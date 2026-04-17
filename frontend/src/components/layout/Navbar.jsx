import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Heart, User, LogOut, Calendar, Activity, Bell, FileText, BrainCircuit, ChevronDown, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileProfileMenu] = useState(false);
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
    const isAdmin = user?.role === 'admin';
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate(isAdmin ? '/admin' : '/login');
  };

  const navLinks = user?.role === 'admin' ? [
    { name: 'Dashboard', path: '/admin/dashboard' },
  ] : [
    { name: 'Find Doctors', path: '/doctors' },
    { name: 'Specialties', path: '/specialties' },
    { name: 'AI Checker', path: '/ai-symptom-checker' },
    { name: 'Telemedicine', path: '/telemedicine' },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled ? 'py-4' : 'py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`relative flex justify-between items-center px-6 py-3 rounded-[24px] transition-all duration-500 ${
          scrolled ? 'glass shadow-premium' : 'bg-transparent'
        }`}>
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 bg-primary-600 rounded-2xl flex items-center justify-center group-hover:rotate-[15deg] transition-all duration-500 shadow-lg shadow-primary-500/30">
              <Heart className="text-white w-6 h-6" fill="currentColor" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">
              IDOC<span className="text-primary-600">.</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${
                  location.pathname === link.path 
                    ? 'text-primary-600 bg-primary-50' 
                    : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="h-6 w-px bg-slate-200 mx-4" />

            {user ? (
              <div className="flex items-center space-x-3">
                <button className="p-2.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowProfileProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-3 p-1.5 pr-3 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {user.name?.[0].toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-bold text-slate-700">{user.name?.split(' ')[0]}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-56 bg-white rounded-3xl shadow-premium border border-slate-100 py-3 overflow-hidden"
                      >
                        <Link to="/dashboard" className="flex items-center space-x-3 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                          <Activity className="w-4 h-4" />
                          <span>Dashboard</span>
                        </Link>
                        <Link to={user.role === 'doctor' ? '/doctor-profile' : '/profile'} className="flex items-center space-x-3 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                          <User className="w-4 h-4" />
                          <span>Profile Settings</span>
                        </Link>
                        <Link to="/reports" className="flex items-center space-x-3 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                          <FileText className="w-4 h-4" />
                          <span>Medical Reports</span>
                        </Link>
                        <Link to="/my-prescriptions" className="flex items-center space-x-3 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                          <ClipboardList className="w-4 h-4" />
                          <span>My Prescriptions</span>
                        </Link>
                        <div className="h-px bg-slate-100 my-2 mx-5" />
                        <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/admin" className="px-3 py-2.5 text-xs font-bold text-slate-500 hover:text-primary-600 transition-colors border border-slate-200 rounded-lg">
                  Admin
                </Link>
                <Link to="/login" className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-primary-600 transition-colors">
                  Log In
                </Link>
                <Link to="/register" className="btn btn-primary !py-2.5 !px-6 text-sm">
                  Join IDOC
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-100 overflow-hidden shadow-xl"
          >
            <div className="px-6 pt-4 pb-10 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="block px-4 py-4 text-base font-bold text-slate-700 border-b border-slate-50 last:border-0 hover:text-primary-600"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              {user ? (
                <div className="pt-6 space-y-3">
                  <Link to="/dashboard" className="btn btn-secondary w-full" onClick={() => setIsOpen(false)}>Dashboard</Link>
                  <button onClick={handleLogout} className="btn w-full text-red-600 bg-red-50 border border-red-100">Sign Out</button>
                </div>
              ) : (
                <div className="pt-6 space-y-3">
                  <Link to="/admin" className="btn btn-secondary w-full" onClick={() => setIsOpen(false)}>Admin Portal</Link>
                  <Link to="/login" className="btn btn-secondary w-full" onClick={() => setIsOpen(false)}>Log In</Link>
                  <Link to="/register" className="btn btn-primary w-full" onClick={() => setIsOpen(false)}>Sign Up</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
