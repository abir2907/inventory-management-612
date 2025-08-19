// src/App.js
import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthComponent from "./components/AuthComponent";
import SnackInventoryApp from "./components/SnackInventoryApp";

// Add these imports at the top if not already present
import { Clock, AlertCircle, RefreshCw, Mail, Heart, Star } from "lucide-react";

const TemporarilyClosedComponent = () => {
  const { logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [bounce, setBounce] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const bounceInterval = setInterval(() => {
      setBounce(true);
      setTimeout(() => setBounce(false), 1000);
    }, 3000);

    const pulseInterval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 2000);
    }, 4000);

    return () => {
      clearInterval(bounceInterval);
      clearInterval(pulseInterval);
    };
  }, []);

  const handleBackToLogin = () => {
    logout();
  };

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      } flex flex-col relative overflow-hidden`}
    >
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
      </div>

      {/* Header */}
      <header
        className={`${
          darkMode
            ? "bg-gray-800/80 backdrop-blur-sm"
            : "bg-white/80 backdrop-blur-sm"
        } shadow-lg border-b ${
          darkMode ? "border-gray-700" : "border-gray-200"
        } relative z-10`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl mr-2 sm:mr-3">
                <img
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl object-cover shadow-lg"
                  src="logo.jpg"
                  alt="Snack Hub Logo"
                />
              </div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Snack Hub
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-all ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                } hover:scale-110`}
              >
                {darkMode ? "🌞" : "🌙"}
              </button>

              <button
                onClick={handleBackToLogin}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  darkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } shadow-lg hover:shadow-xl transform hover:scale-105`}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="max-w-2xl w-full text-center">
          {/* Main Icon */}
          <div className="text-6xl sm:text-7xl mb-8 filter drop-shadow-lg">
            🥱
          </div>

          {/* Status Badge */}
          <div
            className={`inline-flex items-center px-6 py-3 rounded-full text-sm font-medium mb-8 ${
              darkMode
                ? "bg-orange-900/20 text-orange-300 border border-orange-700/50 backdrop-blur-sm"
                : "bg-orange-100 text-orange-800 border border-orange-300"
            } shadow-lg animate-pulse`}
          >
            <Clock size={16} className="mr-2" />
            Temporarily Closed
          </div>

          {/* Main Message */}
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 pb-2"
            style={{ lineHeight: "1.2" }}
          >
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              We are sleeping...
            </span>
            <span className="ml-2">😴</span>
          </h1>

          <div
            className={`${
              darkMode
                ? "bg-gray-800/70 backdrop-blur-sm"
                : "bg-white/70 backdrop-blur-sm"
            } rounded-2xl shadow-2xl p-6 sm:p-8 mb-8 border ${
              darkMode ? "border-gray-700/50" : "border-gray-200"
            } relative overflow-hidden`}
          >
            {/* Subtle animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 animate-pulse"></div>

            <div className="relative z-10">
              <div
                className={`flex items-center justify-center mb-6 ${
                  pulse ? "animate-pulse" : ""
                }`}
              >
                <div
                  className={`p-4 rounded-full ${
                    darkMode ? "bg-blue-900/30" : "bg-blue-100"
                  } shadow-lg`}
                >
                  <RefreshCw className="text-blue-500" size={32} />
                </div>
              </div>

              <p
                className={`text-lg sm:text-xl mb-8 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                } leading-relaxed`}
              >
                The Snack Hub team is currently having a good night's (or
                morning's) sleep. We will be open for service as soon as we wake
                up. Afterall we'll need to be well rested to serve our friends
                well.
              </p>

              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                <div
                  className={`p-6 rounded-xl ${
                    darkMode
                      ? "bg-gray-700/30 backdrop-blur-sm"
                      : "bg-gray-50/70 backdrop-blur-sm"
                  } border ${
                    darkMode ? "border-gray-600/30" : "border-gray-200/50"
                  } shadow-lg transition-transform hover:scale-105`}
                >
                  <AlertCircle
                    className="text-yellow-500 mx-auto mb-3"
                    size={28}
                  />
                  <h3 className="font-semibold mb-2 text-lg">
                    Service Unavailable
                  </h3>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    All services are temporarily suspended for improvements
                  </p>
                </div>

                <div
                  className={`p-6 rounded-xl ${
                    darkMode
                      ? "bg-gray-700/30 backdrop-blur-sm"
                      : "bg-gray-50/70 backdrop-blur-sm"
                  } border ${
                    darkMode ? "border-gray-600/30" : "border-gray-200/50"
                  } shadow-lg transition-transform hover:scale-105`}
                >
                  <RefreshCw
                    className="text-green-500 mx-auto mb-3"
                    size={28}
                  />
                  <h3 className="font-semibold mb-2 text-lg">
                    Expected Return
                  </h3>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    We'll be back stronger and better than ever
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div
            className={`${
              darkMode
                ? "bg-gray-800/70 backdrop-blur-sm"
                : "bg-white/70 backdrop-blur-sm"
            } rounded-2xl shadow-2xl p-8 border ${
              darkMode ? "border-gray-700/50" : "border-gray-200"
            } relative overflow-hidden`}
          >
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full transform translate-x-16 -translate-y-16"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-center mb-4">
                <Heart className="text-red-500 mr-2" size={24} />
                <h3 className="text-2xl font-semibold">Need Assistance?</h3>
              </div>

              <p
                className={`mb-6 text-lg ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                If you have any urgent concerns, please don't hesitate to reach
                out.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className={`inline-flex items-center px-8 py-4 rounded-xl font-medium transition-all ${
                    darkMode
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  } shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1`}
                >
                  <RefreshCw size={20} className="mr-2" />
                  Check Again
                </button>

                <a
                  href="mailto:snackhub612@gmail.com?subject=Urgent%20Support%20Request&body=Hello%20Snack%20Hub%20Team,%0D%0A%0D%0AI%20need%20assistance%20with..."
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center px-8 py-4 rounded-xl font-medium transition-all ${
                    darkMode
                      ? "bg-purple-600 hover:bg-purple-700 text-white border-2 border-purple-500"
                      : "bg-purple-600 hover:bg-purple-700 text-white border-2 border-purple-500"
                  } shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1`}
                >
                  <Mail size={20} className="mr-2" />
                  Email Support
                </a>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-700/30">
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  } mb-2`}
                >
                  Email: snackhub612@gmail.com
                </p>
                <p
                  className={`text-xs ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  We typically respond within 24 hours
                </p>
              </div>
            </div>
          </div>

          {/* Footer Message */}
          <div className="mt-12">
            <div className="flex items-center justify-center mb-4">
              <Star className="text-yellow-500 mr-2" size={20} />
              <p
                className={`text-lg font-medium ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Thank you for your patience and continued support!
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 mt-6">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-ping shadow-lg"></div>
                <div
                  className="w-3 h-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full animate-ping shadow-lg"
                  style={{ animationDelay: "0.3s" }}
                ></div>
                <div
                  className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full animate-ping shadow-lg"
                  style={{ animationDelay: "0.6s" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Bottom Gradient */}
      <div className="relative z-10">
        <div className="h-2 bg-gradient-to-r from-blue-600/80 via-purple-600/80 to-green-600/80 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/50 via-purple-400/50 to-green-400/50 animate-pulse"></div>
          <div
            className="absolute inset-0 bg-gradient-to-l from-transparent via-white/10 to-transparent animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Main app wrapper component
// Add this import at the top of App.js
import { siteAPI } from "./services/api";

const AppContent = () => {
  const { user, isLoading } = useAuth();
  const [siteTemporarilyClosed, setSiteTemporarilyClosed] = useState(false);
  const [siteStatusLoading, setSiteStatusLoading] = useState(true);

  // Load site status from server when app starts
  useEffect(() => {
    const loadSiteStatus = async () => {
      try {
        setSiteStatusLoading(true);
        const response = await siteAPI.getSiteStatus();
        setSiteTemporarilyClosed(response.data?.isTemporarilyClosed || false);
      } catch (error) {
        console.error("Error loading site status:", error);
        // Default to false if there's an error
        setSiteTemporarilyClosed(false);
      } finally {
        setSiteStatusLoading(false);
      }
    };

    loadSiteStatus();
  }, []);

  // Function to update site status on server
  const updateSiteStatus = async (newStatus) => {
    try {
      await siteAPI.updateSiteStatus(newStatus);
      setSiteTemporarilyClosed(newStatus);
    } catch (error) {
      console.error("Error updating site status:", error);
      // Revert the change if server update fails
      setSiteTemporarilyClosed(!newStatus);
      throw error; // Re-throw to handle in the component
    }
  };

  if (isLoading || siteStatusLoading) {
    const savedDarkMode = localStorage.getItem("darkMode");
    const isDark = savedDarkMode ? JSON.parse(savedDarkMode) : true;

    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">🍿</div>
          <h2
            className={`text-xl font-semibold mb-2 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Loading Snack Hub...
          </h2>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // If site is temporarily closed and user is a customer, show closed message
  if (siteTemporarilyClosed && user && user.role === "customer") {
    return <TemporarilyClosedComponent />;
  }

  return user ? (
    <SnackInventoryApp
      siteTemporarilyClosed={siteTemporarilyClosed}
      setSiteTemporarilyClosed={updateSiteStatus} // Pass the async function
    />
  ) : (
    <AuthComponent />
  );
};

const App = () => {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
};

export default App;
