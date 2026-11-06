import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

// Customer APIs
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateCustomerData {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  tags?: string[];
}

export async function listCustomers() {
  const res = await api.get('/customers');
  return res.data.data;
}

export async function createCustomer(data: CreateCustomerData) {
  const res = await api.post('/customers', data);
  return res.data.data;
}

export async function updateCustomer(id: string, data: UpdateCustomerData) {
  const res = await api.patch(`/customers/${id}`, data);
  return res.data.data;
}

export async function deleteCustomer(id: string) {
  const res = await api.delete(`/customers/${id}`);
  return res.data.data;
}

// Booking APIs

export interface Booking {
  id: string;
  businessId: string;
  customerId: string;
  serviceId: string;
  staffId: string | null;
  startAt: string;
  endAt: string;
  status: string;
  notes?: string | null;
  price: number;
  customer: { id: string; name: string; email?: string | null };
  service: { id: string; name: string; durationMin: number; price: number };
  staff: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export async function listBookingsCalendar(start: string, end: string) {
  const res = await api.get('/bookings/calendar', { params: { start, end } });
  return res.data.data;
}

// Notification APIs

export interface Notification {
  id: string;
  businessId: string;
  type: string;
  channel: string;
  recipient: string;
  payload: any;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

export interface CreateNotificationData {
  type: string;
  channel: 'EMAIL' | 'SMS' | 'IN_APP';
  recipient: string;
  payload?: Record<string, unknown>;
}

export async function listNotifications(status?: string) {
  const res = await api.get('/notifications', { params: { status } });
  return res.data.data;
}

export async function createNotification(data: CreateNotificationData) {
  const res = await api.post('/notifications', data);
  return res.data.data;
}

export async function markNotificationSent(id: string) {
  const res = await api.patch(`/notifications/${id}/sent`);
  return res.data.data;
}
