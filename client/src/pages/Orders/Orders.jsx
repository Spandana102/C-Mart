import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        alert("Please login to view your orders.");
        navigate("/login");
        return;
      }

      const user = JSON.parse(storedUser);

      if (!user._id) {
        alert("User information is missing. Please login again.");
        navigate("/login");
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/orders/user/${user._id}`
      );

      setOrders(response.data);
    } catch (error) {
      console.error("Fetch orders error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (order) => {
    navigate("/reviews", {
      state: {
        orderId: order._id,
        productId: order.product?._id || order.product,
        productName: order.productName,
      },
    });
  };

  if (loading) {
    return (
      <div style={{ padding: "30px" }}>
        <h1>My Orders</h1>
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "30px",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <h1>My Orders</h1>

      <p>
        View your purchased products and rate your delivered
        orders.
      </p>

      {orders.length === 0 ? (
        <div
          style={{
            background: "#fff",
            padding: "30px",
            borderRadius: "12px",
            marginTop: "25px",
            textAlign: "center",
          }}
        >
          <h2>No orders yet</h2>
          <p>
            Your purchased products will appear here.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "20px",
            marginTop: "25px",
          }}
        >
          {orders.map((order) => (
            <div
              key={order._id}
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "20px",
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "10px",
                }}
              >
                {order.productName}
              </h2>

              <p>
                <strong>Price:</strong> ₹{order.price}
              </p>

              <p>
                <strong>Order Date:</strong>{" "}
                {new Date(order.createdAt).toLocaleDateString()}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    fontWeight: "bold",
                    color:
                      order.status === "Delivered"
                        ? "green"
                        : order.status === "Cancelled"
                        ? "red"
                        : "#f59e0b",
                  }}
                >
                  {order.status}
                </span>
              </p>

              {order.status === "Delivered" ? (
                <button
                  onClick={() => handleReview(order)}
                  style={{
                    padding: "10px 18px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#7c3aed",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  ⭐ Rate & Review
                </button>
              ) : (
                <p
                  style={{
                    color: "#64748b",
                    marginTop: "15px",
                  }}
                >
                  Review will be available after delivery.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;