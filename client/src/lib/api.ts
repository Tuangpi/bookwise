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
