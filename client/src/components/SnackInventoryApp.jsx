import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { snacksAPI, salesAPI } from "../services/api";

const SnackInventoryApp = () => {
  const { user, logout, isLoading } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Filter states

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSnack, setEditingSnack] = useState(null); // Load data on component mount

  useEffect(() => {
    if (user) {
      loadInitialData();
      if (user.role === "customer") {
        setActiveView("shop");
      }
    }
  }, [user]);

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
      if (user?.role === "admin") {
        const [snackStats, salesStats] = await Promise.all([
          snacksAPI.getStats(),
          salesAPI.getSalesStats(),
        ]);

        // ===== UPDATE THE SETSTATS CALL HERE =====
        setStats({
          // Both now use the consistent '.data.overall' structure
          totalItems: snackStats.data?.overall?.totalQuantity || 0,
          lowStockItems: snackStats.data?.lowStockCount || 0,
          totalSales: salesStats.data?.overall?.totalRevenue || 0,
          // The todaySales field doesn't exist in the API, so we set it to 0
          todaySales: 0,
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error); // Don't throw, stats are not critical
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
    (snack) =>
      snack.quantity <= (snack.lowStockAlert || 5) && snack.isActive !== false
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
      setLoading(true); // Prepare sale data

      const saleData = {
        items: cart.map((item) => ({
          snack: item._id,
          quantity: item.quantity,
        })),
        paymentMethod: "cash",
        notes: `Purchase by ${user.name}`,
      }; // Create sale

      await salesAPI.createSale(saleData); // Clear cart and refresh data

      setCart([]);
      await loadSnacks();
      await loadSalesHistory();
      await loadStats();

      alert("Purchase completed successfully!");
    } catch (error) {
      console.error("Checkout error:", error);
      alert(error.message || "Failed to complete purchase. Please try again.");
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
      await snacksAPI.createSnack(snackData);
      await loadSnacks();
      await loadStats();
      setShowAddModal(false);
      alert("Snack added successfully!");
    } catch (error) {
      console.error("Error adding snack:", error);
      alert(error.message || "Failed to add snack");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSnack = async (snackData) => {
    try {
      setLoading(true);
      await snacksAPI.updateSnack(editingSnack._id, snackData);
      await loadSnacks();
      await loadStats();
      setEditingSnack(null);
      alert("Snack updated successfully!");
    } catch (error) {
      console.error("Error updating snack:", error);
      alert(error.message || "Failed to update snack");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSnack = async (id) => {
    if (!confirm("Are you sure you want to delete this snack?")) return;

    try {
      setLoading(true);
      await snacksAPI.deleteSnack(id);
      await loadSnacks();
      await loadStats();
      alert("Snack deleted successfully!");
    } catch (error) {
      console.error("Error deleting snack:", error);
      alert(error.message || "Failed to delete snack");
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {" "}
        <div className="text-center">
          <div className="text-4xl mb-4">🍿</div> <p>Loading...</p>{" "}
        </div>{" "}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {" "}
        <div className="text-center">
          <div className="text-4xl mb-4">🍿</div>{" "}
          <h1 className="text-2xl font-bold mb-4">Please Login</h1>{" "}
          <p>You need to be logged in to access the snack inventory.</p>{" "}
        </div>{" "}
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
              <div className="text-2xl mr-3">
                <img className="h-10 w-10" src="logo.jpg" alt="logo" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Snack Hub
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {user.role === "customer" && (
                <button
                  onClick={() => setActiveView("cart")}
                  className={`relative p-2 rounded-lg ${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <ShoppingCart size={20} />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <div className="flex items-center space-x-2">
                <User size={20} />
                <span className="text-sm font-medium">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className={`p-2 rounded-lg ${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  } text-red-500`}
                >
                  <LogOut size={16} />
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <nav className="mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "dashboard", label: "Dashboard", icon: BarChart3 },
              ...(user.role === "admin"
                ? [
                    { key: "inventory", label: "Inventory", icon: Package },
                    { key: "sales", label: "Sales History", icon: TrendingUp },
                  ]
                : []),
              ...(user.role === "customer"
                ? [{ key: "shop", label: "Shop", icon: ShoppingCart }]
                : []),
              // eslint-disable-next-line no-unused-vars
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
            ))}
          </div>
        </nav>

        {/* Dashboard View */}
        {activeView === "dashboard" && (
          <div className="space-y-8">
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

            {/* Recent Activity & Top Selling */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Sales */}
              <div
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl shadow-lg p-6`}
              >
                <h3 className="text-lg font-semibold mb-4">Recent Sales</h3>
                <div className="space-y-3">
                  {salesHistory.slice(0, 5).map((sale) => (
                    <div
                      key={sale._id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        darkMode ? "bg-gray-700" : "bg-gray-50"
                      }`}
                    >
                      <div>
                        <p className="font-medium">{sale.customerName}</p>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {sale.items?.length || 0} items •{" "}
                          {new Date(sale.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          ₹{sale.totalAmount}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Selling */}
              <div
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl shadow-lg p-6`}
              >
                <h3 className="text-lg font-semibold mb-4">
                  Top Selling Items
                </h3>
                <div className="space-y-3">
                  {[...snacks]
                    .sort((a, b) => (b.sales || 0) - (a.sales || 0))
                    .slice(0, 5)
                    .map((snack) => (
                      <div
                        key={snack._id}
                        className={`flex items-center p-3 rounded-lg ${
                          darkMode ? "bg-gray-700" : "bg-gray-50"
                        }`}
                      >
                        <div className="text-2xl mr-3">{snack.image}</div>
                        <div className="flex-1">
                          <p className="font-medium">{snack.name}</p>
                          <p
                            className={`text-sm ${
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            ₹{snack.price}
                          </p>
                        </div>
                      </div>
                    ))}
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
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
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
                  <option value="drinks">Drinks</option>
                  <option value="cookies">Cookies</option>
                  <option value="candy">Candy</option>
                  <option value="healthy">Healthy</option>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSnacks.map((snack) => (
                <div
                  key={snack._id}
                  className={`${
                    darkMode ? "bg-gray-800" : "bg-white"
                  } rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-105`}
                >
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">{snack.image || "🍿"}</div>
                    <h3 className="font-semibold text-lg">{snack.name}</h3>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      } mb-2`}
                    >
                      {snack.description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-green-600">
                        ₹{snack.price}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          snack.quantity > (snack.lowStockAlert || 5)
                            ? "bg-green-100 text-green-800"
                            : snack.quantity > 0
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
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
                      }`}
                    >
                      Category: {snack.category} • Sold: {snack.sales || 0}
                    </div>

                    {snack.quantity <= (snack.lowStockAlert || 5) &&
                      snack.quantity > 0 && (
                        <div className="flex items-center text-yellow-600 text-sm">
                          <AlertTriangle size={14} className="mr-1" />
                          Low stock alert!
                        </div>
                      )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingSnack(snack)}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                      >
                        <Edit size={16} className="mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSnack(snack._id)}
                        className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
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
                "drinks",
                "cookies",
                "candy",
                "healthy",
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
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSnacks
                .filter((snack) => snack.quantity > 0)
                .map((snack) => (
                  <div
                    key={snack._id}
                    className={`${
                      darkMode ? "bg-gray-800" : "bg-white"
                    } rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-105 relative`}
                  >
                    {/* Add to Cart Animation */}
                    {addToCartAnimation[snack._id] && (
                      <div className="absolute inset-0 bg-green-500 bg-opacity-20 rounded-xl flex items-center justify-center z-10 pointer-events-none animate-pulse">
                        <div className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center shadow-lg">
                          <CheckCircle size={20} className="mr-2" />
                          Added to Cart!
                        </div>
                      </div>
                    )}

                    <div className="text-center mb-4">
                      <div className="text-5xl mb-3">{snack.image || "🍿"}</div>
                      <h3 className="font-bold text-xl mb-2">{snack.name}</h3>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        } mb-3`}
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
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {getAvailableQuantity(snack)} left
                        </span>
                      </div>

                      {getAvailableQuantity(snack) <=
                        (snack.lowStockAlert || 5) && (
                        <div className="flex items-center justify-center text-orange-600 text-sm mb-3">
                          <AlertTriangle size={14} className="mr-1" />
                          Hurry! Limited stock
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
          </div>
        )}

        {/* Cart View */}
        {activeView === "cart" && user.role === "customer" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Shopping Cart</h2>
              <div className="text-lg font-semibold">
                Total: <span className="text-green-600">₹{cartTotal}</span>
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
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                updateCartQuantity(item._id, item.quantity - 1)
                              }
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                darkMode
                                  ? "border-gray-600 hover:bg-gray-700"
                                  : "border-gray-300 hover:bg-gray-100"
                              }`}
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-semibold">
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
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                darkMode
                                  ? "border-gray-600 hover:bg-gray-700"
                                  : "border-gray-300 hover:bg-gray-100"
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
                      {loading ? "Processing..." : "Checkout"}
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
      </div>

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
    lowStockAlert: snack?.lowStockAlert || 5,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      price: Number(formData.price), // Convert string to number
      quantity: Number(formData.quantity), // Convert string to number
      lowStockAlert: Number(formData.lowStockAlert),
    });
  };

  const emojiOptions = [
    "🍟",
    "🍫",
    "🥤",
    "🍪",
    "🍿",
    "🥨",
    "🧀",
    "🍕",
    "🌭",
    "🍔",
  ];

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
              <option value="drinks">Drinks</option>
              <option value="cookies">Cookies</option>
              <option value="candy">Candy</option>
              <option value="healthy">Healthy</option>
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
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
                min="0"
                placeholder="0"
              />
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
              min="1"
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
