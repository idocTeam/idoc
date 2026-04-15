import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Heart, User, LogOut, Calendar, Activity, Bell, FileText, BrainCircuit } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navLinks = [
    { name: 'Find Doctors', path: '/doctors' },
    { name: 'Specialties', path: '/specialties' },
    { name: 'AI Checker', path: '/ai-symptom-checker' },
    { name: 'Telemedicine', path: '/telemedicine' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-primary-200">
              <Heart className="text-white w-6 h-6" fill="currentColor" />
            </div>
            <span className={`text-2xl font-bold tracking-tight text-slate-900`}>
              IDOC
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                  location.pathname === link.path ? 'text-primary-600' : 'text-slate-600'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center space-x-4 pl-4 border-l border-slate-200">
                <Link to="/dashboard" className="p-2 text-slate-500 hover:text-primary-600 transition-colors">
                  <Bell className="w-5 h-5" />
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-3 p-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                      {user.name?.[0].toUpperCase() || 'U'}
                    </div>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all transform origin-top-right">
                    <Link to="/dashboard" className="flex items-center space-x-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                      <Activity className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                    <Link to="/profile" className="flex items-center space-x-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <Link to="/reports" className="flex items-center space-x-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                      <FileText className="w-4 h-4" />
                      <span>Medical Reports</span>
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left">
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-primary-600">
                  Log In
                </Link>
                <Link to="/register" className="btn btn-primary !py-2 !px-5 text-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-600">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className={`md:hidden bg-white border-b transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="px-4 pt-2 pb-6 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="block px-3 py-4 text-base font-medium text-slate-600 border-b border-slate-50 last:border-0"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          {user ? (
            <div className="pt-4 space-y-2">
              <Link to="/dashboard" className="block w-full text-center py-3 bg-slate-100 rounded-xl font-semibold">Dashboard</Link>
              <button onClick={handleLogout} className="block w-full text-center py-3 text-red-600 bg-red-50 rounded-xl font-semibold">Sign Out</button>
            </div>
          ) : (
            <div className="pt-4 space-y-2">
              <Link to="/login" className="block w-full text-center py-3 font-semibold text-slate-600" onClick={() => setIsOpen(false)}>Log In</Link>
              <Link to="/register" className="block w-full text-center py-3 bg-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-200" onClick={() => setIsOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
