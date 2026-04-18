import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Calendar,
  Search,
  Filter,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { apiOrigin, patientService } from '../services';

const resolveReportUrl = (report = {}) => {
  if (report.filePath) {
    const cleanPath = String(report.filePath)
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");

    return `${apiOrigin}/${cleanPath}`;
  }

  if (report.fileUrl) {
    return String(report.fileUrl)
      .replace("http://patient-service:5003", apiOrigin)
      .replace("https://patient-service:5003", apiOrigin);
  }

  return "#";
};

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [uploadForm, setUploadForm] = useState({ reportType: '', file: null });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data } = await patientService.getMyReports();
      setReports(data.reports || []);
    } catch (err) {
      console.error('Failed to load reports', err);
      setMessage({ type: 'error', content: 'Failed to load your uploaded reports.' });
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = useMemo(() => {
    const types = Array.from(new Set(reports.map((report) => report.reportType).filter(Boolean)));
    return types;
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const typeMatches = !reportTypeFilter || report.reportType === reportTypeFilter;
      const search = searchTerm.trim().toLowerCase();
      const textMatches = !search || [report.reportId, report.reportType, report.fileName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
      return typeMatches && textMatches;
    });
  }, [reports, searchTerm, reportTypeFilter]);

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!uploadForm.reportType || !uploadForm.file) {
      setMessage({ type: 'error', content: 'Please choose report type and PDF file.' });
      return;
    }

    const formData = new FormData();
    formData.append('reportType', uploadForm.reportType);
    formData.append('reportFile', uploadForm.file);

    try {
      setUploading(true);
      setMessage({ type: '', content: '' });
      await patientService.uploadReport(formData);
      setUploadForm({ reportType: '', file: null });
      setShowUploadForm(false);
      setMessage({ type: 'success', content: 'Report uploaded successfully.' });
      await fetchReports();
    } catch (err) {
      setMessage({
        type: 'error',
        content: err.response?.data?.message || 'Failed to upload the report.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Delete this report permanently?')) return;

    try {
      await patientService.deleteReport(reportId);
      setMessage({ type: 'success', content: 'Report deleted successfully.' });
      await fetchReports();
    } catch (err) {
      setMessage({
        type: 'error',
        content: err.response?.data?.message || 'Failed to delete report.',
      });
    }
  };

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Medical Reports</h1>
            <p className="text-slate-500 mt-2 font-medium">Upload and manage your patient PDF reports through the gateway-connected patient service.</p>
          </div>
          <button onClick={() => setShowUploadForm(true)} className="btn btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Upload New Report</span>
          </button>
        </div>

        {message.content && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{message.content}</span>
          </motion.div>
        )}

        {showUploadForm && (
          <div className="mb-8 card p-6 border-primary-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Upload Patient Report</h3>
              <button onClick={() => setShowUploadForm(false)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-1 space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Report Type</label>
                <input
                  className="input h-14"
                  value={uploadForm.reportType}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, reportType: e.target.value }))}
                  placeholder="e.g. Blood Test"
                />
              </div>
              <div className="md:col-span-1 space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">PDF File</label>
                <input
                  type="file"
                  accept="application/pdf"
                  className="input h-14 file:mr-4 file:border-0 file:bg-transparent"
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
                />
              </div>
              <button type="submit" disabled={uploading} className="btn btn-primary h-14 flex items-center justify-center gap-2">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                <span>{uploading ? 'Uploading...' : 'Save Report'}</span>
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              className="input pl-12 h-14"
              placeholder="Search by report id, type, or file name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select
              className="input pl-12 h-14 appearance-none font-medium"
              value={reportTypeFilter}
              onChange={(e) => setReportTypeFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {reportTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="card h-48 animate-pulse bg-slate-100/50" />)
          ) : filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <motion.div
                key={report._id || report.reportId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
                className="card group hover:border-primary-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-100 text-blue-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Stored</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{report.reportType}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{report.reportId}</p>
                  </div>

                  <div className="space-y-2 text-sm text-slate-500">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="font-medium truncate">{report.fileName}</p>
                    <p className="text-xs uppercase tracking-wide">{Math.round((report.fileSize || 0) / 1024)} KB</p>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between gap-3">
                    <a
                      href={resolveReportUrl(report)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-2 text-primary-600 font-bold text-sm hover:underline"
                    >
                      <Download className="w-4 h-4" />
                      <span>Open PDF</span>
                    </a>
                    <button onClick={() => handleDelete(report.reportId)} className="p-2 rounded-xl text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
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
              <p className="text-slate-500">You have not uploaded any PDF patient reports yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
