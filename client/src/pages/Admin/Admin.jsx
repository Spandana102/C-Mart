import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./Admin.css";

function AdminDashboard() {
  const navigate = useNavigate();

  // =========================================================
  // STATES
  // =========================================================

  const [activeMenu, setActiveMenu] = useState("Dashboard");

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const [userError, setUserError] = useState("");
  const [dashboardError, setDashboardError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    products: 0,
    reports: 0,
    complaints: 0,
  });

  // =========================================================
  // AUTH HEADER
  // =========================================================

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // =========================================================
  // FETCH DASHBOARD STATISTICS
  // =========================================================

  const fetchDashboardStats = async () => {
    try {
      setLoadingDashboard(true);
      setDashboardError("");

      const response = await API.get(
        "/admin/dashboard",
        getAuthConfig()
      );

      if (response.data.success) {
        setDashboardStats((current) => ({
          ...current,
          totalUsers: response.data.stats?.totalUsers ?? 0,
          activeUsers: response.data.stats?.activeUsers ?? 0,
          blockedUsers: response.data.stats?.blockedUsers ?? 0,
        }));
      }
    } catch (error) {
      console.error("Dashboard Stats Error:", error);

      setDashboardError(
        error.response?.data?.message ||
          "Failed to load dashboard statistics."
      );
    } finally {
      setLoadingDashboard(false);
    }
  };

  // =========================================================
  // FETCH USERS
  // =========================================================

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setUserError("");

      const response = await API.get(
        "/admin/users",
        getAuthConfig()
      );

      if (response.data.success) {
        // Existing users in MongoDB may not have status.
        // Treat missing status as Active.
        const normalizedUsers = (response.data.users || []).map(
          (user) => ({
            ...user,
            status: user.status || "Active",
          })
        );

        setUsers(normalizedUsers);

        // Calculate from actual users as a fallback.
        // This also handles old MongoDB users created before
        // the status field was added.
        const totalUsers = normalizedUsers.length;

        const activeUsers = normalizedUsers.filter(
          (user) => user.status === "Active"
        ).length;

        const blockedUsers = normalizedUsers.filter(
          (user) => user.status === "Blocked"
        ).length;

        setDashboardStats((current) => ({
          ...current,
          totalUsers,
          activeUsers,
          blockedUsers,
        }));
      }
    } catch (error) {
      console.error("Fetch Users Error:", error);

      setUserError(
        error.response?.data?.message ||
          "Failed to load users."
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  // =========================================================
  // LOAD DATA WHEN ADMIN PANEL OPENS
  // =========================================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    fetchUsers();
    fetchDashboardStats();
  }, []);

  // =========================================================
  // SEARCH USERS
  // =========================================================

  const filteredUsers = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) {
      return users;
    }

    return users.filter((user) =>
      `${user.fullName || ""} ${
        user.email || ""
      } ${user.collegeId || ""}`
        .toLowerCase()
        .includes(searchText)
    );
  }, [users, search]);

  // =========================================================
  // BLOCK / UNBLOCK USER
  // =========================================================

  const toggleUserStatus = async (user) => {
    try {
      const response = await API.put(
        `/admin/users/${user._id}/status`,
        {},
        getAuthConfig()
      );

      if (response.data.success) {
        await fetchUsers();
        await fetchDashboardStats();

        if (selectedUser?._id === user._id) {
          setSelectedUser(null);
        }
      }
    } catch (error) {
      console.error(
        "Update User Status Error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to update user status."
      );
    }
  };

  // =========================================================
  // OPEN DELETE MODAL
  // =========================================================

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // =========================================================
  // DELETE USER
  // =========================================================

  const deleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await API.delete(
        `/admin/users/${userToDelete._id}`,
        getAuthConfig()
      );

      if (response.data.success) {
        setShowDeleteModal(false);
        setUserToDelete(null);
        setSelectedUser(null);

        await fetchUsers();
        await fetchDashboardStats();
      }
    } catch (error) {
      console.error(
        "Delete User Error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to delete user."
      );
    }
  };

  // =========================================================
  // MENU
  // =========================================================

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
    setSearch("");
    setSelectedUser(null);
    setUserError("");
    setDashboardError("");

    // Refresh actual data whenever Dashboard / Users is opened.
    if (menu === "Dashboard") {
      fetchDashboardStats();
      fetchUsers();
    }

    if (menu === "Users") {
      fetchUsers();
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (confirmLogout) {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="admin-dashboard">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside className="admin-sidebar">

        <div>

          {/* BRAND */}

          <div className="admin-brand">

            <div className="brand-icon">
              C
            </div>

            <div>
              <h2>C-Mart</h2>
              <span>Admin Panel</span>
            </div>

          </div>


          {/* NAVIGATION */}

          <nav className="admin-nav">

            <button
              className={
                activeMenu === "Dashboard"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleMenuClick("Dashboard")
              }
            >
              <span>📊</span>
              Dashboard
            </button>


            <button
              className={
                activeMenu === "Users"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleMenuClick("Users")
              }
            >
              <span>👥</span>
              Users
            </button>


            <button
              className={
                activeMenu === "Products"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleMenuClick("Products")
              }
            >
              <span>📦</span>
              Products
            </button>


            <button
              className={
                activeMenu === "Reports"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleMenuClick("Reports")
              }
            >
              <span>🚩</span>
              Reports
            </button>


            <button
              className={
                activeMenu === "Complaints"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleMenuClick("Complaints")
              }
            >
              <span>⚠️</span>
              Complaints
            </button>

          </nav>

        </div>


        {/* LOGOUT */}

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          <span>↪</span>
          Logout
        </button>

      </aside>


      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="admin-main">

        {/* HEADER */}

        <header className="admin-header">

          <div>

            <h1>
              {activeMenu === "Dashboard"
                ? "Admin Dashboard"
                : `Manage ${activeMenu}`}
            </h1>

            <p>
              {activeMenu === "Dashboard"
                ? "Monitor and manage your C-Mart marketplace."
                : `Manage ${activeMenu.toLowerCase()} from here.`}
            </p>

          </div>


          {/* ADMIN PROFILE */}

          <div className="admin-user">

            <div className="admin-avatar">
              A
            </div>

            <div>
              <strong>Administrator</strong>
              <span>Admin</span>
            </div>

          </div>

        </header>


        {/* =====================================================
            DASHBOARD
        ====================================================== */}

        {activeMenu === "Dashboard" && (

          <>

            {/* STAT CARDS */}

            <section className="stats-grid">

              {/* TOTAL USERS */}

              <button
                className="stat-card"
                onClick={() =>
                  handleMenuClick("Users")
                }
              >

                <div className="stat-icon">
                  👥
                </div>

                <div>

                  <span>Total Users</span>

                  <strong>
                    {loadingDashboard
                      ? "..."
                      : dashboardStats.totalUsers}
                  </strong>

                  <small>
                    {dashboardStats.activeUsers} active users
                  </small>

                </div>

              </button>


              {/* PRODUCTS */}

              <button
                className="stat-card"
                onClick={() =>
                  handleMenuClick("Products")
                }
              >

                <div className="stat-icon">
                  📦
                </div>

                <div>

                  <span>Total Products</span>

                  <strong>
                    {dashboardStats.products}
                  </strong>

                  <small>
                    Product management
                  </small>

                </div>

              </button>


              {/* REPORTS */}

              <button
                className="stat-card"
                onClick={() =>
                  handleMenuClick("Reports")
                }
              >

                <div className="stat-icon">
                  🚩
                </div>

                <div>

                  <span>Reports</span>

                  <strong>
                    {dashboardStats.reports}
                  </strong>

                  <small>
                    Review reports
                  </small>

                </div>

              </button>


              {/* COMPLAINTS */}

              <button
                className="stat-card"
                onClick={() =>
                  handleMenuClick("Complaints")
                }
              >

                <div className="stat-icon">
                  ⚠️
                </div>

                <div>

                  <span>Complaints</span>

                  <strong>
                    {dashboardStats.complaints}
                  </strong>

                  <small>
                    Review complaints
                  </small>

                </div>

              </button>

            </section>


            {/* DASHBOARD ERROR */}

            {dashboardError && (
              <div className="no-data">
                {dashboardError}
              </div>
            )}


            {/* QUICK ACTIONS */}

            <section className="dashboard-panel">

              <div className="panel-header">

                <div>

                  <h2>
                    Quick Actions
                  </h2>

                  <p>
                    Frequently used admin actions
                  </p>

                </div>

              </div>


              <div className="quick-actions">

                <button
                  onClick={() =>
                    handleMenuClick("Users")
                  }
                >
                  👥 Manage Users
                </button>


                <button
                  onClick={() =>
                    handleMenuClick("Products")
                  }
                >
                  📦 Manage Products
                </button>


                <button
                  onClick={() =>
                    handleMenuClick("Reports")
                  }
                >
                  🚩 Review Reports
                </button>


                <button
                  onClick={() =>
                    handleMenuClick("Complaints")
                  }
                >
                  ⚠️ View Complaints
                </button>

              </div>

            </section>


            {/* USER OVERVIEW */}

            <section className="dashboard-panel">

              <div className="panel-header">

                <div>

                  <h2>
                    User Overview
                  </h2>

                  <p>
                    Current user account status
                  </p>

                </div>

              </div>


              <div className="quick-actions">

                <button
                  onClick={() =>
                    handleMenuClick("Users")
                  }
                >
                  👥 Total Users
                  <br />
                  <strong>
                    {dashboardStats.totalUsers}
                  </strong>
                </button>


                <button
                  onClick={() =>
                    handleMenuClick("Users")
                  }
                >
                  🟢 Active Users
                  <br />
                  <strong>
                    {dashboardStats.activeUsers}
                  </strong>
                </button>


                <button
                  onClick={() =>
                    handleMenuClick("Users")
                  }
                >
                  🔴 Blocked Users
                  <br />
                  <strong>
                    {dashboardStats.blockedUsers}
                  </strong>
                </button>

              </div>

            </section>

          </>
        )}


        {/* =====================================================
            USERS
        ====================================================== */}

        {activeMenu === "Users" && (

          <section className="management-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Manage Users
                </h2>

                <p>
                  View and manage registered C-Mart users.
                </p>

              </div>


              <span className="record-count">
                {filteredUsers.length} Users
              </span>

            </div>


            {/* SEARCH */}

            <div className="search-box">

              <input
                type="text"
                placeholder="Search by name, email or college ID..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>


            {/* LOADING */}

            {loadingUsers && (

              <div className="no-data">

                <strong>
                  Loading users...
                </strong>

                Please wait while user data is loaded.

              </div>

            )}


            {/* ERROR */}

            {userError && !loadingUsers && (

              <div className="no-data">

                <strong>
                  Unable to load users
                </strong>

                {userError}

              </div>

            )}


            {/* USER TABLE */}

            {!loadingUsers &&
              !userError && (

                <div className="table-container">

                  <table>

                    <thead>

                      <tr>

                        <th>
                          User
                        </th>

                        <th>
                          College ID
                        </th>

                        <th>
                          Role
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Actions
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {filteredUsers.map(
                        (user) => (

                          <tr key={user._id}>

                            {/* USER */}

                            <td>

                              <div className="user-cell">

                                <div className="user-avatar">

                                  {user.fullName
                                    ?.charAt(0)
                                    ?.toUpperCase() || "U"}

                                </div>


                                <div>

                                  <strong>
                                    {user.fullName ||
                                      "Unknown User"}
                                  </strong>

                                  <span>
                                    {user.email ||
                                      "No email"}
                                  </span>

                                </div>

                              </div>

                            </td>


                            {/* COLLEGE ID */}

                            <td>
                              {user.collegeId ||
                                "Not available"}
                            </td>


                            {/* ROLE */}

                            <td>

                              <span className="role-badge">

                                {user.role ||
                                  "user"}

                              </span>

                            </td>


                            {/* STATUS */}

                            <td>

                              <span
                                className={
                                  user.status ===
                                  "Blocked"
                                    ? "status blocked-status"
                                    : "status active-status"
                                }
                              >

                                {user.status ||
                                  "Active"}

                              </span>

                            </td>


                            {/* ACTIONS */}

                            <td>

                              <div className="action-buttons">

                                <button
                                  className="view-btn"
                                  onClick={() =>
                                    setSelectedUser(
                                      user
                                    )
                                  }
                                >
                                  View
                                </button>


                                <button
                                  className="block-btn"
                                  onClick={() =>
                                    toggleUserStatus(
                                      user
                                    )
                                  }
                                >

                                  {user.status ===
                                  "Blocked"
                                    ? "Unblock"
                                    : "Block"}

                                </button>


                                <button
                                  className="delete-btn"
                                  onClick={() =>
                                    openDeleteModal(
                                      user
                                    )
                                  }
                                >
                                  Delete
                                </button>

                              </div>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>


                  {/* NO SEARCH RESULT */}

                  {filteredUsers.length ===
                    0 && (

                    <div className="no-data">

                      <strong>
                        No users found
                      </strong>

                      Try searching with another
                      name, email or college ID.

                    </div>

                  )}

                </div>

              )}

          </section>

        )}


        {/* =====================================================
            PRODUCTS
        ====================================================== */}

        {activeMenu === "Products" && (

          <section className="management-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Manage Products
                </h2>

                <p>
                  Product management will be connected
                  to the Product module API.
                </p>

              </div>

            </div>


            <div className="no-data">

              <strong>
                Product Management
              </strong>

              Product API integration will be connected
              after the Product module is ready.

            </div>

          </section>

        )}


        {/* =====================================================
            REPORTS
        ====================================================== */}

        {activeMenu === "Reports" && (

          <section className="management-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Reports
                </h2>

                <p>
                  Review reports submitted in C-Mart.
                </p>

              </div>

            </div>


            <div className="no-data">

              <strong>
                Reports Management
              </strong>

              Reports API integration will be connected
              after the Report module is ready.

            </div>

          </section>

        )}


        {/* =====================================================
            COMPLAINTS
        ====================================================== */}

        {activeMenu === "Complaints" && (

          <section className="management-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Complaints
                </h2>

                <p>
                  Review complaints submitted by users.
                </p>

              </div>

            </div>


            <div className="no-data">

              <strong>
                Complaints Management
              </strong>

              Complaints API integration will be connected
              after the Complaint module is ready.

            </div>

          </section>

        )}

      </main>


      {/* =====================================================
          VIEW USER MODAL
      ====================================================== */}

      {selectedUser && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedUser(null)
          }
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="close-modal"
              onClick={() =>
                setSelectedUser(null)
              }
            >
              ×
            </button>


            <div className="modal-avatar">

              {selectedUser.fullName
                ?.charAt(0)
                ?.toUpperCase() || "U"}

            </div>


            <h2>
              {selectedUser.fullName}
            </h2>


            <p className="modal-email">
              {selectedUser.email}
            </p>


            <div className="user-details">

              <div>

                <label>
                  College ID
                </label>

                <span>
                  {selectedUser.collegeId ||
                    "Not available"}
                </span>

              </div>


              <div>

                <label>
                  Role
                </label>

                <span>
                  {selectedUser.role ||
                    "user"}
                </span>

              </div>


              <div>

                <label>
                  Status
                </label>

                <span>
                  {selectedUser.status ||
                    "Active"}
                </span>

              </div>


              <div>

                <label>
                  Phone
                </label>

                <span>
                  {selectedUser.phoneNumber ||
                    "Not available"}
                </span>

              </div>

            </div>


            <button
              className="modal-close-btn"
              onClick={() =>
                setSelectedUser(null)
              }
            >
              Close
            </button>

          </div>

        </div>

      )}


      {/* =====================================================
          DELETE MODAL
      ====================================================== */}

      {showDeleteModal &&
        userToDelete && (

          <div
            className="modal-overlay"
            onClick={() => {
              setShowDeleteModal(false);
              setUserToDelete(null);
            }}
          >

            <div
              className="modal delete-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="warning-icon">
                ⚠️
              </div>


              <h2>
                Delete User?
              </h2>


              <p>

                Are you sure you want to delete{" "}

                <strong>
                  {userToDelete.fullName}
                </strong>

                ?

                <br />

                This action cannot be undone.

              </p>


              <div className="modal-actions">

                <button
                  className="cancel-btn"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                >
                  Cancel
                </button>


                <button
                  className="confirm-delete-btn"
                  onClick={deleteUser}
                >
                  Delete User
                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  );
}

export default AdminDashboard;