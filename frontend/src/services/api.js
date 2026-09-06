import axios from 'axios';
import { authUtils } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
});

let currentUserId = null;

export function setCurrentUserId(userId) {
  currentUserId = userId ?? null;
}

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = authUtils.getToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
<<<<<<< Updated upstream
  
=======
>>>>>>> Stashed changes
  if (currentUserId) {
    config.headers['X-User-Id'] = String(currentUserId);
  }
  
  return config;
});

<<<<<<< Updated upstream
// Handle auth errors
=======
>>>>>>> Stashed changes
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authUtils.clearAuth();
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) => 
    api.post('/auth/change-password', { currentPassword, newPassword }),
  refresh: () => api.post('/auth/refresh'),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const contactsAPI = {
  getAll: () => api.get('/contacts'),
  create: (data) => api.post('/contacts', data),
  getById: (id) => api.get(`/contacts/${id}`),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  delete: (id) => api.delete(`/contacts/${id}`),
};

export const productsAPI = {
  getAll: () => api.get('/products'),
  create: (data) => api.post('/products', data),
  getById: (id) => api.get(`/products/${id}`),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const accountsAPI = {
  getAll: () => api.get('/accounts'),
  create: (data) => api.post('/accounts', data),
  getById: (id) => api.get(`/accounts/${id}`),
};

export const journalsAPI = {
  getAll: () => api.get('/journals'),
  create: (data) => api.post('/journals', data),
  getById: (id) => api.get(`/journals/${id}`),
};

export const purchaseOrdersAPI = {
  getAll: () => api.get('/purchase-orders'),
  create: (data) => api.post('/purchase-orders', data),
  getById: (id) => api.get(`/purchase-orders/${id}`),
  confirm: (id) => api.post(`/purchase-orders/${id}/confirm`),
  convertToBill: (id) => api.post(`/purchase-orders/${id}/convert-to-bill`),
};

export const vendorBillsAPI = {
  getAll: () => api.get('/vendor-bills'),
  getById: (id) => api.get(`/vendor-bills/${id}`),
  pay: (id, data) => api.post(`/vendor-bills/${id}/pay`, data),
};

export const salesOrdersAPI = {
  getAll: () => api.get('/sales-orders'),
  create: (data) => api.post('/sales-orders', data),
  getById: (id) => api.get(`/sales-orders/${id}`),
  confirm: (id) => api.post(`/sales-orders/${id}/confirm`),
  generateInvoice: (id) => api.post(`/sales-orders/${id}/generate-invoice`),
};

export const customerInvoicesAPI = {
  getAll: () => api.get('/customer-invoices'),
  getById: (id) => api.get(`/customer-invoices/${id}`),
  pay: (id, data) => api.post(`/customer-invoices/${id}/pay`, data),
};

export const paymentsAPI = {
  getAll: () => api.get('/payments'),
  getById: (id) => api.get(`/payments/${id}`),
};

export const journalEntriesAPI = {
  getAll: () => api.get('/journal-entries'),
  getById: (id) => api.get(`/journal-entries/${id}`),
  update: (id, data) => api.patch(`/journal-entries/${id}`, data),
};

export const reportsAPI = {
  getDashboardSummary: () => api.get('/reports/dashboard/summary'),
  getProfitAndLoss: () => api.get('/reports/profit-loss'),
  getBalanceSheet: () => api.get('/reports/balance-sheet'),
  getLedger: (accountId) => {
    if (accountId) {
      return api.get(`/reports/ledger?accountId=${accountId}`);
    }
    return api.get('/reports/ledger');
  },
  getAccountBalances: () => api.get('/reports/account-balances'),
};

export const aiAPI = {
  chat: (message, conversation = []) => 
    api.post('/ai/chat', { message, conversation }),
};

export const ocrAPI = {
  processFile: (formData) =>
    api.post('/ocr/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  confirmInvoice: (data) => api.post('/ocr/confirm', data),
};

export default api;
