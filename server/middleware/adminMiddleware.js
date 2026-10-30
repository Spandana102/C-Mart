
const adminMiddleware = (req, res, next) => {
  try {
    // ==========================================
    // STEP 1: CHECK AUTHENTICATION
    // ==========================================

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login.",
      });
    }

    // ==========================================
    // STEP 2: CHECK ACCOUNT STATUS
    // ==========================================

    const isBlocked =
      req.user.isBlocked === true ||
      String(req.user.status || "").toLowerCase() === "blocked";

    if (isBlocked) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been blocked. Please contact the administrator.",
      });
    }

    // ==========================================
    // STEP 3: CHECK ADMIN ROLE
    // ==========================================

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Administrator privileges required.",
      });
    }

    // ==========================================
    // STEP 4: ALLOW ACCESS
    // ==========================================

    return next();
  } catch (error) {
    console.error(
      "Admin Middleware Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Admin authorization failed.",
    });
  }
};

module.exports = adminMiddleware;
