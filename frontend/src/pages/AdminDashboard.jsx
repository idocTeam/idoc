import React, { useState, useEffect } from 'react';
import { adminService } from '../services';
import {
  Users,
  CheckCircle,
  XCircle,
  Trash2,
  Search,
  AlertCircle,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  ClipboardList,
  Eye,
  X,
  DollarSign,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('userManagement');
  const [activeTab, setActiveTab] = useState('pendingDoctors');

  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [approvedDoctors, setApprovedDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  const [financeSummary, setFinanceSummary] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    completedCount: 0,
    pendingCount: 0,
    failedCount: 0
  });

  const [transactions, setTransactions] = useState([]);
  const [failedPayments, setFailedPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [financeLoading, setFinanceLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const navigate = useNavigate();

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    return `${apiOrigin}/api/doctors${photoPath}`;
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setFinanceLoading(true);

    try {
      const [
        pendingRes,
        approvedRes,
        patientsRes,
        financeSummaryRes,
        transactionsRes,
        failedPaymentsRes
      ] = await Promise.all([
        adminService.getPendingDoctors(),
        adminService.getApprovedDoctors(),
        adminService.getAllPatients(),
        adminService.getFinanceSummary(),
        adminService.getTransactions({ page: 1, limit: 10 }),
        adminService.getFailedPayments({ page: 1, limit: 10 })
      ]);

      setPendingDoctors(pendingRes.data.data?.doctors || []);
      setApprovedDoctors(approvedRes.data.data?.doctors || []);
      setPatients(patientsRes.data.patients || []);
      setFinanceSummary(financeSummaryRes.data.summary || {});
      setTransactions(transactionsRes.data.transactions || []);
      setFailedPayments(failedPaymentsRes.data.transactions || []);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
      setFinanceLoading(false);
    }
  };

  const refreshFinance = async () => {
    setFinanceLoading(true);
    try {
      const [financeSummaryRes, transactionsRes, failedPaymentsRes] = await Promise.all([
        adminService.getFinanceSummary(),
        adminService.getTransactions({ page: 1, limit: 10 }),
        adminService.getFailedPayments({ page: 1, limit: 10 })
      ]);

      setFinanceSummary(financeSummaryRes.data.summary || {});
      setTransactions(transactionsRes.data.transactions || []);
      setFailedPayments(failedPaymentsRes.data.transactions || []);
    } catch (err) {
      console.error(err);
      setError('Failed to refresh finance data');
    } finally {
      setFinanceLoading(false);
    }
  };

  const switchToUserManagement = () => {
    setActiveSection('userManagement');
    if (!['pendingDoctors', 'approvedDoctors', 'patients'].includes(activeTab)) {
      setActiveTab('pendingDoctors');
    }
  };

  const switchToFinance = () => {
    setActiveSection('finance');
    if (!['financeOverview', 'transactions', 'failedPayments'].includes(activeTab)) {
      setActiveTab('financeOverview');
    }
  };

  const handleApprove = async (id) => {
    try {
      await adminService.approveDoctor(id);
      fetchInitialData();
      setSelectedDoctor(null);
    } catch {
      alert('Failed to approve doctor');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Please enter rejection reason:');
    if (reason === null) return;

    try {
      await adminService.rejectDoctor(id, reason);
      fetchInitialData();
      setSelectedDoctor(null);
    } catch {
      alert('Failed to reject doctor');
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) return;

    try {
      await adminService.deleteDoctor(id);
      fetchInitialData();
    } catch {
      alert('Failed to delete doctor');
    }
  };

  const handleDeletePatient = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return;

    try {
      await adminService.deletePatient(id);
      fetchInitialData();
    } catch {
      alert('Failed to delete patient');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin');
  };

  const filteredUserData = () => {
    let data = [];

    if (activeTab === 'pendingDoctors') data = pendingDoctors;
    if (activeTab === 'approvedDoctors') data = approvedDoctors;
    if (activeTab === 'patients') data = patients;

    return data.filter((item) =>
      (item.fullName || item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredTransactions = (data) => {
    const normalizedSearch = searchTerm.toLowerCase();
    return data.filter((item) =>
      (item._id || '').toLowerCase().includes(normalizedSearch) ||
      (item.patientName || '').toLowerCase().includes(normalizedSearch) ||
      (item.patientId || '').toLowerCase().includes(normalizedSearch) ||
      (item.doctorName || '').toLowerCase().includes(normalizedSearch) ||
      (item.doctorId || '').toLowerCase().includes(normalizedSearch) ||
      (item.appointmentId || '').toLowerCase().includes(normalizedSearch) ||
      (item.status || '').toLowerCase().includes(normalizedSearch) ||
      (getPatientName(item).toLowerCase().includes(normalizedSearch)) ||
      (getDoctorName(item).toLowerCase().includes(normalizedSearch))
    );
  };

  const getPatientName = (item) => {
    if (item.patientName) return item.patientName;
    const transactionPatientId = String(item.patientId || item.metadata?.patientId || '').trim();
    const matchedPatient = patients.find((patient) => {
      const patientMongoId = String(patient._id || '').trim();
      const patientUserId = String(patient.userId || '').trim();
      return patientMongoId === transactionPatientId || patientUserId === transactionPatientId;
    });
    return matchedPatient?.fullName || matchedPatient?.name || '-';
  };

  const getDoctorName = (item) => {
    if (item.doctorName) return item.doctorName;
    if (item.metadata?.doctorName) return item.metadata.doctorName;

    const transactionDoctorId = String(item.doctorId || item.metadata?.doctorId || '').trim();
    const allDoctors = [...pendingDoctors, ...approvedDoctors];
    const matchedDoctor = allDoctors.find((doctor) => {
      const doctorMongoId = String(doctor._id || '').trim();
      const doctorUserId = String(doctor.userId || '').trim();
      const doctorId = String(doctor.id || '').trim();
      return (
        doctorMongoId === transactionDoctorId ||
        doctorUserId === transactionDoctorId ||
        doctorId === transactionDoctorId
      );
    });
    return matchedDoctor?.fullName || matchedDoctor?.name || '-';
  };

  const formatMoney = (amount) => `$${Number(amount || 0).toFixed(2)}`;

  const getDailyRevenueData = () => {
    const revenueByDay = transactions.reduce((acc, item) => {
      if (item.status !== 'completed') return acc;

      const dateSource = item.paidAt || item.createdAt;
      if (!dateSource) return acc;

      const date = new Date(dateSource);
      if (Number.isNaN(date.getTime())) return acc;

      const dayKey = date.toISOString().split('T')[0];
      acc[dayKey] = (acc[dayKey] || 0) + Number(item.amount || 0);
      return acc;
    }, {});

    return Object.keys(revenueByDay)
      .sort((a, b) => new Date(a) - new Date(b))
      .map((dayKey) => ({
        day: new Date(dayKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Number(revenueByDay[dayKey].toFixed(2))
      }));
  };

  const renderSectionButton = (sectionKey, label, Icon) => {
    const isActive = activeSection === sectionKey;

    return (
      <button
        onClick={sectionKey === 'userManagement' ? switchToUserManagement : switchToFinance}
        className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-extrabold transition-all ${
          isActive
            ? 'bg-white text-slate-800 shadow-md border border-slate-200'
            : 'bg-white/70 text-slate-500 border border-slate-200 hover:text-primary-600 hover:border-primary-300'
        }`}
      >
        <Icon className="w-6 h-6 text-primary-600" />
        {label}
      </button>
    );
  };

  const renderTabButton = (tabKey, label) => (
    <button
      onClick={() => setActiveTab(tabKey)}
      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
        activeTab === tabKey
          ? 'bg-primary-600 text-white shadow-md'
          : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-300 hover:text-primary-600'
      }`}
    >
      {label}
    </button>
  );

  const renderUserCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 cursor-pointer hover:border-primary-200 transition-all"
        onClick={() => setActiveTab('pendingDoctors')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase">Pending Doctors</p>
            <h3 className="text-4xl font-black text-slate-900 mt-4">{pendingDoctors.length}</h3>
          </div>
          <div className="p-5 rounded-3xl bg-amber-50 text-amber-500">
            <ClipboardList className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div
        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 cursor-pointer hover:border-primary-200 transition-all"
        onClick={() => setActiveTab('approvedDoctors')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase">Approved Doctors</p>
            <h3 className="text-4xl font-black text-slate-900 mt-4">{approvedDoctors.length}</h3>
          </div>
          <div className="p-5 rounded-3xl bg-green-50 text-green-500">
            <Stethoscope className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div
        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 cursor-pointer hover:border-primary-200 transition-all"
        onClick={() => setActiveTab('patients')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase">Patients</p>
            <h3 className="text-4xl font-black text-slate-900 mt-4">{patients.length}</h3>
          </div>
          <div className="p-5 rounded-3xl bg-primary-50 text-primary-600">
            <Users className="w-8 h-8" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderFinanceCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 cursor-pointer hover:border-primary-200 transition-all"
        onClick={() => setActiveTab('financeOverview')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase">Total Revenue</p>
            <h3 className="text-3xl font-black text-slate-900 mt-4">{formatMoney(financeSummary.totalRevenue)}</h3>
          </div>
          <div className="p-5 rounded-3xl bg-green-50 text-green-600">
            <DollarSign className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div
        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 cursor-pointer hover:border-primary-200 transition-all"
        onClick={() => setActiveTab('transactions')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase">Transactions</p>
            <h3 className="text-4xl font-black text-slate-900 mt-4">{financeSummary.completedCount || 0}</h3>
          </div>
          <div className="p-5 rounded-3xl bg-primary-50 text-primary-600">
            <CreditCard className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div
        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 cursor-pointer hover:border-primary-200 transition-all"
        onClick={() => setActiveTab('failedPayments')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase">Failed Payments</p>
            <h3 className="text-4xl font-black text-slate-900 mt-4">{financeSummary.failedCount || 0}</h3>
          </div>
          <div className="p-5 rounded-3xl bg-red-50 text-red-600">
            <AlertTriangle className="w-8 h-8" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTransactionsTable = (rows, title) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <button
          onClick={refreshFinance}
          className="px-4 py-2 text-sm font-bold text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Appointment</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Method</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((item) => (
              <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900">{item._id}</p>
                  <p className="text-xs text-slate-500">{item.provider || 'stripe'}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">{item.appointmentId}</td>
                <td className="px-6 py-4 text-sm text-slate-700">{getPatientName(item)}</td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-slate-900">{getDoctorName(item)}</p>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatMoney(item.amount)}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    item.status === 'completed'
                      ? 'bg-green-50 text-green-600'
                      : item.status === 'failed'
                        ? 'bg-red-50 text-red-600'
                        : item.status === 'pending'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.status}
                  </span>
                  {item.failureReason && (
                    <p className="text-xs text-red-500 mt-1">{item.failureReason}</p>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">{item.paymentMethod || 'card'}</td>
                <td className="px-6 py-4 text-sm text-slate-700">
                  {new Date(item.paidAt || item.failedAt || item.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No finance records found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-primary-600" />
              Admin Dashboard
            </h1>
            <p className="text-slate-500 mt-1">Manage doctors, patients and platform activities.</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2 self-start md:self-center"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        <div className="flex justify-center mb-10">
          <div className="border border-slate-300 rounded-2xl p-4 flex flex-wrap justify-center gap-4 bg-white/50">
            {renderSectionButton('userManagement', 'USER MANAGEMENT', Users)}
            {renderSectionButton('finance', 'FINANCE', DollarSign)}
          </div>
        </div>

        <div className="mb-8">
          {activeSection === 'userManagement' ? renderUserCards() : renderFinanceCards()}
        </div>

        <div className="space-y-6 mb-8">
          {activeSection === 'userManagement' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-primary-50 text-primary-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">User Management</h2>
                  <p className="text-sm text-slate-500">Manage doctor approvals and patient records.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {renderTabButton('pendingDoctors', 'Pending Doctors')}
                {renderTabButton('approvedDoctors', 'Approved Doctors')}
                {renderTabButton('patients', 'Patients')}
              </div>
            </div>
          )}

          {activeSection === 'finance' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-primary-50 text-primary-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Finance</h2>
                  <p className="text-sm text-slate-500">Monitor transactions, revenue performance and failed payments.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {renderTabButton('financeOverview', 'Finance Overview')}
                {renderTabButton('transactions', 'Transactions')}
                {renderTabButton('failedPayments', 'Failed Payments')}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border-b border-slate-100 gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {activeTab === 'pendingDoctors' && 'Pending Doctors'}
                {activeTab === 'approvedDoctors' && 'Approved Doctors'}
                {activeTab === 'patients' && 'Patients'}
                {activeTab === 'financeOverview' && 'Finance Overview'}
                {activeTab === 'transactions' && 'Transactions'}
                {activeTab === 'failedPayments' && 'Failed Payments'}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {activeSection === 'finance'
                  ? 'Review financial insights and transaction activity.'
                  : 'Review and manage user-related records.'}
              </p>
            </div>

            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder={
                  activeSection === 'finance'
                    ? 'Search by transaction, doctor, patient...'
                    : 'Search by name or email...'
                }
                className="input pl-10 h-10 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="p-6 bg-slate-50/60">
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            {activeTab === 'financeOverview' && (
              financeLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Revenue</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-2">{formatMoney(financeSummary.totalRevenue)}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Today Revenue</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-2">{formatMoney(financeSummary.todayRevenue)}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Monthly Revenue</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-2">{formatMoney(financeSummary.monthlyRevenue)}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Completed Payments</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-2">{financeSummary.completedCount || 0}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Pending Payments</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-2">{financeSummary.pendingCount || 0}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Failed Payments</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-2">{financeSummary.failedCount || 0}</h3>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-bold text-slate-900">Revenue by Day</h4>
                      <p className="text-xs text-slate-500">X-axis: day, Y-axis: revenue</p>
                    </div>

                    {getDailyRevenueData().length > 0 ? (
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={getDailyRevenueData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="day" />
                            <YAxis tickFormatter={(value) => `$${value}`} />
                            <Tooltip formatter={(value) => formatMoney(value)} />
                            <Line
                              type="monotone"
                              dataKey="revenue"
                              stroke="#0ea5e9"
                              strokeWidth={3}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-72 flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
                        <p className="text-sm text-slate-500">No completed payment data available to plot daily revenue.</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {activeTab === 'transactions' && (
              financeLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                renderTransactionsTable(filteredTransactions(transactions), 'Transactions List')
              )
            )}

            {activeTab === 'failedPayments' && (
              financeLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                renderTransactionsTable(filteredTransactions(failedPayments), 'Failed Payments')
              )
            )}

            {activeSection === 'userManagement' && (
              <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                      {activeTab !== 'patients' && (
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Specialty</th>
                      )}
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUserData().map((item) => (
                      <tr key={item.id || item._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold">
                              {(item.fullName || item.name || '?')[0]}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{item.fullName || item.name}</p>
                              <p className="text-xs text-slate-500">ID: {item.userId || item._id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-700">{item.email}</p>
                          <p className="text-xs text-slate-500">{item.phone}</p>
                        </td>
                        {activeTab !== 'patients' && (
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-bold">
                              {item.specialty}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            (item.approvalStatus === 'approved' || activeTab === 'patients')
                              ? 'bg-green-50 text-green-600'
                              : item.approvalStatus === 'rejected'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-amber-50 text-amber-600'
                          }`}>
                            {activeTab === 'patients' ? 'Active' : item.approvalStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {activeTab !== 'patients' && (
                              <button
                                onClick={() => setSelectedDoctor(item)}
                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                            )}
                            {activeTab === 'pendingDoctors' && (
                              <>
                                <button
                                  onClick={() => handleApprove(item._id)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleReject(item._id)}
                                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                  title="Reject"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => activeTab === 'patients' ? handleDeletePatient(item._id) : handleDeleteDoctor(item._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredUserData().length === 0 && (
                  <div className="p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No records found matching your criteria.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedDoctor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Doctor Details</h2>
              <button
                onClick={() => setSelectedDoctor(null)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto">
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="w-24 h-24 bg-primary-100 rounded-3xl flex items-center justify-center text-primary-600 text-3xl font-black shrink-0 overflow-hidden">
                  {selectedDoctor.photoPath ? (
                    <img src={getPhotoUrl(selectedDoctor.photoPath)} alt={selectedDoctor.fullName} className="w-full h-full object-cover" />
                  ) : (
                    selectedDoctor.fullName[0]
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{selectedDoctor.fullName}</h3>
                    <p className="text-primary-600 font-bold">{selectedDoctor.specialty}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</p>
                      <p className="text-sm font-bold text-slate-700">{selectedDoctor.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                      <p className="text-sm font-bold text-slate-700">{selectedDoctor.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hospital</p>
                    <p className="text-sm font-bold text-slate-700">{selectedDoctor.hospital}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qualifications</p>
                    <p className="text-sm font-bold text-slate-700">{selectedDoctor.qualifications}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Experience</p>
                    <p className="text-sm font-bold text-slate-700">{selectedDoctor.experienceYears} Years</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">License Number</p>
                    <p className="text-sm font-bold text-slate-700">{selectedDoctor.medicalLicenseNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consultation Fee</p>
                    <p className="text-sm font-bold text-slate-700">${selectedDoctor.consultationFee}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedDoctor.approvalStatus === 'approved'
                        ? 'bg-green-50 text-green-600'
                        : selectedDoctor.approvalStatus === 'rejected'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-amber-50 text-amber-600'
                    }`}>
                      {selectedDoctor.approvalStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Biography</p>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                  "{selectedDoctor.bio}"
                </p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedDoctor(null)}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Close
              </button>
              {selectedDoctor.approvalStatus === 'pending' && (
                <>
                  <button
                    onClick={() => handleReject(selectedDoctor._id)}
                    className="px-6 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedDoctor._id)}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-green-200"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Doctor
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;