import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  Video, 
  Building, 
  CreditCard, 
  CheckCircle2, 
  ChevronLeft, 
  Printer, 
  Download,
  ShieldCheck,
  MapPin,
  FileText
} from 'lucide-react';
import { paymentService } from '../services';

const TicketDetails = () => {
  const { appointmentId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTicket();
  }, [appointmentId]);

  const fetchTicket = async () => {
    try {
      const { data } = await paymentService.getTicket(appointmentId);
      setTicket(data.ticket);
    } catch (err) {
      setError('E-Ticket not found. Please ensure payment is completed.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="pt-32 flex justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  if (error) return (
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

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/dashboard" className="flex items-center text-slate-500 hover:text-primary-600 font-bold transition-colors">
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex space-x-3">
            <button onClick={() => window.print()} className="btn btn-outline !py-2 !px-4 flex items-center space-x-2">
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button className="btn btn-primary !py-2 !px-4 flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 print:shadow-none print:border-none">
          {/* Ticket Header */}
          <div className="bg-slate-900 p-10 text-white relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 blur-3xl rounded-full" />
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="text-white w-6 h-6" />
                  </div>
                  <span className="text-2xl font-bold tracking-tight">IDOC E-TICKET</span>
                </div>
                <div>
                  <p className="text-primary-400 font-bold text-xs uppercase tracking-widest">Ticket Number</p>
                  <p className="text-2xl font-mono font-bold mt-1">{ticket.ticketNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Payment Status</p>
                <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full font-bold text-xs uppercase tracking-widest border border-green-500/30">
                  Confirmed & Paid
                </span>
              </div>
            </div>
          </div>

          {/* Ticket Content */}
          <div className="p-10 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Patient Info */}
              <div className="space-y-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Patient Details</h4>
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <User className="text-slate-400 w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Full Name</p>
                    <p className="text-lg font-bold text-slate-900">{ticket.patientName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <MapPin className="text-slate-400 w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Appointment ID</p>
                    <p className="text-lg font-bold text-slate-900">{ticket.appointmentId}</p>
                  </div>
                </div>
              </div>

              {/* Doctor Info */}
              <div className="space-y-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Consultation Details</h4>
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
                    <Stethoscope className="text-primary-600 w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Specialist</p>
                    <p className="text-lg font-bold text-slate-900">Dr. {ticket.doctorName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
                    <Calendar className="text-primary-600 w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Date & Time</p>
                    <p className="text-lg font-bold text-slate-900">{ticket.appointmentDate} at {ticket.startTime}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Jitsi Link Section */}
            {ticket.jitsiLink && (
              <div className="bg-primary-50 rounded-3xl p-8 border border-primary-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <Video className="text-primary-600 w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-primary-900">Secure Video Link</h4>
                    <p className="text-sm text-primary-700 font-medium">Use this link to join your consultation session.</p>
                  </div>
                </div>
                <Link 
                  to={`/telemedicine?appointmentId=${ticket.appointmentId}`}
                  className="btn btn-primary !px-8 shadow-xl shadow-primary-600/20 whitespace-nowrap"
                >
                  Join Meeting Now
                </Link>
              </div>
            )}

            {/* Footer / QR Area */}
            <div className="pt-10 border-t border-dashed border-slate-200 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center space-x-4 text-slate-400">
                <ShieldCheck className="w-8 h-8" />
                <p className="text-xs font-medium max-w-xs leading-relaxed">
                  This e-ticket is digitally signed and serves as your proof of payment and booking. 
                  Please have it ready during your consultation.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Amount Paid</p>
                <p className="text-4xl font-bold text-slate-900">${ticket.amountPaid}</p>
              </div>
            </div>
          </div>
          
          {/* Perforation Line for visual effect */}
          <div className="relative h-4 bg-slate-50">
            <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed border-slate-200 -translate-y-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
