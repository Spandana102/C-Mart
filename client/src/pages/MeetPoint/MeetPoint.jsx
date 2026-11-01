
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../services/apiConfig";
import "./MeetPoint.css";

function MeetPoint() {
  const location = useLocation();
  const navigate = useNavigate();

  // Product details from ProductDetails.jsx
  const orderData = location.state || {};
  const product = orderData.product || null;

  const productId =
    orderData.productId ||
    product?._id ||
    product?.id ||
    "";

  const productName =
    orderData.productName ||
    product?.name ||
    product?.title ||
    "";

  const sellerName =
    orderData.sellerName ||
    product?.sellerName ||
    "Seller";

  const price =
    orderData.price ??
    product?.price ??
    0;

  const quantity = orderData.quantity || 1;

  const isBuying =
    orderData.source === "buy" &&
    Boolean(productId);

  // Meet Point States
  const [selectedLocation, setSelectedLocation] =
    useState("");

  const [selectedDate, setSelectedDate] =
    useState("");

  const [selectedTime, setSelectedTime] =
    useState("");

  const [manualProductName, setManualProductName] =
    useState("");

  const [isConfirmed, setIsConfirmed] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [orderId, setOrderId] =
    useState("");

  // Local date (avoid UTC date mismatch)
  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const finalProductName =
    isBuying ? productName : manualProductName;

  // ==========================================
  // CONFIRM ORDER / MEET POINT
  // ==========================================

  const handleConfirm = async () => {
    setError("");

    if (
      !finalProductName.trim() ||
      !selectedLocation ||
      !selectedDate ||
      !selectedTime
    ) {
      setError(
        "Please select product, location, date and time."
      );
      return;
    }

    // Validate selected date and time
    const meetingDateTime = new Date(
      `${selectedDate}T${selectedTime}:00`
    );

    if (
      Number.isNaN(meetingDateTime.getTime()) ||
      meetingDateTime <= new Date()
    ) {
      setError(
        "Please select a future meeting date and time."
      );
      return;
    }

    // If opened directly from Dashboard,
    // allow meet point selection only.
    if (!isBuying) {
      setIsConfirmed(true);
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login to place your order.");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      // Backend must derive buyer and seller
      // from authenticated user and product.
      const response = await axios.post(
        `${API_URL}/orders`,
        {
          productId,
          quantity: Number(quantity),

          meetPoint: selectedLocation,
          meetingDate: selectedDate,
          meetingTime: selectedTime,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data?.message ||
          "Order could not be placed."
        );
      }

      const createdOrder =
        response.data?.order ||
        response.data?.data ||
        {};

      setOrderId(
        createdOrder._id ||
        createdOrder.id ||
        ""
      );

      // Show success only after backend response
      setIsConfirmed(true);
    } catch (err) {
      console.error("Order Error:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to place order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CHANGE MEET POINT
  // ==========================================

  const handleChangeMeetPoint = () => {
    // Do not create duplicate orders.
    if (isBuying && orderId) {
      navigate("/orders");
      return;
    }

    if (isBuying && isConfirmed) {
      navigate("/orders");
      return;
    }

    setIsConfirmed(false);
    setError("");
  };

  // ==========================================
  // CLEAR SELECTION
  // ==========================================

  const handleClear = () => {
    setSelectedLocation("");
    setSelectedDate("");
    setSelectedTime("");
    setManualProductName("");
    setError("");
  };

  return (
    <div className="meet-point-container">

      <h1>📍 Meet Point</h1>

      <p>
        Choose a convenient place and time
        to meet for product exchange.
      </p>

      {/* ======================================
          PRODUCT ORDER SUMMARY
      ====================================== */}

      {isBuying && (
        <div className="meet-point-form">
          <h2>🛍️ Order Summary</h2>

          <div className="confirmation-detail">
            <strong>Product:</strong>
            <span>{productName}</span>
          </div>

          <div className="confirmation-detail">
            <strong>Seller:</strong>
            <span>{sellerName}</span>
          </div>

          <div className="confirmation-detail">
            <strong>Price:</strong>
            <span>
              ₹{Number(price).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="confirmation-detail">
            <strong>Quantity:</strong>
            <span>{quantity}</span>
          </div>
        </div>
      )}

      {/* ======================================
          MEET POINT SELECTION FORM
      ====================================== */}

      {!isConfirmed && (
        <div className="meet-point-form">

          <h2>
            {isBuying
              ? "Select Meet Point for Your Order"
              : "Select Meet Point"}
          </h2>

          {/* PRODUCT */}

          {!isBuying && (
            <>
              <label htmlFor="meet-product">
                Product
              </label>

              <select
                id="meet-product"
                value={manualProductName}
                onChange={(e) =>
                  setManualProductName(e.target.value)
                }
              >
                <option value="">
                  Select a product
                </option>

                <option value="Engineering Book">
                  Engineering Book
                </option>

                <option value="Scientific Calculator">
                  Scientific Calculator
                </option>

                <option value="HP Laptop">
                  HP Laptop
                </option>

                <option value="Drawing Kit">
                  Drawing Kit
                </option>
              </select>
            </>
          )}

          {/* LOCATION */}

          <label htmlFor="meet-location">
            📍 Location
          </label>

          <select
            id="meet-location"
            value={selectedLocation}
            onChange={(e) =>
              setSelectedLocation(e.target.value)
            }
          >
            <option value="">
              Select a location
            </option>

            <option value="College Main Gate">
              College Main Gate
            </option>

            <option value="College Library">
              College Library
            </option>

            <option value="College Canteen">
              College Canteen
            </option>

            <option value="College Ground">
              College Ground
            </option>
          </select>

          {/* DATE */}

          <label htmlFor="meet-date">
            📅 Meeting Date
          </label>

          <input
            id="meet-date"
            type="date"
            min={todayString}
            value={selectedDate}
            onChange={(e) =>
              setSelectedDate(e.target.value)
            }
          />

          {/* TIME */}

          <label htmlFor="meet-time">
            ⏰ Meeting Time
          </label>

          <input
            id="meet-time"
            type="time"
            value={selectedTime}
            onChange={(e) =>
              setSelectedTime(e.target.value)
            }
          />

          {/* ERROR MESSAGE */}

          {error && (
            <p
              style={{
                color: "#dc2626",
                fontWeight: "600",
                marginTop: "12px",
              }}
              role="alert"
            >
              {error}
            </p>
          )}

          {/* CONFIRM BUTTON */}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading
              ? "Placing Order..."
              : isBuying
              ? "Confirm Order"
              : "Confirm Meet Point"}
          </button>

          {/* CLEAR BUTTON */}

          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
          >
            Clear Selection
          </button>

          {/* BACK BUTTON */}

          <button
            type="button"
            onClick={() => navigate("/products")}
            disabled={loading}
          >
            Back to Products
          </button>
        </div>
      )}

      {/* ======================================
          CONFIRMATION / ORDER SUCCESS
      ====================================== */}

      {isConfirmed && (
        <div className="meet-point-confirmation">

          <h2>
            {isBuying
              ? "✅ Ordered Successfully!"
              : "✅ Meet Point Confirmed"}
          </h2>

          <p>
            {isBuying
              ? "Your order has been placed successfully. The seller can view your order details in Received Orders."
              : "Your meet point has been selected."}
          </p>

          {orderId && (
            <div className="confirmation-detail">
              <strong>Order ID:</strong>
              <span>{orderId}</span>
            </div>
          )}

          <div className="confirmation-detail">
            <strong>🛍️ Product:</strong>
            <span>{finalProductName}</span>
          </div>

          {isBuying && (
            <div className="confirmation-detail">
              <strong>💰 Price:</strong>
              <span>
                ₹{Number(price).toLocaleString("en-IN")}
              </span>
            </div>
          )}

          <div className="confirmation-detail">
            <strong>📍 Location:</strong>
            <span>{selectedLocation}</span>
          </div>

          <div className="confirmation-detail">
            <strong>📅 Date:</strong>
            <span>{selectedDate}</span>
          </div>

          <div className="confirmation-detail">
            <strong>⏰ Time:</strong>
            <span>{selectedTime}</span>
          </div>

          {isBuying ? (
            <>
              <button
                type="button"
                onClick={() => navigate("/orders")}
              >
                View My Orders
              </button>

              <button
                type="button"
                onClick={() => navigate("/")}
              >
                Back to Dashboard
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleChangeMeetPoint}
            >
              Change Meet Point
            </button>
          )}
        </div>
      )}

    </div>
  );
}

export default MeetPoint;
