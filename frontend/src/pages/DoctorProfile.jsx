import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Shield,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiOrigin, doctorService } from '../services';
import { getStoredUser, updateStoredUser } from '../utils/session';

const DEFAULT_SLOT_FORM = {
  type: 'recurring',
  day: '',
  date: '',
  startTime: '',
  endTime: '',
  slotDurationMinutes: 20,
  bufferMinutes: 0,
  mode: 'online',
  isAvailable: true,
  maxPatientsPerSlot: 1,
};

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const durations = [10, 15, 20, 30, 45, 60];

const normalizeDoctorForm = (doctor = {}) => ({
  fullName: doctor.fullName || '',
  email: doctor.email || '',
  phone: doctor.phone || '',
  specialty: doctor.specialty || '',
  hospital: doctor.hospital || '',
  qualifications: doctor.qualifications || '',
  experienceYears: doctor.experienceYears || '',
  consultationFee: doctor.consultationFee || '',
  bio: doctor.bio || '',
  approvalStatus: doctor.approvalStatus || 'approved',
  photoPath: doctor.photoPath || '',
});

const DoctorProfile = () => {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [savedProfile, setSavedProfile] = useState(normalizeDoctorForm(user || {}));
  const [draftProfile, setDraftProfile] = useState(normalizeDoctorForm(user || {}));
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = useState(null);
  const [slotForm, setSlotForm] = useState(DEFAULT_SLOT_FORM);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user && user.role !== 'doctor') {
      navigate('/profile');
      return;
    }

    fetchDoctorData();
  }, []);

  const viewProfile = isEditing ? draftProfile : savedProfile;
  const initials = useMemo(() => (viewProfile.fullName?.[0] || user?.name?.[0] || 'D').toUpperCase(), [viewProfile.fullName, user?.name]);
  const photoUrl = useMemo(() => {
    const p = viewProfile.photoPath || savedProfile.photoPath;
    if (!p) return '';
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    // served by doctor-service via gateway: /api/doctors/uploads/...
    return `${apiOrigin}/api/doctors${p}`;
  }, [viewProfile.photoPath, savedProfile.photoPath]);

  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      const [profileRes, availabilityRes] = await Promise.all([
        doctorService.getMyProfile(),
        doctorService.getMyAvailability(),
      ]);

      const nextProfile = normalizeDoctorForm(profileRes.data.doctor);
      setSavedProfile(nextProfile);
      setDraftProfile(nextProfile);
      updateStoredUser(profileRes.data.doctor);

      const slots = availabilityRes.data?.availability || [];
      setAvailability(Array.isArray(slots) ? slots : []);
    } catch (err) {
      console.error('Failed to load doctor profile or availability', err);
      setMessage({ type: 'error', content: 'Failed to load doctor profile or availability.' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', content: '' });

    try {
      const payload = {
        fullName: draftProfile.fullName,
        phone: draftProfile.phone,
        specialty: draftProfile.specialty,
        qualifications: draftProfile.qualifications,
        hospital: draftProfile.hospital,
        consultationFee: Number(draftProfile.consultationFee || 0),
        bio: draftProfile.bio,
        experienceYears: Number(draftProfile.experienceYears || 0),
      };

      const { data } = await doctorService.updateMyProfile(payload);
      const nextProfile = normalizeDoctorForm(data.doctor);
      setSavedProfile(nextProfile);
      setDraftProfile(nextProfile);
      updateStoredUser(data.doctor);
      setMessage({ type: 'success', content: 'Doctor profile updated successfully!' });
      setIsEditing(false);
    } catch (err) {
      setMessage({ type: 'error', content: err.response?.data?.message || 'Failed to update doctor profile.' });
    } finally {
      setSaving(false);
    }
  };

  const startEditing = () => {
    setDraftProfile(savedProfile);
    setIsEditing(true);
    setMessage({ type: '', content: '' });
  };

  const cancelEditing = () => {
    setDraftProfile(savedProfile);
    setIsEditing(false);
    setMessage({ type: '', content: '' });
  };

  const handlePhotoPick = () => {
    if (!isEditing) startEditing();
    fileInputRef.current?.click?.();
  };

  const handlePhotoSelected = async (file) => {
    if (!file) return;
    try {
      setPhotoUploading(true);
      setMessage({ type: '', content: '' });
      const fd = new FormData();
      fd.append('photo', file);
      const { data } = await doctorService.uploadMyPhoto(fd);
      const nextProfile = normalizeDoctorForm(data.doctor);
      setSavedProfile(nextProfile);
      setDraftProfile(nextProfile);
      updateStoredUser(data.doctor);
      setMessage({ type: 'success', content: 'Profile photo updated.' });
    } catch (err) {
      setMessage({
        type: 'error',
        content: err.response?.data?.message || 'Failed to upload profile photo.',
      });
    } finally {
      setPhotoUploading(false);
    }
  };

  const resetSlotForm = () => {
    setSlotForm(DEFAULT_SLOT_FORM);
    setEditingSlotIndex(null);
    setIsAddingSlot(false);
  };

  const handleAddOrUpdateSlot = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', content: '' });

      if (editingSlotIndex !== null) {
        await doctorService.updateAvailabilitySlot(editingSlotIndex, slotForm);
      } else {
        await doctorService.addAvailabilitySlot(slotForm);
      }

      await fetchDoctorData();
      resetSlotForm();
      setMessage({ type: 'success', content: `Availability slot ${editingSlotIndex !== null ? 'updated' : 'added'} successfully.` });
    } catch (err) {
      setMessage({ type: 'error', content: err.response?.data?.message || 'Failed to save availability slot.' });
    } finally {
      setSaving(false);
    }
  };

  const handleEditSlot = (index) => {
    const slot = availability[index];
    setSlotForm({
      type: slot.type || 'recurring',
      day: slot.day || '',
      date: slot.date || '',
      startTime: slot.startTime || '',
      endTime: slot.endTime || '',
      slotDurationMinutes: slot.slotDurationMinutes || 20,
      bufferMinutes: slot.bufferMinutes || 0,
      mode: slot.mode || 'online',
      isAvailable: slot.isAvailable !== false,
      maxPatientsPerSlot: slot.maxPatientsPerSlot || 1,
    });
    setEditingSlotIndex(index);
    setIsAddingSlot(true);
  };

  const handleDeleteSlot = async (index) => {
    if (!window.confirm('Delete this availability slot?')) return;
    try {
      await doctorService.removeAvailabilitySlot(index);
      await fetchDoctorData();
      setMessage({ type: 'success', content: 'Availability slot removed successfully.' });
    } catch (err) {
      setMessage({ type: 'error', content: err.response?.data?.message || 'Failed to remove slot.' });
    }
  };

  const handleToggleSlot = async (index) => {
    try {
      await doctorService.toggleAvailabilitySlot(index);
      await fetchDoctorData();
    } catch (err) {
      setMessage({ type: 'error', content: err.response?.data?.message || 'Failed to toggle slot availability.' });
    }
  };

  if (loading) {
    return (
      <div className="pt-32 flex justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Doctor Profile</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage your doctor account details and live availability schedule.</p>
        </div>

        {message.content && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`mb-8 p-4 rounded-2xl flex items-center space-x-3 border ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{message.content}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="card text-center p-8 space-y-6">
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-primary-100 rounded-[40px] overflow-hidden flex items-center justify-center text-4xl font-bold text-primary-700 border-4 border-white shadow-xl">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Doctor profile" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <button
                  type="button"
                  onClick={handlePhotoPick}
                  disabled={photoUploading}
                  className="absolute -bottom-2 -right-2 bg-white p-2.5 rounded-2xl shadow-lg border border-slate-100 text-primary-600 disabled:opacity-60"
                  title="Upload photo"
                >
                  {photoUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handlePhotoSelected(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{viewProfile.fullName}</h2>
                <p className="text-slate-500 font-medium">{viewProfile.specialty}</p>
                <p className="text-sm text-slate-400">{viewProfile.hospital}</p>
              </div>
              <div className="pt-6 border-t border-slate-50 flex justify-around">
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Experience</p>
                  <p className="text-lg font-bold text-slate-900">{viewProfile.experienceYears || 0} years</p>
                </div>
                <div className="w-px bg-slate-100 h-10" />
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Approval</p>
                  <p className="text-lg font-bold text-green-600 capitalize">{viewProfile.approvalStatus}</p>
                </div>
              </div>
            </div>

            <div className="card p-6 bg-primary-600 text-white relative overflow-hidden border-none">
              <Shield className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
              <h3 className="font-bold text-lg mb-2 relative z-10">Verified Doctor</h3>
              <p className="text-sm text-primary-100 relative z-10 leading-relaxed">
                This page is wired to the doctor-service profile and availability endpoints through the API gateway.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="card p-8 lg:p-10">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-bold text-slate-900">Profile Information</h3>
                <button
                  type="button"
                  onClick={isEditing ? cancelEditing : startEditing}
                  className={`text-sm font-bold transition-colors ${isEditing ? 'text-red-600' : 'text-primary-600'}`}
                >
                  {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                </button>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Full Name', key: 'fullName', icon: User },
                    { label: 'Email Address', key: 'email', icon: Mail, disabled: true },
                    { label: 'Phone Number', key: 'phone', icon: Phone },
                    { label: 'Specialty', key: 'specialty', icon: Shield },
                    { label: 'Hospital', key: 'hospital', icon: Shield },
                    { label: 'Qualifications', key: 'qualifications', icon: Shield },
                    { label: 'Experience Years', key: 'experienceYears', icon: Shield, type: 'number' },
                    { label: 'Consultation Fee', key: 'consultationFee', icon: Shield, type: 'number' },
                  ].map(({ label, key, icon: Icon, disabled, type = 'text' }) => (
                    <div className="space-y-2" key={key}>
                      <label className="text-sm font-bold text-slate-700 ml-1">{label}</label>
                      <div className="relative">
                        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          type={type}
                          disabled={disabled || !isEditing}
                          className="input pl-12 disabled:bg-slate-50 disabled:text-slate-500"
                          value={draftProfile[key]}
                          onChange={(e) => setDraftProfile((prev) => ({ ...prev, [key]: e.target.value }))}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Biography</label>
                  <textarea disabled={!isEditing} rows={4} className="input py-4 disabled:bg-slate-50 disabled:text-slate-500 resize-none" value={draftProfile.bio} onChange={(e) => setDraftProfile((prev) => ({ ...prev, bio: e.target.value }))} />
                </div>

                {isEditing && (
                  <button type="submit" disabled={saving} className="btn btn-primary w-full h-14 flex items-center justify-center space-x-3">
                    {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><span>Save Changes</span><Save className="w-5 h-5" /></>}
                  </button>
                )}
              </form>
            </div>

            <div className="card p-8 lg:p-10">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-bold text-slate-900">Availability Schedule</h3>
                <button type="button" onClick={() => setIsAddingSlot((prev) => !prev)} className="btn btn-primary !py-2 !px-4 text-sm flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add Slot</span>
                </button>
              </div>

              {isAddingSlot && (
                <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold text-slate-900">{editingSlotIndex !== null ? 'Edit Availability Slot' : 'Add New Availability Slot'}</h4>
                    <button type="button" onClick={resetSlotForm} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Slot Type</label>
                      <select className="input" value={slotForm.type} onChange={(e) => setSlotForm((prev) => ({ ...prev, type: e.target.value, day: '', date: '' }))}>
                        <option value="recurring">Recurring (Weekly)</option>
                        <option value="specificDate">Specific Date</option>
                      </select>
                    </div>

                    {slotForm.type === 'recurring' ? (
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Day of Week</label>
                        <select className="input" value={slotForm.day} onChange={(e) => setSlotForm((prev) => ({ ...prev, day: e.target.value }))}>
                          <option value="">Select Day</option>
                          {days.map((day) => <option key={day} value={day}>{day}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Date</label>
                        <input type="date" className="input" value={slotForm.date} onChange={(e) => setSlotForm((prev) => ({ ...prev, date: e.target.value }))} />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Start Time</label>
                      <input type="time" className="input" value={slotForm.startTime} onChange={(e) => setSlotForm((prev) => ({ ...prev, startTime: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">End Time</label>
                      <input type="time" className="input" value={slotForm.endTime} onChange={(e) => setSlotForm((prev) => ({ ...prev, endTime: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Slot Duration</label>
                      <select className="input" value={slotForm.slotDurationMinutes} onChange={(e) => setSlotForm((prev) => ({ ...prev, slotDurationMinutes: Number(e.target.value) }))}>
                        {durations.map((duration) => <option key={duration} value={duration}>{duration} minutes</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Consultation Mode</label>
                      <select className="input" value={slotForm.mode} onChange={(e) => setSlotForm((prev) => ({ ...prev, mode: e.target.value }))}>
                        <option value="online">Online</option>
                        <option value="physical">Physical</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Max Patients per Slot</label>
                      <input type="number" min="1" max="10" className="input" value={slotForm.maxPatientsPerSlot} onChange={(e) => setSlotForm((prev) => ({ ...prev, maxPatientsPerSlot: Number(e.target.value) }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Buffer Minutes</label>
                      <input type="number" min="0" max="30" className="input" value={slotForm.bufferMinutes} onChange={(e) => setSlotForm((prev) => ({ ...prev, bufferMinutes: Number(e.target.value) }))} />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center space-x-2">
                    <input type="checkbox" id="isAvailable" className="w-4 h-4 text-primary-600 rounded" checked={slotForm.isAvailable} onChange={(e) => setSlotForm((prev) => ({ ...prev, isAvailable: e.target.checked }))} />
                    <label htmlFor="isAvailable" className="text-sm font-medium text-slate-700">Available for booking</label>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button type="button" onClick={handleAddOrUpdateSlot} disabled={saving} className="btn btn-primary flex items-center space-x-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /><span>{editingSlotIndex !== null ? 'Update' : 'Add'} Slot</span></>}
                    </button>
                    <button type="button" onClick={resetSlotForm} className="btn btn-outline">Cancel</button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {availability.length > 0 ? availability.map((slot, index) => (
                  <div key={index} className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary-200 transition-all">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${slot.isAvailable ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="font-bold text-slate-900">{slot.type === 'specificDate' ? slot.date : slot.day}</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-100 text-primary-700">{slot.mode}</span>
                            {!slot.isAvailable && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">Unavailable</span>}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-slate-500 mt-1 flex-wrap">
                            <span className="flex items-center space-x-1"><Clock className="w-4 h-4" /><span>{slot.startTime} - {slot.endTime}</span></span>
                            <span>{slot.slotDurationMinutes} min slots</span>
                            <span>{slot.maxPatientsPerSlot || 1} patients/slot</span>
                          </div>
                          {slot.generatedSlots?.length > 0 && (
                            <div className="mt-2 text-xs text-slate-400">{slot.generatedSlots.length} generated bookable sub-slots</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button type="button" onClick={() => handleToggleSlot(index)} className={`p-2 rounded-lg transition-colors ${slot.isAvailable ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-50'}`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => handleEditSlot(index)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => handleDeleteSlot(index)} className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-slate-900 mb-2">No Availability Slots</h4>
                    <p className="text-slate-500 mb-6">Add availability slots to start accepting appointments.</p>
                    <button type="button" onClick={() => setIsAddingSlot(true)} className="btn btn-primary inline-flex items-center space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Add Your First Slot</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
