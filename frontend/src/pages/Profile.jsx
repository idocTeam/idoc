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
  ChevronRight,
  Calendar,
  Home,
  VenusAndMars,
} from 'lucide-react';
import { apiOrigin, patientService } from '../services';
import { getStoredUser, updateStoredUser } from '../utils/session';

const buildProfileForm = (patient = {}) => ({
  fullName: patient.fullName || patient.name || '',
  email: patient.email || '',
  phone: patient.phone || '',
  address: patient.address || '',
  dateOfBirth: patient.dateOfBirth ? String(patient.dateOfBirth).slice(0, 10) : '',
  gender: patient.gender ? `${patient.gender}`.charAt(0).toUpperCase() + `${patient.gender}`.slice(1).toLowerCase() : '',
  photoPath: patient.photoPath || '',
});

const Profile = () => {
  const user = getStoredUser();
  const [savedProfile, setSavedProfile] = useState(buildProfileForm(user || {}));
  const [draftProfile, setDraftProfile] = useState(buildProfileForm(user || {}));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const viewProfile = isEditing ? draftProfile : savedProfile;
  const initials = useMemo(
    () => (viewProfile.fullName?.[0] || user?.name?.[0] || 'U').toUpperCase(),
    [viewProfile.fullName, user?.name]
  );
  const photoUrl = useMemo(() => {
    const p = viewProfile.photoPath || savedProfile.photoPath;
    if (!p) return '';
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    return `${apiOrigin}${p}`;
  }, [viewProfile.photoPath, savedProfile.photoPath]);

  const fetchProfile = async () => {
    try {
      const { data } = await patientService.getProfile();
      const nextProfile = buildProfileForm(data.patient);
      setSavedProfile(nextProfile);
      setDraftProfile(nextProfile);
      updateStoredUser(data.patient);
    } catch (err) {
      console.error('Failed to load profile', err);
      setMessage({ type: 'error', content: 'Could not load your latest profile. Showing saved session data.' });
      const fallbackProfile = buildProfileForm(user || {});
      setSavedProfile(fallbackProfile);
      setDraftProfile(fallbackProfile);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', content: '' });

    try {
      const payload = {
        fullName: draftProfile.fullName,
        phone: draftProfile.phone,
        address: draftProfile.address,
        dateOfBirth: draftProfile.dateOfBirth || null,
        gender: draftProfile.gender,
      };

      const { data } = await patientService.updateProfile(payload);
      const nextProfile = buildProfileForm(data.patient);
      setSavedProfile(nextProfile);
      setDraftProfile(nextProfile);
      updateStoredUser(data.patient);
      setMessage({ type: 'success', content: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (err) {
      setMessage({
        type: 'error',
        content: err.response?.data?.message || 'Failed to update profile.',
      });
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
      const { data } = await patientService.uploadMyPhoto(fd);
      const nextProfile = buildProfileForm(data.patient);
      setSavedProfile(nextProfile);
      setDraftProfile(nextProfile);
      updateStoredUser(data.patient);
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

  if (loading) {
    return (
      <div className="pt-32 flex justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Personal Profile</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage your personal information and patient account details.</p>
        </div>

        {message.content && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-4 rounded-2xl flex items-center space-x-3 border ${
              message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{message.content}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="card text-center p-8 space-y-6">
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-primary-100 rounded-[40px] flex items-center justify-center text-4xl font-bold text-primary-700 border-4 border-white shadow-xl">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Patient profile" className="w-full h-full object-cover rounded-[40px]" />
                  ) : (
                    initials
                  )}
                </div>
                <button
                  type="button"
                  onClick={handlePhotoPick}
                  disabled={photoUploading}
                  className="absolute -bottom-2 -right-2 bg-white p-2.5 rounded-2xl shadow-lg border border-slate-100 text-primary-600 disabled:opacity-60"
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
                <h2 className="text-2xl font-bold text-slate-900">{viewProfile.fullName || user?.name}</h2>
                <p className="text-slate-500 font-medium capitalize">Patient</p>
              </div>
              <div className="pt-6 border-t border-slate-50 flex justify-around">
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">DOB</p>
                  <p className="text-lg font-bold text-slate-900">{viewProfile.dateOfBirth || 'N/A'}</p>
                </div>
                <div className="w-px bg-slate-100 h-10" />
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Status</p>
                  <p className="text-lg font-bold text-green-600">Active</p>
                </div>
              </div>
            </div>

            <div className="card p-6 bg-primary-600 text-white relative overflow-hidden border-none">
              <Shield className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
              <h3 className="font-bold text-lg mb-2 relative z-10">Verified Account</h3>
              <p className="text-sm text-primary-100 relative z-10 leading-relaxed">
                Your patient account is authenticated and ready for appointment booking, payment, and report management.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card p-8 lg:p-10">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-bold text-slate-900">Account Information</h3>
                <button
                  type="button"
                  onClick={isEditing ? cancelEditing : startEditing}
                  className={`text-sm font-bold transition-colors ${isEditing ? 'text-red-600' : 'text-primary-600'}`}
                >
                  {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        disabled={!isEditing}
                        className="input pl-12 disabled:bg-slate-50 disabled:text-slate-500"
                        value={draftProfile.fullName}
                        onChange={(e) => setDraftProfile((prev) => ({ ...prev, fullName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input disabled className="input pl-12 bg-slate-50 text-slate-500" value={draftProfile.email} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        disabled={!isEditing}
                        className="input pl-12 disabled:bg-slate-50 disabled:text-slate-500"
                        value={draftProfile.phone}
                        onChange={(e) => setDraftProfile((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="date"
                        disabled={!isEditing}
                        className="input pl-12 disabled:bg-slate-50 disabled:text-slate-500"
                        value={draftProfile.dateOfBirth}
                        onChange={(e) => setDraftProfile((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Gender</label>
                    <div className="relative">
                      <VenusAndMars className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <select
                        disabled={!isEditing}
                        className="input pl-12 disabled:bg-slate-50 disabled:text-slate-500"
                        value={draftProfile.gender}
                        onChange={(e) => setDraftProfile((prev) => ({ ...prev, gender: e.target.value }))}
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Address</label>
                    <div className="relative">
                      <Home className="absolute left-4 top-5 text-slate-400 w-5 h-5" />
                      <textarea
                        disabled={!isEditing}
                        rows={3}
                        className="input pl-12 py-4 disabled:bg-slate-50 disabled:text-slate-500 resize-none"
                        value={draftProfile.address}
                        onChange={(e) => setDraftProfile((prev) => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary w-full h-14 flex items-center justify-center space-x-3"
                  >
                    {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><span>Save Changes</span><ChevronRight className="w-5 h-5" /></>}
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
