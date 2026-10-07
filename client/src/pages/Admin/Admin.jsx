import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./Admin.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeMenu, setActiveMenu] = useState("Dashboard");

  // =========================
  // USERS
  // =========================

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  // ADD USER
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState("");

  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    password: "",
    collegeId: "",
    phoneNumber: "",
  });

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const [userError, setUserError] = useState("");
  const [dashboardError, setDashboardError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // =========================
  // DASHBOARD STATS
  // =========================

  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    products: 0,
    reports: 0,
    complaints: 0,
  });

  // =========================
  // REPORTS
  // =========================

  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportError, setReportError] = useState("");

  // =========================
  // COMPLAINTS
  // =========================

  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [complaintError, setComplaintError] = useState("");

  // =========================
  // PRODUCTS
  // =========================

  const [products, setProducts] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productError, setProductError] = useState("");

  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    images: [],
    stock: "1",
  });

  // =========================
  // AUTH CONFIG
  // =========================

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // =========================
  // DASHBOARD
  // =========================

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
          products: response.data.stats?.products ?? current.products,
          reports: response.data.stats?.reports ?? current.reports,
          complaints:
            response.data.stats?.complaints ?? current.complaints,
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

  // =========================
  // FETCH USERS
  // =========================

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setUserError("");

      const response = await API.get(
        "/admin/users",
        getAuthConfig()
      );

      if (response.data.success) {
        const normalizedUsers = (response.data.users || []).map(
          (user) => ({
            ...user,
            status: user.status || "Active",
          })
        );

        setUsers(normalizedUsers);

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

  // =========================
  // FETCH REPORTS
  // =========================

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      setReportError("");

      const response = await API.get(
        "/reports",
        getAuthConfig()
      );

      if (response.data.success) {
        const reportList = response.data.reports || [];

        setReports(reportList);

        setDashboardStats((current) => ({
          ...current,
          reports: reportList.length,
        }));
      }
    } catch (error) {
      console.error("Fetch Reports Error:", error);

      setReportError(
        error.response?.data?.message ||
          "Failed to load reports."
      );
    } finally {
      setLoadingReports(false);
    }
  };

  // =========================
  // FETCH COMPLAINTS
  // =========================

  const fetchComplaints = async () => {
    try {
      setLoadingComplaints(true);
      setComplaintError("");

      const response = await API.get(
        "/complaints",
        getAuthConfig()
      );

      if (response.data.success) {
        const complaintList = response.data.complaints || [];

        setComplaints(complaintList);

        setDashboardStats((current) => ({
          ...current,
          complaints: complaintList.length,
        }));
      }
    } catch (error) {
      console.error("Fetch Complaints Error:", error);

      setComplaintError(
        error.response?.data?.message ||
          "Failed to load complaints."
      );
    } finally {
      setLoadingComplaints(false);
    }
  };

  // =========================
  // UPDATE REPORT STATUS
  // =========================

  const updateReportStatus = async (reportId, status) => {
    try {
      const response = await API.put(
        `/reports/${reportId}/status`,
        { status },
        getAuthConfig()
      );

      if (response.data.success) {
        setReports((current) =>
          current.map((report) =>
            report._id === reportId
              ? {
                  ...report,
                  status,
                }
              : report
          )
        );
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to update report status."
      );
    }
  };

  // =========================
  // UPDATE COMPLAINT STATUS
  // =========================

  const updateComplaintStatus = async (
    complaintId,
    status
  ) => {
    try {
      const response = await API.put(
        `/complaints/${complaintId}/status`,
        { status },
        getAuthConfig()
      );

      if (response.data.success) {
        setComplaints((current) =>
          current.map((complaint) =>
            complaint._id === complaintId
              ? {
                  ...complaint,
                  status,
                }
              : complaint
          )
        );
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to update complaint status."
      );
    }
  };

  // =========================
  // DELETE REPORT
  // =========================

  const deleteReport = async (reportId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this report?"
    );

    if (!confirmDelete) return;

    try {
      const response = await API.delete(
        `/reports/${reportId}`,
        getAuthConfig()
      );

      if (response.data.success) {
        setReports((current) =>
          current.filter(
            (report) => report._id !== reportId
          )
        );

        setDashboardStats((current) => ({
          ...current,
          reports: Math.max(
            0,
            current.reports - 1
          ),
        }));
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to delete report."
      );
    }
  };

  // =========================
  // DELETE COMPLAINT
  // =========================

  const deleteComplaint = async (complaintId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this complaint?"
    );

    if (!confirmDelete) return;

    try {
      const response = await API.delete(
        `/complaints/${complaintId}`,
        getAuthConfig()
      );

      if (response.data.success) {
        setComplaints((current) =>
          current.filter(
            (complaint) =>
              complaint._id !== complaintId
          )
        );

        setDashboardStats((current) => ({
          ...current,
          complaints: Math.max(
            0,
            current.complaints - 1
          ),
        }));
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to delete complaint."
      );
    }
  };

  // =========================
  // ADD USER
  // =========================

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;

    setNewUser((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const addUser = async (e) => {
    e.preventDefault();

    if (
      !newUser.fullName.trim() ||
      !newUser.email.trim() ||
      !newUser.password.trim() ||
      !newUser.collegeId.trim() ||
      !newUser.phoneNumber.trim()
    ) {
      setAddUserError("All fields are required.");
      return;
    }

    try {
      setAddingUser(true);
      setAddUserError("");

      const response = await API.post(
        "/admin/users",
        {
          fullName: newUser.fullName.trim(),
          email: newUser.email.trim(),
          password: newUser.password,
          collegeId: newUser.collegeId.trim(),
          phoneNumber: newUser.phoneNumber.trim(),
          role: "user",
        },
        getAuthConfig()
      );

      if (response.data.success) {
        setNewUser({
          fullName: "",
          email: "",
          password: "",
          collegeId: "",
          phoneNumber: "",
        });

        setShowAddUserForm(false);

        await fetchUsers();
        await fetchDashboardStats();

        alert("User added successfully!");
      }
    } catch (error) {
      console.error("Add User Error:", error);

      setAddUserError(
        error.response?.data?.message ||
          "Failed to add user."
      );
    } finally {
      setAddingUser(false);
    }
  };

  // =========================
  // PRODUCTS
  // =========================

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductError("");

      const response = await API.get("/products");

      const productList = response.data || [];

      setProducts(productList);

      setDashboardStats((current) => ({
        ...current,
        products: productList.length,
      }));
    } catch (error) {
      console.error("Fetch Products Error:", error);

      setProductError(
        error.response?.data?.message ||
          "Failed to load products."
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleProductInputChange = (e) => {
    const { name, value } = e.target;

    setProductForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // =========================
  // IMAGE UPLOAD
  // =========================

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProductError(
        "Please select a valid image file."
      );

      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProductError(
        "Image size must be less than 5 MB."
      );

      e.target.value = "";
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
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (
        response.data?.success &&
        response.data?.imageUrl
      ) {
        setProductForm((current) => ({
          ...current,
          images: [response.data.imageUrl],
        }));
      } else {
        setProductError(
          response.data?.message ||
            "Image upload failed."
        );
      }
    } catch (error) {
      console.error(
        "IMAGE UPLOAD ERROR:",
        error
      );

      setProductError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Image upload failed."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  // =========================
  // ADD PRODUCT
  // =========================

  const addProduct = async (e) => {
    e.preventDefault();

    if (
      !productForm.name.trim() ||
      !productForm.price ||
      !productForm.category.trim()
    ) {
      setProductError(
        "Name, price and category are required."
      );
      return;
    }

    if (uploadingImage) {
      setProductError(
        "Please wait until image upload is completed."
      );
      return;
    }

    if (
      !productForm.images ||
      productForm.images.length === 0
    ) {
      setProductError(
        "Please upload a product image."
      );
      return;
    }

    try {
      setLoadingProducts(true);
      setProductError("");

      const productData = {
        name: productForm.name.trim(),
        price: Number(productForm.price),
        category: productForm.category.trim(),
        description:
          productForm.description.trim(),
        images: [...productForm.images],
        stock: Number(productForm.stock || 0),
      };

      const response = await API.post(
        "/products",
        productData
      );

      const newProduct =
        response.data?.product ||
        response.data;

      setProducts((current) => [
        newProduct,
        ...current,
      ]);

      setDashboardStats((current) => ({
        ...current,
        products: current.products + 1,
      }));

      setProductForm({
        name: "",
        price: "",
        category: "",
        description: "",
        images: [],
        stock: "1",
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setShowProductForm(false);
    } catch (error) {
      console.error(
        "Add Product Error:",
        error
      );

      setProductError(
        error.response?.data?.message ||
          "Failed to add product."
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  // =========================
  // DELETE PRODUCT
  // =========================

  const deleteProduct = async (productId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) return;

    try {
      await API.delete(
        `/products/${productId}`
      );

      setProducts((current) =>
        current.filter(
          (product) =>
            product._id !== productId
        )
      );

      setDashboardStats((current) => ({
        ...current,
        products: Math.max(
          0,
          current.products - 1
        ),
      }));
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to delete product."
      );
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    fetchUsers();
    fetchDashboardStats();
    fetchProducts();
    fetchReports();
    fetchComplaints();
  }, []);

  // =========================
  // SEARCH
  // =========================

  const filteredUsers = useMemo(() => {
    const searchText =
      search.toLowerCase().trim();

    if (!searchText) return users;

    return users.filter((user) =>
      `${user.fullName || ""} ${
        user.email || ""
      } ${user.collegeId || ""}`
        .toLowerCase()
        .includes(searchText)
    );
  }, [users, search]);

  // =========================
  // USER STATUS
  // =========================

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

        if (
          selectedUser?._id === user._id
        ) {
          setSelectedUser(null);
        }
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to update user status."
      );
    }
  };

  // =========================
  // DELETE USER
  // =========================

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

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
      alert(
        error.response?.data?.message ||
          "Failed to delete user."
      );
    }
  };

  // =========================
  // MENU
  // =========================

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
    setSearch("");
    setSelectedUser(null);
    setUserError("");
    setDashboardError("");
    setProductError("");
    setReportError("");
    setComplaintError("");

    if (menu === "Dashboard") {
      fetchDashboardStats();
      fetchUsers();
      fetchProducts();
      fetchReports();
      fetchComplaints();
    }

    if (menu === "Users") {
      fetchUsers();
    }

    if (menu === "Products") {
      fetchProducts();
    }

    if (menu === "Reports") {
      fetchReports();
    }

    if (menu === "Complaints") {
      fetchComplaints();
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    const confirmLogout =
      window.confirm(
        "Are you sure you want to logout?"
      );

    if (confirmLogout) {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  // =========================
  // RENDER
  // =========================

  return (
    <div className="admin-dashboard">

      {/* SIDEBAR */}

      <aside className="admin-sidebar">

        <div>

          <div className="admin-brand">
            <div className="brand-icon">
              C
            </div>

            <div>
              <h2>C-Mart</h2>
              <span>Admin Dashboard</span>
            </div>
          </div>

          <div className="sidebar-section-title">
            MAIN MENU
          </div>

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
              <span>⌂</span>
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
                handleMenuClick(
                  "Complaints"
                )
              }
            >
              <span>⚠</span>
              Complaints
            </button>

          </nav>

        </div>

        <div className="sidebar-bottom">

          <div className="admin-sidebar-profile">

            <div className="sidebar-avatar">
              A
            </div>

            <div>
              <strong>
                Administrator
              </strong>

              <span>
                Admin Account
              </span>
            </div>

          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* MAIN */}

      <main className="admin-main">

        {/* HEADER */}

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

            <div className="admin-avatar">
              A
            </div>

            <div>
              <strong>
                Administrator
              </strong>

              <span>Admin</span>
            </div>

          </div>

        </header>

        {/* =========================
            DASHBOARD
        ========================= */}

        {activeMenu === "Dashboard" && (
          <>

            <section className="welcome-banner">

              <div>

                <span className="welcome-label">
                  ADMINISTRATION
                </span>

                <h2>
                  Welcome back, Administrator 👋
                </h2>

                <p>
                  Here's what's happening
                  with your C-Mart marketplace
                  today.
                </p>

              </div>

              <div className="welcome-icon">
                📊
              </div>

            </section>

            <section className="stats-grid">

              <button
                className="stat-card users-card"
                onClick={() =>
                  handleMenuClick("Users")
                }
              >

                <div className="stat-top">

                  <div className="stat-icon">
                    👥
                  </div>

                  <span className="stat-link">
                    View →
                  </span>

                </div>

                <span className="stat-title">
                  Total Users
                </span>

                <strong>
                  {loadingDashboard
                    ? "..."
                    : dashboardStats.totalUsers}
                </strong>

                <small>
                  🟢{" "}
                  {dashboardStats.activeUsers}{" "}
                  active users
                </small>

              </button>

              <button
                className="stat-card products-card"
                onClick={() =>
                  handleMenuClick("Products")
                }
              >

                <div className="stat-top">

                  <div className="stat-icon">
                    📦
                  </div>

                  <span className="stat-link">
                    View →
                  </span>

                </div>

                <span className="stat-title">
                  Total Products
                </span>

                <strong>
                  {dashboardStats.products}
                </strong>

                <small>
                  Manage marketplace products
                </small>

              </button>

              <button
                className="stat-card reports-card"
                onClick={() =>
                  handleMenuClick("Reports")
                }
              >

                <div className="stat-top">

                  <div className="stat-icon">
                    🚩
                  </div>

                  <span className="stat-link">
                    Review →
                  </span>

                </div>

                <span className="stat-title">
                  Reports
                </span>

                <strong>
                  {dashboardStats.reports}
                </strong>

                <small>
                  Review reported content
                </small>

              </button>

              <button
                className="stat-card complaints-card"
                onClick={() =>
                  handleMenuClick(
                    "Complaints"
                  )
                }
              >

                <div className="stat-top">

                  <div className="stat-icon">
                    ⚠
                  </div>

                  <span className="stat-link">
                    Review →
                  </span>

                </div>

                <span className="stat-title">
                  Complaints
                </span>

                <strong>
                  {dashboardStats.complaints}
                </strong>

                <small>
                  Review user complaints
                </small>

              </button>

            </section>

            {dashboardError && (
              <div className="alert-box">
                ⚠ {dashboardError}
              </div>
            )}

            <section className="dashboard-grid">

              <div className="dashboard-panel">

                <div className="panel-header">

                  <div>

                    <h2>
                      Quick Actions
                    </h2>

                    <p>
                      Quickly access common
                      administration tasks.
                    </p>

                  </div>

                </div>

                <div className="quick-action-grid">

                  <button
                    onClick={() =>
                      handleMenuClick("Users")
                    }
                  >
                    <span>👥</span>

                    <div>
                      <strong>
                        Manage Users
                      </strong>

                      <small>
                        View and control users
                      </small>
                    </div>

                    <b>→</b>
                  </button>

                  <button
                    onClick={() =>
                      handleMenuClick(
                        "Products"
                      )
                    }
                  >
                    <span>📦</span>

                    <div>
                      <strong>
                        Manage Products
                      </strong>

                      <small>
                        Add or remove products
                      </small>
                    </div>

                    <b>→</b>
                  </button>

                  <button
                    onClick={() =>
                      handleMenuClick(
                        "Reports"
                      )
                    }
                  >
                    <span>🚩</span>

                    <div>
                      <strong>
                        Review Reports
                      </strong>

                      <small>
                        Check reported content
                      </small>
                    </div>

                    <b>→</b>
                  </button>

                  <button
                    onClick={() =>
                      handleMenuClick(
                        "Complaints"
                      )
                    }
                  >
                    <span>⚠</span>

                    <div>
                      <strong>
                        View Complaints
                      </strong>

                      <small>
                        Handle user complaints
                      </small>
                    </div>

                    <b>→</b>
                  </button>

                </div>

              </div>

              <div className="dashboard-panel">

                <div className="panel-header">

                  <div>

                    <h2>
                      User Overview
                    </h2>

                    <p>
                      Current account status
                    </p>

                  </div>

                </div>

                <div className="user-overview">

                  <div className="overview-item">

                    <span className="overview-icon">
                      👥
                    </span>

                    <div>

                      <small>
                        Total Users
                      </small>

                      <strong>
                        {dashboardStats.totalUsers}
                      </strong>

                    </div>

                  </div>

                  <div className="overview-item">

                    <span className="overview-icon">
                      🟢
                    </span>

                    <div>

                      <small>
                        Active Users
                      </small>

                      <strong>
                        {dashboardStats.activeUsers}
                      </strong>

                    </div>

                  </div>

                  <div className="overview-item">

                    <span className="overview-icon">
                      🔴
                    </span>

                    <div>

                      <small>
                        Blocked Users
                      </small>

                      <strong>
                        {dashboardStats.blockedUsers}
                      </strong>

                    </div>

                  </div>

                </div>

              </div>

            </section>

          </>
        )}

        {/* =========================
            USERS
        ========================= */}

        {activeMenu === "Users" && (
          <section className="management-panel">

            <div className="panel-header">

              <div>

                <h2>
                  User Management
                </h2>

                <p>
                  View, block or remove
                  registered C-Mart users.
                </p>

              </div>

              <div className="panel-actions">

                <span className="record-count">
                  {filteredUsers.length} Users
                </span>

                <button
                  className="primary-btn"
                  type="button"
                  onClick={() => {
                    setShowAddUserForm(
                      (current) => !current
                    );

                    setAddUserError("");
                  }}
                >
                  {showAddUserForm
                    ? "Close Form"
                    : "+ Add User"}
                </button>

              </div>

            </div>

            {/* ADD USER FORM */}

            {showAddUserForm && (
              <form
                onSubmit={addUser}
                className="product-form"
              >

                <div className="form-heading">

                  <div>

                    <h3>
                      Add New User
                    </h3>

                    <p>
                      Create a new C-Mart
                      user account.
                    </p>

                  </div>

                </div>

                <div className="form-grid">

                  <div className="form-group">

                    <label>
                      Full Name
                    </label>

                    <input
                      type="text"
                      name="fullName"
                      placeholder="Enter full name"
                      value={newUser.fullName}
                      onChange={
                        handleNewUserChange
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      placeholder="Enter email address"
                      value={newUser.email}
                      onChange={
                        handleNewUserChange
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Password
                    </label>

                    <input
                      type="password"
                      name="password"
                      placeholder="Create password"
                      value={newUser.password}
                      onChange={
                        handleNewUserChange
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      College ID
                    </label>

                    <input
                      type="text"
                      name="collegeId"
                      placeholder="Enter college ID"
                      value={newUser.collegeId}
                      onChange={
                        handleNewUserChange
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Phone Number
                    </label>

                    <input
                      type="tel"
                      name="phoneNumber"
                      placeholder="Enter phone number"
                      value={
                        newUser.phoneNumber
                      }
                      onChange={
                        handleNewUserChange
                      }
                      required
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

            {/* SEARCH */}

            <div className="search-box">

              <span>⌕</span>

              <input
                type="text"
                placeholder="Search by name, email or college ID..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

            {loadingUsers && (
              <div className="no-data">

                <strong>
                  Loading users...
                </strong>

                Please wait.

              </div>
            )}

            {userError &&
              !loadingUsers && (
                <div className="no-data">

                  <strong>
                    Unable to load users
                  </strong>

                  {userError}

                </div>
              )}

            {!loadingUsers &&
              !userError && (
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

                      {filteredUsers.map(
                        (user) => (
                          <tr
                            key={user._id}
                          >

                            <td>

                              <div className="user-cell">

                                <div className="user-avatar">
                                  {user.fullName
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                    "U"}
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

                            <td>
                              {user.collegeId ||
                                "Not available"}
                            </td>

                            <td>

                              <span className="role-badge">
                                {user.role ||
                                  "user"}
                              </span>

                            </td>

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

                  {filteredUsers.length ===
                    0 && (
                    <div className="no-data">

                      <strong>
                        No users found
                      </strong>

                      Try another search.

                    </div>
                  )}

                </div>
              )}

          </section>
        )}

        {/* =========================
            PRODUCTS
        ========================= */}

        {activeMenu === "Products" && (
          <section className="management-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Product Management
                </h2>

                <p>
                  Add and manage products
                  available in C-Mart.
                </p>

              </div>

              <div className="panel-actions">

                <span className="record-count">
                  {products.length} Products
                </span>

                <button
                  className="primary-btn"
                  type="button"
                  onClick={() => {
                    setShowProductForm(
                      (current) => !current
                    );

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
                onSubmit={addProduct}
                className="product-form"
              >

                <div className="form-heading">

                  <div>

                    <h3>
                      Add New Product
                    </h3>

                    <p>
                      Enter product details
                      below.
                    </p>

                  </div>

                </div>

                <div className="form-grid">

                  <div className="form-group">

                    <label>
                      Product Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      placeholder="Enter product name"
                      value={
                        productForm.name
                      }
                      onChange={
                        handleProductInputChange
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Price
                    </label>

                    <input
                      type="number"
                      name="price"
                      placeholder="Enter price"
                      min="0"
                      value={
                        productForm.price
                      }
                      onChange={
                        handleProductInputChange
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Category
                    </label>

                    <input
                      type="text"
                      name="category"
                      placeholder="Books, Gadgets, Cycles..."
                      value={
                        productForm.category
                      }
                      onChange={
                        handleProductInputChange
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Stock
                    </label>

                    <input
                      type="number"
                      name="stock"
                      placeholder="Stock quantity"
                      min="0"
                      value={
                        productForm.stock
                      }
                      onChange={
                        handleProductInputChange
                      }
                    />

                  </div>

                </div>

                <div className="form-group">

                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    placeholder="Enter product description"
                    value={
                      productForm.description
                    }
                    onChange={
                      handleProductInputChange
                    }
                    rows="4"
                  />

                </div>

                <div className="upload-section">

                  <label>
                    Product Image
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    name="image"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={
                      handleImageUpload
                    }
                    disabled={
                      uploadingImage
                    }
                  />

                  {uploadingImage && (
                    <p className="uploading-text">
                      Uploading image...
                    </p>
                  )}

                  {productForm.images?.length >
                    0 && (
                    <div className="image-preview">

                      <img
                        src={
                          productForm.images[0]
                        }
                        alt="Product preview"
                      />

                      <div>

                        <strong>
                          Image uploaded
                        </strong>

                        <span>
                          Product image is ready
                          to be added.
                        </span>

                      </div>

                    </div>
                  )}

                </div>

                {productError && (
                  <div className="form-error">
                    ⚠ {productError}
                  </div>
                )}

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={
                    loadingProducts ||
                    uploadingImage
                  }
                >
                  {uploadingImage
                    ? "Uploading..."
                    : loadingProducts
                    ? "Adding..."
                    : "Add Product"}
                </button>

              </form>
            )}

            {!showProductForm &&
              productError && (
                <div className="form-error">
                  ⚠ {productError}
                </div>
              )}

            {loadingProducts &&
              products.length === 0 && (
                <div className="no-data">

                  <strong>
                    Loading products...
                  </strong>

                </div>
              )}

            {!loadingProducts &&
              products.length === 0 &&
              !productError && (
                <div className="empty-products">

                  <div>📦</div>

                  <h3>
                    No Products Yet
                  </h3>

                  <p>
                    Start adding products to
                    your C-Mart marketplace.
                  </p>

                  <button
                    className="primary-btn"
                    onClick={() =>
                      setShowProductForm(true)
                    }
                  >
                    + Add First Product
                  </button>

                </div>
              )}

            {products.length > 0 && (
              <div className="product-grid">

                {products.map((product) => (
                  <div
                    className="product-card"
                    key={product._id}
                  >

                    <div className="product-image">

                      {product.images?.length >
                      0 ? (
                        <img
                          src={
                            product.images[0]
                          }
                          alt={
                            product.name
                          }
                        />
                      ) : (
                        <span>📦</span>
                      )}

                    </div>

                    <div className="product-info">

                      <span className="product-category">
                        {product.category}
                      </span>

                      <h3>
                        {product.name}
                      </h3>

                      <p>
                        {product.description ||
                          "No description"}
                      </p>

                      <div className="product-bottom">

                        <strong>
                          ₹
                          {Number(
                            product.price || 0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                        <span>
                          Stock:{" "}
                          {product.stock}
                        </span>

                      </div>

                      <button
                        className="delete-btn product-delete"
                        onClick={() =>
                          deleteProduct(
                            product._id
                          )
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

        {/* =========================
            REPORTS
        ========================= */}

        {activeMenu === "Reports" && (
          <section className="management-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Reports Management
                </h2>

                <p>
                  Review reports submitted
                  by C-Mart users.
                </p>

              </div>

              <div className="panel-actions">

                <span className="record-count">
                  {reports.length} Reports
                </span>

                <button
                  className="primary-btn"
                  onClick={fetchReports}
                  disabled={loadingReports}
                >
                  {loadingReports
                    ? "Refreshing..."
                    : "↻ Refresh"}
                </button>

              </div>

            </div>

            {reportError && (
              <div className="form-error">
                ⚠ {reportError}
              </div>
            )}

            {loadingReports ? (
              <div className="no-data">
                <strong>
                  Loading reports...
                </strong>

                Please wait.
              </div>
            ) : reports.length === 0 ? (
              <div className="no-data">

                <div style={{ fontSize: "40px" }}>
                  🚩
                </div>

                <strong>
                  No Reports Found
                </strong>

                <span>
                  There are no reports submitted
                  by users yet.
                </span>

              </div>
            ) : (
              <div className="table-container">

                <table>

                  <thead>

                    <tr>
                      <th>Reporter</th>
                      <th>Email</th>
                      <th>Reason</th>
                      <th>Reported User</th>
                      <th>Product</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>

                  </thead>

                  <tbody>

                    {reports.map((report) => (
                      <tr
                        key={report._id}
                      >

                        <td>
                          <strong>
                            {report.reporterName ||
                              "Unknown"}
                          </strong>
                        </td>

                        <td>
                          {report.reporterEmail ||
                            "N/A"}
                        </td>

                        <td>
                          {report.reason ||
                            "N/A"}
                        </td>

                        <td>
                          {report.reportedUser ||
                            "N/A"}
                        </td>

                        <td>
                          {report.reportedProduct ||
                            "N/A"}
                        </td>

                        <td>

                          <select
                            className="status-select"
                            value={
                              report.status ||
                              "Pending"
                            }
                            onChange={(e) =>
                              updateReportStatus(
                                report._id,
                                e.target.value
                              )
                            }
                          >

                            <option value="Pending">
                              Pending
                            </option>

                            <option value="Reviewed">
                              Reviewed
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
                              deleteReport(
                                report._id
                              )
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

        {/* =========================
            COMPLAINTS
        ========================= */}

        {activeMenu === "Complaints" && (
          <section className="management-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Complaints Management
                </h2>

                <p>
                  Review complaints submitted
                  by C-Mart users.
                </p>

              </div>

              <div className="panel-actions">

                <span className="record-count">
                  {complaints.length} Complaints
                </span>

                <button
                  className="primary-btn"
                  onClick={fetchComplaints}
                  disabled={
                    loadingComplaints
                  }
                >
                  {loadingComplaints
                    ? "Refreshing..."
                    : "↻ Refresh"}
                </button>

              </div>

            </div>

            {complaintError && (
              <div className="form-error">
                ⚠ {complaintError}
              </div>
            )}

            {loadingComplaints ? (
              <div className="no-data">

                <strong>
                  Loading complaints...
                </strong>

                Please wait.

              </div>
            ) : complaints.length === 0 ? (
              <div className="no-data">

                <div style={{ fontSize: "40px" }}>
                  ⚠
                </div>

                <strong>
                  No Complaints Found
                </strong>

                <span>
                  There are no complaints
                  submitted by users yet.
                </span>

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

                    {complaints.map(
                      (complaint) => (
                        <tr
                          key={
                            complaint._id
                          }
                        >

                          <td>
                            <strong>
                              {complaint.userName ||
                                "Unknown"}
                            </strong>
                          </td>

                          <td>
                            {complaint.userEmail ||
                              "N/A"}
                          </td>

                          <td>
                            {complaint.subject ||
                              "N/A"}
                          </td>

                          <td>
                            {complaint.description ||
                              "N/A"}
                          </td>

                          <td>

                            <select
                              className="status-select"
                              value={
                                complaint.status ||
                                "Pending"
                              }
                              onChange={(e) =>
                                updateComplaintStatus(
                                  complaint._id,
                                  e.target.value
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
                                deleteComplaint(
                                  complaint._id
                                )
                              }
                            >
                              Delete
                            </button>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </section>
        )}

      </main>

      {/* =========================
          VIEW USER MODAL
      ========================= */}

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

      {/* =========================
          DELETE USER MODAL
      ========================= */}

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
                ⚠
              </div>

              <h2>
                Delete User?
              </h2>

              <p>
                Are you sure you want to
                delete{" "}
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
                    setShowDeleteModal(
                      false
                    );
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