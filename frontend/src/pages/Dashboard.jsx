import React, { useState, useEffect } from 'react';
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
  Stethoscope
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { appointmentService, paymentService } from '../services';

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data } = user.role === 'patient' 
        ? await appointmentService.getPatientAppointments()
        : await appointmentService.getDoctorAppointments();
      setAppointments(data.appointments || []);
    } catch (err) {
      setError('Failed to load appointments');
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
      if (action === 'accept') await appointmentService.accept(id);
      if (action === 'reject') await appointmentService.reject(id);
      if (action === 'cancel') await appointmentService.cancel(id);
      fetchAppointments();
    } catch (err) {
      alert(`Failed to ${action} appointment`);
    }
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
              <p className="text-xl font-bold text-slate-900">{appointments.filter(a => a.status !== 'cancelled').length}</p>
            </div>
            <div className="w-px bg-slate-100 my-2" />
            <div className="px-6 py-3 text-center">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Role</p>
              <p className="text-xl font-bold text-primary-600 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {location.state?.message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-green-50 border border-green-100 text-green-700 rounded-2xl flex items-center space-x-3"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{location.state.message}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            [1, 2].map(i => <div key={i} className="card h-40 animate-pulse bg-slate-100/50" />)
          ) : appointments.length > 0 ? (
            appointments.map((apt) => (
              <motion.div 
                key={apt._id}
                layout
                className="card flex flex-col lg:flex-row lg:items-center justify-between gap-6 group hover:border-primary-200 transition-all"
              >
                <div className="flex items-start space-x-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                    apt.status === 'accepted' ? 'bg-green-100 text-green-600 shadow-green-100' :
                    apt.status === 'pending' ? 'bg-amber-100 text-amber-600 shadow-amber-100' :
                    'bg-slate-100 text-slate-400 shadow-slate-100'
                  }`}>
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        apt.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        apt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {apt.status}
                      </span>
                      {apt.paymentStatus === 'paid' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-100 text-primary-700">
                          Paid
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {user.role === 'patient' ? `Dr. ${apt.doctorName}` : apt.patientName}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-4 h-4 text-primary-500" />
                        <span>{apt.appointmentDate} at {apt.startTime}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Video className="w-4 h-4 text-primary-500" />
                        <span className="capitalize">{apt.consultationType}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-50">
                  {user.role === 'doctor' && apt.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleAction(apt._id, 'accept')}
                        className="btn btn-primary !py-2 !px-6 text-sm"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleAction(apt._id, 'reject')}
                        className="btn btn-outline !py-2 !px-6 text-sm !text-red-600 !border-red-100 hover:!bg-red-50"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {user.role === 'patient' && apt.status === 'accepted' && apt.paymentStatus !== 'paid' && (
                    <button 
                      onClick={() => handlePayment(apt._id)}
                      disabled={processingPayment === apt._id}
                      className="btn btn-primary !py-2 !px-6 text-sm flex items-center space-x-2"
                    >
                      {processingPayment === apt._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      <span>Pay Consultation Fee</span>
                    </button>
                  )}

                  {apt.paymentStatus === 'paid' && (
                    <div className="flex gap-2">
                      <Link 
                        to={`/ticket/${apt._id}`}
                        className="btn btn-outline !py-2 !px-4 text-sm flex items-center space-x-2 !text-primary-600 !border-primary-100"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>Ticket</span>
                      </Link>
                      <Link 
                        to={`/telemedicine?appointmentId=${apt._id}`}
                        className="btn btn-primary !py-2 !px-6 text-sm flex items-center space-x-2 bg-green-600 hover:bg-green-700 shadow-green-100"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Session</span>
                      </Link>
                    </div>
                  )}

                  <Link 
                    to={`/appointment/${apt._id}`}
                    className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                  >
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
                <h3 className="text-2xl font-bold text-slate-900">No appointments yet</h3>
                <p className="text-slate-500 mt-2">Your scheduled consultations will appear here.</p>
              </div>
              {user.role === 'patient' && (
                <Link to="/doctors" className="btn btn-primary inline-flex">
                  Book Your First Appointment
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
