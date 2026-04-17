import Stripe from "stripe";
import Payment from "../models/Payment.js";
import { getAppointmentById } from "../utils/appointmentClient.js";
import axios from "axios";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const appointment = await getAppointmentById(appointmentId, token);

    if (appointment.status !== "accepted") {
      return res.status(400).json({ message: "Only accepted appointments can be paid for" });
    }

    if (appointment.paymentStatus === "paid") {
      return res.status(400).json({ message: "Appointment already paid" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Consultation with Dr. ${appointment.doctorName}`,
              description: `Appointment on ${appointment.appointmentDate} at ${appointment.startTime}`
            },
            unit_amount: 5000
          },
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/#/payment-success?session_id={CHECKOUT_SESSION_ID}&appointmentId=${appointmentId}`,
      cancel_url: `${process.env.CLIENT_URL}/#/payment-cancel?appointmentId=${appointmentId}`,
      metadata: {
        appointmentId: appointmentId.toString(),
        patientId: req.user.id.toString()
      }
    });

    const payment = new Payment({
      appointmentId,
      patientId: req.user.id,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      amount: 50,
      currency: "usd",
      paymentMethod: "card",
      provider: "stripe",
      stripeSessionId: session.id,
      status: "pending",
      isTest: false,
      metadata: {
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

const completePaymentWorkflow = async (payment, appointmentId) => {
  console.log(`Starting payment workflow for appointment: ${appointmentId}`);

  try {
    const appointmentUrl = `${process.env.APPOINTMENT_SERVICE_URL}/${appointmentId}/mark-paid`;
    console.log(`Calling appointment-service: ${appointmentUrl}`);

    try {
      await axios.patch(appointmentUrl, {
        amountPaid: payment.amount
      });
      console.log("Appointment status updated to paid");
    } catch (aptErr) {
      console.error("Failed to update appointment status:", aptErr.response?.data || aptErr.message);
      throw new Error(`Appointment service error: ${aptErr.response?.data?.message || aptErr.message}`);
    }

    const consultationType = payment.metadata?.consultationType || "";
    if (consultationType === "online" || consultationType === "telemedicine") {
      const telemedicineUrl = `${process.env.TELEMEDICINE_SERVICE_URL}/sessions/create`;
      console.log(`Calling telemedicine-service: ${telemedicineUrl}`);

      try {
        await axios.post(telemedicineUrl, {
          appointmentId,
          patientId: payment.patientId,
          doctorId: payment.doctorId,
          appointmentDate: payment.metadata?.appointmentDate,
          startTime: payment.metadata?.startTime
        });
        console.log("Telemedicine session created");
      } catch (teleErr) {
        console.error("Telemedicine session creation failed:", teleErr.response?.data || teleErr.message);
      }
    }

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

export const verifyPayment = async (req, res) => {
  try {
    const { session_id, appointmentId } = req.query;

    if (!session_id || !appointmentId) {
      return res.status(400).json({ message: "session_id and appointmentId are required" });
    }

    let payment = await Payment.findOne({ stripeSessionId: session_id });

    if (payment && payment.status === "completed") {
      return res.status(200).json({ status: "paid", message: "Payment already processed" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      if (!payment) {
        payment = await Payment.findOne({ appointmentId });
      }

      if (!payment) {
        return res.status(404).json({ message: "Payment record not found" });
      }

      payment.status = "completed";
      payment.paymentIntentId = session.payment_intent;
      payment.stripeSessionId = session.id;
      payment.paidAt = new Date();
      payment.failedAt = null;
      payment.failureReason = "";

      await payment.save();
      await completePaymentWorkflow(payment, appointmentId);

      return res.status(200).json({
        status: "paid",
        message: "Payment verified and processed"
      });
    }

    return res.status(200).json({
      status: "unpaid",
      message: "Payment not yet confirmed by Stripe"
    });
  } catch (err) {
    console.error("Verify Payment Error:", err);
    res.status(500).json({ message: err.message });
  }
};

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { appointmentId } = session.metadata;

    try {
      const payment = await Payment.findOneAndUpdate(
        { stripeSessionId: session.id },
        {
          status: "completed",
          paymentIntentId: session.payment_intent,
          paidAt: new Date(),
          failedAt: null,
          failureReason: ""
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

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;

    try {
      await Payment.findOneAndUpdate(
        { stripeSessionId: session.id },
        {
          status: "failed",
          failedAt: new Date(),
          failureReason: "Checkout session expired"
        }
      );
    } catch (err) {
      console.error("Failed to mark expired payment:", err.message);
    }
  }

  res.json({ received: true });
};