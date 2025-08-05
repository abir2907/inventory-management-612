import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Eye,
  EyeOff,
  Moon,
  Sun,
  User,
  Mail,
  Lock,
  AlertCircle,
  Loader,
} from "lucide-react";

const AuthComponent = () => {
  const { login, register, isLoading, error } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    hostelRoom: "",
    phoneNumber: "",
  });
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    // Basic validation
    if (!formData.email || !formData.password) {
      setLocalError("Email and password are required");
      return;
    }

    if (!isLogin && !formData.name) {
      setLocalError("Name is required for registration");
      return;
    }

    try {
      console.log("Form submission:", { isLogin, email: formData.email });

      if (isLogin) {
        await login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          hostelRoom: formData.hostelRoom,
          phoneNumber: formData.phoneNumber,
        });
      }
    } catch (error) {
      console.error("Auth error:", error);

      // Better error handling
      let errorMessage = "Authentication failed";

      if (error && typeof error === "object") {
        if (error.message) {
          errorMessage = error.message;
        } else if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          errorMessage = error.response.data.message;
        } else if (error.request && error.request.status === 0) {
          errorMessage =
            "Network error - please check if the server is running";
        } else if (
          error.status === "ERR" &&
          error.request === "PRO FEATURE ONLY"
        ) {
          errorMessage =
            "Development tool blocking request - please disable browser extensions";
        }
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setLocalError(errorMessage);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const displayError = localError || error;

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        darkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-blue-50 to-indigo-100"
      }`}
    >
      <div
        className={`max-w-md w-full mx-4 p-8 rounded-2xl shadow-2xl ${
          darkMode ? "bg-gray-800 text-white" : "bg-white"
        }`}
      >
        <div className="text-center mb-8">
          <div className="text-4xl mb-4 flex justify-center">
            <img
              className="h-25 w-25 border-none rounded-lg"
              src="logo.jpg"
              alt="logo"
            />
          </div>

          <p
            className={`mt-2 text-center text-sm sm:text-base tracking-wide font-medium transition-opacity duration-300 ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Your Hostel Snack Inventory
          </p>
        </div>

        <div className="flex mb-6">
          <button
            onClick={() => {
              setIsLogin(true);
              setLocalError("");
            }}
            className={`flex-1 py-2 px-4 rounded-l-lg font-medium transition-colors ${
              isLogin
                ? "bg-blue-600 text-white"
                : darkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setLocalError("");
            }}
            className={`flex-1 py-2 px-4 rounded-r-lg font-medium transition-colors ${
              !isLogin
                ? "bg-blue-600 text-white"
                : darkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Full Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-50 border-gray-200 text-gray-900"
                  }`}
                  placeholder="Enter your name"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-50 border-gray-200 text-gray-900"
                }`}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-50 border-gray-200 text-gray-900"
                }`}
                placeholder="Enter your password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Hostel Room (Optional)
                </label>
                <input
                  type="text"
                  name="hostelRoom"
                  value={formData.hostelRoom}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-50 border-gray-200 text-gray-900"
                  }`}
                  placeholder="e.g., A-101"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-50 border-gray-200 text-gray-900"
                  }`}
                  placeholder="+91-XXXXXXXXXX"
                />
              </div>
            </>
          )}

          {displayError && (
            <div className="flex items-center p-3 bg-red-100 border border-red-300 rounded-lg">
              <AlertCircle className="text-red-500 mr-2" size={20} />
              <span className="text-red-700 text-sm">{displayError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin mr-2" size={20} />
                Please wait...
              </>
            ) : isLogin ? (
              "Login"
            ) : (
              "Register"
            )}
          </button>
        </form>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`absolute top-4 right-4 p-2 rounded-lg ${
            darkMode
              ? "bg-gray-700 text-yellow-400"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </div>
  );
};

export default AuthComponent;
