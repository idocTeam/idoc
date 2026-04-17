import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { prescriptionService } from '../services';

const emptyMed = () => ({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });

const CreatePrescription = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const patientId = searchParams.get('patientId') || '';
  const appointmentId = searchParams.get('appointmentId') || '';
  const patientUserId = searchParams.get('patientUserId') || '';

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    diagnosis: '',
    notes: '',
    followUpDate: '',
    medicines: [emptyMed()],
  });

  const canSubmit = useMemo(() => {
    if (!patientId) return false;
    const meds = (form.medicines || []).filter((m) => String(m.name || '').trim());
    return meds.length > 0;
  }, [form.medicines, patientId]);

  const updateMedicine = (idx, key, value) => {
    setForm((prev) => {
      const next = [...prev.medicines];
      next[idx] = { ...next[idx], [key]: value };
      return { ...prev, medicines: next };
    });
  };

  const addMedicine = () => setForm((prev) => ({ ...prev, medicines: [...prev.medicines, emptyMed()] }));
  const removeMedicine = (idx) =>
    setForm((prev) => ({ ...prev, medicines: prev.medicines.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSaving(true);
      const payload = {
        patientId,
        appointmentId: appointmentId || undefined,
        diagnosis: form.diagnosis,
        notes: form.notes,
        followUpDate: form.followUpDate || undefined,
        medicines: form.medicines,
      };

      await prescriptionService.create(payload);
      setSuccess('Prescription created successfully.');
      setTimeout(() => navigate(`/appointment/${encodeURIComponent(appointmentId || '')}`), 700);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create prescription.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Link to={appointmentId ? `/appointment/${appointmentId}` : '/dashboard'} className="inline-flex items-center text-slate-500 hover:text-primary-600 font-bold transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>Back</span>
        </Link>

        <div className="card p-8 lg:p-10 space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-2">Prescription</p>
            <h1 className="text-3xl font-bold text-slate-900">Create Prescription</h1>
            <p className="text-slate-500 font-medium mt-2">
              Patient: <span className="font-bold text-slate-700">{patientUserId || 'Selected patient'}</span>
            </p>
          </div>

          {(error || success) && (
            <div className={`p-4 rounded-2xl border font-medium ${success ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
              {success || error}
            </div>
          )}

          {!patientId && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 font-medium">
              Missing patientId. Please open this page from an appointment details screen.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Diagnosis</label>
                <input
                  className="input h-14"
                  value={form.diagnosis}
                  onChange={(e) => setForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="e.g. Viral fever"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Follow up date</label>
                <input
                  type="date"
                  className="input h-14"
                  value={form.followUpDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, followUpDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Notes</label>
              <textarea
                className="input min-h-[120px] py-3"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes..."
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Medicines</h2>
                <button type="button" className="btn btn-outline flex items-center gap-2" onClick={addMedicine}>
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

              <div className="space-y-4">
                {form.medicines.map((med, idx) => (
                  <div key={idx} className="p-4 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-700">Medicine {idx + 1}</p>
                      {form.medicines.length > 1 && (
                        <button type="button" className="p-2 rounded-xl text-red-600 hover:bg-red-50" onClick={() => removeMedicine(idx)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Name *</label>
                        <input className="input h-12" value={med.name} onChange={(e) => updateMedicine(idx, 'name', e.target.value)} placeholder="e.g. Paracetamol" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Dosage</label>
                        <input className="input h-12" value={med.dosage} onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)} placeholder="e.g. 500mg" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Frequency</label>
                        <input className="input h-12" value={med.frequency} onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)} placeholder="e.g. 2 times/day" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Duration</label>
                        <input className="input h-12" value={med.duration} onChange={(e) => updateMedicine(idx, 'duration', e.target.value)} placeholder="e.g. 5 days" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Instructions</label>
                        <input className="input h-12" value={med.instructions} onChange={(e) => updateMedicine(idx, 'instructions', e.target.value)} placeholder="e.g. After meals" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={!canSubmit || saving} className="btn btn-primary w-full h-14 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-5 h-5 animate-spin" />}
              <span>{saving ? 'Creating...' : 'Create Prescription'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePrescription;

