import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Reviews from "./pages/Reviews";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Profile from "./pages/Profile/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reviews" element={<Reviews />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;