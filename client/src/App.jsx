import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import VerifyOTP from "./pages/VerifyOTP/VerifyOTP";

import Profile from "./pages/Profile/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

import Dashboard from "./pages/Dashboard/Dashboard";
import Admin from "./pages/Admin/Admin";
import Swap from "./pages/Swap/Swap";
import Rent from "./pages/Rent/Rent";
import MeetPoint from "./pages/MeetPoint/MeetPoint";
import Reviews from "./pages/Reviewes/Reviews";
import Orders from "./pages/Orders/Orders";
import Products from "./pages/Products/Products.jsx";
import Sell from "./pages/Sell/Sell";
import ProductDetails from "./pages/ProductDetails/ProductDetails";

import Complaint from "./pages/Complaints/Complaints.jsx";

import BargainPage from "./pages/BargainPage";
import SellerOffers from "./pages/SellerOffers";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />

        {/* Main Pages */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/swap" element={<Swap />} />
        <Route path="/rent" element={<Rent />} />
        <Route path="/meetpoint" element={<MeetPoint />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/sell" element={<Sell />} />
        <Route path="/product/:id" element={<ProductDetails />} />

        {/* Complaint */}
        <Route path="/complaints" element={<Complaint />} />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Bargaining */}
        <Route path="/bargain" element={<BargainPage />} />
        <Route path="/seller-offers" element={<SellerOffers />} />

        {/* Admin */}
        <Route path="/admin" element={<Admin />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;