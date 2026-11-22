
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ========================================
// AUTHENTICATION
// ========================================

import LoginSelection from "./pages/LoginSelection/LoginSelection";
import Register from "./pages/Register/Register.jsx";
import Login from "./pages/Login/Login";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword.jsx";
import VerifyOTP from "./pages/VerifyOTP/VerifyOTP.jsx";
import ResetPassword from "./pages/ResetPassword/ResetPassword";

// ========================================
// DASHBOARD
// ========================================

import Dashboard from "./pages/Dashboard/Dashboard";

// ========================================
// PRODUCTS
// ========================================

import Products from "./pages/Products/Products.jsx";
import ProductDetails from "./pages/ProductDetails/ProductDetails";
import Sell from "./pages/Sell/Sell";
import MyProducts from "./pages/MyProducts/MyProducts.jsx";

// ========================================
// WISHLIST AND ORDERS
// ========================================

import Wishlist from "./pages/Wishlist/Wishlist.jsx";
import Orders from "./pages/Orders/Orders";

// ========================================
// PROFILE AND ADMIN
// ========================================

import Profile from "./pages/Profile/Profile";
import Admin from "./pages/Admin/Admin";
import ProtectedRoute from "./components/ProtectedRoute";

// ========================================
// SWAP, RENT AND MEET POINT
// ========================================

import Swap from "./pages/Swap/Swap";
import Rent from "./pages/Rent/Rent";
import MeetPoint from "./pages/MeetPoint/MeetPoint";

// ========================================
// BARGAINING
// ========================================

import BargainPage from "./pages/BargainPage";
import SellerOffers from "./pages/SellerOffers";

// ========================================
// REVIEWS AND COMPLAINTS
// ========================================

import Reviews from "./pages/Reviewes/Reviews.jsx";
import Complaints from "./pages/Complaints/Complaints";

// ========================================
// CHAT AND NOTIFICATIONS
// ========================================

import Chat from "./pages/Chat/Chat";
import Notifications from "./pages/Notifications/Notifications";

// ========================================
// ADMIN ROUTE PROTECTION
// ========================================

function AdminRoute({ children }) {
  const token = localStorage.getItem("token");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  if (!token) {
    return <Navigate to="/login?role=admin" replace />;
  }

  if (user?.role?.toLowerCase() !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// ========================================
// MAIN APP
// ========================================

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* DEFAULT PAGE */}
        <Route
          path="/"
          element={<Navigate to="/login-selection" replace />}
        />

        {/* LOGIN SELECTION */}
        <Route
          path="/login-selection"
          element={<LoginSelection />}
        />

        {/* USER REGISTRATION */}
        <Route
          path="/register"
          element={<Register />}
        />

        {/* USER AND ADMIN LOGIN */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* FORGOT PASSWORD */}
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* VERIFY OTP */}
        <Route
          path="/verify-otp"
          element={<VerifyOTP />}
        />

        {/* RESET PASSWORD */}
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* USER DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* PRODUCTS */}
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />

        <Route
          path="/product/:id"
          element={
            <ProtectedRoute>
              <ProductDetails />
            </ProtectedRoute>
          }
        />

        {/* SELL PRODUCTS */}
        <Route
          path="/sell"
          element={
            <ProtectedRoute>
              <Sell />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-products"
          element={
            <ProtectedRoute>
              <MyProducts />
            </ProtectedRoute>
          }
        />

        {/* WISHLIST */}
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          }
        />

        {/* ORDERS */}
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />

        {/* SWAP */}
        <Route
          path="/swap"
          element={
            <ProtectedRoute>
              <Swap />
            </ProtectedRoute>
          }
        />

        {/* RENT */}
        <Route
          path="/rent"
          element={
            <ProtectedRoute>
              <Rent />
            </ProtectedRoute>
          }
        />

        {/* MEET POINT */}
        <Route
          path="/meetpoint"
          element={
            <ProtectedRoute>
              <MeetPoint />
            </ProtectedRoute>
          }
        />

        {/* BARGAINING */}
        <Route
          path="/bargain"
          element={
            <ProtectedRoute>
              <BargainPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/seller-offers"
          element={
            <ProtectedRoute>
              <SellerOffers />
            </ProtectedRoute>
          }
        />

        {/* REVIEWS */}
        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <Reviews />
            </ProtectedRoute>
          }
        />

        {/* COMPLAINTS */}
        <Route
          path="/complaints"
          element={
            <ProtectedRoute>
              <Complaints />
            </ProtectedRoute>
          }
        />

        {/* CHAT */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* NOTIFICATIONS */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* PROFILE */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* ADMIN DASHBOARD */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />

        {/* UNKNOWN ROUTES */}
        <Route
          path="*"
          element={<Navigate to="/login-selection" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
