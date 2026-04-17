import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorList from './pages/DoctorList';
import Booking from './pages/Booking';
import Dashboard from './pages/Dashboard';
import Telemedicine from './pages/Telemedicine';
import Profile from './pages/Profile';
import DoctorProfile from './pages/DoctorProfile';
import Reports from './pages/Reports';
import MyPrescriptions from './pages/MyPrescriptions';
import PrescriptionDetails from './pages/PrescriptionDetails';
import TicketDetails from './pages/TicketDetails';
import AISymptomChecker from './pages/AISymptomChecker';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PaymentStatus from './pages/PaymentStatus';
import AppointmentDetails from './pages/AppointmentDetails';
import CreatePrescription from './pages/CreatePrescription';
import PatientReportsDoctor from './pages/PatientReportsDoctor';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { getStoredToken, getStoredUser } from './utils/session';

const AdminProtectedRoute = ({ children }) => {
  const user = getStoredUser();
  const token = getStoredToken();

  if (!token || user?.role !== 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

const NotFound = () => (
  <div className="pt-32 pb-20 min-h-screen bg-slate-50 px-4">
    <div className="max-w-2xl mx-auto card p-10 text-center space-y-4">
      <h1 className="text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="text-slate-500">The page you requested does not exist.</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/doctors" element={<DoctorList />} />

            <Route
              path="/book/:id"
              element={
                <ProtectedRoute roles={['patient']}>
                  <Booking />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={['patient', 'doctor']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/telemedicine"
              element={
                <ProtectedRoute roles={['patient', 'doctor']}>
                  <Telemedicine />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute roles={['patient']}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor-profile"
              element={
                <ProtectedRoute roles={['doctor']}>
                  <DoctorProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute roles={['patient']}>
                  <Reports />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-prescriptions"
              element={
                <ProtectedRoute roles={['patient']}>
                  <MyPrescriptions />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-prescriptions/:id"
              element={
                <ProtectedRoute roles={['patient']}>
                  <PrescriptionDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ticket/:appointmentId"
              element={
                <ProtectedRoute roles={['patient', 'doctor']}>
                  <TicketDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/appointment/:id"
              element={
                <ProtectedRoute roles={['patient', 'doctor']}>
                  <AppointmentDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/prescriptions/new"
              element={
                <ProtectedRoute roles={['doctor']}>
                  <CreatePrescription />
                </ProtectedRoute>
              }
            />

            <Route
              path="/patients/:patientId/reports"
              element={
                <ProtectedRoute roles={['doctor']}>
                  <PatientReportsDoctor />
                </ProtectedRoute>
              }
            />

            <Route path="/payment-success" element={<PaymentStatus variant="success" />} />
            <Route path="/payment-cancel" element={<PaymentStatus variant="cancelled" />} />

            <Route path="/ai-symptom-checker" element={<AISymptomChecker />} />
            <Route path="/contact" element={<div className="pt-32 text-center"><h1 className="text-3xl font-bold">Contact Us</h1></div>} />
            <Route path="/specialties" element={<div className="pt-32 text-center"><h1 className="text-3xl font-bold">Medical Specialties</h1></div>} />

            <Route path="/admin" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;