import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Calendar, 
  User, 
  Stethoscope, 
  ChevronRight, 
  Search,
  Filter,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { patientService } from '../services';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // Mock data for initial UI display
      const mockReports = [
        {
          _id: '1',
          title: 'Full Blood Count',
          doctorName: 'Dr. Sarah Smith',
          date: '2026-04-10',
          type: 'Lab Report',
          status: 'verified',
          size: '1.2 MB'
        },
        {
          _id: '2',
          title: 'Chest X-Ray',
          doctorName: 'Dr. James Wilson',
          date: '2026-03-25',
          type: 'Radiology',
          status: 'verified',
          size: '4.5 MB'
        },
        {
          _id: '3',
          title: 'Digital Prescription - Fever',
          doctorName: 'Dr. Emily Chen',
          date: '2026-03-15',
          type: 'Prescription',
          status: 'verified',
          size: '0.8 MB'
        }
      ];
      setReports(mockReports);
    } catch (err) {
      console.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => 
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Medical Reports</h1>
            <p className="text-slate-500 mt-2 font-medium">Access your prescriptions, lab results, and health history.</p>
          </div>
          <button className="btn btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Upload New Report</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              className="input pl-12 h-14"
              placeholder="Search by report name or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select className="input pl-12 h-14 appearance-none font-medium">
              <option>All Categories</option>
              <option>Lab Reports</option>
              <option>Prescriptions</option>
              <option>Radiology</option>
            </select>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="card h-48 animate-pulse bg-slate-100/50" />)
          ) : filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <motion.div
                key={report._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
                className="card group hover:border-primary-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    report.type === 'Prescription' ? 'bg-purple-100 text-purple-600' :
                    report.type === 'Radiology' ? 'bg-amber-100 text-amber-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{report.status}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                      {report.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{report.type}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-slate-500 text-sm">
                      <User className="w-4 h-4" />
                      <span>{report.doctorName}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-500 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{report.date}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">{report.size}</span>
                    <button className="flex items-center space-x-2 text-primary-600 font-bold text-sm hover:underline">
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center space-y-4 bg-white rounded-3xl border border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <FileText className="text-slate-300 w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">No reports found</h3>
              <p className="text-slate-500">You haven't uploaded or received any reports yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
