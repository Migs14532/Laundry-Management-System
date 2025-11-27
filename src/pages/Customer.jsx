import React, { useEffect, useState } from "react";
import supabase from "../lib/supabase";
import { ChevronLeft, Eye, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Customer() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    quantity: 1,
    total: 0,
    status: "Pending",
  });

  // Service prices
  const servicePrices = {
    "Wash & Fold": 50,
    "Dry Cleaning": 120,
    "Ironing & Pressing": 30,
  };

  // Fetch orders with customer info via profile
  const fetchOrders = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        customer:customers (
          id,
          profile:profiles (
            name,
            email
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load orders.");
      console.error(error);
    } else {
      setOrders(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) toast.error("Failed to delete order.");
    else {
      toast.success("Order deleted!");
      fetchOrders();
    }
  };

  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from("orders")
      .update({
        quantity: editForm.quantity,
        total: editForm.total,
        status: editForm.status,
      })
      .eq("id", selectedOrder.id);

    if (error) toast.error("Failed to update order.");
    else {
      toast.success("Order updated!");
      setEditModalOpen(false);
      fetchOrders();
    }
  };

  const openEditModal = (order) => {
    setSelectedOrder(order);
    setEditForm({
      quantity: order.quantity,
      total: order.total,
      status: order.status,
    });
    setEditModalOpen(true);
  };

  const handleQuantityChange = (value) => {
    const qty = Number(value);
    const price = servicePrices[selectedOrder.service_type] || 0;
    setEditForm({ ...editForm, quantity: qty, total: qty * price });
  };

  const formatPHDateTime = (date, time) => {
    if (!date || !time) return { date: "-", time: "-" };
    const dt = new Date(`${date}T${time}`);
    return {
      date: dt.toLocaleDateString("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "short",
        day: "2-digit",
      }),
      time: dt.toLocaleTimeString("en-PH", {
        timeZone: "Asia/Manila",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 via-white to-blue-100 min-h-screen">
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate("/admin-dashboard")}
        className="mb-6 p-3 hover:bg-white rounded-xl transition-all duration-200 cursor-pointer inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200"
      >
        <ChevronLeft className="w-5 h-5 text-gray-700" />
      </button>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Customer Orders
          </h1>
          <p className="text-gray-500">Manage all laundry service orders</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Order List</h2>
          <p className="text-sm text-gray-500 mt-1">View and manage customer orders</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">Service</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">Qty</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">Pickup Date</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">Pickup Time</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {orders.length > 0 ? (
                  orders.map((order) => {
                    const ph = formatPHDateTime(order.pickup_date, order.pickup_time);
                    return (
                      <tr key={order.id} className="hover:bg-blue-50 transition-colors">
                        <td className="py-4 px-6 text-sm text-gray-700 font-medium">
                          {order.customer?.profile?.name || "-"}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {order.customer?.profile?.email || "-"}
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {order.service_type}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-700 font-medium">{order.quantity}</td>
                        <td className="py-4 px-6 text-sm font-bold text-gray-800">₱{order.total}</td>
                        <td className="py-4 px-6 text-sm text-gray-600">{ph.date}</td>
                        <td className="py-4 px-6 text-sm text-gray-600">{ph.time}</td>
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
                        <td className="py-4 px-6">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setViewModalOpen(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-all cursor-pointer"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              onClick={() => openEditModal(order)}
                              className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-lg transition-all cursor-pointer"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>

                            <button
                              onClick={() => handleDelete(order.id)}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-all cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-12 text-gray-400">
                      <p className="font-medium">No orders found</p>
                      <p className="text-sm mt-1">Orders will appear here once customers place them</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW MODAL */}
      {viewModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-6 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6">
              <h2 className="text-2xl font-bold text-white">Order Details</h2>
            </div>

            <div className="p-6 space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-700">Name:</span>
                <span className="text-gray-600">{selectedOrder.customer?.profile?.name || "-"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-700">Email:</span>
                <span className="text-gray-600">{selectedOrder.customer?.profile?.email || "-"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-700">Service:</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {selectedOrder.service_type}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-700">Quantity:</span>
                <span className="text-gray-600">{selectedOrder.quantity}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-700">Total:</span>
                <span className="font-bold text-gray-800">₱{selectedOrder.total}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-700">Status:</span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedOrder.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {selectedOrder.status}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-700">Pickup Date:</span>
                <span className="text-gray-600">
                  {formatPHDateTime(selectedOrder.pickup_date, selectedOrder.pickup_time).date}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-semibold text-gray-700">Pickup Time:</span>
                <span className="text-gray-600">
                  {formatPHDateTime(selectedOrder.pickup_date, selectedOrder.pickup_time).time}
                </span>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all cursor-pointer font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-6 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6">
              <h2 className="text-2xl font-bold text-white">Edit Order</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  value={editForm.quantity}
                  min={1}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Total</label>
                <input
                  type="number"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 font-bold text-gray-700"
                  value={editForm.total}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-between gap-3">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all cursor-pointer font-medium"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveEdit}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-xl text-white rounded-xl transition-all cursor-pointer font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}