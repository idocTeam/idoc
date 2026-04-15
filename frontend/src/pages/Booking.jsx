import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronRight, 
  AlertCircle, 
  Loader2, 
  Video, 
  Building,
  CheckCircle2,
  Stethoscope,
  Activity
} from 'lucide-react';
import { appointmentService } from '../services';

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState('telemedicine');
  
  const doctor = {
    name: 'Sarah Smith',
    specialty: 'Cardiology',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    fee: '$50'
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await appointmentService.create({
        doctorId: id,
        doctorName: doctor.name,
        appointmentDate: selectedDate,
        startTime: selectedTime,
        endTime: '10:30',
        consultationType,
        reason: 'General checkup'
      });
      
      navigate('/dashboard', { state: { success: true, message: 'Appointment requested successfully!' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[40px] p-10 shadow-2xl shadow-primary-200/50 border border-slate-100">
              <h1 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">Schedule Appointment</h1>
              
              <form onSubmit={handleBooking} className="space-y-8">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <label className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <CalendarIcon className="w-5 h-5 text-primary-600" />
                    <span>Select Date</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="input h-14"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-primary-600" />
                    <span>Select Time</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30'].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                          selectedTime === time 
                          ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200' 
                          : 'bg-white border-slate-100 text-slate-600 hover:border-primary-200 hover:bg-primary-50'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-primary-600" />
                    <span>Consultation Type</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setConsultationType('telemedicine')}
                      className={`p-5 rounded-2xl text-left transition-all border-2 flex items-center space-x-4 ${
                        consultationType === 'telemedicine' 
                        ? 'border-primary-600 bg-primary-50/50 ring-4 ring-primary-100' 
                        : 'border-slate-100 hover:border-primary-200'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        consultationType === 'telemedicine' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Video className="w-6 h-6" />
                      </div>
                      <div>
                        <p className={`font-bold ${consultationType === 'telemedicine' ? 'text-primary-900' : 'text-slate-700'}`}>Telemedicine</p>
                        <p className="text-xs text-slate-500 font-medium">Video call session</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConsultationType('physical')}
                      className={`p-5 rounded-2xl text-left transition-all border-2 flex items-center space-x-4 ${
                        consultationType === 'physical' 
                        ? 'border-primary-600 bg-primary-50/50 ring-4 ring-primary-100' 
                        : 'border-slate-100 hover:border-primary-200'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        consultationType === 'physical' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Building className="w-6 h-6" />
                      </div>
                      <div>
                        <p className={`font-bold ${consultationType === 'physical' ? 'text-primary-900' : 'text-slate-700'}`}>Physical Visit</p>
                        <p className="text-xs text-slate-500 font-medium">In-person meeting</p>
                      </div>
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || !selectedDate || !selectedTime}
                  className="btn btn-primary w-full h-16 text-lg flex items-center justify-center space-x-3 mt-8 disabled:opacity-50 disabled:grayscale"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <span>Confirm Appointment</span>
                      <ChevronRight className="w-6 h-6" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-8 bg-slate-900 text-white overflow-hidden relative border-none">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 blur-3xl rounded-full" />
              
              <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                <img 
                  src={doctor.image} 
                  alt={doctor.name} 
                  className="w-24 h-24 rounded-3xl object-cover border-4 border-slate-800 shadow-2xl"
                />
                <div>
                  <div className="flex items-center justify-center space-x-2 text-primary-400 mb-1">
                    <Stethoscope className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{doctor.specialty}</span>
                  </div>
                  <h3 className="text-2xl font-bold">Dr. {doctor.name}</h3>
                </div>

                <div className="w-full space-y-4 pt-6 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm font-medium">Consultation Fee</span>
                    <span className="text-xl font-bold">{doctor.fee}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm font-medium">Service Charge</span>
                    <span className="text-xl font-bold">$5</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                    <span className="text-primary-400 font-bold uppercase tracking-wider text-xs">Total Amount</span>
                    <span className="text-3xl font-bold text-primary-500">$55</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-primary-100 bg-primary-50/30 p-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle2 className="text-primary-600 w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Verified Expert</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    This doctor is verified and has over 10 years of experience in their field.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Booking;
