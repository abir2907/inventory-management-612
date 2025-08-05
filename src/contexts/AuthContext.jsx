import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Create the AuthContext
const AuthContext = createContext();

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if user is logged in on app start
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Verify token with backend
      verifyToken();
    }
  }, []);

  const verifyToken = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/api/auth/me");

      if (response.data.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      localStorage.removeItem("token");
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      setError("");

      const response = await api.post("/api/auth/login", credentials);

      if (response.data.success) {
        const { token, user } = response.data;

        // Store token
        localStorage.setItem("token", token);

        // Update state
        setUser(user);
        setIsAuthenticated(true);

        return response.data;
      } else {
        throw new Error(response.data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);

      let errorMessage = "Login failed";

      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || "Login failed";
      } else if (error.request) {
        errorMessage = "Network error - please check your connection";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      setError("");

      const response = await api.post("/api/auth/register", userData);

      if (response.data.success) {
        const { token, user } = response.data;

        // Store token
        localStorage.setItem("token", token);

        // Update state
        setUser(user);
        setIsAuthenticated(true);

        return response.data;
      } else {
        throw new Error(response.data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);

      let errorMessage = "Registration failed";

      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || "Registration failed";

        // Handle validation errors
        if (
          error.response.data.errors &&
          Array.isArray(error.response.data.errors)
        ) {
          errorMessage = error.response.data.errors
            .map((err) => err.msg)
            .join(", ");
        }
      } else if (error.request) {
        errorMessage = "Network error - please check your connection";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint (optional)
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local state regardless of API call success
      localStorage.removeItem("token");
      setUser(null);
      setIsAuthenticated(false);
      setError("");
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setIsLoading(true);
      setError("");

      const response = await api.put("/api/auth/profile", profileData);

      if (response.data.success) {
        setUser(response.data.user);
        return response.data;
      } else {
        throw new Error(response.data.message || "Profile update failed");
      }
    } catch (error) {
      console.error("Profile update error:", error);

      let errorMessage = "Profile update failed";

      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || "Profile update failed";
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (passwordData) => {
    try {
      setIsLoading(true);
      setError("");

      const response = await api.put("/api/auth/change-password", passwordData);

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || "Password change failed");
      }
    } catch (error) {
      console.error("Password change error:", error);

      let errorMessage = "Password change failed";

      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || "Password change failed";
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const contextValue = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError: () => setError(""),
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
