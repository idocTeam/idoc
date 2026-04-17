import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, FileText, Loader2, Stethoscope } from 'lucide-react';
import { prescriptionService } from '../services';

const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString();
};

const getDoctorLabel = (p) => {
  const doc = p?.doctor || p?.doctorProfile || p?.doctorDetails || null;
  if (doc) {
    const name = doc.name || doc.fullName;
    const specialty = doc.specialty;
    if (name && specialty) return `${name} • ${specialty}`;
    if (name) return name;
  }
  return p?.doctorName || p?.doctor?.name || p?.issuedBy || 'Doctor';
};

const PrescriptionDetails = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prescription, setPrescription] = useState(null);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await prescriptionService.getMyPrescriptionById(id);
      setPrescription(data?.prescription || data?.data?.prescription || data || null);
    } catch (err) {
      setPrescription(null);
      setError(err.response?.data?.message || 'Failed to load prescription.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const status = prescription?.status || 'active';
  const doctorLabel = useMemo(() => getDoctorLabel(prescription), [prescription]);

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Link
          to="/my-prescriptions"
          className="inline-flex items-center text-slate-500 hover:text-primary-600 font-bold transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>Back to My Prescriptions</span>
        </Link>

        {loading ? (
          <div className="card p-10 flex items-center justify-center gap-3 text-slate-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-bold">Loading prescription...</span>
          </div>
        ) : error ? (
          <div className="card p-10 border border-red-100 bg-red-50 text-red-700 font-medium">
            {error}
          </div>
        ) : !prescription ? (
          <div className="card p-10 text-slate-700 font-medium">Prescription not found.</div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-8 lg:p-10 space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Prescription</p>
                  <h1 className="text-3xl font-bold text-slate-900">
                    {prescription?.diagnosis || 'Prescription Details'}
                  </h1>
                  <p className="text-slate-500 font-medium flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    {doctorLabel}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                      status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                    }`}
                  >
                    {status}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <Calendar className="w-4 h-4" />
                    {formatDate(prescription?.createdAt || prescription?.issuedAt)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Prescription ID</p>
                  <p className="font-bold text-slate-900 break-all">{prescription?._id || id}</p>
                </div>
                <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Appointment</p>
                  <p className="font-bold text-slate-900 break-all">{prescription?.appointmentId || '-'}</p>
                </div>
              </div>

              {(prescription?.notes || prescription?.followUpDate) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-3xl bg-white border border-slate-100 space-y-2">
                    <p className="text-sm font-bold text-slate-700">Notes</p>
                    <p className="text-slate-600 font-medium whitespace-pre-wrap">{prescription?.notes || '-'}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white border border-slate-100 space-y-2">
                    <p className="text-sm font-bold text-slate-700">Follow up date</p>
                    <p className="text-slate-600 font-medium">{formatDate(prescription?.followUpDate)}</p>
                  </div>
                </div>
              )}

              {status === 'cancelled' && (
                <div className="p-6 rounded-3xl bg-red-50 border border-red-100 space-y-2">
                  <p className="text-sm font-bold text-red-700">Cancelled</p>
                  <p className="text-red-700 font-medium">
                    {prescription?.cancelReason ? `Reason: ${prescription.cancelReason}` : 'No reason provided.'}
                  </p>
                  <p className="text-sm text-red-700/80 font-medium">
                    {prescription?.cancelledAt ? `Cancelled on ${formatDate(prescription.cancelledAt)}` : ''}
                  </p>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-8 lg:p-10 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  Medicines
                </h2>
                <span className="text-sm font-bold text-slate-500">
                  {Array.isArray(prescription?.medicines) ? `${prescription.medicines.length} items` : '0 items'}
                </span>
              </div>

              {Array.isArray(prescription?.medicines) && prescription.medicines.length > 0 ? (
                <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white">
                  <div className="grid grid-cols-12 gap-0 px-5 py-3 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <div className="col-span-4">Name</div>
                    <div className="col-span-2">Dosage</div>
                    <div className="col-span-2">Frequency</div>
                    <div className="col-span-2">Duration</div>
                    <div className="col-span-2">Instructions</div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {prescription.medicines.map((m, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-0 px-5 py-4 text-sm text-slate-700">
                        <div className="col-span-4 font-bold">{m?.name || '-'}</div>
                        <div className="col-span-2">{m?.dosage || '-'}</div>
                        <div className="col-span-2">{m?.frequency || '-'}</div>
                        <div className="col-span-2">{m?.duration || '-'}</div>
                        <div className="col-span-2">{m?.instructions || '-'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center rounded-3xl bg-slate-50 border border-slate-100 text-slate-600 font-medium">
                  No medicines found for this prescription.
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default PrescriptionDetails;

