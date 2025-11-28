import React, { useEffect, useState } from "react";
import { Home, Users, LogOut, ShoppingBag, DollarSign, Sparkles, ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../lib/supabase";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const navigate = useNavigate();

  // STATS
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    completed: 0,
    pending: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Orders
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select("*");
        if (ordersError) throw ordersError;

        // Customers
        const { data: customers, error: customersError } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "customer");
        if (customersError) throw customersError;

        const totalRevenue = orders?.reduce(
          (sum, o) => sum + Number(o.total || 0),
          0
        );

        setStats({
          totalOrders: orders?.length || 0,
          totalCustomers: customers?.length || 0,
          totalRevenue,
          completed:
            orders?.filter((o) => o.status === "Completed").length || 0,
          pending: orders?.filter((o) => o.status === "Pending").length || 0,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
        toast.error("Failed to load statistics");
      }
    };

    fetchStats();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* SIDEBAR */}
      <aside className="w-72 bg-white shadow-2xl border-r border-blue-100 p-6 hidden md:flex flex-col">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              LaundryMS
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-1">Admin Panel</p>
        </div>

        <nav className="space-y-2 flex-1">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-200">
            <Home size={20} />
            <span className="font-semibold">Dashboard</span>
          </div>

          <Link
            to="/customer"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-all"
          >
            <Users size={20} />
            <span className="font-medium">Customer Management</span>
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-500 hover:text-red-600 transition-all cursor-pointer mt-4"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">

          {/* BACK BUTTON */}
          <button
            onClick={() => navigate("/customer-dashboard")}
            className="mb-6 p-3 hover:bg-white rounded-xl transition-all duration-200 cursor-pointer inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 text-lg">
              Overview of your laundry management system
            </p>
          </div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Total Customers"
              value={stats.totalCustomers}
              icon={<Users size={30} />}
              bgColor="bg-white"
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              subtitle="Registered users"
            />
            <StatCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={<ShoppingBag size={30} />}
              bgColor="bg-white"
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
              subtitle="All-time orders"
            />
            <StatCard
              title="Total Revenue"
              value={`₱${stats.totalRevenue.toLocaleString()}`}
              icon={<DollarSign size={30} />}
              bgColor="bg-white"
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              subtitle="Total earnings"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, bgColor, iconBg, iconColor, subtitle }) {
  return (
    <div
      className={`${bgColor} rounded-2xl p-6 shadow-xl border border-gray-100 transform hover:scale-105 hover:shadow-2xl transition-all`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-600">{title}</h2>
        <div className={`${iconBg} p-3 rounded-xl`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>

      <p className="text-4xl font-extrabold tracking-tight text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
    </div>
  );
}