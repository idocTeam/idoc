import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, FileText, Filter, Loader2, Search, Stethoscope } from 'lucide-react';
import { prescriptionService } from '../services';

const toISODate = (value) => {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

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

const MyPrescriptions = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [filters, setFilters] = useState({
    from: '',
    to: '',
    doctor: '',
    q: '',
  });

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setMessage('');

      const params = {
        from: filters.from || undefined,
        to: filters.to || undefined,
        doctorName: filters.doctor?.trim() || undefined,
        q: filters.q?.trim() || undefined,
        limit: 200,
      };

      const { data } = await prescriptionService.getMyPrescriptions(params);
      const list = data?.prescriptions || data?.data?.prescriptions || data?.items || [];
      setPrescriptions(Array.isArray(list) ? list : []);
    } catch (err) {
      setPrescriptions([]);
      setMessage(err.response?.data?.message || 'Failed to load prescriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const doctor = filters.doctor.trim().toLowerCase();
    const from = filters.from ? new Date(filters.from) : null;
    const to = filters.to ? new Date(filters.to) : null;

    return (prescriptions || []).filter((p) => {
      const createdAt = new Date(p?.createdAt || p?.date || p?.issuedAt || 0);
      const withinFrom = !from || (!Number.isNaN(createdAt.getTime()) && createdAt >= from);
      const withinTo = !to || (!Number.isNaN(createdAt.getTime()) && createdAt <= new Date(to.getTime() + 24 * 60 * 60 * 1000 - 1));

      const doctorLabel = getDoctorLabel(p).toLowerCase();
      const doctorMatches = !doctor || doctorLabel.includes(doctor);

      const text = [
        p?._id,
        p?.prescriptionId,
        p?.diagnosis,
        p?.status,
        doctorLabel,
        p?.appointmentId,
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .join(' ');
      const qMatches = !q || text.includes(q);

      return withinFrom && withinTo && doctorMatches && qMatches;
    });
  }, [prescriptions, filters]);

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-2">Patient</p>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">My Prescriptions</h1>
            <p className="text-slate-500 mt-2 font-medium">
              View your prescriptions and filter by date and doctor name.
            </p>
          </div>
          <Link to="/dashboard" className="btn btn-secondary h-12">Back to Dashboard</Link>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-2xl border bg-red-50 border-red-100 text-red-700 font-medium">
            {message}
          </div>
        )}

        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                From
              </label>
              <input
                type="date"
                className="input h-12"
                value={filters.from}
                onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
                max={filters.to || undefined}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                To
              </label>
              <input
                type="date"
                className="input h-12"
                value={filters.to}
                onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
                min={filters.from || undefined}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-slate-400" />
                Doctor name
              </label>
              <input
                className="input h-12"
                placeholder="e.g. Dr. Perera"
                value={filters.doctor}
                onChange={(e) => setFilters((p) => ({ ...p, doctor: e.target.value }))}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => fetchPrescriptions()}
                className="btn btn-primary h-12 flex-1 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                Apply
              </button>
              <button
                type="button"
                className="btn btn-outline h-12"
                onClick={() => {
                  const next = { from: '', to: '', doctor: '', q: '' };
                  setFilters(next);
                  setTimeout(() => fetchPrescriptions(), 0);
                }}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mt-4 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              className="input pl-12 h-12"
              placeholder="Search diagnosis, status, doctor, appointment id..."
              value={filters.q}
              onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="card h-44 animate-pulse bg-slate-100/50" />)
          ) : filtered.length > 0 ? (
            filtered.map((p) => {
              const id = p?._id || p?.id || p?.prescriptionId;
              const createdAt = p?.createdAt || p?.issuedAt || p?.date;
              const medsCount = Array.isArray(p?.medicines) ? p.medicines.length : undefined;
              const status = p?.status || 'active';
              const doctorLabel = getDoctorLabel(p);

              return (
                <motion.button
                  key={id}
                  type="button"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  onClick={() => navigate(`/my-prescriptions/${encodeURIComponent(String(id))}`)}
                  className="card text-left group hover:border-primary-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary-50 text-primary-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                        status === 'cancelled'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                      {p?.diagnosis || 'Prescription'}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">{doctorLabel}</p>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(createdAt)}
                      </span>
                      <span className="font-bold text-slate-700">
                        {typeof medsCount === 'number' ? `${medsCount} meds` : 'View'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-2 truncate">
                      {String(id)}
                    </p>
                  </div>
                </motion.button>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center space-y-4 bg-white rounded-3xl border border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <FileText className="text-slate-300 w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">No prescriptions found</h3>
              <p className="text-slate-500">Try adjusting the date range or doctor filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyPrescriptions;

