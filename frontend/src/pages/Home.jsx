import React from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Calendar, 
  Video, 
  ShieldCheck, 
  ChevronRight, 
  Star, 
  Users, 
  Award, 
  ArrowRight,
  Stethoscope,
  Activity,
  Heart,
  BrainCircuit
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const features = [
    {
      icon: Search,
      title: 'Find Top Doctors',
      desc: 'Browse through our verified network of expert specialists by specialty, location, or availability.',
      color: 'bg-blue-500',
    },
    {
      icon: Calendar,
      title: 'Instant Booking',
      desc: 'Book appointments in real-time with just a few clicks. Manage your schedule effortlessly.',
      color: 'bg-green-500',
    },
    {
      icon: Video,
      title: 'Video Consultation',
      desc: 'Connect with your doctor from anywhere via high-quality, secure video sessions.',
      color: 'bg-purple-500',
    },
    {
      icon: ShieldCheck,
      title: 'Secure & Private',
      desc: 'Your medical data and consultations are protected with enterprise-grade security.',
      color: 'bg-red-500',
    },
    {
      icon: BrainCircuit,
      title: 'AI Health Insights',
      desc: 'Get preliminary health suggestions and doctor recommendations via our AI engine.',
      color: 'bg-indigo-600',
    },
  ];

  const stats = [
    { label: 'Verified Doctors', value: '500+', icon: Stethoscope },
    { label: 'Happy Patients', value: '10K+', icon: Users },
    { label: 'Specialties', value: '30+', icon: Activity },
    { label: 'Service Score', value: '4.9/5', icon: Award },
  ];

  return (
    <div className="flex flex-col w-full overflow-hidden pt-20">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-slate-50 pt-16">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary-50/50 rounded-bl-[100px] -z-10" />
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-primary-200/20 blur-[100px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full font-semibold text-sm animate-bounce shadow-sm border border-primary-100">
                <span className="flex h-2 w-2 rounded-full bg-primary-600 animate-ping" />
                <span>Advanced Healthcare Solutions</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                Healthcare that <br />
                <span className="text-primary-600">Travels with You</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
                Experience world-class medical care from the comfort of your home. 
                Connect with top specialists instantly via secure video consultations.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Link to="/doctors" className="btn btn-primary group flex items-center space-x-2 w-full sm:w-auto justify-center">
                  <span>Book Appointment</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/ai-symptom-checker" className="btn btn-outline flex items-center space-x-2 w-full sm:w-auto justify-center">
                  <BrainCircuit className="w-5 h-5" />
                  <span>AI Symptom Checker</span>
                </Link>
              </div>

              {/* Stats Bar */}
              <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-8 border-t border-slate-200">
                {stats.map((stat, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center space-x-2 text-primary-600">
                      <stat.icon className="w-5 h-5" />
                      <span className="text-2xl font-bold">{stat.value}</span>
                    </div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative hidden lg:block"
            >
              <div className="relative z-10 rounded-[40px] overflow-hidden shadow-2xl shadow-primary-200 border-8 border-white group">
                <img 
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                  alt="Telemedicine App" 
                  className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>

              {/* Floating UI Elements */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-10 -right-10 z-20 bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex items-center space-x-4 max-w-[240px]"
              >
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                  <Video className="text-green-600 w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Live Call</p>
                  <p className="text-sm font-bold text-slate-900">Consultation Active</p>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-10 -left-10 z-20 bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex items-center space-x-4 max-w-[240px]"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center">
                  <Heart className="text-primary-600 w-6 h-6" fill="currentColor" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Heart Rate</p>
                  <p className="text-sm font-bold text-slate-900">72 BPM (Normal)</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
              Revolutionizing the <br /> 
              <span className="text-primary-600">Patient Experience</span>
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              We've built a seamless ecosystem that puts your health first. 
              Everything you need for your wellness journey is now in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="card group hover:border-primary-500/30 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300"
              >
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-inherit/20 group-hover:rotate-6 transition-transform`}>
                  <feature.icon className="text-white w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-primary-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  {feature.desc}
                </p>
                <Link to="/register" className="flex items-center space-x-2 text-primary-600 font-bold text-sm group/btn">
                  <span>Learn More</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[50px] p-12 lg:p-20 relative overflow-hidden flex flex-col items-center text-center space-y-8">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/20 blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-500/10 blur-[80px] rounded-full" />
            
            <h2 className="text-4xl lg:text-6xl font-bold text-white tracking-tight relative z-10">
              Ready to start your <br /> 
              <span className="text-primary-500">health journey?</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl relative z-10 leading-relaxed">
              Join thousands of satisfied patients today. Experience healthcare 
              that's modern, secure, and always there for you.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 relative z-10 pt-4">
              <Link to="/register" className="btn btn-primary !bg-white !text-slate-900 hover:!bg-slate-100 !px-10 !py-4 shadow-2xl">
                Get Started Now
              </Link>
              <Link to="/doctors" className="btn btn-outline !border-slate-700 !text-white hover:!bg-slate-800 !px-10 !py-4">
                View All Doctors
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
