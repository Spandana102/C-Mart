
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./Admin.css";

const API_URL = "http://localhost:5000";

const MENU_ITEMS = [
  { name: "Dashboard", icon: "🏠" },
  { name: "Users", icon: "👥" },
  { name: "Products", icon: "📦" },
  { name: "Reports", icon: "🚩" },
  { name: "Complaints", icon: "📋" },
];

const EMPTY_USER = {
  fullName: "",
  email: "",
  phoneNumber: "",
  password: "",
};

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

const getError = (error, fallback) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

const normalizeList = (data, key) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const isUserBlocked = (user) =>
  user?.isBlocked === true ||
  String(user?.status || "").toLowerCase() === "blocked";

const getImageUrl = (image) => {
  if (!image) return "";

  if (Array.isArray(image)) {
    return image.map(getImageUrl).find(Boolean) || "";
  }

  if (typeof image === "object") {
    return getImageUrl(
      image.secure_url ||
      image.url ||
      image.imageUrl ||
      image.path ||
      ""
    );
  }

  if (typeof image !== "string") return "";

  const value = image.trim().replace(/\\/g, "/");

  if (!value) return "";

  if (
    /^https?:\/\//i.test(value) ||
    value.startsWith("data:image/")
  ) {
    return value;
  }

  return `${API_URL}/${value.replace(/^\/+/, "")}`;
};

function AdminDashboard() {
  const navigate = useNavigate();

  // ==========================================
  // STATES
  // ==========================================

  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [adminName, setAdminName] = useState("Admin");

  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [reports, setReports] = useState([]);
  const [complaints, setComplaints] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  const [search, setSearch] = useState("");
  const [userError, setUserError] = useState("");
  const [pageError, setPageError] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_USER);
  const [addingUser, setAddingUser] = useState(false);

  const [deletingProductId, setDeletingProductId] = useState(null);

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    let storedUser = null;

    try {
      storedUser = JSON.parse(
        localStorage.getItem("user") || "null"
      );
    } catch {
      storedUser = null;
    }

    if (storedUser?.fullName) {
      setAdminName(storedUser.fullName);
    }

    setCheckingAccess(false);
  }, [navigate]);

  // ==========================================
  // FETCH DASHBOARD STATS
  // ==========================================

  const fetchDashboardStats = async () => {
    try {
      const response = await API.get(
        "/admin/dashboard",
        getAuthConfig()
      );

      const data = response.data;

      setStats(data?.stats || data?.data || data || {});
    } catch (error) {
      console.error("Dashboard stats error:", error);
      setPageError(
        getError(error, "Unable to load dashboard statistics.")
      );
    }
  };

  // ==========================================
  // FETCH USERS
  // ==========================================

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setUserError("");

      const response = await API.get(
        "/admin/users",
        getAuthConfig()
      );

      setUsers(normalizeList(response.data, "users"));
    } catch (error) {
      console.error("Fetch users error:", error);
      setUserError(
        getError(error, "Unable to fetch users.")
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  // ==========================================
  // FETCH PRODUCTS
  // ==========================================

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);

      const response = await API.get(
        "/admin/products",
        getAuthConfig()
      );

      setProducts(normalizeList(response.data, "products"));
    } catch (error) {
      console.error("Fetch products error:", error);
      setPageError(
        getError(error, "Unable to fetch products.")
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  // ==========================================
  // FETCH REPORTS
  // ==========================================

  const fetchReports = async () => {
    try {
      setLoadingReports(true);

      const response = await API.get(
        "/reports",
        getAuthConfig()
      );

      setReports(normalizeList(response.data, "reports"));
    } catch (error) {
      console.error("Fetch reports error:", error);
      setPageError(
        getError(error, "Unable to fetch reports.")
      );
    } finally {
      setLoadingReports(false);
    }
  };

  // ==========================================
  // FETCH COMPLAINTS
  // ==========================================

  const fetchComplaints = async () => {
    try {
      setLoadingComplaints(true);

      const response = await API.get(
        "/complaints",
        getAuthConfig()
      );

      setComplaints(
        normalizeList(response.data, "complaints")
      );
    } catch (error) {
      console.error("Fetch complaints error:", error);
      setPageError(
        getError(error, "Unable to fetch complaints.")
      );
    } finally {
      setLoadingComplaints(false);
    }
  };

  // ==========================================
  // INITIAL DATA
  // ==========================================

  useEffect(() => {
    if (checkingAccess) return;

    fetchDashboardStats();
    fetchUsers();
    fetchProducts();
    fetchReports();
    fetchComplaints();
  }, [checkingAccess]);

  // ==========================================
  // SEARCH USERS
  // ==========================================

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return users;

    return users.filter((user) =>
      [
        user.fullName,
        user.email,
        user.phoneNumber,
        user.collegeId,
        user.role,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(keyword)
        )
    );
  }, [users, search]);

  // ==========================================
  // BLOCK / UNBLOCK USER
  // ==========================================

  const toggleUserStatus = async (user) => {
    if (!user?._id || updatingUserId) return;

    if (String(user.role).toLowerCase() === "admin") {
      alert("Admin accounts cannot be blocked.");
      return;
    }

    const currentlyBlocked = isUserBlocked(user);
    const newBlockedStatus = !currentlyBlocked;
    const action = newBlockedStatus ? "block" : "unblock";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${
        user.fullName || "this user"
      }?`
    );

    if (!confirmed) return;

    try {
      setUpdatingUserId(user._id);
      setUserError("");

      const response = await API.put(
        `/admin/users/${user._id}/status`,
        { isBlocked: newBlockedStatus },
        getAuthConfig()
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data.message || "Status update failed."
        );
      }

      setUsers((previous) =>
        previous.map((item) =>
          item._id === user._id
            ? {
                ...item,
                ...response.data?.user,
                isBlocked: newBlockedStatus,
                status: newBlockedStatus
                  ? "Blocked"
                  : "Active",
              }
            : item
        )
      );

      setSelectedUser(null);

      await Promise.all([
        fetchUsers(),
        fetchDashboardStats(),
      ]);

      alert(
        newBlockedStatus
          ? "User blocked successfully!"
          : "User unblocked successfully!"
      );
    } catch (error) {
      console.error("Update user status error:", error);

      const message = getError(
        error,
        "Failed to update user status."
      );

      setUserError(message);
      alert(message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ==========================================
  // DELETE USER
  // ==========================================

  const deleteUser = async () => {
    if (!userToDelete?._id || deletingUser) return;

    if (userToDelete.role === "admin") {
      alert("Admin accounts cannot be deleted.");
      return;
    }

    try {
      setDeletingUser(true);
      setUserError("");

      const response = await API.delete(
        `/admin/users/${userToDelete._id}`,
        getAuthConfig()
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data.message || "Delete failed."
        );
      }

      setUsers((previous) =>
        previous.filter(
          (user) => user._id !== userToDelete._id
        )
      );

      setUserToDelete(null);
      setSelectedUser(null);

      await Promise.all([
        fetchUsers(),
        fetchDashboardStats(),
      ]);

      alert("User deleted successfully!");
    } catch (error) {
      console.error("Delete user error:", error);

      const message = getError(
        error,
        "Failed to delete user."
      );

      setUserError(message);
      alert(message);
    } finally {
      setDeletingUser(false);
    }
  };

  // ==========================================
  // ADD USER
  // ==========================================

  const addUser = async (event) => {
    event.preventDefault();

    if (addingUser) return;

    try {
      setAddingUser(true);
      setUserError("");

      const response = await API.post(
        "/admin/users",
        {
          fullName: newUser.fullName.trim(),
          email: newUser.email.trim(),
          phoneNumber: newUser.phoneNumber.trim(),
          password: newUser.password,
          role: "user",
        },
        getAuthConfig()
      );

      if (response.data?.success === false) {
        throw new Error(response.data.message);
      }

      setNewUser(EMPTY_USER);
      setShowAddUserForm(false);

      await Promise.all([
        fetchUsers(),
        fetchDashboardStats(),
      ]);

      alert("User added successfully!");
    } catch (error) {
      console.error("Add user error:", error);

      const message = getError(
        error,
        "Failed to add user."
      );

      setUserError(message);
      alert(message);
    } finally {
      setAddingUser(false);
    }
  };

  // ==========================================
  // DELETE PRODUCT
  // ==========================================

  const deleteProduct = async (product) => {
    if (!product?._id || deletingProductId) return;

    const confirmed = window.confirm(
      `Delete "${product.name}" permanently?`
    );

    if (!confirmed) return;

    try {
      setDeletingProductId(product._id);

      const response = await API.delete(
        `/admin/products/${product._id}`,
        getAuthConfig()
      );

      if (response.data?.success === false) {
        throw new Error(response.data.message);
      }

      await Promise.all([
        fetchProducts(),
        fetchDashboardStats(),
      ]);

      alert("Product deleted successfully!");
    } catch (error) {
      alert(getError(error, "Failed to delete product."));
    } finally {
      setDeletingProductId(null);
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  // ==========================================
  // STATISTICS
  // ==========================================

  const totalUsers = stats.totalUsers ?? users.length;

  const blockedUsers =
    stats.blockedUsers ??
    users.filter(isUserBlocked).length;

  const activeUsers =
    stats.activeUsers ??
    users.filter((user) => !isUserBlocked(user)).length;

  const totalProducts =
    stats.totalProducts ??
    stats.products ??
    products.length;

  const totalReports =
    stats.totalReports ??
    stats.reports ??
    reports.length;

  const totalComplaints =
    stats.totalComplaints ??
    stats.complaints ??
    complaints.length;

  // ==========================================
  // LOADING
  // ==========================================

  if (checkingAccess) {
    return (
      <div className="admin-dashboard">
        <main className="admin-main">
          <h2>Loading Admin Dashboard...</h2>
        </main>
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="admin-dashboard">
      {/* SIDEBAR */}

      <aside className="admin-sidebar">
        <div>
          <div className="admin-brand">
            <div className="brand-icon">C</div>

            <div>
              <h2>C-MART</h2>
              <span>Admin Panel</span>
            </div>
          </div>

          <p className="sidebar-section-title">
            MAIN MENU
          </p>

          <nav className="admin-nav">
            {MENU_ITEMS.map((menu) => (
              <button
                key={menu.name}
                type="button"
                className={
                  activeMenu === menu.name ? "active" : ""
                }
                onClick={() => {
                  setActiveMenu(menu.name);
                  setSearch("");
                  setPageError("");
                }}
              >
                <span>{menu.icon}</span>
                {menu.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="admin-sidebar-profile">
            <div className="sidebar-avatar">
              {adminName.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{adminName}</strong>
              <span>Administrator</span>
            </div>
          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <div className="breadcrumb">
              C-Mart / Admin / {activeMenu}
            </div>

            <h1>
              {activeMenu === "Dashboard"
                ? "Admin Dashboard"
                : `Manage ${activeMenu}`}
            </h1>

            <p>
              Manage your C-Mart campus marketplace.
            </p>
          </div>

          <div className="admin-user">
            <div className="admin-avatar">
              {adminName.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{adminName}</strong>
              <span>Admin</span>
            </div>
          </div>
        </header>

        {/* DASHBOARD */}

        {activeMenu === "Dashboard" && (
          <>
            <section className="welcome-banner">
              <div>
                <span className="welcome-label">
                  C-MART ADMINISTRATION
                </span>

                <h2>Welcome back, {adminName}!</h2>

                <p>
                  Monitor users, products, reports and
                  complaints from one dashboard.
                </p>
              </div>

              <div className="welcome-icon">📊</div>
            </section>

            <section className="stats-grid">
              {[
                {
                  title: "Total Users",
                  value: totalUsers,
                  icon: "👥",
                  menu: "Users",
                },
                {
                  title: "Total Products",
                  value: totalProducts,
                  icon: "📦",
                  menu: "Products",
                },
                {
                  title: "Reports",
                  value: totalReports,
                  icon: "🚩",
                  menu: "Reports",
                },
                {
                  title: "Complaints",
                  value: totalComplaints,
                  icon: "📋",
                  menu: "Complaints",
                },
              ].map((item) => (
                <button
                  key={item.title}
                  type="button"
                  className="stat-card"
                  onClick={() => setActiveMenu(item.menu)}
                >
                  <div className="stat-top">
                    <div className="stat-icon">
                      {item.icon}
                    </div>

                    <span className="stat-link">
                      View
                    </span>
                  </div>

                  <span className="stat-title">
                    {item.title}
                  </span>

                  <strong>{item.value}</strong>

                  <small>View and manage</small>
                </button>
              ))}
            </section>

            <section className="dashboard-grid">
              <div className="dashboard-panel">
                <div className="panel-header">
                  <div>
                    <h2>Quick Actions</h2>
                    <p>
                      Access important management sections.
                    </p>
                  </div>
                </div>

                <div className="quick-action-grid">
                  {MENU_ITEMS.filter(
                    (item) => item.name !== "Dashboard"
                  ).map((item) => (
                    <button
                      type="button"
                      key={item.name}
                      onClick={() =>
                        setActiveMenu(item.name)
                      }
                    >
                      <span>{item.icon}</span>

                      <div>
                        <strong>
                          Manage {item.name}
                        </strong>
                        <small>
                          Open {item.name.toLowerCase()}
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
                    <p>Account status summary</p>
                  </div>
                </div>

                <div className="user-overview">
                  <div className="overview-item">
                    <span className="overview-icon">
                      👥
                    </span>
                    <div>
                      <small>Total Users</small>
                      <strong>{totalUsers}</strong>
                    </div>
                  </div>

                  <div className="overview-item">
                    <span className="overview-icon">
                      ✅
                    </span>
                    <div>
                      <small>Active Users</small>
                      <strong>{activeUsers}</strong>
                    </div>
                  </div>

                  <div className="overview-item">
                    <span className="overview-icon">
                      🚫
                    </span>
                    <div>
                      <small>Blocked Users</small>
                      <strong>{blockedUsers}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {pageError && (
              <p className="form-error">{pageError}</p>
            )}
          </>
        )}

        {/* MANAGE USERS */}

        {activeMenu === "Users" && (
          <section className="management-panel">
            <div className="panel-header">
              <div>
                <h2>Manage Users</h2>
                <p>
                  View, add, block, unblock and delete users.
                </p>
              </div>

              <div className="panel-actions">
                <span className="record-count">
                  {users.length} Users
                </span>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() =>
                    setShowAddUserForm((value) => !value)
                  }
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
                  <p>Create a new student account.</p>
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
                      name: "phoneNumber",
                      label: "Phone Number",
                      type: "tel",
                    },
                    {
                      name: "password",
                      label: "Password",
                      type: "password",
                    },
                  ].map((field) => (
                    <div
                      className="form-group"
                      key={field.name}
                    >
                      <label>{field.label}</label>

                      <input
                        type={field.type}
                        value={newUser[field.name]}
                        onChange={(event) =>
                          setNewUser((previous) => ({
                            ...previous,
                            [field.name]:
                              event.target.value,
                          }))
                        }
                        required
                        minLength={
                          field.name === "password"
                            ? 8
                            : undefined
                        }
                        maxLength={
                          field.name === "phoneNumber"
                            ? 10
                            : undefined
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() =>
                      setShowAddUserForm(false)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={addingUser}
                  >
                    {addingUser
                      ? "Adding..."
                      : "Add User"}
                  </button>
                </div>
              </form>
            )}

            <div className="search-box">
              <span>🔍</span>

              <input
                type="search"
                placeholder="Search by name, email, phone or college ID..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            {userError && (
              <p className="form-error">{userError}</p>
            )}

            {loadingUsers ? (
              <p className="no-data">
                Loading users...
              </p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>College ID</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map((user) => {
                      const blocked =
                        isUserBlocked(user);

                      return (
                        <tr key={user._id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar">
                                {(user.fullName || "U")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>
                                  {user.fullName ||
                                    "Unknown User"}
                                </strong>

                                <span>
                                  {user.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            {user.collegeId || "189"}
                          </td>

                          <td>
                            {user.phoneNumber || "N/A"}
                          </td>

                          <td>
                            <span className="role-badge">
                              {user.role || "user"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`status ${
                                blocked
                                  ? "blocked-status"
                                  : "active-status"
                              }`}
                            >
                              {blocked
                                ? "Blocked"
                                : "Active"}
                            </span>
                          </td>

                          <td>
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="view-btn"
                                onClick={() =>
                                  setSelectedUser(user)
                                }
                              >
                                View
                              </button>

                              <button
                                type="button"
                                className="block-btn"
                                disabled={
                                  user.role === "admin" ||
                                  updatingUserId !== null
                                }
                                onClick={() =>
                                  toggleUserStatus(user)
                                }
                              >
                                {updatingUserId === user._id
                                  ? "Updating..."
                                  : blocked
                                  ? "Unblock"
                                  : "Block"}
                              </button>

                              <button
                                type="button"
                                className="delete-btn"
                                disabled={
                                  user.role === "admin" ||
                                  deletingUser
                                }
                                onClick={() =>
                                  setUserToDelete(user)
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredUsers.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="no-data"
                        >
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* MANAGE PRODUCTS */}

        {activeMenu === "Products" && (
          <section className="management-panel">
            <div className="panel-header">
              <div>
                <h2>Manage Products</h2>
                <p>
                  View and remove marketplace products.
                </p>
              </div>

              <span className="record-count">
                {products.length} Products
              </span>
            </div>

            {loadingProducts ? (
              <p className="no-data">
                Loading products...
              </p>
            ) : products.length === 0 ? (
              <p className="no-data">
                No products found.
              </p>
            ) : (
              <div className="product-grid">
                {products.map((product) => (
                  <div
                    className="product-card"
                    key={product._id}
                  >
                    <div className="product-image">
                      {getImageUrl(product.images) ? (
                        <img
                          src={getImageUrl(
                            product.images
                          )}
                          alt={product.name}
                        />
                      ) : (
                        <span>📦</span>
                      )}
                    </div>

                    <div className="product-info">
                      <span className="product-category">
                        {product.category ||
                          "General"}
                      </span>

                      <h3>{product.name}</h3>

                      <p>
                        {product.description ||
                          "No description available."}
                      </p>

                      <div className="product-bottom">
                        <strong>
                          ₹{product.price ?? 0}
                        </strong>

                        <span>
                          Stock: {product.stock ?? 1}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="delete-btn product-delete"
                        disabled={
                          deletingProductId ===
                          product._id
                        }
                        onClick={() =>
                          deleteProduct(product)
                        }
                      >
                        {deletingProductId === product._id
                          ? "Deleting..."
                          : "Delete Product"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* REPORTS */}

        {activeMenu === "Reports" && (
          <section className="management-panel">
            <div className="panel-header">
              <div>
                <h2>Reports</h2>
                <p>
                  Review reports submitted by users.
                </p>
              </div>

              <span className="record-count">
                {reports.length} Reports
              </span>
            </div>

            {loadingReports ? (
              <p className="no-data">
                Loading reports...
              </p>
            ) : reports.length === 0 ? (
              <p className="no-data">
                No reports found.
              </p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Report</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {reports.map((report) => (
                      <tr key={report._id}>
                        <td>
                          {report.title ||
                            report.reportType ||
                            report.type ||
                            "User Report"}
                        </td>

                        <td>
                          {report.reason ||
                            report.description ||
                            "N/A"}
                        </td>

                        <td>
                          <span className="role-badge">
                            {report.status ||
                              "Pending"}
                          </span>
                        </td>

                        <td>
                          {report.createdAt
                            ? new Date(
                                report.createdAt
                              ).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* COMPLAINTS */}

        {activeMenu === "Complaints" && (
          <section className="management-panel">
            <div className="panel-header">
              <div>
                <h2>Complaints</h2>
                <p>
                  Review complaints from C-Mart users.
                </p>
              </div>

              <span className="record-count">
                {complaints.length} Complaints
              </span>
            </div>

            {loadingComplaints ? (
              <p className="no-data">
                Loading complaints...
              </p>
            ) : complaints.length === 0 ? (
              <p className="no-data">
                No complaints found.
              </p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Complaint</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {complaints.map((complaint) => (
                      <tr key={complaint._id}>
                        <td>
                          {complaint.title ||
                            complaint.subject ||
                            "Complaint"}
                        </td>

                        <td>
                          {complaint.description ||
                            complaint.message ||
                            "N/A"}
                        </td>

                        <td>
                          <span className="role-badge">
                            {complaint.status ||
                              "Pending"}
                          </span>
                        </td>

                        <td>
                          {complaint.createdAt
                            ? new Date(
                                complaint.createdAt
                              ).toLocaleDateString()
                            : "N/A"}
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

      {/* USER DETAILS MODAL */}

      {selectedUser && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h2>User Details</h2>

            <p>
              <strong>Name:</strong>{" "}
              {selectedUser.fullName}
            </p>

            <p>
              <strong>Email:</strong>{" "}
              {selectedUser.email}
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
              <strong>Role:</strong>{" "}
              {selectedUser.role}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {isUserBlocked(selectedUser)
                ? "Blocked"
                : "Active"}
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() =>
                  setSelectedUser(null)
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}

      {userToDelete && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!deletingUser) {
              setUserToDelete(null);
            }
          }}
        >
          <div
            className="modal confirm-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h2>Delete User?</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>
                {userToDelete.fullName}
              </strong>
              ?
            </p>

            <p>
              This action cannot be undone.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                disabled={deletingUser}
                onClick={() =>
                  setUserToDelete(null)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-btn"
                disabled={deletingUser}
                onClick={deleteUser}
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
