import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Star, Clock, Filter, ChevronRight, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doctorService } from '../services';

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialty, setSpecialty] = useState('');

  const specialties = [
    'Cardiology', 'Dermatology', 'Neurology', 'Pediatrics', 
    'Psychiatry', 'General Medicine', 'Orthopedics'
  ];

  useEffect(() => {
    fetchDoctors();
  }, [specialty]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      // Mock data for initial UI display
      const mockDoctors = [
        {
          _id: '1',
          name: 'Sarah Smith',
          specialty: 'Cardiology',
          location: 'Colombo 07',
          rating: 4.9,
          reviews: 124,
          image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
          availability: 'Available Today',
          fee: '$50'
        },
        {
          _id: '2',
          name: 'James Wilson',
          specialty: 'Neurology',
          location: 'Kandy',
          rating: 4.8,
          reviews: 89,
          image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
          availability: 'Next: Tomorrow',
          fee: '$45'
        },
        {
          _id: '3',
          name: 'Emily Chen',
          specialty: 'Pediatrics',
          location: 'Galle',
          rating: 5.0,
          reviews: 210,
          image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
          availability: 'Available Today',
          fee: '$40'
        }
      ];
      
      const filtered = specialty 
        ? mockDoctors.filter(d => d.specialty === specialty)
        : mockDoctors;

      setDoctors(filtered);
    } catch (err) {
      console.error('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor => 
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Search */}
        <div className="mb-12 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Find Your Specialist</h1>
            <p className="text-slate-500 mt-2 font-medium">Book appointments with top-rated doctors in your area.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                className="input pl-12 h-14"
                placeholder="Search by name, specialty, or condition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <select
                className="input pl-12 h-14 appearance-none font-medium"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              >
                <option value="">All Specialties</option>
                {specialties.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button className="btn btn-primary h-14">Search Now</button>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="card h-80 animate-pulse bg-slate-100/50" />
            ))
          ) : filteredDoctors.length > 0 ? (
            filteredDoctors.map((doctor) => (
              <motion.div
                key={doctor._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="card group hover:border-primary-500/30 transition-all"
              >
                <div className="flex items-start space-x-4 mb-6">
                  <div className="relative">
                    <img 
                      src={doctor.image} 
                      alt={doctor.name} 
                      className="w-20 h-20 rounded-2xl object-cover"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-lg shadow-sm border border-slate-100">
                      <div className="bg-green-500 w-3 h-3 rounded-full border-2 border-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 text-primary-600 mb-1">
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold uppercase tracking-wider">{doctor.specialty}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                      Dr. {doctor.name}
                    </h3>
                    <div className="flex items-center space-x-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-bold text-slate-700">{doctor.rating}</span>
                      <span className="text-xs text-slate-400 font-medium">({doctor.reviews} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-8 border-t border-slate-50 pt-4">
                  <div className="flex items-center text-slate-500 space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">{doctor.location}</span>
                  </div>
                  <div className="flex items-center text-slate-500 space-x-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium text-green-600">{doctor.availability}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Consultation</p>
                    <p className="text-lg font-bold text-slate-900">{doctor.fee}</p>
                  </div>
                  <Link 
                    to={`/book/${doctor._id}`} 
                    className="btn btn-primary !py-2.5 !px-6 text-sm flex items-center space-x-2"
                  >
                    <span>Book Now</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="text-slate-400 w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">No Doctors Found</h3>
              <p className="text-slate-500 mt-2">Try adjusting your search or specialty filters.</p>
              <button 
                onClick={() => {setSearchTerm(''); setSpecialty('');}}
                className="mt-6 text-primary-600 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorList;
