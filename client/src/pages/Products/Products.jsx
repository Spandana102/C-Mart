import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Products.css";

function Products() {
  const navigate = useNavigate();

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
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        alert("Please login before buying a product.");
        navigate("/login");
        return;
      }

      const user = JSON.parse(storedUser);

      if (!user._id) {
        alert("User information is missing. Please login again.");
        navigate("/login");
        return;
      }

      setBuying(true);

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

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="products-page">

        <nav className="products-navbar">
          <div
            className="products-logo"
            onClick={() => navigate("/")}
          >
            <span className="products-logo-icon">
              🛍️
            </span>
            <span>C-Mart</span>
          </div>

          <div className="products-nav-links">
            <button onClick={() => navigate("/")}>
              Home
            </button>

            <button className="active-nav">
              Marketplace
            </button>

            <button onClick={() => navigate("/orders")}>
              Orders
            </button>

            <button onClick={() => navigate("/profile")}>
              Profile
            </button>
          </div>
        </nav>

        <div className="products-loading">
          <div className="loading-box">🛍️</div>
          <h2>Loading Marketplace...</h2>
          <p>Finding products available on C-Mart.</p>
        </div>

      </div>
    );
  }

  return (
    <div className="products-page">

      {/* ================= NAVBAR ================= */}

      <nav className="products-navbar">

        <div
          className="products-logo"
          onClick={() => navigate("/")}
        >
          <span className="products-logo-icon">
            🛍️
          </span>

          <span>C-Mart</span>
        </div>

        <div className="products-nav-links">

          <button onClick={() => navigate("/")}>
            Home
          </button>

          <button className="active-nav">
            Marketplace
          </button>

          <button onClick={() => navigate("/orders")}>
            Orders
          </button>

          <button onClick={() => navigate("/profile")}>
            Profile
          </button>

          <button
            className="products-logout"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/login");
            }}
          >
            Logout
          </button>

        </div>

      </nav>

      {/* ================= HERO ================= */}

      <section className="products-hero">

        <div className="products-hero-content">

          <p className="products-label">
            C-MART • CAMPUS MARKETPLACE
          </p>

          <h1>
            Explore the <span>Marketplace</span>
          </h1>

          <p className="products-description">
            Discover useful products from your campus
            community. Browse, choose and buy products
            easily through C-Mart.
          </p>

          <div className="products-hero-buttons">

            <button
              className="back-dashboard"
              onClick={() => navigate("/")}
            >
              ← Dashboard
            </button>

            <button
              className="orders-button"
              onClick={() => navigate("/orders")}
            >
              📦 My Orders
            </button>

          </div>

        </div>

        <div className="marketplace-visual">
          <div className="market-circle"></div>

          <div className="market-main-icon">
            🛍️
          </div>

          <div className="market-floating-card card-a">
            📚
            <span>Books</span>
          </div>

          <div className="market-floating-card card-b">
            💻
            <span>Electronics</span>
          </div>

          <div className="market-floating-card card-c">
            🎒
            <span>Campus Items</span>
          </div>
        </div>

      </section>

      {/* ================= PRODUCTS HEADER ================= */}

      <section className="products-section">

        <div className="products-section-heading">

          <div>
            <p>AVAILABLE PRODUCTS</p>

            <h2>
              Shop from Your Campus
            </h2>

            <span>
              {products.length} product
              {products.length !== 1 ? "s" : ""} available
            </span>
          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="products-error">
            ⚠️ {error}
          </div>
        )}

        {/* ================= NO PRODUCTS ================= */}

        {products.length === 0 ? (

          <div className="no-products">

            <div className="no-products-icon">
              🛒
            </div>

            <h2>
              No products available
            </h2>

            <p>
              There are no products listed on C-Mart yet.
              Please check again later.
            </p>

            <button onClick={() => navigate("/")}>
              ← Back to Dashboard
            </button>

          </div>

        ) : (

          /* ================= PRODUCT GRID ================= */

          <div className="product-grid">

            {products.map((product) => {

              const imageUrl =
                product.images &&
                product.images.length > 0
                  ? product.images[0]
                  : "";

              return (

                <div
                  className="product-card"
                  key={product._id}
                >

                  {/* IMAGE */}

                  <div className="product-image-wrapper">

                    {imageUrl ? (

                      <img
                        src={imageUrl}
                        alt={product.name}
                        onError={(e) => {
                          e.target.style.display =
                            "none";

                          e.target.parentElement
                            .classList.add(
                              "image-error"
                            );
                        }}
                      />

                    ) : (

                      <div className="no-image">
                        📦
                        <span>No Image</span>
                      </div>

                    )}

                  </div>

                  {/* PRODUCT DETAILS */}

                  <div className="product-details">

                    <div className="product-category">
                      {product.category ||
                        "Campus Product"}
                    </div>

                    <h3>
                      {product.name}
                    </h3>

                    <div className="product-price">
                      ₹{product.price}
                    </div>

                    {product.mrp > 0 && (
                      <div className="product-mrp">
                        MRP: ₹{product.mrp}
                      </div>
                    )}

                    <div className="product-info">

                      <p>
                        <strong>
                          Category:
                        </strong>{" "}
                        {product.category}
                      </p>

                      {product.condition && (
                        <p>
                          <strong>
                            Condition:
                          </strong>{" "}
                          {product.condition}
                        </p>
                      )}

                    </div>

                    {product.description && (
                      <p className="product-description">
                        {product.description}
                      </p>
                    )}

                    <div className="product-bottom">

                      <div className="stock-info">

                        <span>
                          Stock
                        </span>

                        <strong
                          className={
                            product.stock > 0
                              ? "in-stock"
                              : "out-stock"
                          }
                        >
                          {product.stock > 0
                            ? `${product.stock} available`
                            : "Out of stock"}
                        </strong>

                      </div>

                    </div>

                    {/* BUY BUTTON */}

                    <button
                      className={
                        product.stock > 0
                          ? "buy-button"
                          : "buy-button disabled"
                      }
                      disabled={
                        product.stock <= 0 ||
                        buying
                      }
                      onClick={() =>
                        handleBuyNow(product)
                      }
                    >
                      {buying
                        ? "Processing..."
                        : product.stock > 0
                        ? "🛒 Buy Now"
                        : "Out of Stock"}
                    </button>

                  </div>

                </div>

              );
            })}

          </div>

        )}

      </section>

      {/* ================= BOTTOM BANNER ================= */}

      <section className="marketplace-banner">

        <div>
          <p>
            CAMPUS SHOPPING MADE EASY
          </p>

          <h2>
            Find it. Buy it. Enjoy it.
          </h2>

          <span>
            Everything you need from your campus
            marketplace in one place.
          </span>
        </div>

        <button
          onClick={() => navigate("/orders")}
        >
          View My Orders →
        </button>

      </section>

      {/* ================= FOOTER ================= */}

      <footer className="products-footer">

        <div className="products-footer-logo">
          🛍️ C-Mart
        </div>

        <p>
          Campus Marketplace • Buy • Sell • Swap • Rent
        </p>

      </footer>

    </div>
  );
}

export default Products;