import React, { useEffect, useState, useRef } from "react";
import { Home, LogOut, ShoppingBag, CheckCircle, Clock, Plus, Shield, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import supabase from "../lib/supabase";
import toast from "react-hot-toast";
import { sendMessageToGemini } from "../lib/ai";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [stats, setStats] = useState({ totalOrders: 0, completed: 0, pending: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [service, setService] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [status, setStatus] = useState("Pending");
  const [total, setTotal] = useState(0);
  const [userRole, setUserRole] = useState("customer");

  // Chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([{ sender: "bot", text: "Hi! I'm Laundry Chatbot 🤖 How can I assist you today?" }]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // --- Fetch authenticated user ---
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("User fetch error:", error);
        return;
      }
      setUser(data.user);

      // Fetch role from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        return;
      }

      setUserRole(profileData.role);
    };
    fetchUser();
  }, []);

  // --- Fetch or create profile and customer ---
  const fetchUserAndCustomer = async () => {
    if (!user) return null;

    try {
      // Step 1: Ensure profile exists
      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code === "PGRST116") {
        const { data: newProfile, error: insertProfileError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            name: user.user_metadata.full_name || "Unnamed",
            email: user.email,
          })
          .select()
          .single();
        if (insertProfileError) throw insertProfileError;
        profile = newProfile;
      } else if (profileError) throw profileError;

      // Step 2: Ensure customer exists
      let { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("profile_id", profile.id)
        .single();

      if (customerError && customerError.code === "PGRST116") {
        const { data: newCustomer, error: insertCustomerError } = await supabase
          .from("customers")
          .insert({
            profile_id: profile.id,
            name: profile.name,
            email: profile.email,
          })
          .select()
          .single();
        if (insertCustomerError) throw insertCustomerError;
        customerData = newCustomer;
      } else if (customerError) throw customerError;

      setCustomer(customerData);
      return customerData;
    } catch (err) {
      console.error("Failed to fetch/create profile/customer:", err);
      toast.error("Failed to initialize your account!");
      return null;
    }
  };

  // --- Fetch orders for dashboard ---
  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      if (!customer) await fetchUserAndCustomer();
      if (!customer) return;

      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setStats({
        totalOrders: orders.length,
        completed: orders.filter(o => o.status === "Completed").length,
        pending: orders.filter(o => o.status === "Pending").length,
      });
      setRecentOrders(orders);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard data");
    }
    setLoading(false);
  };

  useEffect(() => { fetchDashboardData(); }, [user, customer]);

  // --- Modal handling ---
  const openModal = (order = null) => {
    if (order) {
      setEditingId(order.id);
      setService(order.service_type);
      setQuantity(Number(order.quantity));
      setPickupDate(order.pickup_date);
      setPickupTime(order.pickup_time);
      setStatus(order.status);
      setTotal(Number(order.total));
    } else {
      setEditingId(null);
      setService("");
      setQuantity(0);
      setPickupDate("");
      setPickupTime("");
      setStatus("Pending");
      setTotal(0);
    }
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const calculateTotal = (serviceType, qty) => {
    if (!serviceType || !qty) return 0;
    const n = Number(qty);
    if (serviceType === "Wash & Fold") return n * 50;
    if (serviceType === "Ironing & Pressing") return n * 30;
    if (serviceType === "Dry Cleaning") return n * 150;
    return 0;
  };

  // --- Handle Order Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!service || !pickupDate || !pickupTime || !quantity) {
      return toast.error("All fields are required!");
    }

    const calculatedTotal = calculateTotal(service, quantity);

    try {
      if (!customer) {
        const cust = await fetchUserAndCustomer();
        if (!cust) return;
      }

      let res;
      if (editingId) {
        res = await supabase
          .from("orders")
          .update({
            service_type: service,
            quantity: Number(quantity),
            pickup_date: pickupDate,
            pickup_time: pickupTime,
            status,
            total: calculatedTotal,
          })
          .eq("id", editingId);
      } else {
        res = await supabase.from("orders").insert([
          {
            customer_id: customer.id,
            service_type: service,
            quantity: Number(quantity),
            pickup_date: pickupDate,
            pickup_time: pickupTime,
            status,
            total: calculatedTotal,
          },
        ]);
      }

      if (res.error) throw res.error;

      toast.success(editingId ? "Order updated successfully!" : "Order created successfully!");
      fetchDashboardData();
      closeModal();
    } catch (err) {
      console.error("Supabase error:", err);
      toast.error("Failed to save order!");
    }
  };

  // --- Handle Delete ---
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
      toast.success("Order deleted successfully!");
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete order!");
    }
  };

  const handleAdminClick = () => {
    if (userRole !== "admin") {
      toast.error("You can't access the Admin Dashboard!");
      return;
    }
    navigate("/admin-dashboard");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // --- Chat handler ---
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMessage = chatInput;
    setMessages(prev => [...prev, { sender: "user", text: userMessage }]);
    setChatInput("");
    setIsTyping(true);
    const aiReply = await sendMessageToGemini(userMessage, userRole);
    setIsTyping(false);
    setMessages(prev => [...prev, { sender: "bot", text: aiReply }]);
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
          <p className="text-sm text-gray-500 ml-1">Customer Portal</p>
        </div>

        <nav className="space-y-2 flex-1">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-200">
            <Home size={20} />
            <span className="font-semibold">My Orders</span>
          </div>

          <div
            onClick={handleAdminClick}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-gray-700 hover:text-red-600 transition-all cursor-pointer"
          >
            <Shield size={20} />
            <span className="font-medium">Admin Dashboard</span>
          </div>
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
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">My Dashboard</h1>
              <p className="text-gray-500">Track and manage your laundry orders</p>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-105 transition-all cursor-pointer font-semibold"
            >
              <Plus size={20} />
              New Order
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* STATS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-blue-100 transform hover:scale-105 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-medium text-gray-600">Total Orders</h2>
                    <div className="bg-blue-100 p-3 rounded-xl">
                      <ShoppingBag size={24} className="text-blue-600" />
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-gray-800">{stats.totalOrders}</p>
                  <p className="text-xs text-gray-500 mt-2">All your orders</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-xl border border-amber-100 transform hover:scale-105 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-medium text-gray-600">Pending</h2>
                    <div className="bg-amber-100 p-3 rounded-xl">
                      <Clock size={24} className="text-amber-600" />
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-gray-800">{stats.pending}</p>
                  <p className="text-xs text-gray-500 mt-2">In progress</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-xl border border-green-100 transform hover:scale-105 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-medium text-gray-600">Completed</h2>
                    <div className="bg-green-100 p-3 rounded-xl">
                      <CheckCircle size={24} className="text-green-600" />
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-gray-800">{stats.completed}</p>
                  <p className="text-xs text-gray-500 mt-2">Ready for pickup</p>
                </div>
              </div>

              {/* MY ORDERS TABLE */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-800">My Orders</h2>
                  <p className="text-sm text-gray-500 mt-1">Your laundry order history</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Service</th>
                        <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
                        <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pickup Date & Time</th>
                        <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                        <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recentOrders.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-12 text-gray-400">
                            <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="font-medium">No orders yet</p>
                            <p className="text-sm mt-1">Create your first order to get started</p>
                          </td>
                        </tr>
                      ) : (
                        recentOrders.map((order) => {
                          const pickupDateTime = order.pickup_date && order.pickup_time
                            ? new Date(`${order.pickup_date}T${order.pickup_time}`)
                            : null;

                          return (
                            <tr key={order.id} className="hover:bg-blue-50 transition-colors">
                              <td className="py-4 px-6">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                  {order.service_type}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-700 font-medium">{order.quantity}</td>
                              <td className="py-4 px-6 text-sm text-gray-600">
                                {pickupDateTime ? (
                                  <>
                                    <div>{pickupDateTime.toLocaleDateString("en-PH", {
                                      timeZone: "Asia/Manila",
                                      year: "numeric",
                                      month: "short",
                                      day: "2-digit"
                                    })}</div>
                                    <div className="text-xs text-gray-400">{pickupDateTime.toLocaleTimeString("en-PH", {
                                      timeZone: "Asia/Manila",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true
                                    })}</div>
                                  </>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="py-4 px-6">
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                    order.status === "Completed"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-sm font-bold text-gray-800">
                                ₱{Number(order.total || 0).toLocaleString()}
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openModal(order)}
                                    className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all cursor-pointer text-xs font-medium"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(order.id)}
                                    className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all cursor-pointer text-xs font-medium"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ORDER MODAL */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 p-6 rounded-t-2xl">
                  <h2 className="text-2xl font-bold text-white">
                    {editingId ? "Edit Order" : "Create New Order"}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="absolute top-6 right-6 text-white hover:bg-white/20 rounded-full p-1 transition-colors cursor-pointer text-2xl w-8 h-8 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>

                <form className="p-6 space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                    <select
                      className="w-full border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                      value={service}
                      onChange={(e) => {
                        setService(e.target.value);
                        setTotal(calculateTotal(e.target.value, quantity));
                      }}
                    >
                      <option value="" disabled>Choose a service</option>
                      <option value="Wash & Fold">Wash & Fold - ₱50/kg</option>
                      <option value="Ironing & Pressing">Ironing & Pressing - ₱30/piece</option>
                      <option value="Dry Cleaning">Dry Cleaning - ₱150/piece</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                      <div className="relative w-full">
                        <div className="relative w-full">
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                          value={quantity}
                          min={0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setQuantity(val);
                            setTotal(calculateTotal(service, val));
                          }}
                        />
                      </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total</label>
                      <input
                        type="text"
                        className="w-full border-2 border-gray-200 p-3 rounded-xl bg-gray-50 font-bold text-gray-700"
                        value={`₱${total}`}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Date</label>
                      <input
                        type="date"
                        className="w-full border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Time</label>
                      <input
                        type="time"
                        className="w-full border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all cursor-pointer font-semibold mt-6"
                  >
                    {editingId ? "Update Order" : "Create Order"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* CHATBOT */}
          <div className="fixed bottom-6 right-6 z-50">
            {!chatOpen && (
              <button
                onClick={() => setChatOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform cursor-pointer text-3xl"
              >
                💬
              </button>
            )}
          </div>

          {chatOpen && (
            <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 rounded-t-2xl flex justify-between items-center">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  🤖 Laundry Chatbot
                </h2>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full p-1 text-xl cursor-pointer w-7 h-7 flex items-center justify-center"
                >
                  ✖
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 p-4 max-h-80 bg-gray-50">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 text-sm rounded-xl shadow-sm max-w-[85%] ${
                      msg.sender === "user"
                        ? "ml-auto bg-blue-600 text-white rounded-br-none"
                        : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}

                {isTyping && (
                  <div className="bg-white text-gray-600 text-sm p-3 rounded-xl w-24 animate-pulse border border-gray-200">
                    typing...
                  </div>
                )}

                <div ref={chatEndRef}></div>
              </div>

              <div className="flex gap-2 p-4 border-t border-gray-200 bg-white rounded-b-2xl">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 border-2 border-gray-200 rounded-xl p-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Ask something..."
                />

                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl transition cursor-pointer"
                >
                  ➤
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}