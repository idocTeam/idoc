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
  Clock,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Video,
  Users
} from 'lucide-react';
import { doctorService } from '../services';

import { useNavigate } from 'react-router-dom';

const DoctorProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = useState(null);
  
  const user = JSON.parse(localStorage.getItem('user'));

  // Redirect non-doctors away from this page
  useEffect(() => {
    if (user && user.role !== 'doctor') {
      navigate('/profile');
    }
  }, [user, navigate]);

  // Form state for new/editing slot
  const [slotForm, setSlotForm] = useState({
    type: 'recurring',
    day: '',
    date: '',
    startTime: '',
    endTime: '',
    slotDurationMinutes: 20,
    bufferMinutes: 0,
    mode: 'online',
    isAvailable: true,
    maxPatientsPerSlot: 1
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const modes = ['online', 'physical', 'both'];
  const durations = [10, 15, 20, 30, 45, 60];

  useEffect(() => {
    console.log('DoctorProfile component mounted');
    console.log('User role:', user?.role);
    fetchProfile();
    fetchAvailability();
  }, []);

  const fetchProfile = async () => {
    try {
      // Mock data for now - replace with actual API call
      setProfile({
        name: user?.name || 'Dr. John Doe',
        email: user?.email || 'doctor@example.com',
        phone: '+94 77 123 4567',
        specialty: 'General Medicine',
        hospital: 'City Hospital',
        qualifications: 'MBBS, MD',
        experienceYears: 10
      });
    } catch (err) {
      console.error('Failed to load profile');
    }
  };

  const fetchAvailability = async () => {
  try {
    console.log('Fetching availability...');
    const { data } = await doctorService.getMyAvailability();
    console.log('Availability data:', data);

    const slots =
      data?.availability ||
      data?.slots ||
      data?.data?.availability ||
      data?.data?.slots ||
      [];

    setAvailability(Array.isArray(slots) ? slots : []);
  } catch (err) {
    console.error('Failed to load availability:', err);
    console.error('Error response:', err.response);
    setAvailability([]);
  } finally {
    setLoading(false);
  }
};

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', content: '' });

    try {
      // Mock update - replace with actual API call
      setMessage({ type: 'success', content: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (err) {
      setMessage({ type: 'error', content: 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const resetSlotForm = () => {
    setSlotForm({
      type: 'recurring',
      day: '',
      date: '',
      startTime: '',
      endTime: '',
      slotDurationMinutes: 20,
      bufferMinutes: 0,
      mode: 'online',
      isAvailable: true,
      maxPatientsPerSlot: 1
    });
    setEditingSlotIndex(null);
    setIsAddingSlot(false);
  };

  const handleAddSlot = async () => {
    setSaving(true);
    try {
      if (editingSlotIndex !== null) {
        await doctorService.updateAvailabilitySlot(editingSlotIndex, slotForm);
      } else {
        await doctorService.addAvailabilitySlot(slotForm);
      }
      await fetchAvailability();
      resetSlotForm();
      setMessage({ type: 'success', content: `Availability slot ${editingSlotIndex !== null ? 'updated' : 'added'} successfully!` });
    } catch (err) {
      setMessage({ type: 'error', content: `Failed to ${editingSlotIndex !== null ? 'update' : 'add'} availability slot.` });
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
      maxPatientsPerSlot: slot.maxPatientsPerSlot || 1
    });
    setEditingSlotIndex(index);
    setIsAddingSlot(true);
  };

  const handleDeleteSlot = async (index) => {
    if (!confirm('Are you sure you want to delete this availability slot?')) return;
    
    setSaving(true);
    try {
      await doctorService.removeAvailabilitySlot(index);
      await fetchAvailability();
      setMessage({ type: 'success', content: 'Availability slot removed successfully!' });
    } catch (err) {
      setMessage({ type: 'error', content: 'Failed to remove availability slot.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSlot = async (index) => {
    try {
      await doctorService.toggleAvailabilitySlot(index);
      await fetchAvailability();
    } catch (err) {
      setMessage({ type: 'error', content: 'Failed to toggle availability slot.' });
    }
  };

  if (loading) return (
    <div className="pt-32 flex justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Doctor Profile</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage your profile information and availability schedule.</p>
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
                <p className="text-slate-500 font-medium">{profile.specialty}</p>
                <p className="text-sm text-slate-400">{profile.hospital}</p>
              </div>
              <div className="pt-6 border-t border-slate-50 flex justify-around">
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Experience</p>
                  <p className="text-lg font-bold text-slate-900">{profile.experienceYears} years</p>
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
              <h3 className="font-bold text-lg mb-2 relative z-10">Verified Doctor</h3>
              <p className="text-sm text-primary-100 relative z-10 leading-relaxed">
                Your profile is verified and you can manage patient appointments and availability.
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Information */}
            <div className="card p-8 lg:p-10">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-bold text-slate-900">Profile Information</h3>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={`text-sm font-bold transition-colors ${isEditing ? 'text-red-600' : 'text-primary-600'}`}
                >
                  {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                </button>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-8">
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
                    <label className="text-sm font-bold text-slate-700 ml-1">Specialty</label>
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        disabled={!isEditing}
                        className="input pl-12 disabled:bg-slate-50 disabled:text-slate-500"
                        value={profile.specialty}
                        onChange={(e) => setProfile({...profile, specialty: e.target.value})}
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
                    {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      <>
                        <span>Save Changes</span>
                        <Save className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}
              </form>
            </div>

            {/* Debug Section */}
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <h4 className="font-bold text-amber-800 mb-2">Debug Info</h4>
              <div className="text-sm text-amber-700 space-y-1">
                <p>URL: {window.location.pathname}</p>
                <p>User Role: {user?.role}</p>
                <p>Loading: {loading ? 'Yes' : 'No'}</p>
                <p>Availability Slots: {availability.length}</p>
                <p>Adding Slot: {isAddingSlot ? 'Yes' : 'No'}</p>
              </div>
              <button 
                onClick={() => setIsAddingSlot(true)}
                className="mt-3 px-3 py-1 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700"
              >
                Force Show Add Slot Form
              </button>
            </div>

            {/* Availability Management */}
            <div className="card p-8 lg:p-10">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-bold text-slate-900">Availability Schedule</h3>
                <button 
                  onClick={() => setIsAddingSlot(!isAddingSlot)}
                  className="btn btn-primary !py-2 !px-4 text-sm flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Slot</span>
                </button>
              </div>

              {/* Add/Edit Slot Form */}
              {isAddingSlot && (
                <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold text-slate-900">
                      {editingSlotIndex !== null ? 'Edit Availability Slot' : 'Add New Availability Slot'}
                    </h4>
                    <button 
                      onClick={resetSlotForm}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Slot Type</label>
                      <select
                        className="input"
                        value={slotForm.type}
                        onChange={(e) => setSlotForm({...slotForm, type: e.target.value, day: '', date: ''})}
                      >
                        <option value="recurring">Recurring (Weekly)</option>
                        <option value="specificDate">Specific Date</option>
                      </select>
                    </div>

                    {slotForm.type === 'recurring' ? (
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Day of Week</label>
                        <select
                          className="input"
                          value={slotForm.day}
                          onChange={(e) => setSlotForm({...slotForm, day: e.target.value})}
                        >
                          <option value="">Select Day</option>
                          {days.map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Date</label>
                        <input
                          type="date"
                          className="input"
                          value={slotForm.date}
                          onChange={(e) => setSlotForm({...slotForm, date: e.target.value})}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Start Time</label>
                      <input
                        type="time"
                        className="input"
                        value={slotForm.startTime}
                        onChange={(e) => setSlotForm({...slotForm, startTime: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">End Time</label>
                      <input
                        type="time"
                        className="input"
                        value={slotForm.endTime}
                        onChange={(e) => setSlotForm({...slotForm, endTime: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Slot Duration</label>
                      <select
                        className="input"
                        value={slotForm.slotDurationMinutes}
                        onChange={(e) => setSlotForm({...slotForm, slotDurationMinutes: parseInt(e.target.value)})}
                      >
                        {durations.map(duration => (
                          <option key={duration} value={duration}>{duration} minutes</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Consultation Mode</label>
                      <select
                        className="input"
                        value={slotForm.mode}
                        onChange={(e) => setSlotForm({...slotForm, mode: e.target.value})}
                      >
                        <option value="online">Online</option>
                        <option value="physical">Physical</option>
                        <option value="both">Both</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Max Patients per Slot</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        className="input"
                        value={slotForm.maxPatientsPerSlot}
                        onChange={(e) => setSlotForm({...slotForm, maxPatientsPerSlot: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Buffer Minutes</label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        className="input"
                        value={slotForm.bufferMinutes}
                        onChange={(e) => setSlotForm({...slotForm, bufferMinutes: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isAvailable"
                      className="w-4 h-4 text-primary-600 rounded"
                      checked={slotForm.isAvailable}
                      onChange={(e) => setSlotForm({...slotForm, isAvailable: e.target.checked})}
                    />
                    <label htmlFor="isAvailable" className="text-sm font-medium text-slate-700">
                      Available for booking
                    </label>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button 
                      onClick={handleAddSlot}
                      disabled={saving}
                      className="btn btn-primary flex items-center space-x-2"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>{editingSlotIndex !== null ? 'Update' : 'Add'} Slot</span>
                        </>
                      )}
                    </button>
                    <button 
                      onClick={resetSlotForm}
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Existing Slots */}
              <div className="space-y-4">
                {availability.length > 0 ? (
                  availability.map((slot, index) => (
                    <div key={index} className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary-200 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            slot.isAvailable ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                          }`}>
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900">
                                {slot.type === 'recurring' ? slot.day : slot.date}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-100 text-primary-700">
                                {slot.mode}
                              </span>
                              {!slot.isAvailable && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                  Unavailable
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-slate-500 mt-1">
                              <span className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{slot.startTime} - {slot.endTime}</span>
                              </span>
                              <span>{slot.slotDurationMinutes}min slots</span>
                              <span>{slot.maxPatientsPerSlot} patients/slot</span>
                            </div>
                            {slot.generatedSlots && slot.generatedSlots.length > 0 && (
                              <div className="mt-2 text-xs text-slate-400">
                                {slot.generatedSlots.length} slots generated
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleToggleSlot(index)}
                            className={`p-2 rounded-lg transition-colors ${
                              slot.isAvailable 
                                ? 'text-green-600 hover:bg-green-50' 
                                : 'text-slate-400 hover:bg-slate-50'
                            }`}
                            title={slot.isAvailable ? 'Mark as unavailable' : 'Mark as available'}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditSlot(index)}
                            className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors"
                            title="Edit slot"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteSlot(index)}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                            title="Delete slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-slate-900 mb-2">No Availability Slots</h4>
                    <p className="text-slate-500 mb-6">Add availability slots to start accepting appointments.</p>
                    <button 
                      onClick={() => setIsAddingSlot(true)}
                      className="btn btn-primary inline-flex items-center space-x-2"
                    >
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
