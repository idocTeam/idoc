import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import { patientService, doctorService } from '../services';
import { saveAuthSession } from '../utils/session';
import { Mail, Lock, User, Phone, ArrowRight, AlertCircle, Loader2, Stethoscope, Camera } from 'lucide-react';

const Register = () => {
  const [role, setRole] = useState('patient');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    pw: '',
    phone: '',
    specialty: '',
    consultationFee: '',
    qualifications: 'MBBS', // Default value
    hospital: 'General Hospital', // Default value
    bio: 'Experienced doctor specializing in ' + role, // Default value
    experienceYears: '5', // Default value
    medicalLicenseNumber: 'MD' + Math.floor(Math.random() * 100000), // Random default
    photo: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const navigate = useNavigate();

  // Handle photo preview cleanup
  React.useEffect(() => {
    if (formData.photo) {
      const url = URL.createObjectURL(formData.photo);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [formData.photo]);

  // Update bio when role or specialty changes
  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      bio: `Experienced ${role} specializing in ${prev.specialty || 'medicine'}.`,
      medicalLicenseNumber: prev.medicalLicenseNumber || 'MD' + Math.floor(Math.random() * 100000)
    }));
  }, [role, formData.specialty]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const service = role === 'patient' ? patientService : doctorService;
      
      let submissionData;
      
      if (role === 'doctor') {
        submissionData = new FormData();
        Object.keys(formData).forEach(key => {
          if (key === 'photo') {
            if (formData[key]) {
              submissionData.append('photo', formData[key]);
            }
          } else if (key === 'experienceYears') {
            submissionData.append(key, parseInt(formData[key]));
          } else if (key === 'consultationFee') {
            submissionData.append(key, parseFloat(formData[key]));
          } else {
            submissionData.append(key, formData[key]);
          }
        });
      } else {
        // Patients registration remains JSON
        submissionData = { ...formData };
        delete submissionData.specialty;
        delete submissionData.consultationFee;
        delete submissionData.qualifications;
        delete submissionData.hospital;
        delete submissionData.bio;
        delete submissionData.experienceYears;
        delete submissionData.medicalLicenseNumber;
        delete submissionData.photo;
      }

      const { data } = await service.register(submissionData);
      
      if (role === 'patient') {
        // Auto-login for patients
        const loginRes = await patientService.login({ 
          email: formData.email, 
          pw: formData.pw 
        });
        
        saveAuthSession({
          token: loginRes.data.token,
          user: loginRes.data.patient,
          role: 'patient',
        });

        navigate('/dashboard');
      } else {
        // Doctors need approval
        navigate('/login', { 
          state: { 
            message: 'Registration successful! Your account is pending admin approval. You can login once approved.' 
          } 
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <AuthLayout 
      title="Create Account" 
      subtitle="Join IDOC today and experience healthcare reimagined."
    >
      {/* Role Switcher */}
      <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
        <button
          type="button"
          onClick={() => { setRole('patient'); setFormData(prev => ({ ...prev, photo: null })); }}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-bold transition-all ${
            role === 'patient' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Patient</span>
        </button>
        <button
          type="button"
          onClick={() => setRole('doctor')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-bold transition-all ${
            role === 'doctor' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Doctor</span>
        </button>
      </div>

      <form onSubmit={handleRegister} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {role === 'doctor' && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Profile Photo</label>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 overflow-hidden border-2 border-dashed border-slate-200">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <Camera className="w-6 h-6" />
                )}
              </div>
              <label className="flex-1 cursor-pointer">
                <div className="bg-white border-2 border-slate-200 border-dashed rounded-2xl p-4 text-center hover:border-primary-500 hover:bg-primary-50/30 transition-all">
                  <span className="text-sm font-medium text-slate-500">
                    {formData.photo ? formData.photo.name : 'Click to upload profile photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFormData({ ...formData, photo: e.target.files[0] })}
                  />
                </div>
              </label>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              name="fullName"
              type="text"
              required
              className="input pl-12"
              placeholder={role === 'doctor' ? 'Dr. John Doe' : 'John Doe'}
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              name="email"
              type="email"
              required
              className="input pl-12"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>

        {role === 'doctor' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Specialty</label>
                <div className="relative">
                  <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <select
                    name="specialty"
                    required
                    className="input pl-12 appearance-none"
                    value={formData.specialty}
                    onChange={handleChange}
                  >
                    <option value="">Select Specialty</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Psychiatry">Psychiatry</option>
                    <option value="General Medicine">General Medicine</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Consultation Fee ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    name="consultationFee"
                    type="number"
                    required
                    className="input pl-10"
                    placeholder="50"
                    value={formData.consultationFee}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Qualifications</label>
                <input
                  name="qualifications"
                  type="text"
                  required
                  className="input"
                  placeholder="MBBS, MD"
                  value={formData.qualifications}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Hospital</label>
                <input
                  name="hospital"
                  type="text"
                  required
                  className="input"
                  placeholder="City Hospital"
                  value={formData.hospital}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Experience (Years)</label>
                <input
                  name="experienceYears"
                  type="number"
                  required
                  className="input"
                  placeholder="5"
                  value={formData.experienceYears}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">License Number</label>
                <input
                  name="medicalLicenseNumber"
                  type="text"
                  required
                  className="input"
                  placeholder="MC12345"
                  value={formData.medicalLicenseNumber}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Short Bio</label>
              <textarea
                name="bio"
                required
                className="input min-h-[100px] py-3"
                placeholder="Tell patients about yourself..."
                value={formData.bio}
                onChange={handleChange}
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              name="phone"
              type="tel"
              required
              className="input pl-12"
              placeholder="+94 77 123 4567"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              name="pw"
              type="password"
              required
              className="input pl-12"
              placeholder="••••••••"
              value={formData.pw}
              onChange={handleChange}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn btn-primary w-full flex items-center justify-center space-x-3 h-14"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 font-medium pt-8">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 font-bold hover:underline">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
