import api, { apiOrigin } from './api';

export { apiOrigin };

export const patientService = {
  login: (credentials) => api.post('/patients/auth/login', credentials),
  register: (data) => api.post('/patients/auth/register', data),
  getProfile: () => api.get('/patients/auth/me'),
  updateProfile: (data) => api.put('/patients/auth/me', data),
  deleteProfile: () => api.delete('/patients/auth/me'),
  getById: (id) => api.get(`/patients/auth/${id}`),

  getMyReports: () => api.get('/patients/reports/my'),
  getMyReportById: (reportId) => api.get(`/patients/reports/my/${reportId}`),
  uploadReport: (formData) => api.post('/patients/reports', formData),
  updateReport: (reportId, formData) => api.put(`/patients/reports/my/${reportId}`, formData),
  deleteReport: (reportId) => api.delete(`/patients/reports/my/${reportId}`),

  // Doctor/Admin access
  getReportsByPatientId: (patientId) => api.get(`/patients/reports/doctor/patient/${patientId}`),
  getReportByPatientIdAndReportId: (patientId, reportId) =>
    api.get(`/patients/reports/doctor/patient/${patientId}/${reportId}`),
};

export const doctorService = {
  login: (credentials) => api.post('/doctors/auth/login', credentials),
  register: (data) => api.post('/doctors/auth/register', data),
  getMyProfile: () => api.get('/doctors/profile/me'),
  updateMyProfile: (data) => api.put('/doctors/profile/me', data),
  getById: (id) => api.get(`/doctors/profile/${id}`),
  getPublicById: (id) => api.get(`/doctors/profile/public/${id}`),

  getAll: async (params = {}) => {
    const { specialty = '', q = '', ...rest } = params;

    if (q) {
      return api.get('/doctors/profile/search', {
        params: { q, ...rest },
      });
    }

    if (specialty) {
      return api.get('/doctors/profile/search/specialty', {
        params: { specialty, ...rest },
      });
    }

    return api.get('/doctors/profile/approved', { params: rest });
  },

  getMyAvailability: () => api.get('/availability/me'),
  updateMyAvailability: (availability) => api.put('/availability/me', { availability }),
  addAvailabilitySlot: (slot) => api.post('/availability/me/slot', slot),
  updateAvailabilitySlot: (index, slot) => api.patch(`/availability/me/slot/${index}`, slot),
  removeAvailabilitySlot: (index) => api.delete(`/availability/me/slot/${index}`),
  toggleAvailabilitySlot: (index) => api.patch(`/availability/me/slot/${index}/toggle`),
};

export const appointmentService = {
  create: (data) => api.post('/appointments/create', data),
  getById: (id) => api.get(`/appointments/${id}`),
  getPatientAppointments: (params) => api.get('/appointments/mine', { params }),
  getDoctorAppointments: (params) => api.get('/appointments/doctor/me', { params }),
  accept: (id) => api.patch(`/appointments/${id}/accept`),
  reject: (id) => api.patch(`/appointments/${id}/reject`),
  cancel: (id, payload = {}) => api.patch(`/appointments/${id}/cancel`, payload),
  complete: (id) => api.patch(`/appointments/${id}/complete`),
  reschedule: (id, payload) => api.patch(`/appointments/${id}/reschedule`, payload),
  acceptDoctorReschedule: (id) => api.patch(`/appointments/${id}/accept-doctor-reschedule`),
  rejectDoctorReschedule: (id, payload = {}) => api.patch(`/appointments/${id}/reject-doctor-reschedule`, payload),
  getBookableSlots: (doctorId, date, mode) =>
    api.get(`/appointments/doctors/${doctorId}/bookable-slots`, {
      params: { date, mode },
    }),
};

export const paymentService = {
  createCheckoutSession: (appointmentId) => api.post('/payments/create-checkout-session', { appointmentId }),
  verifyPayment: (sessionId, appointmentId) =>
    api.get('/payments/verify-payment', {
      params: { session_id: sessionId, appointmentId }
    }),
  getTicket: (appointmentId) => api.get(`/payments/ticket/${appointmentId}`),
  downloadTicket: (appointmentId) => api.get(`/payments/ticket/${appointmentId}/download`, { responseType: 'blob' }),
};

export const telemedicineService = {
  getSession: (appointmentId) => api.get(`/telemedicine/sessions/appointment/${appointmentId}`),
};

export const prescriptionService = {
  create: (payload) => api.post('/prescriptions', payload),
  getMyIssued: (params) => api.get('/prescriptions/me', { params }),
  getByPatientId: (patientId, params) => api.get(`/prescriptions/patient/${patientId}`, { params }),
  getById: (id) => api.get(`/prescriptions/${id}`),
  update: (id, payload) => api.put(`/prescriptions/${id}`, payload),
  cancel: (id, payload = {}) => api.patch(`/prescriptions/${id}/cancel`, payload),

  // Patient access (implemented in doctor-service; proxied via gateway)
  getMyPrescriptions: (params) => api.get('/prescriptions/my', { params }),
  getMyPrescriptionById: (id) => api.get(`/prescriptions/my/${id}`),
};

export const adminService = {
  login: (credentials) => api.post('/admin/auth/login', credentials),
  getPendingDoctors: (params) => api.get('/admin/doctors/pending', { params }),
  getApprovedDoctors: (params) => api.get('/admin/doctors/approved', { params }),
  approveDoctor: (id) => api.patch(`/admin/doctors/${id}/approve`),
  rejectDoctor: (id, rejectionReason) => api.patch(`/admin/doctors/${id}/reject`, { rejectionReason }),
  deleteDoctor: (id) => api.delete(`/admin/doctors/${id}`),
  getAllPatients: () => api.get('/admin/patients'),
  deletePatient: (id) => api.delete(`/admin/patients/${id}`),
};
