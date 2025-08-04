import React, { useState } from "react"; // Removed unused useEffect
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
} from "lucide-react";

const SnackInventoryApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [cart, setCart] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Sample data - in real app, this would come from MongoDB
  const [snacks, setSnacks] = useState([
    {
      id: 1,
      name: "Lays Classic",
      category: "chips",
      price: 20,
      quantity: 15,
      image: "🍟",
      description: "Crispy potato chips",
      sales: 45,
      rating: 4.5,
      lowStockAlert: 5,
    },
    {
      id: 2,
      name: "Dairy Milk",
      category: "chocolate",
      price: 45,
      quantity: 8,
      image: "🍫",
      description: "Smooth milk chocolate",
      sales: 32,
      rating: 4.8,
      lowStockAlert: 3,
    },
    {
      id: 3,
      name: "Coca Cola",
      category: "drinks",
      price: 35,
      quantity: 2,
      image: "🥤",
      description: "Refreshing cola drink",
      sales: 28,
      rating: 4.3,
      lowStockAlert: 5,
    },
    {
      id: 4,
      name: "Oreo Cookies",
      category: "cookies",
      price: 25,
      quantity: 12,
      image: "🍪",
      description: "Chocolate cream cookies",
      sales: 38,
      rating: 4.6,
      lowStockAlert: 4,
    },
  ]);

  // FIX 1: Dynamically generate one sale for today to make the dashboard functional.
  const [salesHistory, setSalesHistory] = useState([
    {
      id: 1,
      snackId: 1,
      snackName: "Lays Classic",
      quantity: 2,
      price: 40,
      date: new Date().toISOString(),
      customer: "Rahul",
    },
    {
      id: 2,
      snackId: 2,
      snackName: "Dairy Milk",
      quantity: 1,
      price: 45,
      date: "2025-08-04T11:15:00",
      customer: "Priya",
    },
    {
      id: 3,
      snackId: 3,
      snackName: "Coca Cola",
      quantity: 3,
      price: 105,
      date: "2025-08-03T15:20:00",
      customer: "Amit",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSnack, setEditingSnack] = useState(null);

  const users = [
    {
      id: 1,
      username: "admin",
      password: "admin123",
      role: "admin",
      name: "Admin User",
    },
    {
      id: 2,
      username: "customer",
      password: "cust123",
      role: "customer",
      name: "Customer User",
    },
  ];

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(
      (u) =>
        u.username === loginForm.username && u.password === loginForm.password
    );
    if (user) {
      setCurrentUser(user);
      setLoginError("");
      setActiveView("dashboard");
    } else {
      setLoginError("Invalid credentials");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCart([]);
    setActiveView("dashboard");
  };

  const totalItems = snacks.reduce((sum, snack) => sum + snack.quantity, 0);
  const lowStockItems = snacks.filter(
    (snack) => snack.quantity <= snack.lowStockAlert
  );
  const totalSales = salesHistory.reduce((sum, sale) => sum + sale.price, 0);
  const todaySales = salesHistory
    .filter(
      (sale) => new Date(sale.date).toDateString() === new Date().toDateString()
    )
    .reduce((sum, sale) => sum + sale.price, 0);

  const filteredSnacks = snacks.filter((snack) => {
    const matchesSearch = snack.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || snack.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (snack) => {
    const existingItem = cart.find((item) => item.id === snack.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === snack.id
            ? { ...item, quantity: Math.min(item.quantity + 1, snack.quantity) }
            : item
        )
      );
    } else {
      setCart([...cart, { ...snack, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const updateCartQuantity = (id, quantity) => {
    if (quantity === 0) {
      removeFromCart(id);
    } else {
      setCart(
        cart.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    }
  };

  // FIX 2: Implement stock validation at checkout.
  const checkout = () => {
    // 1. Validate stock for every item in the cart *before* processing the sale.
    const invalidItems = [];
    for (const item of cart) {
      const stockItem = snacks.find((s) => s.id === item.id);
      if (!stockItem || stockItem.quantity < item.quantity) {
        invalidItems.push(item.name);
      }
    }

    if (invalidItems.length > 0) {
      alert(
        `Could not complete purchase. Some items are out of stock or have limited quantity: ${invalidItems.join(
          ", "
        )}. Please review your cart.`
      );
      // Optionally, you could update the cart to reflect the available stock.
      return; // Stop the checkout process
    }

    // 2. If all items are available, proceed with the checkout.
    const newSales = cart.map((item) => ({
      id: salesHistory.length + Math.random(),
      snackId: item.id,
      snackName: item.name,
      quantity: item.quantity,
      price: item.price * item.quantity,
      date: new Date().toISOString(),
      customer: currentUser.name,
    }));

    setSalesHistory([...salesHistory, ...newSales]);

    // Update inventory
    setSnacks(
      snacks.map((snack) => {
        const cartItem = cart.find((item) => item.id === snack.id);
        return cartItem
          ? {
              ...snack,
              quantity: snack.quantity - cartItem.quantity,
              sales: snack.sales + cartItem.quantity,
            }
          : snack;
      })
    );

    setCart([]);
    alert("Purchase completed successfully!");
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddSnack = (snackData) => {
    const newSnack = {
      id: Date.now(),
      ...snackData,
      sales: 0,
      rating: 0,
      lowStockAlert: 5,
    };
    setSnacks([...snacks, newSnack]);
    setShowAddModal(false);
  };

  const handleEditSnack = (snackData) => {
    setSnacks(
      snacks.map((snack) =>
        snack.id === editingSnack.id ? { ...snack, ...snackData } : snack
      )
    );
    setEditingSnack(null);
  };

  const handleDeleteSnack = (id) => {
    if (confirm("Are you sure you want to delete this snack?")) {
      setSnacks(snacks.filter((snack) => snack.id !== id));
    }
  };

  // The rest of the JSX remains the same, except for one small fix in the sales history table.
  // ... (Login form JSX)
  // ... (Header and Navigation JSX)
  // ... (Dashboard and other views JSX)

  // In the "Sales History View" table body:
  // ...
  // <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}> // <-- FIX 3: Dynamic divider color
  // ...
  // The rest of the code is unchanged.

  if (!currentUser) {
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
            <div className="text-4xl mb-4">🍿</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Snack Hub
            </h1>
            <p
              className={`mt-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
            >
              Your Hostel Snack Inventory
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Username
              </label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, username: e.target.value })
                }
                className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-50 border-gray-200 text-gray-900"
                }`}
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Password
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-50 border-gray-200 text-gray-900"
                }`}
                placeholder="Enter password"
                required
              />
            </div>

            {loginError && (
              <div className="text-red-500 text-sm text-center bg-red-100 p-2 rounded-lg">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Login
            </button>
          </form>

          <div
            className={`mt-6 p-4 rounded-lg ${
              darkMode ? "bg-gray-700" : "bg-gray-100"
            }`}
          >
            <p
              className={`text-sm ${
                darkMode ? "text-gray-300" : "text-gray-600"
              } mb-2`}
            >
              Demo Credentials:
            </p>
            <p className="text-xs">Admin: admin / admin123</p>
            <p className="text-xs">Customer: customer / cust123</p>
          </div>

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
  }

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
              <div className="text-2xl mr-3">🍿</div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Snack Hub
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-lg ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                <Bell size={20} />
                {lowStockItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {lowStockItems.length}
                  </span>
                )}
              </button>

              {currentUser.role === "customer" && (
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
                <span className="text-sm font-medium">{currentUser.name}</span>
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

        {/* Notifications Panel */}
        {showNotifications && (
          <div
            className={`absolute right-4 top-20 w-80 ${
              darkMode ? "bg-gray-800" : "bg-white"
            } rounded-lg shadow-xl border ${
              darkMode ? "border-gray-700" : "border-gray-200"
            } z-50`}
          >
            <div className="p-4">
              <h3 className="font-semibold mb-3">Notifications</h3>
              {lowStockItems.length > 0 ? (
                <div className="space-y-2">
                  {lowStockItems.map((snack) => (
                    <div
                      key={snack.id}
                      className={`p-3 rounded-lg ${
                        darkMode ? "bg-red-900/20" : "bg-red-50"
                      } border-l-4 border-red-500`}
                    >
                      <div className="flex items-center">
                        <AlertTriangle
                          className="text-red-500 mr-2"
                          size={16}
                        />
                        <div>
                          <p className="text-sm font-medium">{snack.name}</p>
                          <p className="text-xs text-red-600">
                            Only {snack.quantity} left in stock
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  No new notifications
                </p>
              )}
            </div>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <nav className="mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "dashboard", label: "Dashboard", icon: BarChart3 },
              { key: "inventory", label: "Inventory", icon: Package },
              ...(currentUser.role === "admin"
                ? [{ key: "sales", label: "Sales History", icon: TrendingUp }]
                : []),
              ...(currentUser.role === "customer"
                ? [{ key: "shop", label: "Shop", icon: ShoppingCart }]
                : []),
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
                      {totalItems}
                    </p>
                  </div>
                  <Package className="text-blue-500" size={32} />
                </div>
              </div>

              <div
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl shadow-lg p-6 border-l-4 border-red-500`}
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
                      ₹{totalSales}
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
                      ₹{todaySales}
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
                      key={sale.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        darkMode ? "bg-gray-700" : "bg-gray-50"
                      }`}
                    >
                      <div>
                        <p className="font-medium">{sale.snackName}</p>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {sale.customer} •{" "}
                          {new Date(sale.date).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          ₹{sale.price}
                        </p>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Qty: {sale.quantity}
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
                    .sort((a, b) => b.sales - a.sales)
                    .slice(0, 5)
                    .map((snack, index) => (
                      <div
                        key={snack.id}
                        className={`flex items-center p-3 rounded-lg ${
                          darkMode ? "bg-gray-700" : "bg-gray-50"
                        }`}
                      >
                        <div className="text-2xl mr-3">{snack.image}</div>
                        <div className="flex-1">
                          <p className="font-medium">{snack.name}</p>
                          <div className="flex items-center">
                            <Star className="text-yellow-500 mr-1" size={14} />
                            <span
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              {snack.rating}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{snack.sales} sold</p>
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
        {activeView === "inventory" && (
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
                </select>
              </div>

              {currentUser.role === "admin" && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Add Snack
                </button>
              )}
            </div>

            {/* Snacks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSnacks.map((snack) => (
                <div
                  key={snack.id}
                  className={`${
                    darkMode ? "bg-gray-800" : "bg-white"
                  } rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-105`}
                >
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">{snack.image}</div>
                    <h3 className="font-semibold text-lg">{snack.name}</h3>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      } mb-2`}
                    >
                      {snack.description}
                    </p>
                    <div className="flex items-center justify-center mb-2">
                      <Star className="text-yellow-500 mr-1" size={14} />
                      <span
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {snack.rating}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-green-600">
                        ₹{snack.price}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          snack.quantity > snack.lowStockAlert
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
                      Category: {snack.category} • Sold: {snack.sales}
                    </div>

                    {snack.quantity <= snack.lowStockAlert &&
                      snack.quantity > 0 && (
                        <div className="flex items-center text-yellow-600 text-sm">
                          <AlertTriangle size={14} className="mr-1" />
                          Low stock alert!
                        </div>
                      )}

                    <div className="flex gap-2">
                      {currentUser.role === "customer" &&
                        snack.quantity > 0 && (
                          <button
                            onClick={() => addToCart(snack)}
                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                          >
                            <ShoppingCart size={16} className="mr-2" />
                            Add to Cart
                          </button>
                        )}

                      {currentUser.role === "admin" && (
                        <>
                          <button
                            onClick={() => setEditingSnack(snack)}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                          >
                            <Edit size={16} className="mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSnack(snack.id)}
                            className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shop View (Customer) */}
        {activeView === "shop" && currentUser.role === "customer" && (
          // This entire section is unchanged
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
              {["all", "chips", "chocolate", "drinks", "cookies"].map(
                (category) => (
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
                )
              )}
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
                    key={snack.id}
                    className={`${
                      darkMode ? "bg-gray-800" : "bg-white"
                    } rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-105`}
                  >
                    <div className="text-center mb-4">
                      <div className="text-5xl mb-3">{snack.image}</div>
                      <h3 className="font-bold text-xl mb-2">{snack.name}</h3>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        } mb-3`}
                      >
                        {snack.description}
                      </p>

                      <div className="flex items-center justify-center mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`${
                              i < Math.floor(snack.rating)
                                ? "text-yellow-500"
                                : "text-gray-300"
                            }`}
                            size={16}
                            fill={
                              i < Math.floor(snack.rating)
                                ? "currentColor"
                                : "none"
                            }
                          />
                        ))}
                        <span
                          className={`ml-2 text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          ({snack.rating})
                        </span>
                      </div>

                      <div className="flex justify-between items-center mb-4">
                        <span className="text-3xl font-bold text-green-600">
                          ₹{snack.price}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            snack.quantity > snack.lowStockAlert
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {snack.quantity} left
                        </span>
                      </div>

                      {snack.quantity <= snack.lowStockAlert && (
                        <div className="flex items-center justify-center text-orange-600 text-sm mb-3">
                          <AlertTriangle size={14} className="mr-1" />
                          Hurry! Limited stock
                        </div>
                      )}

                      <button
                        onClick={() => addToCart(snack)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center justify-center"
                      >
                        <ShoppingCart size={18} className="mr-2" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Cart View */}
        {activeView === "cart" && currentUser.role === "customer" && (
          // This entire section is unchanged
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
                      key={item.id}
                      className={`${
                        darkMode ? "bg-gray-800" : "bg-white"
                      } rounded-xl shadow-lg p-6`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-3xl mr-4">{item.image}</div>
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
                                updateCartQuantity(item.id, item.quantity - 1)
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
                                  item.id,
                                  Math.min(
                                    item.quantity + 1,
                                    snacks.find((s) => s.id === item.id)
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
                            onClick={() => removeFromCart(item.id)}
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
                      className="flex-2 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center"
                    >
                      <CreditCard size={20} className="mr-2" />
                      Checkout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Sales History View (Admin only) */}
        {activeView === "sales" && currentUser.role === "admin" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Sales History</h2>
              <div className="text-lg font-semibold">
                Total Revenue:{" "}
                <span className="text-green-600">₹{totalSales}</span>
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
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  {/* FIX 3: DYNAMIC TABLE DIVIDER */}
                  <tbody
                    className={`divide-y ${
                      darkMode ? "divide-gray-700" : "divide-gray-200"
                    }`}
                  >
                    {salesHistory.map((sale) => (
                      <tr
                        key={sale.id}
                        className={`${
                          darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {new Date(sale.date).toLocaleDateString()}
                            </span>
                            <span
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              {new Date(sale.date).toLocaleTimeString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">
                              {snacks.find((s) => s.id === sale.snackId)
                                ?.image || "🍿"}
                            </span>
                            <span className="font-medium">
                              {sale.snackName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium">{sale.customer}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-sm font-medium ${
                              darkMode
                                ? "bg-blue-900 text-blue-300"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {sale.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-green-600">
                            ₹{sale.price}
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

      {/* Add/Edit Snack Modal */}
      {(showAddModal || editingSnack) && currentUser.role === "admin" && (
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

// The SnackModal component is unchanged.
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
      price: Number(formData.price),
      quantity: Number(formData.quantity),
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
        <h3 className="text-xl font-bold mb-6">
          {snack ? "Edit Snack" : "Add New Snack"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            />
          </div>

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
            </select>
          </div>

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
              />
            </div>
          </div>

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
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Low Stock Alert (when quantity is below this number)
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
            />
          </div>

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
