import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import TicketDetails from './pages/TicketDetails';
import AISymptomChecker from './pages/AISymptomChecker';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { Navigate } from 'react-router-dom';

const AdminProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  
  if (!token || user?.role !== 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  return children;
};

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
            <Route path="/book/:id" element={<Booking />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/telemedicine" element={<Telemedicine />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/doctor-profile" element={<DoctorProfile />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/ticket/:appointmentId" element={<TicketDetails />} />
            <Route path="/ai-symptom-checker" element={<AISymptomChecker />} />
            <Route path="/contact" element={<div className="pt-32 text-center"><h1 className="text-3xl font-bold">Contact Us</h1></div>} />
            <Route path="/specialties" element={<div className="pt-32 text-center"><h1 className="text-3xl font-bold">Medical Specialties</h1></div>} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              } 
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
