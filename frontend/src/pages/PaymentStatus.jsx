import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Ticket
} from 'lucide-react';
import { appointmentService, paymentService } from '../services';

const PaymentStatus = ({ variant = 'success' }) => {
  const [searchParams] = useSearchParams();

  const appointmentId = searchParams.get('appointmentId');
  const sessionId = searchParams.get('session_id');
  const isCancelPage = variant === 'cancelled';

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [error, setError] = useState('');

  const verifyPayment = async () => {
    if (!sessionId || !appointmentId || isCancelPage) return;

    try {
      await paymentService.verifyPayment(sessionId, appointmentId);
    } catch (err) {
      console.error('Payment verification failed:', err);
    }
  };

  const fetchAppointment = async () => {
    if (!appointmentId) {
      setLoading(false);
      return;
    }

    try {
      setError('');
      const { data } = await appointmentService.getById(appointmentId);
      setAppointment(data?.appointment || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load appointment status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!isCancelPage && sessionId && appointmentId) {
        await verifyPayment();
      }
      await fetchAppointment();
    };

    init();

    if (!appointmentId || isCancelPage) return;

    let attempts = 0;

    const interval = setInterval(async () => {
      attempts += 1;

      try {
        const { data } = await appointmentService.getById(appointmentId);
        const nextAppointment = data?.appointment || null;
        setAppointment(nextAppointment);

        if (nextAppointment?.paymentStatus === 'paid' || attempts >= 10) {
          clearInterval(interval);
        }
      } catch {
        if (attempts >= 10) {
          clearInterval(interval);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [appointmentId, isCancelPage, sessionId]);

  const view = useMemo(() => {
    if (isCancelPage) {
      return {
        title: 'Payment Was Cancelled',
        subtitle:
          'You cancelled the checkout process. Your appointment remains unpaid until you complete payment.',
        tone: 'amber'
      };
    }

    if (!appointmentId) {
      return {
        title: 'Payment Submitted',
        subtitle:
          'Checkout returned successfully, but no appointment ID was provided in the URL.',
        tone: 'amber'
      };
    }

    if (loading) {
      return {
        title: 'Checking Payment Status',
        subtitle:
          'Please wait while we confirm your payment and appointment status.',
        tone: 'slate'
      };
    }

    if (appointment?.paymentStatus === 'paid') {
      return {
        title: 'Payment Successful',
        subtitle:
          'Your payment has been confirmed and the appointment is now marked as paid.',
        tone: 'green'
      };
    }

    return {
      title: 'Payment Processing',
      subtitle:
        'Checkout returned successfully, but the payment has not been marked as paid yet. This can happen if the webhook is still processing.',
        tone: 'amber'
    };
  }, [isCancelPage, appointmentId, loading, appointment]);

  const iconBoxClass =
    view.tone === 'green'
      ? 'bg-green-50'
      : view.tone === 'amber'
      ? 'bg-amber-50'
      : 'bg-slate-100';

  const icon =
    view.tone === 'green' ? (
      <CheckCircle2 className="w-12 h-12 text-green-600" />
    ) : loading && !isCancelPage ? (
      <Loader2 className="w-12 h-12 text-slate-600 animate-spin" />
    ) : (
      <AlertCircle className="w-12 h-12 text-amber-600" />
    );

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50 px-4">
      <div className="max-w-2xl mx-auto card p-10 text-center space-y-8">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${iconBoxClass}`}>
          {icon}
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900">{view.title}</h1>
          <p className="text-slate-500">{view.subtitle}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600 text-left">
            {error}
          </div>
        )}

        <div className="bg-slate-50 rounded-3xl border border-slate-100 p-6 text-left space-y-3">
          <div className="flex items-center gap-3 text-slate-700">
            <CreditCard className="w-5 h-5 text-primary-600" />
            <span className="font-medium">Appointment ID: {appointmentId || 'Not provided'}</span>
          </div>

          <div className="flex items-center gap-3 text-slate-700">
            <CreditCard className="w-5 h-5 text-primary-600" />
            <span className="font-medium">Session ID: {sessionId || 'Not provided'}</span>
          </div>

          <div className="flex items-center gap-3 text-slate-700">
            <CreditCard className="w-5 h-5 text-primary-600" />
            <span className="font-medium">Payment Status: {appointment?.paymentStatus || 'unknown'}</span>
          </div>

          <div className="flex items-center gap-3 text-slate-700">
            <CreditCard className="w-5 h-5 text-primary-600" />
            <span className="font-medium">Appointment Status: {appointment?.status || 'unknown'}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/dashboard"
            className="btn btn-outline inline-flex items-center justify-center gap-2"
          >
            Back to Dashboard
          </Link>

          {appointmentId && appointment?.paymentStatus === 'paid' && (
            <Link
              to={`/ticket/${appointmentId}`}
              className="btn btn-primary inline-flex items-center justify-center gap-2"
            >
              <Ticket className="w-4 h-4" />
              <span>Open E-Ticket</span>
            </Link>
          )}

          {appointmentId && appointment?.paymentStatus !== 'paid' && (
            <Link
              to={`/appointment/${appointmentId}`}
              className="btn btn-primary inline-flex items-center justify-center gap-2"
            >
              <span>View Appointment</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;