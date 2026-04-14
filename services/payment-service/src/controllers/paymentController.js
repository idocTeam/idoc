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
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&appointmentId=${appointmentId}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel?appointmentId=${appointmentId}`,
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
      // 2. Update Appointment status in appointment-service
      // Note: In a real microservices environment, we'd use a message queue (RabbitMQ/Kafka)
      // Here we use an internal system token or bypass auth if possible, or just call with a dummy token
      // For simplicity, let's assume we have a system-level communication method
      try {
        await axios.patch(`${process.env.APPOINTMENT_SERVICE_URL}/appointments/${appointmentId}/mark-paid`, {
          amountPaid: payment.amount
        });

        // 3. Trigger Telemedicine Session creation if it's a telemedicine appointment
        if (payment.metadata.consultationType === "telemedicine") {
          await axios.post(`${process.env.TELEMEDICINE_SERVICE_URL}/sessions/create`, {
            appointmentId: appointmentId,
            patientId: payment.patientId,
            doctorId: payment.metadata.doctorId,
            appointmentDate: payment.metadata.appointmentDate,
            startTime: payment.metadata.startTime
          });
        }
      } catch (err) {
        console.error("Failed to update appointment or trigger telemedicine:", err.message);
      }
    }
  }

  res.json({ received: true });
};
