
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Products.css";

const API_URL = "http://localhost:5000/api";
const SERVER_URL = "http://localhost:5000";

function getImageUrl(value) {
  if (!value) return "";

  // Support image objects from Cloudinary or MongoDB
  if (typeof value === "object" && !Array.isArray(value)) {
    value =
      value.url ||
      value.secure_url ||
      value.imageUrl ||
      value.path ||
      value.src ||
      value.filename ||
      "";
  }

  if (typeof value !== "string") return "";

  const url = value.trim();
  if (!url) return "";

  if (
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("data:image/")
  ) {
    return url;
  }

  // Relative path, e.g. uploads/product.jpg
  return `${SERVER_URL}/${url.replace(/^\/+/, "")}`;
}

function getProductImage(product) {
  if (!product) return "";

  const possibleFields = [
    product.images,
    product.image,
    product.imageUrl,
    product.photo,
    product.thumbnail,
    product.productImage,
  ];

  for (const field of possibleFields) {
    if (Array.isArray(field)) {
      for (const image of field) {
        const url = getImageUrl(image);
        if (url) return url;
      }
    } else {
      const url = getImageUrl(field);
      if (url) return url;
    }
  }

  return "";
}

function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API_URL}/products`);

      const productData = Array.isArray(response.data)
        ? response.data
        : response.data?.products ||
          response.data?.data ||
          [];

      console.log("Products API response:", response.data);
      console.log(
        "Product image fields:",
        productData.map((p) => ({
          name: p.name,
          images: p.images,
          image: p.image,
          imageUrl: p.imageUrl,
          photo: p.photo,
          thumbnail: p.thumbnail,
        }))
      );

      setProducts(productData);
    } catch (err) {
      console.error("Fetch products error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load products. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (product) => {
    if (!product?._id) {
      setError("Product details are unavailable.");
      return;
    }

    navigate(`/product/${product._id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="products-page">
      {/* NAVBAR */}
      <nav className="products-navbar">
        <div
          className="products-logo"
          onClick={() => navigate("/")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/");
            }
          }}
        >
          <span className="products-logo-icon">🛍️</span>
          <span>C-Mart</span>
        </div>

        <div className="products-nav-links">
          <button onClick={() => navigate("/")}>Home</button>
          <button className="active-nav">Marketplace</button>
          <button onClick={() => navigate("/orders")}>Orders</button>
          <button onClick={() => navigate("/complaints")}>
            Complaints
          </button>
          <button onClick={() => navigate("/profile")}>Profile</button>
          <button className="products-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="products-hero">
        <div className="products-hero-content">
          <p className="products-label">
            C-MART • CAMPUS MARKETPLACE
          </p>

          <h1>
            Explore the <span>Marketplace</span>
          </h1>

          <p className="products-description">
            Discover products from your campus community.
            Open any product to explore its images, description,
            seller information, reviews and ratings.
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
          <div className="market-main-icon">🛍️</div>

          <div className="market-floating-card card-a">
            📚 <span>Books</span>
          </div>
          <div className="market-floating-card card-b">
            💻 <span>Electronics</span>
          </div>
          <div className="market-floating-card card-c">
            🎒 <span>Campus Items</span>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="products-section">
        <div className="products-section-heading">
          <div>
            <p>AVAILABLE PRODUCTS</p>
            <h2>Shop from Your Campus</h2>
            <span>
              {products.length} product
              {products.length !== 1 ? "s" : ""} available
            </span>
          </div>
        </div>

        {loading && (
          <div className="products-loading">
            <div className="loading-box">🛍️</div>
            <h2>Loading Marketplace...</h2>
            <p>Finding products available on C-Mart.</p>
          </div>
        )}

        {!loading && error && (
          <div className="products-error">
            <p>⚠️ {error}</p>
            <button onClick={fetchProducts}>Try Again</button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="no-products">
            <div className="no-products-icon">🛒</div>
            <h2>No products available</h2>
            <p>
              There are no products listed on C-Mart yet.
              Please check again later.
            </p>
            <button onClick={() => navigate("/")}>
              ← Back to Dashboard
            </button>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="product-grid">
            {products.map((product) => {
              const imageUrl = getProductImage(product);

              return (
                <article className="product-card" key={product._id}>
                  <button
                    type="button"
                    className="product-image-wrapper"
                    onClick={() => handleViewDetails(product)}
                    aria-label={`View ${product.name || "product"} details`}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name || "Product"}
                        onError={(e) => {
                          console.error(
                            "Product image failed to load:",
                            imageUrl
                          );
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement.classList.add(
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
                  </button>

                  <div className="product-details">
                    <h3>{product.name || "Unnamed Product"}</h3>

                    <div className="product-price">
                      ₹
                      {Number(product.price || 0).toLocaleString(
                        "en-IN"
                      )}
                    </div>

                    <button
                      type="button"
                      className="buy-button"
                      onClick={() => handleViewDetails(product)}
                    >
                      View Details →
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* BOTTOM BANNER */}
      <section className="marketplace-banner">
        <div>
          <p>CAMPUS SHOPPING MADE EASY</p>
          <h2>Find it. Check it. Choose it.</h2>
          <span>
            View product details and reviews before making
            your purchase.
          </span>
        </div>

        <button onClick={() => navigate("/orders")}>
          View My Orders →
        </button>
      </section>

      {/* FOOTER */}
      <footer className="products-footer">
        <div className="products-footer-logo">🛍️ C-Mart</div>
        <p>Campus Marketplace • Buy • Sell • Swap • Rent</p>
      </footer>
    </div>
  );
}

export default Products;