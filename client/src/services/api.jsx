import axios from "axios";

// Create axios instance with base configuration
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 30000, // Increased timeout
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

    // Log request for debugging
    console.log("API Request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      headers: config.headers,
      data: config.data,
    });

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
    // Log successful response for debugging
    console.log("API Response:", {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });

    return response.data;
  },
  (error) => {
    // Enhanced error logging
    console.error("API Error Details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
      message: error.message,
      headers: error.response?.headers,
    });

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Redirect to login if needed
      window.location.href = "/login";
    }

    // Create a more descriptive error
    let errorMessage = "Network error occurred";

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.errors) {
      errorMessage = error.response.data.errors
        .map((err) => err.msg || err.message || err)
        .join(", ");
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Preserve the original error response for detailed handling
    const customError = new Error(errorMessage);
    customError.response = error.response;
    customError.status = error.response?.status;
    customError.originalError = error;

    return Promise.reject(customError);
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

// Sales API with additional debugging
export const salesAPI = {
  getSales: (params) => API.get("/sales", { params }),
  getSale: (id) => API.get(`/sales/${id}`),
  createSale: async (saleData) => {
    try {
      console.log("Creating sale with data:", saleData);
      const response = await API.post("/sales", saleData);
      console.log("Sale created successfully:", response);
      return response;
    } catch (error) {
      console.error("Sale creation failed:", error);
      throw error;
    }
  },
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
