import api from './api';

export const patientService = {
  login: (credentials) => api.post('/patients/login', credentials),
  register: (data) => api.post('/patients/register', data),
  getProfile: () => api.get('/patients/me'),
  updateProfile: (data) => api.put('/patients/me', data),
};

export const doctorService = {
  login: (credentials) => api.post('/doctors/login', credentials),
  getAll: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  getAvailability: (id, date) => api.get(`/appointments/doctors/${id}/bookable-slots`, { params: { date } }),
};

export const appointmentService = {
  create: (data) => api.post('/appointments/create', data),
  getPatientAppointments: () => api.get('/appointments/mine'),
  getDoctorAppointments: () => api.get('/appointments/doctor/me'),
  accept: (id) => api.patch(`/appointments/${id}/accept`),
  reject: (id) => api.patch(`/appointments/${id}/reject`),
  cancel: (id) => api.patch(`/appointments/${id}/cancel`),
};

export const paymentService = {
  createCheckoutSession: (appointmentId) => api.post('/payments/create-checkout-session', { appointmentId }),
  getTicket: (appointmentId) => api.get(`/payments/ticket/${appointmentId}`),
};

export const telemedicineService = {
  getSession: (appointmentId) => api.get(`/telemedicine/sessions/appointment/${appointmentId}`),
};
