import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, ChevronLeft, Download, FileText, Loader2, Search } from 'lucide-react';
import { apiOrigin, patientService } from '../services';

const resolveReportUrl = (report = {}) => {
  if (!report.filePath) return report.fileUrl || '#';

  const cleanPath = String(report.filePath)
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');

  if (window.location.origin) {
    return `${window.location.origin}/${cleanPath}`;
  }

  return `${apiOrigin}/${cleanPath}`;
};

const PatientReportsDoctor = () => {
  const { patientId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await patientService.getReportsByPatientId(patientId);
      setPatient(data.patient || null);
      setReports(data.reports || []);
    } catch (err) {
      setPatient(null);
      setReports([]);
      setError(err.response?.data?.message || 'Failed to load patient medical reports.');
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return reports;
    return reports.filter((report) => {
      return [report.reportId, report.reportType, report.fileName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [reports, searchTerm]);

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Link to="/dashboard" className="inline-flex items-center text-slate-500 hover:text-primary-600 font-bold transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="card p-8 lg:p-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-2">Medical Reports</p>
              <h1 className="text-3xl font-bold text-slate-900">
                {patient?.fullName ? `${patient.fullName}'s Reports` : `Patient Reports (${patientId})`}
              </h1>
              {patient && (
                <p className="text-slate-500 font-medium mt-2">
                  {patient.email ? patient.email : null}{patient.email && patient.phone ? ' • ' : null}{patient.phone ? patient.phone : null}
                </p>
              )}
            </div>

            <div className="relative w-full md:w-[420px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                className="input pl-12 h-14 w-full"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 font-medium">
              {error}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <FileText className="text-slate-300 w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">No reports found</h3>
              <p className="text-slate-500">This patient has no uploaded reports (or none match your search).</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <div key={report._id || report.reportId} className="card group hover:border-primary-500/30 transition-all">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-100 text-blue-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <a
                      href={resolveReportUrl(report)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-primary-600 font-bold text-sm hover:underline"
                    >
                      <Download className="w-4 h-4" />
                      Open
                    </a>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{report.reportType || 'Report'}</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{report.reportId}</p>
                    </div>

                    <div className="space-y-2 text-sm text-slate-500">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{report.createdAt ? new Date(report.createdAt).toLocaleDateString() : '—'}</span>
                      </div>
                      <p className="font-medium truncate">{report.fileName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientReportsDoctor;

