import React, { useEffect, useState } from "react";
import axios from "axios";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/products"
      );

      setProducts(response.data);
    } catch (err) {
      console.error("Fetch products error:", err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // BUY PRODUCT
  const handleBuyNow = async (product) => {
    try {
      // Get logged-in user
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        alert("Please login before buying a product.");
        return;
      }

      const user = JSON.parse(storedUser);

      if (!user._id) {
        alert("User information is missing. Please login again.");
        return;
      }

      setBuying(true);

      // Create order
      const response = await axios.post(
        "http://localhost:5000/api/orders",
        {
          buyer: user._id,
          product: product._id,
          productName: product.name,
          price: product.price,
        }
      );

      console.log("Order created:", response.data);

      alert(
        `Order placed successfully for ${product.name}!`
      );

    } catch (err) {
      console.error("Buy Now error:", err);

      alert(
        err.response?.data?.message ||
          "Failed to place order. Please try again."
      );
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "30px" }}>
        <h1>Buy Products</h1>
        <p>Loading products...</p>
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
      <h1>Buy Products</h1>

      <p>Browse products available on C-Mart.</p>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      {products.length === 0 ? (
        <p>No products available yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "24px",
            marginTop: "25px",
          }}
        >
          {products.map((product) => {
            const imageUrl =
              product.images &&
              product.images.length > 0
                ? product.images[0]
                : "";

            return (
              <div
                key={product._id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "15px",
                  boxShadow:
                    "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                {/* PRODUCT IMAGE */}
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.name}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      display: "block",
                      marginBottom: "15px",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "200px",
                      borderRadius: "10px",
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                      marginBottom: "15px",
                    }}
                  >
                    No Image
                  </div>
                )}

                {/* PRODUCT NAME */}
                <h2
                  style={{
                    fontSize: "20px",
                    margin: "8px 0",
                  }}
                >
                  {product.name}
                </h2>

                {/* PRICE */}
                <p
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    margin: "8px 0",
                  }}
                >
                  ₹{product.price}
                </p>

                {/* MRP */}
                {product.mrp > 0 && (
                  <p
                    style={{
                      color: "#64748b",
                      margin: "5px 0",
                    }}
                  >
                    MRP: ₹{product.mrp}
                  </p>
                )}

                {/* CATEGORY */}
                <p>
                  <strong>Category:</strong>{" "}
                  {product.category}
                </p>

                {/* CONDITION */}
                {product.condition && (
                  <p>
                    <strong>Condition:</strong>{" "}
                    {product.condition}
                  </p>
                )}

                {/* DESCRIPTION */}
                {product.description && (
                  <p
                    style={{
                      color: "#555",
                      fontSize: "14px",
                      lineHeight: "1.5",
                    }}
                  >
                    {product.description}
                  </p>
                )}

                {/* STOCK */}
                <p>
                  <strong>Stock:</strong>{" "}
                  {product.stock > 0
                    ? product.stock
                    : "Out of stock"}
                </p>

                {/* BUY BUTTON */}
                <button
                  disabled={
                    product.stock <= 0 || buying
                  }
                  onClick={() => handleBuyNow(product)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: "10px",
                    border: "none",
                    borderRadius: "8px",
                    cursor:
                      product.stock > 0 && !buying
                        ? "pointer"
                        : "not-allowed",
                    background:
                      product.stock > 0
                        ? "#2563eb"
                        : "#9ca3af",
                    color: "#fff",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  {buying
                    ? "Processing..."
                    : product.stock > 0
                    ? "Buy Now"
                    : "Out of Stock"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Products;