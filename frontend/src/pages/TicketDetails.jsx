import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  User,
  Stethoscope,
  Video,
  CheckCircle2,
  ChevronLeft,
  Download,
  ShieldCheck,
  MapPin,
  AlertCircle,
  CreditCard,
  Clock,
  Activity,
  Tag,
  FileText,
} from 'lucide-react';
import { paymentService } from '../services';

const TicketDetails = () => {
  const { appointmentId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTicket();
  }, [appointmentId]);

  const fetchTicket = async () => {
    try {
      const { data } = await paymentService.getTicket(appointmentId);
      setTicket(data.ticket);
    } catch (err) {
      setError(err.response?.data?.message || 'E-Ticket not found. Please ensure payment is completed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await paymentService.downloadTicket(appointmentId);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `IDOC_Ticket_${ticket.ticketNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download ticket PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 flex justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-slate-50 px-4 text-center">
        <div className="max-w-md mx-auto card p-10 space-y-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="text-red-500 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">No Ticket Found</h2>
          <p className="text-slate-500">{error}</p>
          <Link to="/dashboard" className="btn btn-primary inline-flex">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/dashboard" className="flex items-center text-slate-600 hover:text-primary-600 font-bold transition-colors bg-white px-4 py-2 rounded-full shadow-sm">
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span>Back to Dashboard</span>
          </Link>
          <button onClick={handleDownload} disabled={downloading} className="btn btn-primary !py-2.5 !px-6 flex items-center space-x-2 shadow-lg shadow-primary-600/30">
            {downloading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{downloading ? 'Generating...' : 'Download Ticket'}</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full translate-y-1/2 -translate-x-1/4" />
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-5">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/40">
                    <CheckCircle2 className="text-white w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">Healthcare Platform</span>
                    <h1 className="text-3xl font-bold tracking-tight">IDOC E-TICKET</h1>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-primary-300 font-bold text-xs uppercase tracking-widest">Ticket Number</p>
                  <p className="text-2xl font-mono font-bold bg-white/10 px-4 py-2 rounded-lg inline-block">{ticket.ticketNumber}</p>
                </div>
              </div>
              <div className="text-right space-y-3">
                <div>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Payment Status</p>
                  <span className="px-5 py-2.5 bg-green-500/20 text-green-400 rounded-full font-bold text-sm uppercase tracking-widest border border-green-500/30 shadow-lg shadow-green-500/20">
                    Confirmed & Paid
                  </span>
                </div>
                <div className="pt-2">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Booking Date</p>
                  <p className="text-white font-semibold">{ticket.bookingDate || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center space-x-3 mb-5">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <User className="text-blue-600 w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Patient Information</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                    <span className="text-sm text-slate-500">Full Name</span>
                    <span className="font-bold text-slate-900">{ticket.patientName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                    <span className="text-sm text-slate-500">Appointment ID</span>
                    <span className="font-mono text-sm font-bold text-slate-700">{ticket.appointmentId}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-2xl p-6 border border-primary-200">
                <div className="flex items-center space-x-3 mb-5">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Stethoscope className="text-primary-600 w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-primary-900 uppercase tracking-wider">Doctor Details</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-primary-200">
                    <span className="text-sm text-primary-700">Doctor</span>
                    <span className="font-bold text-primary-900">Dr. {ticket.doctorName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-primary-200">
                    <span className="text-sm text-primary-700">Specialty</span>
                    <span className="font-bold text-primary-800">{ticket.doctorSpecialty || 'General Practice'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-primary-700">Mode</span>
                    <span className="px-3 py-1 bg-primary-200/50 text-primary-800 rounded-full text-xs font-bold capitalize">
                      {ticket.consultationType === 'online' ? 'Telemedicine' : 'Physical Visit'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center space-x-3 mb-5">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Calendar className="text-amber-600 w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Appointment Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <Calendar className="w-6 h-6 text-primary-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 mb-1">Date</p>
                  <p className="font-bold text-slate-900">{ticket.appointmentDate}</p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <Clock className="w-6 h-6 text-primary-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 mb-1">Time Slot</p>
                  <p className="font-bold text-slate-900">{ticket.startTime} - {ticket.endTime || ticket.startTime}</p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <Activity className="w-6 h-6 text-primary-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 mb-1">Type</p>
                  <p className="font-bold text-slate-900 capitalize">{ticket.consultationType === 'online' ? 'Video Call' : 'In-Person'}</p>
                </div>
              </div>
            </div>

            {ticket.reason && (
              <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-2xl p-6 border border-violet-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                    <FileText className="text-violet-600 w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-violet-900 uppercase tracking-wider">Reason for Visit</h3>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed pl-13">{ticket.reason}</p>
              </div>
            )}

            {ticket.jitsiLink && (
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-6 border border-green-200">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
                      <Video className="text-green-600 w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-green-900">Secure Video Consultation</h4>
                      <p className="text-sm text-green-700 font-medium">Click to join your telemedicine session</p>
                    </div>
                  </div>
                  <Link to={`/telemedicine?appointmentId=${ticket.appointmentId}`} className="btn btn-primary !px-8 shadow-xl shadow-green-500/30 whitespace-nowrap">
                    Join Meeting
                  </Link>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="text-green-400 w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Payment Summary</p>
                    <p className="text-3xl font-bold text-white">${ticket.amountPaid}.00 <span className="text-sm font-normal text-slate-400">USD</span></p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 bg-green-500/20 px-5 py-3 rounded-xl border border-green-500/30">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="font-bold text-green-300">Payment Confirmed</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-3 text-slate-400 pt-4">
              <ShieldCheck className="w-5 h-5" />
              <p className="text-sm font-medium">This e-ticket is your proof of booking and payment. Please present during your consultation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
