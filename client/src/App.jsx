
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";

// AUTHENTICATION PAGES
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import VerifyOTP from "./pages/VerifyOTP/VerifyOTP";
import ResetPassword from "./pages/ResetPassword/ResetPassword";

// PROTECTED ROUTE
import ProtectedRoute from "./components/ProtectedRoute";

// MAIN PAGES
import Dashboard from "./pages/Dashboard/Dashboard";
import Profile from "./pages/Profile/Profile";
import Admin from "./pages/Admin/Admin";

// MARKETPLACE
import Products from "./pages/Products/Products.jsx";
import ProductDetails from "./pages/ProductDetails/ProductDetails";
import Sell from "./pages/Sell/Sell";
import MyProducts from "./pages/MyProducts/MyProducts";

// STUDENT FEATURES
import Swap from "./pages/Swap/Swap";
import Rent from "./pages/Rent/Rent";
import MeetPoint from "./pages/MeetPoint/MeetPoint";
import Reviews from "./pages/ReviewsPage.jsx";
import Orders from "./pages/Orders/Orders";
import Complaint from "./pages/Complaints/Complaints.jsx";

// BARGAINING
import BargainPage from "./pages/BargainPage";
import SellerOffers from "./pages/SellerOffers";

// NOT FOUND PAGE
function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fb",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        padding: 20,
      }}
    >
      <h1
        style={{
          fontSize: 60,
          color: "#2563eb",
          marginBottom: 10,
        }}
      >
        404
      </h1>

      <h2>Page Not Found</h2>

      <p style={{ color: "#64748b" }}>
        The page you are looking for does not exist.
      </p>

      <Link
        to="/"
        style={{
          marginTop: 20,
          background: "#2563eb",
          color: "#fff",
          padding: "12px 20px",
          borderRadius: 10,
          textDecoration: "none",
          fontWeight: 700,
        }}
      >
        Back to Dashboard
      </Link>
    </div>
  );
}

// MAIN APPLICATION
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* AUTHENTICATION */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
<<<<<<< HEAD
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
=======

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
>>>>>>> 0ef369c (Update all C-Mart project files)

        <Route
          path="/verify-otp"
          element={<VerifyOTP />}
        />

        {/* NEW RESET PASSWORD ROUTE */}
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* DASHBOARD */}
        <Route path="/" element={<Dashboard />} />

        <Route
          path="/dashboard"
          element={<Navigate to="/" replace />}
        />

        {/* BUY PRODUCTS */}
        <Route path="/products" element={<Products />} />
<<<<<<< HEAD
        <Route path="/product/:id" element={<ProductDetails />} />
=======

        <Route
          path="/product/:id"
          element={<ProductDetails />}
        />
>>>>>>> 0ef369c (Update all C-Mart project files)

        {/* SELL PRODUCT */}
        <Route
          path="/sell"
          element={
            <ProtectedRoute>
              <Sell />
            </ProtectedRoute>
          }
        />

        {/* MY PRODUCTS */}
        <Route
          path="/my-products"
          element={
            <ProtectedRoute>
              <MyProducts />
            </ProtectedRoute>
          }
        />

<<<<<<< HEAD
        {/* Student Features */}
        <Route path="/swap" element={<Swap />} />
        <Route path="/rent" element={<Rent />} />
        <Route path="/meetpoint" element={<MeetPoint />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/orders" element={<Orders />} />

        {/* Complaints */}
        <Route path="/complaints" element={<Complaint />} />

        {/* Profile */}
        <Route
          path="/profile"
=======
        {/* BARGAINING */}
        <Route
          path="/bargaining/:productId"
>>>>>>> 0ef369c (Update all C-Mart project files)
          element={
            <ProtectedRoute>
              <BargainPage />
            </ProtectedRoute>
          }
        />

<<<<<<< HEAD
        {/* Bargaining */}
        <Route
          path="/bargaining/:productId"
          element={<BargainPage />}
        />
        <Route path="/bargain" element={<BargainPage />} />
=======
        <Route
          path="/bargain"
          element={
            <ProtectedRoute>
              <BargainPage />
            </ProtectedRoute>
          }
        />
>>>>>>> 0ef369c (Update all C-Mart project files)

        {/* SELLER OFFERS */}
        <Route
          path="/seller-offers"
          element={
            <ProtectedRoute>
              <SellerOffers />
            </ProtectedRoute>
          }
        />

<<<<<<< HEAD
        {/* Admin */}
        <Route path="/admin" element={<Admin />} />
=======
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

        {/* REVIEWS */}
        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <Reviews />
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

        {/* COMPLAINTS */}
        <Route
          path="/complaints"
          element={
            <ProtectedRoute>
              <Complaint />
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

        {/* ADMIN PANEL */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* UNKNOWN ROUTES */}
        <Route path="*" element={<NotFound />} />
>>>>>>> 0ef369c (Update all C-Mart project files)
      </Routes>
    </BrowserRouter>
  );
}

export default App;
