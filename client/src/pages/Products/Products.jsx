
const DASHBOARD_PATH = "/dashboard";

const goToDashboard = () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token) {
    navigate("/login", { replace: true });
    return;
  }

  if (user?.role === "admin") {
    navigate("/admin", { replace: true });
    return;
  }

  navigate("/dashboard", { replace: true });
};
