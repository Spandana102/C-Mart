
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../services/apiConfig";
import "./Notifications.css";

const DASHBOARD_PATH = "/dashboard";

// ==========================================
// AUTH HEADERS
// ==========================================

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ==========================================
// NOTIFICATION TYPES
// ==========================================

const notificationConfig = {
  chat: {
    icon: "💬",
    label: "Chat",
    route: "/chat",
    button: "Open Chat",
  },

  bargain: {
    icon: "🤝",
    label: "Bargaining",
    route: "/seller-offers",
    button: "View Offers",
  },

  order: {
    icon: "📦",
    label: "Orders",
    route: "/orders",
    button: "View Orders",
  },

  swap: {
    icon: "🔄",
    label: "Swap",
    route: "/swap",
    button: "View Swaps",
  },

  rent: {
    icon: "🏷️",
    label: "Rent",
    route: "/rent",
    button: "View Rentals",
  },

  meetpoint: {
    icon: "📍",
    label: "Meet Point",
    route: "/meetpoint",
    button: "View Meet Point",
  },

  review: {
    icon: "⭐",
    label: "Reviews",
    route: "/reviews",
    button: "View Reviews",
  },

  system: {
    icon: "🔔",
    label: "System",
    route: DASHBOARD_PATH,
    button: "View Dashboard",
  },
};

const getConfig = (type) =>
  notificationConfig[type] || notificationConfig.system;

// ==========================================
// FORMAT TIME
// ==========================================

const formatTime = (date) => {
  if (!date) return "";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "";

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - value.getTime()) / 1000)
  );

  if (seconds < 60) return "Just now";

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} min ago`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} hours ago`;
  }

  if (seconds < 604800) {
    return `${Math.floor(seconds / 86400)} days ago`;
  }

  return value.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ==========================================
// VALIDATE NOTIFICATION LINKS
// ==========================================

const getDestination = (notification) => {
  const config = getConfig(notification.type);
  const link = notification.link;

  if (typeof link !== "string") {
    return config.route;
  }

  // Prevent external or unsafe redirects.
  if (
    !link.startsWith("/") ||
    link.startsWith("//") ||
    link.includes("\\") ||
    /[\r\n]/.test(link)
  ) {
    return config.route;
  }

  const pathname = link.split(/[?#]/)[0];

  // Root path now opens Login Selection.
  // Redirect old root notification links to Dashboard.
  if (pathname === "/") {
    return DASHBOARD_PATH;
  }

  const allowedPaths = [
    DASHBOARD_PATH,
    "/chat",
    "/seller-offers",
    "/bargain",
    "/orders",
    "/swap",
    "/rent",
    "/meetpoint",
    "/reviews",
    "/products",
    "/notifications",
  ];

  const allowed =
    allowedPaths.includes(pathname) ||
    /^\/product\/[a-f0-9]{24}$/i.test(pathname);

  return allowed ? link : config.route;
};

// ==========================================
// NOTIFICATIONS COMPONENT
// ==========================================

function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  // ========================================
  // DASHBOARD NAVIGATION
  // ========================================

  const goToDashboard = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    navigate(DASHBOARD_PATH);
  };

  // ========================================
  // FETCH NOTIFICATIONS
  // ========================================

  const fetchNotifications = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const response = await axios.get(
          `${API_URL}/notifications`,
          {
            headers: getHeaders(),
          }
        );

        const items = response.data?.notifications;

        setNotifications(
          Array.isArray(items) ? items : []
        );

        setUnreadCount(
          Number(response.data?.unreadCount) || 0
        );

        if (!silent) setError("");
      } catch (err) {
        console.error(
          "Notifications Error:",
          err.response?.data || err.message
        );

        if (!silent) {
          setError(
            err.response?.data?.message ||
              "Unable to load notifications."
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [navigate]
  );

  // ========================================
  // INITIAL LOAD + AUTO REFRESH
  // ========================================

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ========================================
  // MARK ONE NOTIFICATION AS READ
  // ========================================

  const markAsRead = async (notification) => {
    if (notification.isRead) return true;

    try {
      setProcessingId(notification._id);

      await axios.patch(
        `${API_URL}/notifications/${notification._id}/read`,
        {},
        {
          headers: getHeaders(),
        }
      );

      setNotifications((previous) =>
        previous.map((item) =>
          item._id === notification._id
            ? { ...item, isRead: true }
            : item
        )
      );

      setUnreadCount((count) =>
        Math.max(0, count - 1)
      );

      return true;
    } catch (err) {
      console.error("Mark As Read Error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to mark notification as read."
      );

      return false;
    } finally {
      setProcessingId(null);
    }
  };

  // ========================================
  // MARK ALL AS READ
  // ========================================

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      setMarkingAll(true);

      await axios.patch(
        `${API_URL}/notifications/read-all`,
        {},
        {
          headers: getHeaders(),
        }
      );

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          isRead: true,
        }))
      );

      setUnreadCount(0);
      setError("");
    } catch (err) {
      console.error("Mark All Error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to mark all notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  };

  // ========================================
  // DELETE NOTIFICATION
  // ========================================

  const deleteNotification = async (notification) => {
    try {
      setProcessingId(notification._id);

      await axios.delete(
        `${API_URL}/notifications/${notification._id}`,
        {
          headers: getHeaders(),
        }
      );

      setNotifications((previous) =>
        previous.filter(
          (item) => item._id !== notification._id
        )
      );

      if (!notification.isRead) {
        setUnreadCount((count) =>
          Math.max(0, count - 1)
        );
      }

      setError("");
    } catch (err) {
      console.error("Delete Notification Error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to delete notification."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ========================================
  // OPEN RELATED PAGE
  // ========================================

  const openNotification = async (notification) => {
    const success = await markAsRead(notification);

    if (!success) return;

    const destination = getDestination(notification);

    navigate(destination);
  };

  // ========================================
  // FILTER NOTIFICATIONS
  // ========================================

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((item) => !item.isRead)
      : notifications;

  // ========================================
  // UI
  // ========================================

  return (
    <div className="cm-notifications-page">
      <div className="cm-notifications-container">
        {/* HEADER */}

        <header className="cm-notifications-header">
          <button
            className="cm-notifications-back"
            type="button"
            onClick={goToDashboard}
          >
            ← Dashboard
          </button>

          <div className="cm-notifications-heading">
            <div className="cm-notifications-heading-icon">
              🔔
            </div>

            <div>
              <h1>Notifications</h1>

              <p>
                Stay updated with your campus activities
              </p>
            </div>
          </div>

          <div className="cm-notifications-header-actions">
            <span className="cm-notifications-unread-summary">
              {unreadCount} unread
            </span>

            <button
              type="button"
              className="cm-notifications-mark-all"
              onClick={markAllAsRead}
              disabled={unreadCount === 0 || markingAll}
            >
              {markingAll
                ? "Updating..."
                : "✓ Mark all as read"}
            </button>
          </div>
        </header>

        {/* ERROR */}

        {error && (
          <div
            className="cm-notifications-error"
            role="alert"
          >
            <span>⚠️ {error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* FILTERS */}

        <div className="cm-notifications-filters">
          <button
            type="button"
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All Notifications
            <span>{notifications.length}</span>
          </button>

          <button
            type="button"
            className={filter === "unread" ? "active" : ""}
            onClick={() => setFilter("unread")}
          >
            Unread
            <span>{unreadCount}</span>
          </button>
        </div>

        {/* NOTIFICATIONS LIST */}

        <section className="cm-notifications-list">
          {loading ? (
            <div className="cm-notifications-empty">
              <div className="cm-notifications-empty-icon">
                ⏳
              </div>

              <h2>Loading notifications...</h2>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="cm-notifications-empty">
              <div className="cm-notifications-empty-icon">
                🔔
              </div>

              <h2>
                {filter === "unread"
                  ? "You're all caught up!"
                  : "No notifications yet"}
              </h2>

              <p>
                {filter === "unread"
                  ? "You have no unread notifications."
                  : "Your new messages and marketplace updates will appear here."}
              </p>

              <button
                type="button"
                onClick={() => navigate("/products")}
              >
                Explore Products →
              </button>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const config = getConfig(notification.type);

              return (
                <article
                  key={notification._id}
                  className={`cm-notification-card ${
                    !notification.isRead ? "unread" : ""
                  }`}
                >
                  {/* MODULE ICON */}

                  <div className="cm-notification-icon">
                    {config.icon}
                  </div>

                  {/* NOTIFICATION DETAILS */}

                  <div className="cm-notification-content">
                    <div className="cm-notification-title-row">
                      <h3>
                        {notification.title ||
                          "New Notification"}
                      </h3>

                      {!notification.isRead && (
                        <span className="cm-notification-dot" />
                      )}
                    </div>

                    <p>
                      {notification.message ||
                        "You have a new update."}
                    </p>

                    <div className="cm-notification-meta">
                      <span className="cm-notification-type">
                        {config.label}
                      </span>

                      <span>
                        {formatTime(
                          notification.createdAt
                        )}
                      </span>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}

                  <div className="cm-notification-actions">
                    <button
                      type="button"
                      className="cm-notification-open"
                      disabled={
                        processingId === notification._id
                      }
                      onClick={() =>
                        openNotification(notification)
                      }
                    >
                      {config.button} →
                    </button>

                    {!notification.isRead && (
                      <button
                        type="button"
                        className="cm-notification-read"
                        disabled={
                          processingId === notification._id
                        }
                        onClick={() =>
                          markAsRead(notification)
                        }
                      >
                        ✓ Read
                      </button>
                    )}

                    <button
                      type="button"
                      className="cm-notification-delete"
                      disabled={
                        processingId === notification._id
                      }
                      onClick={() =>
                        deleteNotification(notification)
                      }
                      title="Delete notification"
                      aria-label="Delete notification"
                    >
                      🗑️
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {/* FOOTER */}

        <footer className="cm-notifications-footer">
          C-Mart • Campus Marketplace
        </footer>
      </div>
    </div>
  );
}

export default Notifications;
