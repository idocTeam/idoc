import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Calendar, ChevronLeft, Clock, CreditCard, FileText, Loader2, User, Video } from 'lucide-react';
import { appointmentService, patientService } from '../services';
import { getStoredUser } from '../utils/session';

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();
  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  useEffect(() => {
    if (user?.role !== 'doctor') return;
    if (!appointment?.patientId) return;
    fetchPatient(appointment.patientId);
  }, [appointment?.patientId, user?.role]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const { data } = await appointmentService.getById(id);
      setAppointment(data.appointment);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointment details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatient = async (patientId) => {
    try {
      setPatientLoading(true);
      const { data } = await patientService.getById(patientId);
      setPatient(data.patient || null);
    } catch (err) {
      setPatient(null);
    } finally {
      setPatientLoading(false);
    }
  };

  const doctorActions = useMemo(() => {
    if (user?.role !== 'doctor') return null;
    if (!appointment?.patientId) return null;
    const patientUserId = appointment.patientId;
    const patientMongoId = patient?._id;
    return { patientUserId, patientMongoId };
  }, [appointment?.patientId, patient?._id, user?.role]);

  if (loading) {
    return (
      <div className="pt-32 min-h-screen flex justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-slate-50 px-4">
        <div className="max-w-3xl mx-auto card p-10 text-center space-y-4">
          <h1 className="text-3xl font-bold text-slate-900">Appointment Not Found</h1>
          <p className="text-slate-500">{error || 'The appointment could not be found.'}</p>
          <Link to="/dashboard" className="btn btn-primary inline-flex mx-auto">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Link to="/dashboard" className="inline-flex items-center text-slate-500 hover:text-primary-600 font-bold transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="card p-8 lg:p-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-2">Appointment Details</p>
              <h1 className="text-3xl font-bold text-slate-900">{user?.role === 'patient' ? `Dr. ${appointment.doctorName}` : appointment.patientName || 'Patient'}</h1>
            </div>
            <span className="px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wider self-start">
              {appointment.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3 text-slate-600"><Calendar className="w-5 h-5 text-primary-600" /><span className="font-medium">{appointment.appointmentDate}</span></div>
              <div className="flex items-center gap-3 text-slate-600"><Clock className="w-5 h-5 text-primary-600" /><span className="font-medium">{appointment.startTime} - {appointment.endTime}</span></div>
              <div className="flex items-center gap-3 text-slate-600"><Video className="w-5 h-5 text-primary-600" /><span className="font-medium capitalize">{appointment.consultationType === 'online' ? 'Telemedicine' : 'Physical Visit'}</span></div>
              <div className="flex items-center gap-3 text-slate-600"><CreditCard className="w-5 h-5 text-primary-600" /><span className="font-medium capitalize">Payment: {appointment.paymentStatus}</span></div>
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3 text-slate-600"><User className="w-5 h-5 text-primary-600" /><span className="font-medium">Doctor ID: {appointment.doctorId}</span></div>
              <div className="flex items-center gap-3 text-slate-600"><User className="w-5 h-5 text-primary-600" /><span className="font-medium">Patient ID: {appointment.patientId}</span></div>
              <div className="flex items-start gap-3 text-slate-600"><FileText className="w-5 h-5 text-primary-600 mt-0.5" /><span className="font-medium">Reason: {appointment.reason || 'No reason provided'}</span></div>
            </div>
          </div>

          {user?.role === 'doctor' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 bg-white border border-slate-100 rounded-3xl">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Patient Details</h2>
                    <p className="text-sm text-slate-500 font-medium">Quick view of the patient profile linked to this appointment.</p>
                  </div>
                  {patientLoading && <Loader2 className="w-5 h-5 animate-spin text-primary-600" />}
                </div>

                {patient ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Name</p>
                      <p className="font-bold text-slate-900 mt-1">{patient.fullName || '—'}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</p>
                      <p className="font-bold text-slate-900 mt-1 break-all">{patient.email || '—'}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone</p>
                      <p className="font-bold text-slate-900 mt-1">{patient.phone || '—'}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">DOB</p>
                      <p className="font-bold text-slate-900 mt-1">{patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '—'}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Gender</p>
                      <p className="font-bold text-slate-900 mt-1">{patient.gender || '—'}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Address</p>
                      <p className="font-bold text-slate-900 mt-1">{patient.address || '—'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 font-medium">
                    Patient profile not available.
                  </div>
                )}
              </div>

              <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Doctor Actions</h3>
                <button
                  type="button"
                  className="btn btn-primary w-full"
                  disabled={!doctorActions?.patientMongoId}
                  onClick={() => navigate(`/prescriptions/new?appointmentId=${encodeURIComponent(id)}&patientId=${encodeURIComponent(doctorActions.patientMongoId)}&patientUserId=${encodeURIComponent(doctorActions.patientUserId)}`)}
                >
                  Create Prescription
                </button>
                <button
                  type="button"
                  className="btn btn-outline w-full"
                  onClick={() => navigate(`/patients/${encodeURIComponent(appointment.patientId)}/reports`)}
                >
                  View Medical Reports
                </button>
                {!doctorActions?.patientMongoId && (
                  <p className="text-xs text-slate-500 font-medium">
                    Prescription button unlocks after patient profile loads.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="p-6 bg-white border border-slate-100 rounded-3xl">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Appointment Timeline</h2>
            <div className="text-sm text-slate-500 space-y-2">
              <p>Created: {new Date(appointment.createdAt).toLocaleString()}</p>
              {appointment.updatedAt && <p>Last updated: {new Date(appointment.updatedAt).toLocaleString()}</p>}
              {appointment.amountPaid > 0 && <p>Amount paid: ${appointment.amountPaid}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;
