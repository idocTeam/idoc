import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Lock, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  FileText,
  Clock,
  ChevronRight
} from 'lucide-react';
import { patientService } from '../services';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [isEditing, setIsEditing] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await patientService.getProfile();
      setProfile(data.patient);
    } catch (err) {
      console.error('Failed to load profile');
      // Mock data if service fails
      setProfile({
        name: user?.name || 'User',
        email: user?.email || 'user@example.com',
        phone: '+94 77 123 4567',
        address: '123 Health Ave, Colombo',
        bloodGroup: 'O+',
        allergies: 'None',
        emergencyContact: '+94 71 987 6543'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', content: '' });

    try {
      await patientService.updateProfile(profile);
      setMessage({ type: 'success', content: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (err) {
      setMessage({ type: 'error', content: 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="pt-32 flex justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Personal Profile</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage your personal information and medical preferences.</p>
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
          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="card text-center p-8 space-y-6">
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-primary-100 rounded-[40px] flex items-center justify-center text-4xl font-bold text-primary-700 border-4 border-white shadow-xl">
                  {profile.name?.[0].toUpperCase()}
                </div>
                <button className="absolute -bottom-2 -right-2 bg-white p-2.5 rounded-2xl shadow-lg border border-slate-100 text-primary-600 hover:bg-primary-50 transition-colors">
                  <Camera className="w-5 h-5" />
                </button>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{profile.name}</h2>
                <p className="text-slate-500 font-medium capitalize">{user.role}</p>
              </div>
              <div className="pt-6 border-t border-slate-50 flex justify-around">
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Blood</p>
                  <p className="text-lg font-bold text-slate-900">{profile.bloodGroup || 'N/A'}</p>
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
                Your account is fully verified. You can book unlimited consultations and access medical reports.
              </p>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="card p-8 lg:p-10">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-bold text-slate-900">Account Information</h3>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
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
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        disabled
                        className="input pl-12 bg-slate-50 text-slate-500"
                        value={profile.email}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        disabled={!isEditing}
                        className="input pl-12 disabled:bg-slate-50 disabled:text-slate-500"
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Emergency Contact</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        disabled={!isEditing}
                        className="input pl-12 disabled:bg-slate-50 disabled:text-slate-500"
                        value={profile.emergencyContact}
                        onChange={(e) => setProfile({...profile, emergencyContact: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-50">
                  <label className="text-sm font-bold text-slate-700 ml-1">Medical History & Allergies</label>
                  <textarea
                    disabled={!isEditing}
                    rows={4}
                    className="input py-4 disabled:bg-slate-50 disabled:text-slate-500 resize-none"
                    value={profile.allergies}
                    onChange={(e) => setProfile({...profile, allergies: e.target.value})}
                  />
                </div>

                {isEditing && (
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="btn btn-primary w-full h-14 flex items-center justify-center space-x-3"
                  >
                    {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      <>
                        <span>Save Changes</span>
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}
              </form>

              {!isEditing && (
                 <div className="mt-12 pt-10 border-t border-slate-50 space-y-6">
                    <h4 className="text-lg font-bold text-slate-900">Security Settings</h4>
                    <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary-200 transition-all">
                       <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                             <Lock className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                             <p className="font-bold text-slate-900">Account Password</p>
                             <p className="text-xs text-slate-500 font-medium">Last changed 3 months ago</p>
                          </div>
                       </div>
                       <button className="text-sm font-bold text-primary-600 hover:underline">Change</button>
                    </div>
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
