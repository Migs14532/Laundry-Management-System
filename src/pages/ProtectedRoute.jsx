import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import supabase from "../lib/supabase";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      setSession(session);

      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        setRole(profile?.role || "customer"); // default to customer
      }

      setLoading(false);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return null;

  if (!session) return <Navigate to="/login" replace />;

  // If adminOnly and user is not admin, redirect to CustomerDashboard
  if (adminOnly && role !== "admin") {
    return <Navigate to="/customer-dashboard" replace />;
  }

  // If user is customer and trying to access non-CustomerDashboard pages
  if (!adminOnly && role === "customer" && window.location.pathname !== "/customer-dashboard") {
    return <Navigate to="/customer-dashboard" replace />;
  }

  return children;
}
