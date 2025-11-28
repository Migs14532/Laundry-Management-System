import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Loading from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import CustomerDashboard from "./pages/CustomerDashboard";
import Customer from "./pages/Customer";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./pages/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <Toaster position="top-center" reverseOrder={false} />

      <Routes>
        {/* Auth Screens */}
        <Route path="/" element={<Loading />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* CustomerDashboard accessible by everyone logged in */}
        <Route
          path="/customer-dashboard"
          element={
            <ProtectedRoute>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin-only routes */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute adminOnly={true}>
              <Customer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
