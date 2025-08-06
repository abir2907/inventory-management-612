import axios from "axios";

// Create axios instance with base configuration
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
API.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error(
      "API Error:",
      error.response?.status,
      error.response?.data,
      error.message
    );

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Don't redirect automatically, let the app handle it
    }

    // Return a more detailed error
    const errorMessage =
      error.response?.data?.message || error.message || "Network error";
    return Promise.reject(new Error(errorMessage));
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => API.post("/auth/login", credentials),
  register: (userData) => API.post("/auth/register", userData),
  getMe: () => API.get("/auth/me"),
  updateProfile: (profileData) => API.put("/auth/profile", profileData),
  changePassword: (passwordData) =>
    API.put("/auth/change-password", passwordData),
  logout: () => API.post("/auth/logout"),
};

// Snacks API
export const snacksAPI = {
  getSnacks: (params) => API.get("/snacks", { params }),
  getSnack: (id) => API.get(`/snacks/${id}`),
  createSnack: (snackData) => API.post("/snacks", snackData),
  updateSnack: (id, snackData) => API.put(`/snacks/${id}`, snackData),
  deleteSnack: (id) => API.delete(`/snacks/${id}`),
  generateQRCode: (id) => API.get(`/snacks/${id}/qr`),
  getLowStock: () => API.get("/snacks/low-stock"),
  getStats: () => API.get("/snacks/stats"),
  createSnackWithImage: (snackData, config) =>
    API.post("/snacks", snackData, config),
  updateSnackWithImage: (id, snackData, config) =>
    API.put(`/snacks/${id}`, snackData, config),
};

// Sales API
export const salesAPI = {
  getSales: (params) => API.get("/sales", { params }),
  getSale: (id) => API.get(`/sales/${id}`),
  createSale: (saleData) => API.post("/sales", saleData),
  updateSaleStatus: (id, statusData) =>
    API.put(`/sales/${id}/status`, statusData),
  getSalesStats: (params) => API.get("/sales/stats", { params }),
  processRefund: (id, refundData) =>
    API.post(`/sales/${id}/refund`, refundData),
};

// Users API
export const usersAPI = {
  getUsers: (params) => API.get("/users", { params }),
  getUser: (id) => API.get(`/users/${id}`),
  updateUser: (id, userData) => API.put(`/users/${id}`, userData),
  deactivateUser: (id) => API.delete(`/users/${id}`),
  activateUser: (id) => API.post(`/users/${id}/activate`),
  getUserPurchaseHistory: (id, params) =>
    API.get(`/users/${id}/purchase-history`, { params }),
  getUserStats: () => API.get("/auth/stats"),
};

export default API;
