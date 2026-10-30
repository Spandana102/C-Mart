
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Products.css";

const API_URL = "http://localhost:5000/api";
const SERVER_URL = "http://localhost:5000";

// Convert image data into a usable URL
function getImageUrl(value) {
  if (!value) return "";

  if (Array.isArray(value)) {
    for (const item of value) {
      const url = getImageUrl(item);
      if (url) return url;
    }
    return "";
  }

  if (typeof value === "object") {
    return getImageUrl(
      value.secure_url ||
      value.url ||
      value.imageUrl ||
      value.path ||
      value.src ||
      ""
    );
  }

  if (typeof value !== "string") return "";

  const url = value.trim().replace(/\\/g, "/");

  if (!url) return "";

  if (
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("data:image/") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  return `${SERVER_URL}/${url.replace(/^\/+/, "")}`;
}

// Find product image
function getProductImage(product) {
  if (!product) return "";

  const fields = [
    product.images,
    product.image,
    product.imageUrl,
    product.photo,
    product.thumbnail,
    product.productImage,
  ];

  for (const field of fields) {
    const url = getImageUrl(field);
    if (url) return url;
  }

  return "";
}

// Product image with fallback
function ProductImage({ product }) {
  const imageUrl = getProductImage(product);
  const [failedUrl, setFailedUrl] = useState("");

  if (!imageUrl || failedUrl === imageUrl) {
    return (
      <div className="no-image">
        <span style={{ fontSize: "40px" }}>
          📦
        </span>
        <span>Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={product.name || "Product"}
      loading="lazy"
      onError={() => {
        console.error(
          "Failed to load image:",
          imageUrl
        );
        setFailedUrl(imageUrl);
      }}
    />
  );
}

// Extract products from API response
function extractProducts(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.products)) {
    return data.products;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (data?.product) {
    return [data.product];
  }

  return [];
}

function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = async (signal) => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/products`,
        { signal }
      );

      const productData = extractProducts(
        response.data
      );

      const sortedProducts = [...productData].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );

      setProducts(sortedProducts);
    } catch (err) {
      if (
        err.code === "ERR_CANCELED" ||
        axios.isCancel(err)
      ) {
        return;
      }

      console.error(
        "Fetch products error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          "Failed to load products. Please try again."
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    fetchProducts(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  const handleViewDetails = (product) => {
    const productId = product?._id || product?.id;

    if (!productId) {
      setError("Product details are unavailable.");
      return;
    }

    navigate(`/product/${productId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const formatPrice = (price) => {
    if (
      price === undefined ||
      price === null ||
      price === "" ||
      !Number.isFinite(Number(price))
    ) {
      return "Price unavailable";
    }

    return `₹${Number(price).toLocaleString(
      "en-IN"
    )}`;
  };

  return (
    <div className="products-page">
      {/* Navbar */}
      <nav className="products-navbar">
        <div
          className="products-logo"
          onClick={() => navigate("/")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              navigate("/");
            }
          }}
        >
          <span className="products-logo-icon">
            🛍️
          </span>
          <span>C-Mart</span>
        </div>

        <div className="products-nav-links">
          <button
            type="button"
            onClick={() => navigate("/")}
          >
            Home
          </button>

          <button
            type="button"
            className="active-nav"
          >
            Marketplace
          </button>

          <button
            type="button"
            onClick={() => navigate("/my-products")}
          >
            My Products
          </button>

          <button
            type="button"
            onClick={() => navigate("/orders")}
          >
            Orders
          </button>

          <button
            type="button"
            onClick={() => navigate("/complaints")}
          >
            Complaints
          </button>

          <button
            type="button"
            onClick={() => navigate("/profile")}
          >
            Profile
          </button>

          <button
            type="button"
            className="products-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="products-hero">
        <div className="products-hero-content">
          <p className="products-label">
            C-MART • CAMPUS MARKETPLACE
          </p>

          <h1>
            Explore the <span>Marketplace</span>
          </h1>

          <p className="products-description">
            Discover products from your campus
            community. Open any product to explore
            its images, description, seller
            information, reviews and ratings.
          </p>

          <div className="products-hero-buttons">
            <button
              type="button"
              className="back-dashboard"
              onClick={() => navigate("/")}
            >
              ← Dashboard
            </button>

            <button
              type="button"
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

      {/* Products Section */}
      <section className="products-section">
        <div className="products-section-heading">
          <div>
            <p>AVAILABLE PRODUCTS</p>
            <h2>Shop from Your Campus</h2>

            <span>
              {products.length} product
              {products.length !== 1 ? "s" : ""}{" "}
              available
            </span>
          </div>

          <button
            type="button"
            onClick={() => fetchProducts()}
            disabled={loading}
          >
            ↻ Refresh Products
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="products-loading">
            <div className="loading-box">
              🛍️
            </div>

            <h2>Loading Marketplace...</h2>

            <p>
              Finding products available on C-Mart.
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="products-error">
            <p>⚠️ {error}</p>

            <button
              type="button"
              onClick={() => fetchProducts()}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty Products */}
        {!loading &&
          !error &&
          products.length === 0 && (
            <div className="no-products">
              <div className="no-products-icon">
                🛒
              </div>

              <h2>No products available</h2>

              <p>
                There are no products listed on
                C-Mart yet. Please check again later.
              </p>

              <button
                type="button"
                onClick={() => navigate("/")}
              >
                ← Back to Dashboard
              </button>
            </div>
          )}

        {/* Product Cards */}
        {!loading &&
          !error &&
          products.length > 0 && (
            <div className="product-grid">
              {products.map((product, index) => {
                const productId =
                  product._id || product.id;

                return (
                  <article
                    className="product-card"
                    key={productId || index}
                  >
                    <button
                      type="button"
                      className="product-image-wrapper"
                      onClick={() =>
                        handleViewDetails(product)
                      }
                      aria-label={`View ${
                        product.name || "product"
                      } details`}
                    >
                      <ProductImage
                        product={product}
                      />
                    </button>

                    <div className="product-details">
                      <h3>
                        {product.name ||
                          product.productName ||
                          "Unnamed Product"}
                      </h3>

                      <div className="product-price">
                        {formatPrice(product.price)}
                      </div>

                      <button
                        type="button"
                        className="buy-button"
                        onClick={() =>
                          handleViewDetails(product)
                        }
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

      {/* Bottom Banner */}
      <section className="marketplace-banner">
        <div>
          <p>CAMPUS SHOPPING MADE EASY</p>

          <h2>
            Find it. Check it. Choose it.
          </h2>

          <span>
            View product details and reviews
            before making your purchase.
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate("/orders")}
        >
          View My Orders →
        </button>
      </section>

      {/* Footer */}
      <footer className="products-footer">
        <div className="products-footer-logo">
          🛍️ C-Mart
        </div>

        <p>
          Campus Marketplace • Buy • Sell •
          Swap • Rent
        </p>
      </footer>
    </div>
  );
}

export default Products;
