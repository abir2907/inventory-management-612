import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Moon,
  Sun,
  User,
  LogOut,
  Eye,
  QrCode,
  Camera,
  Calendar,
  BarChart3,
  Heart,
  Star,
  Clock,
  CreditCard,
  Bell,
  CheckCircle,
  X,
  Award,
  Target,
  PieChart,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { snacksAPI, salesAPI, usersAPI } from "../services/api";
import { siteAPI } from "../services/api";

const SnackInventoryApp = ({
  siteTemporarilyClosed,
  setSiteTemporarilyClosed,
}) => {
  const { user, logout, isLoading } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showBillModal, setShowBillModal] = useState(false);
  const [currentBill, setCurrentBill] = useState(null);
  const [userPurchaseHistory, setUserPurchaseHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [cart, setCart] = useState([]);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [addToCartAnimation, setAddToCartAnimation] = useState({}); // Data states

  const [snacks, setSnacks] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    totalSales: 0,
    todaySales: 0,
  });
  const [dashboardData, setDashboardData] = useState({
    topByRevenue: [],
    topByCategory: [],
    categoryStats: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Filter states

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSnack, setEditingSnack] = useState(null); // Load data on component mount

  useEffect(() => {
    if (user) {
      if (user.role === "customer") {
        setActiveView("shop");
        loadSnacks(); // Only load snacks for customers
        loadUserPurchaseHistory();
      } else {
        loadInitialData(); // Load all data for admin
        setActiveView("dashboard");
      }
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  // Add this new useEffect
  useEffect(() => {
    // Scroll to top when view changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeView]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadSnacks(), loadSalesHistory(), loadStats()]);
    } catch (error) {
      console.error("Error loading initial data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadSnacks = async () => {
    try {
      const response = await snacksAPI.getSnacks({ limit: 1000 });
      setSnacks(response.data || []);
    } catch (error) {
      console.error("Error loading snacks:", error);
      throw error;
    }
  };

  const loadSalesHistory = async () => {
    try {
      if (user?.role === "admin") {
        const response = await salesAPI.getSales({ limit: 50 });
        setSalesHistory(response.data || []);
      } else {
        const response = await salesAPI.getSales({ limit: 10 });
        setSalesHistory(response.data || []);
      }
    } catch (error) {
      console.error("Error loading sales:", error); // Don't throw, sales history is not critical for basic functionality
    }
  };

  const loadStats = async () => {
    try {
      console.log("--- STARTING STATS LOAD (Final Attempt) ---");

      if (user?.role !== "admin") {
        return;
      }

      // Step 1: Fetch Snack Stats - this now returns the payload object directly.
      const snackStatsPayload = await snacksAPI.getStats();

      // We check if the payload itself is a valid object.
      // Uses Object.hasOwn() to fix the linting error.
      if (
        !snackStatsPayload ||
        typeof snackStatsPayload !== "object" ||
        !Object.hasOwn(snackStatsPayload, "overall")
      ) {
        console.error(
          "Received invalid or incomplete snack stats payload:",
          snackStatsPayload
        );
        throw new Error("Snack stats payload is invalid or missing.");
      }
      console.log(
        "Successfully extracted snack stats payload:",
        snackStatsPayload
      );

      // Step 2: Fetch Sales Stats (only for admin)
      let salesData = {};
      if (user?.role === "admin") {
        const salesStatsResponse = await salesAPI.getSalesStats();
        // As seen in your logs, the necessary data is nested.
        salesData =
          salesStatsResponse?.data?.overall || salesStatsResponse?.data || {};
        console.log("Extracted sales data:", salesData);
      }

      // Step 3: Set the top-level stat cards
      const finalStats = {
        totalItems: snackStatsPayload.overall?.totalQuantity || 0,
        lowStockItems: snackStatsPayload.lowStockCount || 0,
        totalSales: salesData.totalRevenue || 0,
        todaySales: salesData.todaysRevenue || 0,
      };
      setStats(finalStats);
      console.log("Setting final stats:", finalStats);

      // Step 4: Set the dashboard chart data from the payload
      const newDashboardData = {
        topByRevenue: snackStatsPayload.topByRevenue || [],
        topByCategory: snackStatsPayload.topByCategory || [],
        categoryStats: snackStatsPayload.categoryStats || [],
      };
      setDashboardData(newDashboardData);
      console.log("--- DASHBOARD DATA SET SUCCESSFULLY ---", newDashboardData);
    } catch (error) {
      console.error("Error loading stats:", error);
      toast.error("Failed to load dashboard stats.");
    }
  };

  const loadUserPurchaseHistory = async () => {
    if (user?.role !== "customer") return;

    try {
      setHistoryLoading(true);
      console.log("Loading purchase history for user:", user.id);

      // Try the direct sales API first since the user routes might not be working
      const response = await salesAPI.getSales({
        limit: 50,
        page: 1,
        customer: user.id, // Add customer filter
      });

      console.log("Purchase history response:", response);
      setUserPurchaseHistory(response.data || []);
    } catch (error) {
      console.error("Error loading purchase history:", error);

      // Fallback: try the users API route
      try {
        const response = await usersAPI.getUserPurchaseHistory(user.id, {
          limit: 50,
          page: 1,
        });
        console.log("Fallback purchase history response:", response);
        setUserPurchaseHistory(response.data?.purchases || []);
      } catch (fallbackError) {
        console.error("Fallback purchase history error:", fallbackError);
        toast.error("Failed to load purchase history");
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredSnacks = snacks.filter((snack) => {
    const matchesSearch = snack.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || snack.category === filterCategory;
    return matchesSearch && matchesCategory && snack.isActive !== false;
  });

  const lowStockItems = snacks.filter(
    (snack) => snack.quantity <= snack.lowStockAlert && snack.isActive !== false
  );

  const addToCart = (snack) => {
    const existingItem = cart.find((item) => item._id === snack._id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item._id === snack._id
            ? { ...item, quantity: Math.min(item.quantity + 1, snack.quantity) }
            : item
        )
      );
    } else {
      setCart([...cart, { ...snack, quantity: 1 }]);
    } // Add animation effect

    setAddToCartAnimation({ [snack._id]: true });
    setTimeout(() => {
      setAddToCartAnimation({ [snack._id]: false });
    }, 350);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item._id !== id));
  };

  const updateCartQuantity = (id, quantity) => {
    if (quantity === 0) {
      removeFromCart(id);
    } else {
      setCart(
        cart.map((item) => (item._id === id ? { ...item, quantity } : item))
      );
    }
  };

  const checkout = async () => {
    if (cart.length === 0) return;

    try {
      setLoading(true);

      // Show UPI payment modal
      setShowUPIModal(true);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to initiate checkout.");
    } finally {
      setLoading(false);
    }
  };

  const completePayment = async () => {
    try {
      setLoading(true);

      // Validate cart before proceeding
      if (!cart || cart.length === 0) {
        throw new Error("Cart is empty");
      }

      // Check if all cart items are still valid
      const invalidItems = cart.filter(
        (item) => !item._id || !item.quantity || item.quantity <= 0
      );

      if (invalidItems.length > 0) {
        throw new Error("Invalid items in cart");
      }

      // Prepare sale data with proper validation
      const saleData = {
        items: cart.map((item) => ({
          snack: item._id,
          quantity: parseInt(item.quantity),
        })),
        paymentMethod: "upi",
        notes: `UPI Purchase by ${user.name || user.email || "Customer"}`,
        location: {
          room: user.hostelRoom || "",
          hostel: user.hostel || "",
        },
      };

      console.log("Sending sale data:", saleData);
      console.log("Current user:", user);

      // Validate that snack IDs are valid MongoDB ObjectIds
      const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
      const invalidSnackIds = saleData.items.filter(
        (item) => !isValidObjectId(item.snack)
      );

      if (invalidSnackIds.length > 0) {
        throw new Error("Invalid snack IDs in cart");
      }

      // Create sale
      const response = await salesAPI.createSale(saleData);

      console.log("Sale response:", response);

      // Create bill data for display
      const billData = {
        saleId:
          response.data?.saleId || response.saleId || `BILL-${Date.now()}`,
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          image: item.image,
        })),
        totalAmount: cartTotal,
        paymentMethod: "UPI",
        customerName: user.name,
        date: new Date().toLocaleString(),
        status: "PAID",
      };

      // Show bill modal
      setCurrentBill(billData);
      setShowBillModal(true);

      // Clear cart and close UPI modal
      setCart([]);
      setShowUPIModal(false);

      // Refresh data
      await Promise.all([
        loadSnacks(),
        loadSalesHistory(),
        loadStats(),
        loadUserPurchaseHistory(),
      ]);

      toast.success("Payment completed successfully!");
    } catch (error) {
      console.error("Payment completion error:", error);
      console.error("Error details:", {
        response: error.response,
        request: error.request,
        message: error.message,
        cart: cart,
        user: user,
      });

      let errorMessage = "Failed to complete payment.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors
          .map((err) => err.msg)
          .join(", ");
        errorMessage = `Validation failed: ${validationErrors}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddSnack = async (snackData) => {
    try {
      setLoading(true);
      // Use FormData for multipart upload
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };
      await snacksAPI.createSnackWithImage(snackData, config);
      await loadSnacks();
      await loadStats();
      setShowAddModal(false);
      toast.success("Snack added successfully!");
    } catch (error) {
      console.error("Error adding snack:", error);
      toast.error(error.message || "Failed to add snack");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSnack = async (snackData) => {
    try {
      setLoading(true);
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };
      await snacksAPI.updateSnackWithImage(editingSnack._id, snackData, config);
      await loadSnacks();
      await loadStats();
      setEditingSnack(null);
      toast.success("Snack updated successfully!");
    } catch (error) {
      console.error("Error updating snack:", error);
      toast.error(error.message || "Failed to update snack");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSnack = async (id) => {
    if (!confirm("Are you sure you want to delete this snack?")) return;

    try {
      setLoading(true);
      const response = await snacksAPI.deleteSnack(id);
      await loadSnacks();
      await loadStats();
      toast.success(response.message || "Snack deleted successfully!");
    } catch (error) {
      console.error("Error deleting snack:", error);
      toast.error(error.message || "Failed to delete snack");
    } finally {
      setLoading(false);
    }
  }; // Get available quantity for display (considering cart items)

  const getAvailableQuantity = (snack) => {
    const cartItem = cart.find((item) => item._id === snack._id);
    return snack.quantity - (cartItem ? cartItem.quantity : 0);
  };

  const handleLogout = () => {
    logout();
    setCart([]);
    setActiveView("dashboard");
  };

  const handleSiteToggle = async () => {
    try {
      setLoading(true);
      const newStatus = !siteTemporarilyClosed;

      // Call the API to update site status
      const response = await siteAPI.updateSiteStatus(newStatus);

      // Update local state with the response
      if (response.success) {
        setSiteTemporarilyClosed(response.data.isTemporarilyClosed);
        toast.success(
          response.message ||
            (newStatus
              ? "Site has been temporarily closed"
              : "Site has been reopened")
        );
      } else {
        throw new Error(response.message || "Failed to update site status");
      }
    } catch (error) {
      console.error("Error updating site status:", error);
      toast.error(error.message || "Failed to update site status");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    <style jsx>{`
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `}</style>;
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        }`}
      >
        <div className="text-center">
          <div className="text-4xl mb-4">🍿</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const savedDarkMode = localStorage.getItem("darkMode");
    const isDark = savedDarkMode ? JSON.parse(savedDarkMode) : true;
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        }`}
      >
        <div className="text-center">
          <div className="text-4xl mb-4">🍿</div>
          <h1 className="text-2xl font-bold mb-4">Please Login</h1>
          <p>You need to be logged in to access the snack inventory.</p>
        </div>
      </div>
    );
  }

  // ... rest of the file remains the same ...

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <Toaster position="top-center" reverseOrder={false} />
      {/* Header */}
      <header
        className={`${
          darkMode ? "bg-gray-800" : "bg-white"
        } shadow-lg border-b ${
          darkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl mr-2 sm:mr-3">
                <img
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl"
                  src="logo.jpg"
                  alt="logo"
                />
              </div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Snack Hub
              </h1>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                {darkMode ? (
                  <Sun size={18} className="sm:w-5 sm:h-5" />
                ) : (
                  <Moon size={18} className="sm:w-5 sm:h-5" />
                )}
              </button>

              <div className="flex items-center space-x-1 sm:space-x-2">
                <User size={16} className="sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium hidden xs:block">
                  {user.name}
                </span>
                <span className="text-xs sm:text-sm font-medium xs:hidden">
                  {user.name.split(" ")[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className={`p-2 rounded-lg ${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  } text-red-500`}
                >
                  <LogOut size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          {" "}
          <div
            className={`p-4 rounded-lg flex items-center ${
              darkMode
                ? "bg-red-900/50 text-red-300"
                : "bg-red-100 text-red-700"
            }`}
          >
            <AlertTriangle className="mr-3" size={20} />{" "}
            <span className="font-medium">{error}</span>{" "}
          </div>{" "}
        </div>
      )}

      {loading && (
        <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 z-50">
          Loading...
        </div>
      )}

      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${
          user?.role === "customer" ? "pb-32" : "pb-8"
        }`}
      >
        {/* Navigation */}
        <nav className="mb-8">
          <div className="flex flex-wrap gap-2">
            {user.role === "admin"
              ? [
                  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
                  { key: "inventory", label: "Inventory", icon: Package },
                  { key: "sales", label: "Sales History", icon: TrendingUp },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveView(key)}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                      activeView === key
                        ? "bg-blue-600 text-white shadow-lg"
                        : darkMode
                        ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={16} className="mr-2" />
                    {label}
                  </button>
                ))
              : [
                  { key: "shop", label: "Shop", icon: ShoppingCart },
                  { key: "history", label: "Purchase History", icon: Clock },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveView(key)}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all relative ${
                      activeView === key
                        ? "bg-blue-600 text-white shadow-lg"
                        : darkMode
                        ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={16} className="mr-2" />
                    {label}
                  </button>
                ))}
          </div>
        </nav>

        {/* Dashboard View */}
        {/* Enhanced Dashboard View - Replace the existing Dashboard View section with this */}
        {activeView === "dashboard" && user.role === "admin" && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Dashboard</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-lg"
              >
                <Plus size={18} className="mr-2" />
                Add New Snack
              </button>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl shadow-lg p-6 border-l-4 border-blue-500`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Total Items
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.totalItems}
                    </p>
                  </div>
                  <Package className="text-blue-500" size={32} />
                </div>
              </div>

              {/* Clickable Low Stock Card */}
              <div
                onClick={() => setShowLowStockModal(true)}
                className={`${
                  darkMode
                    ? "bg-gray-800 hover:bg-gray-750"
                    : "bg-white hover:bg-gray-50"
                } rounded-xl shadow-lg p-6 border-l-4 border-red-500 cursor-pointer transition-all transform hover:scale-105`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Low Stock
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {lowStockItems.length}
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      Click to view details
                    </p>
                  </div>
                  <AlertTriangle className="text-red-500" size={32} />
                </div>
              </div>

              <div
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl shadow-lg p-6 border-l-4 border-green-500`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Total Sales
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{stats.totalSales}
                    </p>
                  </div>
                  <DollarSign className="text-green-500" size={32} />
                </div>
              </div>

              <div
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl shadow-lg p-6 border-l-4 border-purple-500`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Today's Sales
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      ₹{stats.todaySales}
                    </p>
                  </div>
                  <TrendingUp className="text-purple-500" size={32} />
                </div>
              </div>
            </div>

            {/* Enhanced Analytics Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Recent Sales */}
              <div
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl shadow-lg p-6`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Clock className="mr-2 text-blue-500" size={20} />
                    Recent Sales
                  </h3>
                  <span className="text-xs text-blue-500 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full">
                    Latest 5
                  </span>
                </div>
                <div className="space-y-3">
                  {salesHistory.slice(0, 5).map((sale) => (
                    <div
                      key={sale._id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        darkMode ? "bg-gray-700" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{sale.customerName}</p>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {sale.items?.length || 0} items •{" "}
                          {new Date(sale.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          ₹{sale.totalAmount}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            sale.status === "completed" ||
                            sale.status === "confirmed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                          }`}
                        >
                          {sale.status || "completed"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Selling Items by Quantity */}
              <div
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl shadow-lg p-6`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Award className="mr-2 text-yellow-500" size={20} />
                    Top by Quantity
                  </h3>
                  <span className="text-xs text-yellow-500 bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded-full">
                    Most Sold
                  </span>
                </div>
                <div className="space-y-3">
                  {[...snacks]
                    .sort((a, b) => (b.sales || 0) - (a.sales || 0))
                    .slice(0, 5)
                    .map((snack, index) => (
                      <div
                        key={snack._id}
                        className={`flex items-center p-3 rounded-lg ${
                          darkMode ? "bg-gray-700" : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center mr-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0
                                ? "bg-yellow-500 text-white"
                                : index === 1
                                ? "bg-gray-400 text-white"
                                : index === 2
                                ? "bg-orange-500 text-white"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            }`}
                          >
                            {index + 1}
                          </span>
                        </div>
                        {snack.imageUrl ? (
                          <img
                            src={snack.imageUrl}
                            alt={snack.name}
                            className="w-10 h-10 object-cover rounded-lg mr-3"
                          />
                        ) : (
                          <div className="text-2xl mr-3">{snack.image}</div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{snack.name}</p>
                          <p
                            className={`text-sm ${
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {snack.sales || 0} sold • ₹{snack.price}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Top Items by Revenue */}
              <div
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl shadow-lg p-6`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Target className="mr-2 text-green-500" size={20} />
                    Top by Revenue
                  </h3>
                  <span className="text-xs text-green-500 bg-green-100 dark:bg-green-900 px-2 py-1 rounded-full">
                    Revenue Leaders
                  </span>
                </div>
                <div className="space-y-3">
                  {dashboardData.topByRevenue
                    .slice(0, 5)
                    .map((snack, index) => (
                      <div
                        key={snack._id}
                        className={`flex items-center p-3 rounded-lg ${
                          darkMode ? "bg-gray-700" : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center mr-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0
                                ? "bg-green-500 text-white"
                                : index === 1
                                ? "bg-green-400 text-white"
                                : index === 2
                                ? "bg-green-300 text-white"
                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            }`}
                          >
                            {index + 1}
                          </span>
                        </div>
                        {snack.imageUrl ? (
                          <img
                            src={snack.imageUrl}
                            alt={snack.name}
                            className="w-10 h-10 object-cover rounded-lg mr-3"
                          />
                        ) : (
                          <div className="text-2xl mr-3">{snack.image}</div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{snack.name}</p>
                          <p
                            className={`text-sm ${
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            ₹{snack.revenue || 0} earned • {snack.sales || 0}{" "}
                            sold
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Category Performance & Top Items by Category */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Category Performance */}
              <div
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl shadow-lg p-6 flex flex-col h-full`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <PieChart className="mr-2 text-purple-500" size={20} />
                    Category Performance
                  </h3>
                </div>
                <div className="space-y-4 flex-1">
                  {dashboardData.categoryStats.map((category) => (
                    <div
                      key={category._id}
                      className={`p-5 rounded-lg border ${
                        darkMode
                          ? "border-gray-600 bg-gray-700"
                          : "border-gray-200 bg-gray-50"
                      } hover:shadow-md transition-all`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">
                            {category._id === "chips"
                              ? "🍟"
                              : category._id === "chocolate"
                              ? "🍫"
                              : category._id === "cookies"
                              ? "🍪"
                              : category._id === "cake"
                              ? "🍰"
                              : category._id === "noodles"
                              ? "🍜"
                              : category._id === "namkeen"
                              ? "🥨"
                              : "🍿"}
                          </span>
                          <div>
                            <h4 className="font-semibold text-lg capitalize">
                              {category._id}
                            </h4>
                            <p
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              {category.totalItems} items •{" "}
                              {category.totalSales || 0} sold
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-green-600">
                            ₹{category.totalRevenue || 0}
                          </p>
                          <p
                            className={`text-sm ${
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            ₹{Math.round(category.avgPrice || 0)} avg
                          </p>
                        </div>
                      </div>

                      {/* Enhanced metrics row */}
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-center">
                          <p className="text-sm font-semibold text-blue-600">
                            {(
                              (category.totalItems / snacks.length) *
                              100
                            ).toFixed(0)}
                            %
                          </p>
                          <p className="text-xs text-gray-500">of inventory</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-orange-600">
                            {category.totalSales || 0}
                          </p>
                          <p className="text-xs text-gray-500">units sold</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-purple-600">
                            {category.totalItems > 0
                              ? Math.round(
                                  ((category.totalSales || 0) /
                                    category.totalItems) *
                                    100
                                ) / 100
                              : 0}
                          </p>
                          <p className="text-xs text-gray-500">sales/item</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Empty state */}
                  {dashboardData.categoryStats.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <PieChart size={48} className="mx-auto mb-3 opacity-50" />
                      <p className="text-lg">No category data available</p>
                      <p className="text-sm">
                        Add some snacks to see performance metrics
                      </p>
                    </div>
                  )}
                </div>

                {/* Enhanced Summary Footer */}
                <div
                  className={`mt-6 pt-4 border-t ${
                    darkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xl font-bold text-purple-500">
                        {dashboardData.categoryStats.length}
                      </p>
                      <p
                        className={`text-xs ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Active Categories
                      </p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-green-500">
                        ₹
                        {dashboardData.categoryStats.reduce(
                          (sum, cat) => sum + (cat.totalRevenue || 0),
                          0
                        )}
                      </p>
                      <p
                        className={`text-xs ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Total Revenue
                      </p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-blue-500">
                        {dashboardData.categoryStats.reduce(
                          (sum, cat) => sum + (cat.totalSales || 0),
                          0
                        )}
                      </p>
                      <p
                        className={`text-xs ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Items Sold
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Items by Category */}
              <div
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl shadow-lg p-6 flex flex-col h-full`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Star className="mr-2 text-orange-500" size={20} />
                    Top Items by Category
                  </h3>
                </div>
                <div className="space-y-4 flex-1">
                  {dashboardData.topByCategory.map((categoryData) => (
                    <div
                      key={categoryData._id || categoryData.category}
                      className={`p-3 rounded-lg ${
                        darkMode ? "bg-gray-700" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <span className="text-lg mr-2">
                          {(categoryData._id || categoryData.category) ===
                          "chips"
                            ? "🍟"
                            : (categoryData._id || categoryData.category) ===
                              "chocolate"
                            ? "🍫"
                            : (categoryData._id || categoryData.category) ===
                              "cookies"
                            ? "🍪"
                            : (categoryData._id || categoryData.category) ===
                              "cake"
                            ? "🍰"
                            : (categoryData._id || categoryData.category) ===
                              "noodles"
                            ? "🍜"
                            : (categoryData._id || categoryData.category) ===
                              "namkeen"
                            ? "🥨"
                            : "🍿"}
                        </span>
                        <h4 className="font-semibold capitalize">
                          {categoryData._id || categoryData.category}
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {(categoryData.topItems || categoryData.items || [])
                          .slice(0, 3)
                          .map((item, index) => (
                            <div
                              key={item._id}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center">
                                <span
                                  className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${
                                    index === 0
                                      ? "bg-yellow-400 text-yellow-900"
                                      : index === 1
                                      ? "bg-gray-400 text-white"
                                      : "bg-orange-400 text-white"
                                  }`}
                                >
                                  {index + 1}
                                </span>
                                <span className="font-medium">{item.name}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-green-600 font-medium">
                                  ₹{item.revenue || 0}
                                </span>
                                <div className="text-xs text-gray-500">
                                  {item.sales || 0} sold
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                  {dashboardData.topByCategory.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <Package size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No category data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Insights Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Stock Alerts Summary */}
              <div
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl shadow-lg p-6`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Bell className="mr-2 text-red-500" size={20} />
                    Stock Alerts
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center">
                      <AlertTriangle className="text-red-500 mr-2" size={16} />
                      <span className="font-medium text-red-700 dark:text-red-300">
                        Out of Stock
                      </span>
                    </div>
                    <span className="text-red-600 font-bold">
                      {
                        snacks.filter(
                          (s) => s.quantity === 0 && s.isActive !== false
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <div className="flex items-center">
                      <AlertTriangle
                        className="text-yellow-500 mr-2"
                        size={16}
                      />
                      <span className="font-medium text-yellow-700 dark:text-yellow-300">
                        Low Stock
                      </span>
                    </div>
                    <span className="text-yellow-600 font-bold">
                      {lowStockItems.filter((s) => s.quantity > 0).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center">
                      <CheckCircle className="text-green-500 mr-2" size={16} />
                      <span className="font-medium text-green-700 dark:text-green-300">
                        Well Stocked
                      </span>
                    </div>
                    <span className="text-green-600 font-bold">
                      {
                        snacks.filter(
                          (s) =>
                            s.quantity > (s.lowStockAlert || 5) &&
                            s.isActive !== false
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Revenue Insights */}
              <div
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl shadow-lg p-6`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <TrendingUp className="mr-2 text-green-500" size={20} />
                    Revenue Insights
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Average Sale Value
                      </span>
                      <span className="font-semibold">
                        ₹
                        {salesHistory.length > 0
                          ? Math.round(
                              salesHistory.reduce(
                                (sum, sale) => sum + (sale.totalAmount || 0),
                                0
                              ) / salesHistory.length
                            )
                          : 0}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Total Items Sold
                      </span>
                      <span className="font-semibold">
                        {dashboardData.categoryStats.reduce(
                          (sum, cat) => sum + (cat.totalSales || 0),
                          0
                        )}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Inventory Value
                      </span>
                      <span className="font-semibold text-blue-600">
                        ₹
                        {snacks.reduce(
                          (sum, snack) => sum + snack.price * snack.quantity,
                          0
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl shadow-lg p-6`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Target className="mr-2 text-blue-500" size={20} />
                    Quick Actions
                  </h3>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Plus size={16} className="mr-2" />
                    Add New Snack
                  </button>
                  <button
                    onClick={() => setShowLowStockModal(true)}
                    className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
                  >
                    <AlertTriangle size={16} className="mr-2" />
                    View Low Stock ({lowStockItems.length})
                  </button>
                  <button
                    onClick={() => setActiveView("inventory")}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                  >
                    <Package size={16} className="mr-2" />
                    Manage Inventory
                  </button>
                  <button
                    onClick={handleSiteToggle}
                    disabled={loading}
                    className={`w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 ${
                      siteTemporarilyClosed
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Updating...
                      </>
                    ) : siteTemporarilyClosed ? (
                      <>
                        <CheckCircle size={16} className="mr-2" />
                        Open Site
                      </>
                    ) : (
                      <>
                        <X size={16} className="mr-2" />
                        Close Site
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inventory View */}
        {activeView === "inventory" && user.role === "admin" && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search snacks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 ${
                      searchTerm ? "pr-10" : "pr-4"
                    } py-2 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className={`px-4 py-2 rounded-lg border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="all">All Categories</option>
                  <option value="chips">Chips</option>
                  <option value="chocolate">Chocolate</option>
                  <option value="cookies">Cookies</option>
                  <option value="cake">Cake</option>
                  <option value="noodles">Noodles</option>
                  <option value="namkeen">Namkeen</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus size={16} className="mr-2" />
                Add Snack
              </button>
            </div>

            {/* Snacks Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredSnacks.map((snack) => (
                <div
                  key={snack._id}
                  className={`${
                    darkMode ? "bg-gray-800" : "bg-white"
                  } rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-105 relative`}
                >
                  {/*  LOW STOCK RIBBON */}
                  {snack.quantity <= 1 && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-20 shadow-lg">
                      <div className="flex items-center">
                        <AlertTriangle size={10} className="mr-1" />
                        Low Stock
                      </div>
                    </div>
                  )}
                  <div className="text-center mb-4">
                    <div className="mb-4 flex justify-center">
                      {snack.imageUrl ? (
                        <img
                          src={snack.imageUrl}
                          alt={snack.name}
                          className="w-24 h-24 object-cover rounded-xl shadow-md"
                        />
                      ) : (
                        <div className="text-6xl">{snack.image || "🍿"}</div>
                      )}
                    </div>
                    <h3 className="font-semibold text-xl mb-2">{snack.name}</h3>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      } mb-3 line-clamp-2`}
                    >
                      {snack.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-green-600">
                        ₹{snack.price}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          snack.quantity > (snack.lowStockAlert || 5)
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : snack.quantity > 0
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {snack.quantity > 0
                          ? `${snack.quantity} in stock`
                          : "Out of stock"}
                      </span>
                    </div>

                    <div
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      } flex justify-between`}
                    >
                      <span>Category: {snack.category}</span>
                      <span>Sold: {snack.sales || 0}</span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setEditingSnack(snack)}
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center font-medium"
                      >
                        <Edit size={16} className="mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSnack(snack._id)}
                        className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shop View (Customer) */}
        {activeView === "shop" && user.role === "customer" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                Welcome to Snack Shop!
              </h2>
              <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Browse and add your favorite snacks to cart
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "all",
                "chips",
                "chocolate",
                "cookies",
                "cake",
                "noodles",
                "namkeen",
                "other",
              ].map((category) => (
                <button
                  key={category}
                  onClick={() => setFilterCategory(category)}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    filterCategory === category
                      ? "bg-blue-600 text-white shadow-lg"
                      : darkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            <div className="relative max-w-md mx-auto">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search for snacks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 ${
                  searchTerm ? "pr-10" : "pr-4"
                } py-3 rounded-lg border ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {(() => {
              const availableSnacks = filteredSnacks.filter(
                (snack) => snack.quantity > 0
              );

              if (availableSnacks.length === 0) {
                return (
                  <div
                    className={`text-center py-16 ${
                      darkMode ? "bg-gray-800" : "bg-white"
                    } rounded-xl shadow-lg`}
                  >
                    <Package
                      size={64}
                      className={`mx-auto mb-4 ${
                        darkMode ? "text-gray-600" : "text-gray-400"
                      }`}
                    />
                    <h3 className="text-xl font-semibold mb-2">
                      No items available
                    </h3>
                    <p
                      className={`${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {searchTerm || filterCategory !== "all"
                        ? "Try adjusting your search or filter"
                        : "Items are currently out of stock"}
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {availableSnacks.map((snack) => (
                    <div
                      key={snack._id}
                      className={`${
                        darkMode ? "bg-gray-800" : "bg-white"
                      } rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-105 relative`}
                    >
                      {/* Keep the animation overlay as is */}
                      {addToCartAnimation[snack._id] && (
                        <div className="absolute inset-0 bg-green-500 bg-opacity-20 rounded-xl flex items-center justify-center z-10 pointer-events-none animate-pulse">
                          <div className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center shadow-lg">
                            <CheckCircle size={20} className="mr-2" />
                            Added to Cart!
                          </div>
                        </div>
                      )}

                      <div className="text-center">
                        <div className="mb-4 flex justify-center">
                          {snack.imageUrl ? (
                            <img
                              src={snack.imageUrl}
                              alt={snack.name}
                              className="w-28 h-28 object-cover rounded-xl shadow-lg"
                            />
                          ) : (
                            <div className="text-7xl mb-2">
                              {snack.image || "🍿"}
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-xl mb-3">{snack.name}</h3>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          } mb-4 line-clamp-2`}
                        >
                          {snack.description}
                        </p>

                        <div className="flex justify-between items-center mb-4">
                          <span className="text-3xl font-bold text-green-600">
                            ₹{snack.price}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              getAvailableQuantity(snack) >
                              (snack.lowStockAlert || 5)
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            }`}
                          >
                            {getAvailableQuantity(snack)} left
                          </span>
                        </div>

                        {getAvailableQuantity(snack) <= 1 && (
                          <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-20 shadow-lg">
                            <div className="flex items-center">
                              <AlertTriangle size={10} className="mr-1" />
                              Limited!
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => addToCart(snack)}
                          disabled={getAvailableQuantity(snack) === 0}
                          className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center transition-all transform ${
                            getAvailableQuantity(snack) === 0
                              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                              : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-lg"
                          }`}
                        >
                          <ShoppingCart size={18} className="mr-2" />
                          {getAvailableQuantity(snack) === 0
                            ? "Out of Stock"
                            : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Cart View */}
        {activeView === "cart" && user.role === "customer" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Shopping Cart</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveView("shop")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    darkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  <ShoppingCart size={16} />
                  Continue Shopping
                </button>
                <div className="text-lg font-semibold">
                  Total: <span className="text-green-600">₹{cartTotal}</span>
                </div>
              </div>
            </div>

            {cart.length === 0 ? (
              <div
                className={`text-center py-12 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl shadow-lg`}
              >
                <ShoppingCart
                  size={64}
                  className={`mx-auto mb-4 ${
                    darkMode ? "text-gray-600" : "text-gray-400"
                  }`}
                />
                <h3 className="text-xl font-semibold mb-2">
                  Your cart is empty
                </h3>
                <p
                  className={`${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  } mb-4`}
                >
                  Add some delicious snacks to get started!
                </p>
                <button
                  onClick={() => setActiveView("shop")}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Snacks
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item._id}
                      className={`${
                        darkMode ? "bg-gray-800" : "bg-white"
                      } rounded-xl shadow-lg p-6`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-3xl mr-4">
                            {item.image || "🍿"}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {item.name}
                            </h3>
                            <p
                              className={`${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              ₹{item.price} each
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <button
                              onClick={() =>
                                updateCartQuantity(item._id, item.quantity - 1)
                              }
                              className={`px-3 py-1 rounded-l-lg border font-semibold transition-colors ${
                                darkMode
                                  ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                                  : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              -
                            </button>
                            <span
                              className={`px-4 py-1 border-t border-b font-semibold ${
                                darkMode
                                  ? "bg-gray-700 border-gray-600 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                              }`}
                            >
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateCartQuantity(
                                  item._id,
                                  Math.min(
                                    item.quantity + 1,
                                    snacks.find((s) => s._id === item._id)
                                      ?.quantity || 0
                                  )
                                )
                              }
                              className={`px-3 py-1 rounded-r-lg border font-semibold transition-colors ${
                                darkMode
                                  ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                                  : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-lg">
                              ₹{item.price * item.quantity}
                            </p>
                          </div>

                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="text-red-500 hover:text-red-700 p-2"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className={`${
                    darkMode ? "bg-gray-800" : "bg-white"
                  } rounded-xl shadow-lg p-6`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-semibold">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ₹{cartTotal}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setCart([])}
                      className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                        darkMode
                          ? "bg-gray-700 text-white hover:bg-gray-600"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }`}
                    >
                      Clear Cart
                    </button>
                    <button
                      onClick={checkout}
                      disabled={loading}
                      className="flex-2 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center disabled:opacity-50"
                    >
                      <CreditCard size={20} className="mr-2" />
                      {loading ? "Processing..." : "Pay with UPI"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Sales History View (Admin only) */}
        {activeView === "sales" && user.role === "admin" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Sales History</h2>
              <div className="text-lg font-semibold">
                Total Revenue:{" "}
                <span className="text-green-600">₹{stats.totalSales}</span>
              </div>
            </div>

            <div
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } rounded-xl shadow-lg overflow-hidden`}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead
                    className={`${darkMode ? "bg-gray-700" : "bg-gray-50"}`}
                  >
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Items Purchased
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Total Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${
                      darkMode ? "divide-gray-700" : "divide-gray-200"
                    }`}
                  >
                    {salesHistory.map((sale) => (
                      <tr
                        key={sale._id}
                        className={`${
                          darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {new Date(sale.createdAt).toLocaleDateString()}
                            </span>
                            <span
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              {new Date(sale.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium">
                            {sale.customerName}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {sale.items?.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center text-sm"
                              >
                                <span className="text-lg mr-2">
                                  {item.snackImage || "🍿"}
                                </span>
                                <span className="font-medium mr-2">
                                  {item.snackName}
                                </span>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    darkMode
                                      ? "bg-blue-900 text-blue-300"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  x{item.quantity}
                                </span>
                              </div>
                            )) || (
                              <span className="text-sm text-gray-500">
                                No items
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-green-600">
                            ₹{sale.totalAmount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Purchase History View (Customer only) */}
        {activeView === "history" && user.role === "customer" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Purchase History</h2>
              <button
                onClick={loadUserPurchaseHistory}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  darkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                disabled={historyLoading}
              >
                {historyLoading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {historyLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2">Loading your purchase history...</p>
              </div>
            ) : userPurchaseHistory.length === 0 ? (
              <div
                className={`text-center py-12 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl shadow-lg`}
              >
                <ShoppingCart
                  size={64}
                  className={`mx-auto mb-4 ${
                    darkMode ? "text-gray-600" : "text-gray-400"
                  }`}
                />
                <h3 className="text-xl font-semibold mb-2">No purchases yet</h3>
                <p
                  className={`${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  } mb-4`}
                >
                  Start shopping to see your purchase history here
                </p>
                <button
                  onClick={() => setActiveView("shop")}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {userPurchaseHistory.map((purchase) => (
                  <div
                    key={purchase._id}
                    className={`${
                      darkMode ? "bg-gray-800" : "bg-white"
                    } rounded-xl shadow-lg p-6`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">
                            Order #{purchase.saleId || purchase._id?.slice(-6)}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center whitespace-nowrap ${
                              purchase.status === "completed" ||
                              purchase.status === "confirmed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : purchase.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {purchase.status === "completed" ||
                            purchase.status === "confirmed"
                              ? "✓ PAID"
                              : purchase.status?.toUpperCase() || "PAID"}
                          </span>
                        </div>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {new Date(purchase.createdAt).toLocaleDateString()} at{" "}
                          {new Date(purchase.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ₹{purchase.totalAmount}
                        </p>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {purchase.paymentMethod?.toUpperCase() || "UPI"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Items Purchased:</h4>
                      {purchase.items?.map((item, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            darkMode ? "bg-gray-700" : "bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">
                              {item.snackImage || item.snack?.image || "🍿"}
                            </span>
                            <div>
                              <p className="font-medium">
                                {item.snackName ||
                                  item.snack?.name ||
                                  "Unknown Item"}
                              </p>
                              <p
                                className={`text-sm ${
                                  darkMode ? "text-gray-400" : "text-gray-600"
                                }`}
                              >
                                ₹{item.unitPrice} × {item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{item.totalPrice}</p>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                darkMode
                                  ? "bg-blue-900 text-blue-300"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                      )) || (
                        <p className="text-gray-500 text-sm">No items found</p>
                      )}
                    </div>

                    {purchase.notes && (
                      <div
                        className={`mt-4 p-3 rounded-lg ${
                          darkMode ? "bg-gray-700" : "bg-gray-50"
                        }`}
                      >
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          <strong>Note:</strong> {purchase.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Cart Button for Customers */}
      {user.role === "customer" && activeView !== "cart" && (
        <button
          onClick={() => setActiveView("cart")}
          className={`fixed bottom-6 right-6 z-40 ${
            darkMode
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-blue-600 hover:bg-blue-700"
          } text-white shadow-2xl transition-all transform hover:scale-110 ${
            cartItemCount > 0
              ? "animate-pulse rounded-2xl px-4 py-3"
              : "rounded-full p-4"
          } flex items-center gap-2`}
        >
          <ShoppingCart size={24} />
          {cartItemCount > 0 && (
            <>
              <span className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center absolute -top-2 -left-2 font-bold">
                {cartItemCount}
              </span>
              <div className="flex flex-col items-center">
                <span className="font-semibold text-sm">₹{cartTotal}</span>
                <span className="text-xs opacity-90">View Cart</span>
              </div>
            </>
          )}
        </button>
      )}

      {/* Low Stock Modal */}
      {showLowStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`${
              darkMode ? "bg-gray-800" : "bg-white"
            } rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <AlertTriangle className="text-red-500 mr-2" size={24} />
                Low Stock Items
              </h3>
              <button
                onClick={() => setShowLowStockModal(false)}
                className={`p-2 rounded-lg ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                ✕
              </button>
            </div>

            {lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.map((snack) => (
                  <div
                    key={snack._id}
                    className={`p-4 rounded-lg ${
                      darkMode ? "bg-red-900/20" : "bg-red-50"
                    } border-l-4 border-red-500`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">
                          {snack.image || "🍿"}
                        </span>
                        <div>
                          <p className="font-medium">{snack.name}</p>
                          <p className="text-sm text-red-600">
                            Only {snack.quantity} left in stock
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">₹{snack.price}</p>
                        <p className="text-xs text-gray-500">
                          {snack.category}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className={`text-center py-8 ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                No low stock items
              </p>
            )}

            <div className="mt-6">
              <button
                onClick={() => setShowLowStockModal(false)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Snack Modal */}
      {(showAddModal || editingSnack) && user.role === "admin" && (
        <SnackModal
          snack={editingSnack}
          onSave={editingSnack ? handleEditSnack : handleAddSnack}
          onClose={() => {
            setShowAddModal(false);
            setEditingSnack(null);
          }}
          darkMode={darkMode}
        />
      )}

      {/* UPI Payment Modal */}
      {showUPIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`${
              darkMode ? "bg-gray-800" : "bg-white"
            } rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <QrCode className="text-blue-500 mr-2" size={24} />
                UPI Payment
              </h3>
              <button
                onClick={() => setShowUPIModal(false)}
                className={`p-2 rounded-lg ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                ✕
              </button>
            </div>

            {/* Order Summary */}
            <div
              className={`p-4 rounded-lg mb-4 ${
                darkMode ? "bg-gray-700" : "bg-gray-50"
              }`}
            >
              <h4 className="font-semibold mb-2">Order Summary</h4>
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span>
                      {item.name} x{item.quantity}
                    </span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 font-semibold">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="text-green-600">₹{cartTotal}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* UPI QR Code */}
            <div className="text-center mb-4">
              <p
                className={`text-sm mb-3 ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Scan the QR code below to pay ₹{cartTotal}
              </p>
              <div className="flex justify-center">
                <div
                  className={`p-4 rounded-lg border-2 border-dashed ${
                    darkMode
                      ? "border-gray-600 bg-gray-700"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                      `upi://pay?pa=abirchodha1@okhdfcbank&pn=Snack%20Hub&am=${cartTotal}&cu=INR&tn=Snack%20Hub%20Purchase%20Order%20${Date.now()}`
                    )}`}
                    alt="UPI QR Code"
                    className="w-64 h-64 object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                  <div
                    style={{ display: "none" }}
                    className="w-64 h-64 flex items-center justify-center"
                  >
                    <div className="text-center">
                      <QrCode
                        size={64}
                        className={`mx-auto mb-2 ${
                          darkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <p className="text-sm">QR Code Loading...</p>
                      <p className="text-xs mt-2">
                        UPI ID: abirchodha1@okhdfcbank
                      </p>
                      <p className="text-xs">Amount: ₹{cartTotal}</p>
                      <p className="text-xs text-blue-500 mt-1">
                        Manual UPI Payment Available
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div
              className={`p-3 rounded-lg mb-4 ${
                darkMode
                  ? "bg-blue-900/20 text-blue-300"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              <p className="text-sm">
                📱 Open any UPI app (GPay, PhonePe, Paytm, etc.)
                <br />
                📷 Scan the QR code above
                <br />
                💰 Verify amount: ₹{cartTotal}
                <br />✅ Complete the payment
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowUPIModal(false)}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  darkMode
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={completePayment}
                disabled={loading}
                className="flex-2 bg-gradient-to-r from-green-600 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    <CheckCircle size={16} className="mr-2" />
                    Payment Completed
                  </>
                )}
              </button>
            </div>

            <p
              className={`text-xs text-center mt-3 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Click "Payment Completed" after successful UPI payment
            </p>
          </div>
        </div>
      )}

      {/* Bill/Receipt Modal */}
      {showBillModal && currentBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`${
              darkMode ? "bg-gray-800" : "bg-white"
            } rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}
          >
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🧾</div>
              <h3 className="text-2xl font-bold mb-1">Payment Successful!</h3>
              <p className="text-green-600 font-semibold">✓ PAID</p>
            </div>

            {/* Bill Details */}
            <div
              className={`border rounded-lg p-4 mb-6 ${
                darkMode ? "border-gray-600" : "border-gray-300"
              }`}
            >
              <div className="text-center mb-4">
                <h4 className="text-lg font-bold">🍿 Snack Hub</h4>
                <p className="text-sm opacity-75">Digital Receipt</p>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span>Bill ID:</span>
                  <span className="font-mono">{currentBill.saleId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{currentBill.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{currentBill.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment:</span>
                  <span>{currentBill.paymentMethod}</span>
                </div>
              </div>

              <div
                className={`border-t pt-4 ${
                  darkMode ? "border-gray-600" : "border-gray-300"
                }`}
              >
                <h5 className="font-semibold mb-3">Items Purchased:</h5>
                <div className="space-y-2">
                  {currentBill.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center flex-1">
                        <span className="text-lg mr-2">{item.image}</span>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs opacity-75">
                            ₹{item.price} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{item.total}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={`border-t pt-4 mt-4 ${
                  darkMode ? "border-gray-600" : "border-gray-300"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total Paid:</span>
                  <span className="text-xl font-bold text-green-600">
                    ₹{currentBill.totalAmount}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBillModal(false);
                  setCurrentBill(null);
                  setActiveView("history");
                }}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  darkMode
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                View History
              </button>
              <button
                onClick={() => {
                  setShowBillModal(false);
                  setCurrentBill(null);
                  setActiveView("shop");
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continue Shopping
              </button>
            </div>

            <p className={`text-xs text-center mt-4 opacity-75`}>
              Thank you for shopping with Snack Hub! 🍿
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const SnackModal = ({ snack, onSave, onClose, darkMode }) => {
  const [formData, setFormData] = useState({
    name: snack?.name || "",
    category: snack?.category || "chips",
    price: snack?.price || "",
    quantity: snack?.quantity || "",
    image: snack?.image || "🍿",
    description: snack?.description || "",
    lowStockAlert: snack?.lowStockAlert ?? 5,
    imageUrl: snack?.imageUrl || "",
    imageFile: null, // Add this
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = new FormData();

    // Add all form fields
    Object.keys(formData).forEach((key) => {
      if (key !== "imageFile") {
        if (key === "price" || key === "quantity" || key === "lowStockAlert") {
          submitData.append(key, Number(formData[key]));
        } else {
          submitData.append(key, formData[key]);
        }
      }
    });

    // Add image file if exists
    if (formData.imageFile) {
      submitData.append("image", formData.imageFile);
    }

    onSave(submitData);
  };

  const emojiOptions = ["🍜", "🍰", "🍟", "🍫", "🍪"];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`${
          darkMode ? "bg-gray-800" : "bg-white"
        } rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}
      >
        {/* Modal Header */}
        <h3 className="text-xl font-bold mb-6">
          {snack ? "Edit Snack" : "Add New Snack"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              required
              placeholder="Enter snack name"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="chips">Chips</option>
              <option value="chocolate">Chocolate</option>
              <option value="cookies">Cookies</option>
              <option value="cake">Cake</option>
              <option value="noodles">Noodles</option>
              <option value="namkeen">Namkeen</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Price and Quantity Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Price (₹)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
                min="1"
                placeholder="0"
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Quantity
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      quantity: Math.max(
                        0,
                        (parseInt(formData.quantity) || 0) - 1
                      ),
                    })
                  }
                  className={`px-3 py-2 rounded-l-lg border font-semibold transition-colors ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                      : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  -
                </button>
                <input
                  type="text"
                  value={formData.quantity}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setFormData({ ...formData, quantity: value });
                  }}
                  className={`w-20 px-3 py-2 border-t border-b text-center ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  required
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      quantity: (parseInt(formData.quantity) || 0) + 1,
                    })
                  }
                  className={`px-3 py-2 rounded-r-lg border font-semibold transition-colors ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                      : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Emoji Selector */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Emoji
            </label>
            <div className="grid grid-cols-5 gap-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, image: emoji })}
                  className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                    formData.image === emoji
                      ? "border-blue-500 bg-blue-100"
                      : darkMode
                      ? "border-gray-600 hover:border-gray-500"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Photo Upload
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setFormData({ ...formData, imageFile: file });
                }
              }}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {formData.imageUrl && (
              <div className="mt-2">
                <img
                  src={formData.imageUrl}
                  alt="Current snack"
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <p className="text-xs mt-1">Current photo</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              rows="3"
              placeholder="Enter description (optional)"
            />
          </div>

          {/* Low Stock Alert */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Low Stock Alert
            </label>
            <input
              type="number"
              value={formData.lowStockAlert}
              onChange={(e) =>
                setFormData({ ...formData, lowStockAlert: e.target.value })
              }
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              required
              min="0"
              placeholder="5"
            />
            <p
              className={`text-xs mt-1 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Alert when quantity falls below this number
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                darkMode
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {snack ? "Update" : "Add"} Snack
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SnackInventoryApp;
