import Stripe from "stripe";
import Payment from "../models/Payment.js";
import { getAppointmentById, updateAppointmentPaymentStatus } from "../utils/appointmentClient.js";
import axios from "axios";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /payments/create-checkout-session
 * Create a Stripe checkout session for an accepted appointment
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // 1. Fetch appointment details
    const appointment = await getAppointmentById(appointmentId, token);

    // 2. Check if appointment is accepted
    if (appointment.status !== "accepted") {
      return res.status(400).json({ message: "Only accepted appointments can be paid for" });
    }

    // 3. Check if already paid
    if (appointment.paymentStatus === "paid") {
      return res.status(400).json({ message: "Appointment already paid" });
    }

    // 4. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Consultation with Dr. ${appointment.doctorName}`,
              description: `Appointment on ${appointment.appointmentDate} at ${appointment.startTime}`,
            },
            unit_amount: 5000, // Hardcoded fee for demo: $50.00
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/#/payment-success?session_id={CHECKOUT_SESSION_ID}&appointmentId=${appointmentId}`,
      cancel_url: `${process.env.CLIENT_URL}/#/payment-cancel?appointmentId=${appointmentId}`,
      metadata: {
        appointmentId: appointmentId.toString(),
        patientId: req.user.id.toString(),
      },
    });

    // 5. Save pending payment record
    const payment = new Payment({
      appointmentId: appointmentId,
      patientId: req.user.id,
      amount: 50,
      stripeSessionId: session.id,
      status: "pending",
      metadata: {
        doctorId: appointment.doctorId,
        doctorName: appointment.doctorName,
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        consultationType: appointment.consultationType
      }
    });

    await payment.save();

    res.status(200).json({
      message: "Checkout session created",
      sessionId: session.id,
      url: session.url
    });
  } catch (err) {
    console.error("Create Checkout Session Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Helper to update appointment and trigger post-payment actions
 */
const completePaymentWorkflow = async (payment, appointmentId) => {
  console.log(`Starting payment workflow for appointment: ${appointmentId}`);
  
  try {
    // 1. Update Appointment status in appointment-service
    const appointmentUrl = `${process.env.APPOINTMENT_SERVICE_URL}/${appointmentId}/mark-paid`;
    console.log(`Calling appointment-service: ${appointmentUrl}`);
    
    try {
      await axios.patch(appointmentUrl, {
        amountPaid: payment.amount
      });
      console.log("Appointment status updated to paid");
    } catch (aptErr) {
      console.error("Failed to update appointment status:", aptErr.response?.data || aptErr.message);
      // If appointment not found, we still want to try other things or at least not throw a generic error
      throw new Error(`Appointment service error: ${aptErr.response?.data?.message || aptErr.message}`);
    }

    // 2. Trigger Telemedicine Session creation if it's a telemedicine appointment
    const consultationType = payment.metadata?.consultationType || "";
    if (consultationType === "online" || consultationType === "telemedicine") {
      const telemedicineUrl = `${process.env.TELEMEDICINE_SERVICE_URL}/sessions/create`;
      console.log(`Calling telemedicine-service: ${telemedicineUrl}`);
      
      try {
        await axios.post(telemedicineUrl, {
          appointmentId: appointmentId,
          patientId: payment.patientId,
          doctorId: payment.metadata?.doctorId,
          appointmentDate: payment.metadata?.appointmentDate,
          startTime: payment.metadata?.startTime
        });
        console.log("Telemedicine session created");
      } catch (teleErr) {
        console.error("Telemedicine session creation failed:", teleErr.response?.data || teleErr.message);
        // Don't fail the whole workflow for telemedicine session
      }
    }

    // 3. Generate E-Ticket automatically
    const selfUrl = process.env.PAYMENT_SERVICE_URL || `http://localhost:${process.env.PORT || 5005}`;
    const ticketUrl = `${selfUrl}/generate-ticket/${appointmentId}`;
    console.log(`Calling generate-ticket: ${ticketUrl}`);
    
    try {
      await axios.post(ticketUrl);
      console.log("E-Ticket generated");
    } catch (ticketErr) {
      console.error("Ticket generation failed:", ticketErr.response?.data || ticketErr.message);
    }

    console.log(`Payment workflow completed for appointment ${appointmentId}`);
  } catch (err) {
    console.error("Error in completePaymentWorkflow:", err.response?.data || err.message);
    throw new Error(`Workflow failed: ${err.response?.data?.message || err.message}`);
  }
};

/**
 * GET /payments/verify-payment?session_id=xxx&appointmentId=yyy
 * Fallback for when webhooks are not received (e.g. local dev)
 */
export const verifyPayment = async (req, res) => {
  try {
    const { session_id, appointmentId } = req.query;

    if (!session_id || !appointmentId) {
      return res.status(400).json({ message: "session_id and appointmentId are required" });
    }

    // 1. Check if payment is already marked as completed
    let payment = await Payment.findOne({ stripeSessionId: session_id });

    if (payment && payment.status === "completed") {
      return res.status(200).json({ status: "paid", message: "Payment already processed" });
    }

    // 2. Verify with Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      // Update Payment record if not already done
      if (!payment) {
        payment = await Payment.findOne({ appointmentId });
      }

      if (payment) {
        payment.status = "completed";
        payment.paymentIntentId = session.payment_intent;
        payment.stripeSessionId = session.id;
        await payment.save();

        // Trigger workflow
        await completePaymentWorkflow(payment, appointmentId);

        return res.status(200).json({ status: "paid", message: "Payment verified and processed" });
      } else {
        return res.status(404).json({ message: "Payment record not found" });
      }
    }

    res.status(200).json({ status: "unpaid", message: "Payment not yet confirmed by Stripe" });
  } catch (err) {
    console.error("Verify Payment Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /payments/webhook
 * Handle Stripe webhook for successful payments
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { appointmentId } = session.metadata;

    try {
      // 1. Update Payment record
      const payment = await Payment.findOneAndUpdate(
        { stripeSessionId: session.id },
        {
          status: "completed",
          paymentIntentId: session.payment_intent,
        },
        { new: true }
      );

      if (payment) {
        await completePaymentWorkflow(payment, appointmentId);
      }
    } catch (err) {
      console.error("Webhook processing failed:", err.message);
    }
  }

  res.json({ received: true });
};
