import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Video,
  CreditCard,
  Ticket,
  ChevronRight,
  Loader2,
  XCircle,
} from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { appointmentService, paymentService } from '../services';
import { getStoredUser } from '../utils/session';

const doctorTabs = [
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'accepted_paid', label: 'Accepted + Paid' },
  { key: 'rejected', label: 'Rejected' },
];

const Dashboard = () => {
  const user = getStoredUser();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const location = useLocation();
  const [doctorTab, setDoctorTab] = useState('pending');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const upcomingCount = useMemo(
    () => appointments.filter((item) => !['cancelled', 'rejected', 'completed'].includes(item.status)).length,
    [appointments]
  );

  const doctorBuckets = useMemo(() => {
    if (user?.role !== 'doctor') return null;

    const base = {
      pending: [],
      accepted: [],
      accepted_paid: [],
      rejected: [],
    };

    for (const apt of appointments || []) {
      if (apt.status === 'pending') base.pending.push(apt);
      else if (apt.status === 'rejected') base.rejected.push(apt);
      else if (apt.status === 'accepted' && apt.paymentStatus === 'paid') base.accepted_paid.push(apt);
      else if (apt.status === 'accepted') base.accepted.push(apt);
    }

    return base;
  }, [appointments, user?.role]);

  const doctorCounts = useMemo(() => {
    if (!doctorBuckets) return null;
    return {
      pending: doctorBuckets.pending.length,
      accepted: doctorBuckets.accepted.length,
      accepted_paid: doctorBuckets.accepted_paid.length,
      rejected: doctorBuckets.rejected.length,
    };
  }, [doctorBuckets]);

  const visibleAppointments = useMemo(() => {
    if (user?.role !== 'doctor') return appointments;
    if (!doctorBuckets) return [];
    return doctorBuckets[doctorTab] || [];
  }, [appointments, doctorBuckets, doctorTab, user?.role]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = user?.role === 'patient'
        ? await appointmentService.getPatientAppointments()
        : await appointmentService.getDoctorAppointments();
      setAppointments(data.appointments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (appointmentId) => {
    setProcessingPayment(appointmentId);
    try {
      const { data } = await paymentService.createCheckoutSession(appointmentId);
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment initiation failed');
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleAction = async (id, action) => {
    try {
      setActionLoading(`${action}-${id}`);
      if (action === 'accept') await appointmentService.accept(id);
      if (action === 'reject') await appointmentService.reject(id);
      if (action === 'cancel') {
        await appointmentService.cancel(id, {
          requestRefund: true,
          refundReason: 'Cancelled by patient from dashboard',
        });
      }
      await fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} appointment`);
    } finally {
      setActionLoading(null);
    }
  };

  const renderActionButtons = (appointment) => {
    const actionKey = actionLoading?.endsWith(appointment._id) ? actionLoading : null;

    if (user?.role === 'doctor' && appointment.status === 'pending') {
      return (
        <>
          <button onClick={() => handleAction(appointment._id, 'accept')} disabled={!!actionLoading} className="btn btn-primary !py-2 !px-6 text-sm">
            {actionKey === `accept-${appointment._id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept'}
          </button>
          <button onClick={() => handleAction(appointment._id, 'reject')} disabled={!!actionLoading} className="btn btn-outline !py-2 !px-6 text-sm !text-red-600 !border-red-100 hover:!bg-red-50">
            {actionKey === `reject-${appointment._id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject'}
          </button>
        </>
      );
    }

    if (user?.role === 'patient') {
      if (appointment.status === 'accepted' && appointment.paymentStatus !== 'paid') {
        return (
          <button onClick={() => handlePayment(appointment._id)} disabled={processingPayment === appointment._id} className="btn btn-primary !py-2 !px-6 text-sm flex items-center space-x-2">
            {processingPayment === appointment._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            <span>Pay Consultation Fee</span>
          </button>
        );
      }

      if (['pending', 'accepted'].includes(appointment.status)) {
        return (
          <button onClick={() => handleAction(appointment._id, 'cancel')} disabled={!!actionLoading} className="btn btn-outline !py-2 !px-6 text-sm !text-red-600 !border-red-100 hover:!bg-red-50 flex items-center gap-2">
            {actionKey === `cancel-${appointment._id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            <span>Cancel</span>
          </button>
        );
      }
    }

    return null;
  };

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              Welcome back, <span className="text-primary-600">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Manage your health schedule and consultations.</p>
          </div>
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
            <div className="px-6 py-3 text-center">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Upcoming</p>
              <p className="text-xl font-bold text-slate-900">{upcomingCount}</p>
            </div>
            <div className="w-px bg-slate-100 my-2" />
            <div className="px-6 py-3 text-center">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Role</p>
              <p className="text-xl font-bold text-primary-600 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {location.state?.message && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-green-50 border border-green-100 text-green-700 rounded-2xl flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{location.state.message}</span>
          </motion.div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center space-x-3">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {user?.role === 'doctor' && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
              {doctorTabs.map((t) => {
                const active = doctorTab === t.key;
                const count = doctorCounts?.[t.key] ?? 0;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setDoctorTab(t.key)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      active ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 text-sm text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-700">{doctorCounts?.[doctorTab] ?? 0}</span> appointments in{' '}
              <span className="font-bold text-slate-700">
                {doctorTabs.find((t) => t.key === doctorTab)?.label || doctorTab}
              </span>.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            [1, 2].map(i => <div key={i} className="card h-40 animate-pulse bg-slate-100/50" />)
          ) : visibleAppointments.length > 0 ? (
            visibleAppointments.map((apt) => (
              <motion.div key={apt._id} layout className="card flex flex-col lg:flex-row lg:items-center justify-between gap-6 group hover:border-primary-200 transition-all">
                <div className="flex items-start space-x-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                    apt.status === 'accepted' ? 'bg-green-100 text-green-600 shadow-green-100' :
                    apt.status === 'pending' ? 'bg-amber-100 text-amber-600 shadow-amber-100' :
                    apt.status === 'completed' ? 'bg-blue-100 text-blue-600 shadow-blue-100' :
                    'bg-slate-100 text-slate-400 shadow-slate-100'
                  }`}>
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        apt.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        apt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        apt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {apt.status}
                      </span>
                      {apt.paymentStatus === 'paid' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-100 text-primary-700">Paid</span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {user?.role === 'patient' ? `Dr. ${apt.doctorName}` : apt.patientName || 'Patient'}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-4 h-4 text-primary-500" />
                        <span>{apt.appointmentDate} at {apt.startTime} - {apt.endTime}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Video className="w-4 h-4 text-primary-500" />
                        <span className="capitalize">{apt.consultationType === 'online' ? 'Telemedicine' : 'Physical Visit'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-50">
                  {renderActionButtons(apt)}

                  {apt.paymentStatus === 'paid' && (
                    <div className="flex gap-2 flex-wrap">
                      <Link to={`/ticket/${apt._id}`} className="btn btn-outline !py-2 !px-4 text-sm flex items-center space-x-2 !text-primary-600 !border-primary-100">
                        <Ticket className="w-4 h-4" />
                        <span>Ticket</span>
                      </Link>
                      {apt.consultationType === 'online' && (
                        <Link to={`/telemedicine?appointmentId=${apt._id}`} className="btn btn-primary !py-2 !px-6 text-sm flex items-center space-x-2 bg-green-600 hover:bg-green-700 shadow-green-100">
                          <Video className="w-4 h-4" />
                          <span>Join Session</span>
                        </Link>
                      )}
                    </div>
                  )}

                  <Link to={`/appointment/${apt._id}`} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="card py-20 text-center space-y-6">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <Calendar className="text-slate-300 w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {user?.role === 'doctor' ? 'No appointments in this section' : 'No appointments yet'}
                </h3>
                <p className="text-slate-500 mt-2">
                  {user?.role === 'doctor'
                    ? 'Try switching tabs to view other appointment requests.'
                    : 'Your scheduled consultations will appear here.'}
                </p>
              </div>
              {user?.role === 'patient' && (
                <Link to="/doctors" className="btn btn-primary inline-flex">Book Your First Appointment</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
