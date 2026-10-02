```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Authentication
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Profile from "./pages/Profile/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

// Main Modules
import Dashboard from "./pages/Dashboard/Dashboard";
import Admin from "./pages/Admin/Admin";
import Swap from "./pages/Swap/Swap";
import Rent from "./pages/Rent/Rent";
import MeetPoint from "./pages/MeetPoint/MeetPoint";
import Reviews from "./pages/Reviews";

// Bargaining / Offers
import BargainPage from "./pages/BargainPage";
import SellerOffers from "./pages/SellerOffers";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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

        {/* Home */}
        <Route path="/" element={<Dashboard />} />

        {/* Swap */}
        <Route path="/swap" element={<Swap />} />

        {/* Rent */}
        <Route path="/rent" element={<Rent />} />

        {/* Meet Point */}
        <Route path="/meetpoint" element={<MeetPoint />} />

        {/* Reviews */}
        <Route path="/reviews" element={<Reviews />} />

        {/* Bargaining */}
        <Route path="/bargain" element={<BargainPage />} />

        {/* Seller Offers */}
        <Route path="/seller-offers" element={<SellerOffers />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
```
