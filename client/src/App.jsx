// src/App.js
import React from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthComponent from "./components/AuthComponent";
import SnackInventoryApp from "./components/SnackInventoryApp";

// Main app wrapper component
const AppContent = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
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

  return user ? <SnackInventoryApp /> : <AuthComponent />;
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
