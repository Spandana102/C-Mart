
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Authentication Pages
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOTP from "./pages/VerifyOTP";
import ResetPassword from "./pages/ResetPassword/ResetPassword";

// Dashboard
import Dashboard from "./pages/Dashboard/Dashboard";

// Product Pages
import Products from "./pages/Products/Products";
import ProductDetails from "./pages/ProductDetails/ProductDetails";
import Sell from "./pages/Sell/Sell";

// Orders
import Orders from "./pages/Orders/Orders";

// User Profile and Admin
import Profile from "./pages/Profile/Profile";
import Admin from "./pages/Admin/Admin";
import ProtectedRoute from "./components/ProtectedRoute";

// Swap, Rent and Meet Point
import Swap from "./pages/Swap/Swap";
import Rent from "./pages/Rent/Rent";
import MeetPoint from "./pages/MeetPoint/MeetPoint";

// Bargaining
import BargainPage from "./pages/BargainPage";
import SellerOffers from "./pages/SellerOffers";

// Reviews and Complaints
import Reviews from "./pages/Reviews/Reviews";
import Complaints from "./pages/Complaints/Complaints";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Authentication Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/verify-otp"
          element={<VerifyOTP />}
        />
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* Product Routes */}
        <Route path="/products" element={<Products />} />
        <Route
          path="/product/:id"
          element={<ProductDetails />}
        />
        <Route path="/sell" element={<Sell />} />

        {/* Orders */}
        <Route path="/orders" element={<Orders />} />

        {/* Swap, Rent and Meet Point */}
        <Route path="/swap" element={<Swap />} />
        <Route path="/rent" element={<Rent />} />
        <Route
          path="/meetpoint"
          element={<MeetPoint />}
        />

        {/* Bargaining */}
        <Route
          path="/bargain"
          element={<BargainPage />}
        />
        <Route
          path="/seller-offers"
          element={<SellerOffers />}
        />

        {/* Reviews and Complaints */}
        <Route path="/reviews" element={<Reviews />} />
        <Route
          path="/complaints"
          element={<Complaints />}
        />

        {/* Protected Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={<Admin />}
        />

        {/* Unknown Routes */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
