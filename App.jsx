
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login/Login";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOTP from "./pages/VerifyOTP";
import ResetPassword from "./pages/ResetPassword/ResetPassword";

import Dashboard from "./pages/Dashboard/Dashboard";
import Products from "./pages/Products/Products";
import ProductDetails from "./pages/ProductDetails/ProductDetails";
import Sell from "./pages/Sell/Sell";
import Orders from "./pages/Orders/Orders";

import Profile from "./pages/Profile/Profile";
import Admin from "./pages/Admin/Admin";

import Swap from "./pages/Swap/Swap";
import Rent from "./pages/Rent/Rent";
import MeetPoint from "./pages/MeetPoint/MeetPoint";

import BargainPage from "./pages/BargainPage";
import SellerOffers from "./pages/SellerOffers";

import Reviews from "./pages/Reviews/Reviews";
import Complaints from "./pages/Complaints/Complaints";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* Products */}
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/sell" element={<Sell />} />

        {/* Orders */}
        <Route path="/orders" element={<Orders />} />

        {/* Swap, Rent and Meet Point */}
        <Route path="/swap" element={<Swap />} />
        <Route path="/rent" element={<Rent />} />
        <Route path="/meetpoint" element={<MeetPoint />} />

        {/* Bargaining */}
        <Route path="/bargain" element={<BargainPage />} />
        <Route path="/seller-offers" element={<SellerOffers />} />

        {/* Reviews and Complaints */}
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/complaints" element={<Complaints />} />

        {/* Protected Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
