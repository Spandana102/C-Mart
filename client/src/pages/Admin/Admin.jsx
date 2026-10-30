import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./Admin.css";
const EMPTY_USER = {
  fullName: "",
  email: "",
  password: "",
  phoneNumber: "",
};
const EMPTY_PRODUCT = {
  name: "",
  price: "",
  category: "",
  description: "",
  images: [],
  stock: "1",
};
const INITIAL_STATS = {
  totalUsers: 0,
  activeUsers: 0,
  blockedUsers: 0,
  totalAdmins: 0,
  products: 0,
  reports: 0,
  complaints: 0,
};
const MENUS = [
  { name: "Dashboard", icon: "⌂" },
  { name: "Users", icon: "👥" },
  { name: "Products", icon: "📦" },
  { name: "Reports", icon: "🚩" },
  { name: "Complaints", icon: "⚠" },
];
function getAuthConfig() {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token || ""}`,
    },
  };
}
function getError(error, fallback) {
  return error?.response?.data?.message || fallback;
}
function normalizeList(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  return [];
}
function getImageUrl(image) {
  if (!image) return "";
  if (Array.isArray(image)) {
    for (const item of image) {
      const url = getImageUrl(item);
      if (url) return url;
    }
    return "";
  }
  if (typeof image === "object") {
    return getImageUrl(
      image.secure_url || image.url || image.imageUrl || image.path || image.src || ""
    );
  }
  if (typeof image !== "string") return "";
  const value = image.trim().replace(/\\/g, "/");
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:image/")) return value;
  return `http://localhost:5000/${value.replace(/^\/+/, "")}`;
}
const isUserBlocked = (user) =>
  user?.isBlocked === true || String(user?.status || "").toLowerCase() === "blocked";
function AdminDashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  // ===============================
  // NAVIGATION AND AUTH
  // ===============================
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessError, setAccessError] = useState("");
  // ===============================
  // DASHBOARD
  // ===============================
  const [stats, setStats] = useState(INITIAL_STATS);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  // ===============================
  // USERS
  // ===============================
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_USER);
  const [addingUser, setAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState("");
  // ===============================
  // PRODUCTS
  // ===============================
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  // ===============================
  // REPORTS
  // ===============================
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportError, setReportError] = useState("");
  // ===============================
  // COMPLAINTS
  // ===============================
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [complaintError, setComplaintError] = useState("");
  // ===============================
  // API FUNCTIONS
  // ===============================
  const fetchDashboardStats = async () => {
    try {
      setLoadingDashboard(true);
      setDashboardError("");
      const response = await API.get(
        "/admin/dashboard",
        getAuthConfig()
      );
      const data = response.data?.stats || {};
      setStats((current) => ({
        ...current,
        totalUsers: data.totalUsers ?? current.totalUsers,
        activeUsers: data.activeUsers ?? current.activeUsers,
        blockedUsers: data.blockedUsers ?? current.blockedUsers,
        totalAdmins: data.totalAdmins ?? current.totalAdmins,
        products: data.totalProducts ?? data.products ?? current.products,
      }));
    } catch (error) {
      setDashboardError(
        getError(error, "Failed to load dashboard.")
      );
    } finally {
      setLoadingDashboard(false);
    }
  };
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setUserError("");
      const response = await API.get(
        "/admin/users",
        getAuthConfig()
      );
      const list = normalizeList(response.data, "users");
      setUsers(list);
      setStats((current) => ({
        ...current,
        totalUsers: list.length,
        activeUsers: list.filter(
          (user) => !isUserBlocked(user)
        ).length,
        blockedUsers: list.filter(
          (user) => isUserBlocked(user)
        ).length,
      }));
    } catch (error) {
      setUserError(
        getError(error, "Failed to load users.")
      );
    } finally {
      setLoadingUsers(false);
    }
  };
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductError("");
      const response = await API.get(
        "/admin/products",
        getAuthConfig()
      );
      const list = normalizeList(response.data, "products");
      setProducts(list);
      setStats((current) => ({
        ...current,
        products: list.length,
      }));
    } catch (error) {
      setProductError(
        getError(error, "Failed to load products.")
      );
    } finally {
      setLoadingProducts(false);
    }
  };
  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      setReportError("");
      const response = await API.get(
        "/reports",
        getAuthConfig()
      );
      const list = normalizeList(response.data, "reports");
      setReports(list);
      setStats((current) => ({
        ...current,
        reports: list.length,
      }));
    } catch (error) {
      setReportError(
        getError(error, "Failed to load reports.")
      );
    } finally {
      setLoadingReports(false);
    }
  };
  const fetchComplaints = async () => {
    try {
      setLoadingComplaints(true);
      setComplaintError("");
      const response = await API.get(
        "/complaints",
        getAuthConfig()
      );
      const list = normalizeList(response.data, "complaints");
      setComplaints(list);
      setStats((current) => ({
        ...current,
        complaints: list.length,
      }));
    } catch (error) {
      setComplaintError(
        getError(error, "Failed to load complaints.")
      );
    } finally {
      setLoadingComplaints(false);
    }
  };
  // ===============================
  // CHECK ADMIN ACCESS
  // ===============================
  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }
      try {
        await API.get(
          "/admin/dashboard",
          getAuthConfig()
        );
        if (cancelled) return;
        setCheckingAccess(false);
        // Load each section independently.
        // A failed reports API must not hide users.
        fetchDashboardStats();
        fetchUsers();
        fetchProducts();
        fetchReports();
        fetchComplaints();
      } catch (error) {
        if (cancelled) return;
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }
        if (error.response?.status === 403) {
          setAccessError(
            "Access denied. This page is for administrators only."
          );
        } else {
          setAccessError(
            getError(
              error,
              "Unable to verify admin access. Check your server."
            )
          );
        }
        setCheckingAccess(false);
      }
    };
    initialize();
    return () => {
      cancelled = true;
    };
  }, [navigate]);
  // ===============================
  // MENU NAVIGATION
  // ===============================
  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
    setSearch("");
    setSelectedUser(null);
    if (menu === "Dashboard") {
      fetchDashboardStats();
      fetchUsers();
      fetchProducts();
      fetchReports();
      fetchComplaints();
    }
    if (menu === "Users") fetchUsers();
    if (menu === "Products") fetchProducts();
    if (menu === "Reports") fetchReports();
    if (menu === "Complaints") fetchComplaints();
  };
  // ===============================
  // ADD USER
  // ===============================
  const handleNewUserChange = (event) => {
    const { name, value } = event.target;
    setNewUser((current) => ({
      ...current,
      [name]: value,
    }));
  };
  const addUser = async (event) => {
    event.preventDefault();
    if (
      !newUser.fullName.trim() ||
      !newUser.email.trim() ||
      !newUser.password ||
      !newUser.phoneNumber.trim()
    ) {
      setAddUserError("All fields are required.");
      return;
    }
    if (newUser.password.length < 8) {
      setAddUserError(
        "Password must contain at least 8 characters."
      );
      return;
    }
    if (!/^[0-9]{10}$/.test(newUser.phoneNumber.trim())) {
      setAddUserError("Enter a valid 10-digit phone number.");
      return;
    }
    try {
      setAddingUser(true);
      setAddUserError("");
      await API.post(
        "/admin/users",
        {
          fullName: newUser.fullName.trim(),
          email: newUser.email.trim(),
          password: newUser.password,
          phoneNumber: newUser.phoneNumber.trim(),
          collegeId: "189",
          role: "user",
        },
        getAuthConfig()
      );
      setNewUser(EMPTY_USER);
      setShowAddUserForm(false);
      await fetchUsers();
      await fetchDashboardStats();
      alert("User added successfully!");
    } catch (error) {
      setAddUserError(
        getError(error, "Failed to add user.")
      );
    } finally {
      setAddingUser(false);
    }
  };
  // ===============================
  // BLOCK / UNBLOCK USER
  // ===============================
  const toggleUserStatus = async (user) => {
    if (user.role === "admin") {
      alert("Admin accounts cannot be blocked here.");
      return;
    }
    const action =
      isUserBlocked(user) ? "unblock" : "block";
    if (
      !window.confirm(
        `Are you sure you want to ${action} ${user.fullName}?`
      )
    ) {
      return;
    }
    try {
      await API.put(
        `/admin/users/${user._id}/status`,
        {},
        getAuthConfig()
      );
      await fetchUsers();
      await fetchDashboardStats();
      setSelectedUser(null);
    } catch (error) {
      alert(
        getError(error, "Failed to update user status.")
      );
    }
  };
  // ===============================
  // DELETE USER
  // ===============================
  const deleteUser = async () => {
    if (!userToDelete || deletingUser) return;
    try {
      setDeletingUser(true);
      await API.delete(
        `/admin/users/${userToDelete._id}`,
        getAuthConfig()
      );
      setUserToDelete(null);
      setSelectedUser(null);
      await fetchUsers();
      await fetchDashboardStats();
      alert("User deleted successfully.");
    } catch (error) {
      alert(
        getError(error, "Failed to delete user.")
      );
    } finally {
      setDeletingUser(false);
    }
  };
  // ===============================
  // PRODUCT IMAGE UPLOAD
  // ===============================
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProductError("Please select an image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProductError("Image must be smaller than 5 MB.");
      return;
    }
    try {
      setUploadingImage(true);
      setProductError("");
      const formData = new FormData();
      formData.append("image", file);
      const response = await API.post(
        "/upload/image",
        formData,
        getAuthConfig()
      );
      const imageUrl =
        response.data?.imageUrl ||
        response.data?.url ||
        response.data?.secure_url;
      if (!imageUrl) {
        throw new Error("Upload API did not return an image URL.");
      }
      setProductForm((current) => ({
        ...current,
        images: [...current.images, imageUrl],
      }));
    } catch (error) {
      setProductError(
        getError(
          error,
          error.message || "Image upload failed."
        )
      );
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  // ===============================
  // ADD PRODUCT
  // ===============================
  const addProduct = async (event) => {
    event.preventDefault();
    if (
      !productForm.name.trim() ||
      !productForm.category.trim() ||
      !productForm.price
    ) {
      setProductError(
        "Name, category and price are required."
      );
      return;
    }
    if (
      !Number.isFinite(Number(productForm.price)) ||
      Number(productForm.price) <= 0
    ) {
      setProductError("Enter a valid price above zero.");
      return;
    }
    if (productForm.images.length === 0) {
      setProductError("Upload at least one product image.");
      return;
    }
    try {
      setSavingProduct(true);
      setProductError("");
      await API.post(
        "/products",
        {
          name: productForm.name.trim(),
          price: Number(productForm.price),
          category: productForm.category.trim(),
          description: productForm.description.trim(),
          stock: Number(productForm.stock),
          images: productForm.images,
        },
        getAuthConfig()
      );
      setProductForm(EMPTY_PRODUCT);
      setShowProductForm(false);
      await fetchProducts();
      alert("Product added successfully!");
    } catch (error) {
      setProductError(
        getError(error, "Failed to add product.")
      );
    } finally {
      setSavingProduct(false);
    }
  };
  // ===============================
  // DELETE PRODUCT
  // ===============================
  const deleteProduct = async (productId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this product?"
      )
    ) {
      return;
    }
    try {
      await API.delete(
        `/admin/products/${productId}`,
        getAuthConfig()
      );
      await fetchProducts();
      alert("Product deleted successfully.");
    } catch (error) {
      alert(
        getError(error, "Failed to delete product.")
      );
    }
  };
  // ===============================
  // REPORT ACTIONS
  // ===============================
  const updateReportStatus = async (id, status) => {
    try {
      await API.put(
        `/reports/${id}/status`,
        { status },
        getAuthConfig()
      );
      await fetchReports();
    } catch (error) {
      alert(
        getError(error, "Failed to update report.")
      );
    }
  };
  const deleteReport = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await API.delete(
        `/reports/${id}`,
        getAuthConfig()
      );
      await fetchReports();
    } catch (error) {
      alert(
        getError(error, "Failed to delete report.")
      );
    }
  };
  // ===============================
  // COMPLAINT ACTIONS
  // ===============================
  const updateComplaintStatus = async (id, status) => {
    try {
      await API.put(
        `/complaints/${id}/status`,
        { status },
        getAuthConfig()
      );
      await fetchComplaints();
    } catch (error) {
      alert(
        getError(error, "Failed to update complaint.")
      );
    }
  };
  const deleteComplaint = async (id) => {
    if (!window.confirm("Delete this complaint?")) return;
    try {
      await API.delete(
        `/complaints/${id}`,
        getAuthConfig()
      );
      await fetchComplaints();
    } catch (error) {
      alert(
        getError(error, "Failed to delete complaint.")
      );
    }
  };
  // ===============================
  // SEARCH USERS
  // ===============================
  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return users;
    return users.filter((user) =>
      [
        user.fullName,
        user.email,
        user.collegeId,
        user.phoneNumber,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [users, search]);
  // ===============================
  // LOGOUT
  // ===============================
  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to logout?")) {
      return;
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };
  // ===============================
  // ACCESS SCREEN
  // ===============================
  if (checkingAccess) {
    return (
      <div className="admin-dashboard">
        <main className="admin-main">
          <div className="no-data">
            <h2>Checking administrator access...</h2>
            <p>Please wait.</p>
          </div>
        </main>
      </div>
    );
  }
  if (accessError) {
    return (
      <div className="admin-dashboard">
        <main className="admin-main">
          <div className="management-panel">
            <h2>Admin Access</h2>
            <p className="form-error">{accessError}</p>
            <button
              className="primary-btn"
              onClick={() => navigate("/")}
            >
              Go to Dashboard
            </button>
            <button
              className="cancel-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </main>
      </div>
    );
  }
  // ===============================
  // MAIN ADMIN UI
  // ===============================
  return (
    <div className="admin-dashboard">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div>
          <div className="admin-brand">
            <div className="brand-icon">C</div>
            <div>
              <h2>C-Mart</h2>
              <span>Admin Dashboard</span>
            </div>
          </div>
          <div className="sidebar-section-title">
            MAIN MENU
          </div>
          <nav className="admin-nav">
            {MENUS.map((menu) => (
              <button
                key={menu.name}
                type="button"
                className={
                  activeMenu === menu.name ? "active" : ""
                }
                onClick={() => handleMenuClick(menu.name)}
              >
                <span>{menu.icon}</span>
                {menu.name}
              </button>
            ))}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <div className="admin-sidebar-profile">
            <div className="sidebar-avatar">A</div>
            <div>
              <strong>Administrator</strong>
              <span>Admin Account</span>
            </div>
          </div>
          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            <span>↪</span> Logout
          </button>
        </div>
      </aside>
      {/* MAIN CONTENT */}
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <div className="breadcrumb">
              C-Mart / {activeMenu}
            </div>
            <h1>
              {activeMenu === "Dashboard"
                ? "Admin Dashboard"
                : `Manage ${activeMenu}`}
            </h1>
            <p>
              {activeMenu === "Dashboard"
                ? "Monitor and manage your C-Mart marketplace."
                : `Manage ${activeMenu.toLowerCase()} from your admin panel.`}
            </p>
          </div>
          <div className="admin-user">
            <div className="admin-avatar">A</div>
            <div>
              <strong>Administrator</strong>
              <span>Admin</span>
            </div>
          </div>
        </header>
        {/* ================= DASHBOARD ================= */}
        {activeMenu === "Dashboard" && (
          <>
            <section className="welcome-banner">
              <div>
                <span className="welcome-label">
                  ADMINISTRATION
                </span>
                <h2>Welcome back, Administrator 👋</h2>
                <p>
                  Here's what's happening with your
                  C-Mart marketplace today.
                </p>
              </div>
              <div className="welcome-icon">📊</div>
            </section>
            {dashboardError && (
              <div className="form-error">
                {dashboardError}
              </div>
            )}
            <section className="stats-grid">
              {[
                {
                  title: "Total Users",
                  value: stats.totalUsers,
                  icon: "👥",
                  menu: "Users",
                  className: "users-card",
                  note: `${stats.activeUsers} active users`,
                },
                {
                  title: "Total Products",
                  value: stats.products,
                  icon: "📦",
                  menu: "Products",
                  className: "products-card",
                  note: "Manage marketplace products",
                },
                {
                  title: "Reports",
                  value: stats.reports,
                  icon: "🚩",
                  menu: "Reports",
                  className: "reports-card",
                  note: "Review reported content",
                },
                {
                  title: "Complaints",
                  value: stats.complaints,
                  icon: "⚠",
                  menu: "Complaints",
                  className: "complaints-card",
                  note: "Review user complaints",
                },
              ].map((item) => (
                <button
                  key={item.title}
                  className={`stat-card ${item.className}`}
                  onClick={() => handleMenuClick(item.menu)}
                >
                  <div className="stat-top">
                    <div className="stat-icon">
                      {item.icon}
                    </div>
                    <span className="stat-link">
                      View →
                    </span>
                  </div>
                  <span className="stat-title">
                    {item.title}
                  </span>
                  <strong>
                    {loadingDashboard ? "..." : item.value}
                  </strong>
                  <small>{item.note}</small>
                </button>
              ))}
            </section>
            <section className="dashboard-grid">
              <div className="dashboard-panel">
                <div className="panel-header">
                  <div>
                    <h2>Quick Actions</h2>
                    <p>Access administration tasks.</p>
                  </div>
                </div>
                <div className="quick-action-grid">
                  {MENUS.filter(
                    (menu) => menu.name !== "Dashboard"
                  ).map((menu) => (
                    <button
                      key={menu.name}
                      onClick={() =>
                        handleMenuClick(menu.name)
                      }
                    >
                      <span>{menu.icon}</span>
                      <div>
                        <strong>
                          Manage {menu.name}
                        </strong>
                        <small>
                          Open {menu.name.toLowerCase()}
                        </small>
                      </div>
                      <b>→</b>
                    </button>
                  ))}
                </div>
              </div>
              <div className="dashboard-panel">
                <div className="panel-header">
                  <div>
                    <h2>User Overview</h2>
                    <p>Current account status</p>
                  </div>
                </div>
                <div className="user-overview">
                  {[
                    ["👥", "Total Users", stats.totalUsers],
                    ["🟢", "Active Users", stats.activeUsers],
                    ["🔴", "Blocked Users", stats.blockedUsers],
                  ].map(([icon, label, value]) => (
                    <div
                      className="overview-item"
                      key={label}
                    >
                      <span className="overview-icon">
                        {icon}
                      </span>
                      <div>
                        <small>{label}</small>
                        <strong>{value}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
        {/* ================= USERS ================= */}
        {activeMenu === "Users" && (
          <section className="management-panel">
            <div className="panel-header">
              <div>
                <h2>User Management</h2>
                <p>
                  View, add, block or remove
                  registered C-Mart users.
                </p>
              </div>
              <div className="panel-actions">
                <span className="record-count">
                  {filteredUsers.length} Users
                </span>
                <button
                  className="primary-btn"
                  onClick={() => {
                    setShowAddUserForm(!showAddUserForm);
                    setAddUserError("");
                  }}
                >
                  {showAddUserForm
                    ? "Close Form"
                    : "+ Add User"}
                </button>
              </div>
            </div>
            {showAddUserForm && (
              <form
                className="product-form"
                onSubmit={addUser}
              >
                <div className="form-heading">
                  <h3>Add New User</h3>
                  <p>
                    Create a new student account.
                  </p>
                </div>
                <div className="form-grid">
                  {[
                    {
                      name: "fullName",
                      label: "Full Name",
                      type: "text",
                    },
                    {
                      name: "email",
                      label: "Email",
                      type: "email",
                    },
                    {
                      name: "password",
                      label: "Password",
                      type: "password",
                    },
                    {
                      name: "phoneNumber",
                      label: "Phone Number",
                      type: "tel",
                    },
                  ].map((field) => (
                    <div
                      className="form-group"
                      key={field.name}
                    >
                      <label>{field.label}</label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={newUser[field.name]}
                        onChange={handleNewUserChange}
                        required
                        minLength={
                          field.name === "password"
                            ? 8
                            : undefined
                        }
                      />
                    </div>
                  ))}
                  <div className="form-group">
                    <label>College ID</label>
                    <input
                      type="text"
                      value="189"
                      readOnly
                    />
                  </div>
                </div>
                {addUserError && (
                  <div className="form-error">
                    ⚠ {addUserError}
                  </div>
                )}
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={addingUser}
                >
                  {addingUser
                    ? "Adding User..."
                    : "Add User"}
                </button>
              </form>
            )}
            <div className="search-box">
              <span>⌕</span>
              <input
                type="text"
                placeholder="Search users by name, email or phone..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>
            {userError && (
              <div className="form-error">
                {userError}
              </div>
            )}
            {loadingUsers ? (
              <div className="no-data">
                Loading users...
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>College ID</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user._id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">
                              {user.fullName
                                ?.charAt(0)
                                .toUpperCase() || "U"}
                            </div>
                            <div>
                              <strong>
                                {user.fullName}
                              </strong>
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>{user.collegeId || "189"}</td>
                        <td>
                          <span className="role-badge">
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span
                            className={
                              isUserBlocked(user)
                                ? "status blocked-status"
                                : "status active-status"
                            }
                          >
                            {user.status || "Active"}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="view-btn"
                              onClick={() =>
                                setSelectedUser(user)
                              }
                            >
                              View
                            </button>
                            <button
                              className="block-btn"
                              disabled={user.role === "admin"}
                              onClick={() =>
                                toggleUserStatus(user)
                              }
                            >
                              {isUserBlocked(user)
                                ? "Unblock"
                                : "Block"}
                            </button>
                            <button
                              className="delete-btn"
                              disabled={user.role === "admin"}
                              onClick={() =>
                                setUserToDelete(user)
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <div className="no-data">
                    No users found.
                  </div>
                )}
              </div>
            )}
          </section>
        )}
        {/* ================= PRODUCTS ================= */}
        {activeMenu === "Products" && (
          <section className="management-panel">
            <div className="panel-header">
              <div>
                <h2>Product Management</h2>
                <p>
                  View and manage C-Mart marketplace products.
                </p>
              </div>
              <div className="panel-actions">
                <span className="record-count">
                  {products.length} Products
                </span>
                <button
                  className="primary-btn"
                  onClick={() => {
                    setShowProductForm(!showProductForm);
                    setProductError("");
                  }}
                >
                  {showProductForm
                    ? "Close Form"
                    : "+ Add Product"}
                </button>
              </div>
            </div>
            {showProductForm && (
              <form
                className="product-form"
                onSubmit={addProduct}
              >
                <div className="form-heading">
                  <h3>Add New Product</h3>
                </div>
                <div className="form-grid">
                  {[
                    {
                      name: "name",
                      label: "Product Name",
                      type: "text",
                    },
                    {
                      name: "price",
                      label: "Price",
                      type: "number",
                    },
                    {
                      name: "category",
                      label: "Category",
                      type: "text",
                    },
                    {
                      name: "stock",
                      label: "Stock",
                      type: "number",
                    },
                  ].map((field) => (
                    <div
                      className="form-group"
                      key={field.name}
                    >
                      <label>{field.label}</label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={productForm[field.name]}
                        onChange={(event) =>
                          setProductForm((current) => ({
                            ...current,
                            [field.name]: event.target.value,
                          }))
                        }
                        min={
                          field.type === "number"
                            ? "0"
                            : undefined
                        }
                        required
                      />
                    </div>
                  ))}
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    rows="4"
                    value={productForm.description}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="upload-section">
                  <label>Product Images</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && (
                    <p className="uploading-text">
                      Uploading image...
                    </p>
                  )}
                  {productForm.images.length > 0 && (
                    <div className="image-preview">
                      {productForm.images.map((image, index) => (
                        <div key={`image-${index}`}>
                          <img
                            src={getImageUrl(image)}
                            alt={`Product preview ${index + 1}`}
                          />
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() =>
                              setProductForm((current) => ({
                                ...current,
                                images: current.images.filter(
                                  (_, i) => i !== index
                                ),
                              }))
                            }
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {productError && (
                  <div className="form-error">
                    ⚠ {productError}
                  </div>
                )}
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={savingProduct || uploadingImage}
                >
                  {savingProduct
                    ? "Adding Product..."
                    : "Add Product"}
                </button>
              </form>
            )}
            {!showProductForm && productError && (
              <div className="form-error">
                {productError}
              </div>
            )}
            {loadingProducts ? (
              <div className="no-data">
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div className="empty-products">
                <div>📦</div>
                <h3>No Products Yet</h3>
                <p>No products available in C-Mart.</p>
              </div>
            ) : (
              <div className="product-grid">
                {products.map((product) => (
                  <div
                    className="product-card"
                    key={product._id}
                  >
                    <div className="product-image">
                      {getImageUrl(
                        product.images?.[0] ||
                        product.image ||
                        product.imageUrl
                      ) ? (
                        <img
                          src={getImageUrl(
                            product.images?.[0] ||
                            product.image ||
                            product.imageUrl
                          )}
                          alt={product.name}
                        />
                      ) : (
                        <span>📦</span>
                      )}
                    </div>
                    <div className="product-info">
                      <span className="product-category">
                        {product.category}
                      </span>
                      <h3>{product.name}</h3>
                      <p>
                        {product.description ||
                          "No description available."}
                      </p>
                      <div className="product-bottom">
                        <strong>
                          ₹
                          {Number(
                            product.price || 0
                          ).toLocaleString("en-IN")}
                        </strong>
                        <span>
                          Stock: {product.stock ?? 0}
                        </span>
                      </div>
                      <button
                        className="delete-btn product-delete"
                        onClick={() =>
                          deleteProduct(product._id)
                        }
                      >
                        Delete Product
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
{/* ================= REPORTS ================= */}
{activeMenu === "Reports" && (
  <section className="management-panel">
    <div className="panel-header">
      <div>
        <h2>Reports Management</h2>
        <p>
          Review user reports and take appropriate action.
        </p>
      </div>
      <div className="panel-actions">
        <span className="record-count">
          {reports.length} Reports
        </span>
        <button
          type="button"
          className="primary-btn"
          onClick={fetchReports}
          disabled={loadingReports}
        >
          {loadingReports ? "Refreshing..." : "Refresh"}
        </button>
      </div>
    </div>
    {reportError && (
      <div className="form-error">
        {reportError}
      </div>
    )}
    {loadingReports ? (
      <div className="no-data">
        Loading reports...
      </div>
    ) : reports.length === 0 ? (
      <div className="no-data">
        No reports found.
      </div>
    ) : (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Reporter</th>
              <th>Email</th>
              <th>Reason</th>
              <th>Description</th>
              <th>Reported User</th>
              <th>Product</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report._id}>
                <td>
                  {report.reporterName || "Unknown"}
                </td>
                <td>
                  {report.reporterEmail || "N/A"}
                </td>
                <td>
                  {report.reason || "N/A"}
                </td>
                <td>
                  {report.description || "N/A"}
                </td>
                <td>
                  {report.reportedUser || "N/A"}
                </td>
                <td>
                  {report.reportedProduct || "N/A"}
                </td>
                <td>
                  {report.createdAt
                    ? new Date(
                        report.createdAt
                      ).toLocaleDateString()
                    : "N/A"}
                </td>
                <td>
                  <select
                    className="status-select"
                    value={report.status || "Pending"}
                    onChange={(event) =>
                      updateReportStatus(
                        report._id,
                        event.target.value
                      )
                    }
                  >
                    <option value="Pending">
                      Pending
                    </option>
                    <option value="In Progress">
                      In Progress
                    </option>
                    <option value="Reviewed">
                      Reviewed
                    </option>
                    <option value="Resolved">
                      Resolved
                    </option>
                    <option value="Rejected">
                      Rejected
                    </option>
                  </select>
                </td>
                <td>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() =>
                      deleteReport(report._id)
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
)}
        {/* ================= COMPLAINTS ================= */}
        {activeMenu === "Complaints" && (
          <section className="management-panel">
            <div className="panel-header">
              <div>
                <h2>Complaints Management</h2>
                <p>
                  Review and resolve student complaints.
                </p>
              </div>
              <div className="panel-actions">
                <span className="record-count">
                  {complaints.length} Complaints
                </span>
                <button
                  className="primary-btn"
                  onClick={fetchComplaints}
                  disabled={loadingComplaints}
                >
                  Refresh
                </button>
              </div>
            </div>
            {complaintError && (
              <div className="form-error">
                {complaintError}
              </div>
            )}
            {loadingComplaints ? (
              <div className="no-data">
                Loading complaints...
              </div>
            ) : complaints.length === 0 ? (
              <div className="no-data">
                No complaints found.
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Subject</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((complaint) => (
                      <tr key={complaint._id}>
                        <td>
                          {complaint.userName ||
                            complaint.fullName ||
                            "Unknown"}
                        </td>
                        <td>
                          {complaint.userEmail ||
                            complaint.email ||
                            "N/A"}
                        </td>
                        <td>
                          {complaint.subject || "N/A"}
                        </td>
                        <td>
                          {complaint.description || "N/A"}
                        </td>
                        <td>
                          <select
                            className="status-select"
                            value={
                              complaint.status || "Pending"
                            }
                            onChange={(event) =>
                              updateComplaintStatus(
                                complaint._id,
                                event.target.value
                              )
                            }
                          >
                            <option value="Pending">
                              Pending
                            </option>
                            <option value="In Progress">
                              In Progress
                            </option>
                            <option value="Resolved">
                              Resolved
                            </option>
                          </select>
                        </td>
                        <td>
                          <button
                            className="delete-btn"
                            onClick={() =>
                              deleteComplaint(complaint._id)
                            }
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
      {/* ================= VIEW USER MODAL ================= */}
      {selectedUser && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-modal"
              onClick={() => setSelectedUser(null)}
            >
              ×
            </button>
            <div className="user-avatar">
              {selectedUser.fullName
                ?.charAt(0)
                .toUpperCase() || "U"}
            </div>
            <h2>{selectedUser.fullName}</h2>
            <p>
              <strong>Email:</strong> {selectedUser.email}
            </p>
            <p>
              <strong>College ID:</strong>{" "}
              {selectedUser.collegeId || "189"}
            </p>
            <p>
              <strong>Phone:</strong>{" "}
              {selectedUser.phoneNumber || "N/A"}
            </p>
            <p>
              <strong>Role:</strong> {selectedUser.role}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {selectedUser.status || "Active"}
            </p>
            <button
              className="modal-close-btn"
              onClick={() => setSelectedUser(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* ================= DELETE USER MODAL ================= */}
      {userToDelete && (
        <div
          className="modal-overlay"
          onClick={() => setUserToDelete(null)}
        >
          <div
            className="modal delete-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="warning-icon">⚠</div>
            <h2>Delete User?</h2>
            <p>
              Are you sure you want to delete{" "}
              <strong>{userToDelete.fullName}</strong>?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setUserToDelete(null)}
                disabled={deletingUser}
              >
                Cancel
              </button>
              <button
                className="confirm-delete-btn"
                onClick={deleteUser}
                disabled={deletingUser}
              >
                {deletingUser
                  ? "Deleting..."
                  : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminDashboard;
