
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Products.css";

const API_URL = "http://localhost:5000/api";
const SERVER_URL = "http://localhost:5000";
const DASHBOARD_PATH = "/dashboard";

// ==========================================
// COLLEGE RELATED CATEGORIES
// ==========================================

const CATEGORIES = [
  {
    label: "All Products",
    icon: "🛍️",
    value: "All",
    aliases: [],
  },
  {
    label: "Books & Study Materials",
    icon: "📚",
    value: "Books",
    aliases: [
      "books",
      "study materials",
      "textbooks",
      "notes",
    ],
  },
  {
    label: "Stationery & Calculators",
    icon: "✏️",
    value: "Stationery",
    aliases: [
      "stationery",
      "calculators",
      "calculator",
    ],
  },
  {
    label: "Electronics & Gadgets",
    icon: "💻",
    value: "Electronics",
    aliases: [
      "electronics",
      "gadgets",
      "electronic accessories",
    ],
  },
  {
    label: "Lab & Project Materials",
    icon: "🔬",
    value: "Lab Materials",
    aliases: [
      "lab materials",
      "lab equipment",
      "project materials",
    ],
  },
  {
    label: "Bags & College Essentials",
    icon: "🎒",
    value: "College Essentials",
    aliases: [
      "college essentials",
      "bags",
      "campus items",
    ],
  },
  {
    label: "Drawing & Workshop Tools",
    icon: "📐",
    value: "Workshop Tools",
    aliases: [
      "workshop tools",
      "drawing tools",
      "drawing materials",
    ],
  },
  {
    label: "Other",
    icon: "📦",
    value: "Other",
    aliases: [
      "other",
      "others",
      "miscellaneous",
    ],
  },
];

// ==========================================
// IMAGE URL HELPER
// ==========================================

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
    /^https?:\/\//i.test(url) ||
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

// ==========================================
// PRODUCT IMAGE COMPONENT
// ==========================================

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

// ==========================================
// EXTRACT PRODUCTS FROM API
// ==========================================

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

// ==========================================
// FORMAT PRICE
// ==========================================

function formatPrice(price) {
  if (
    price === undefined ||
    price === null ||
    price === "" ||
    !Number.isFinite(Number(price))
  ) {
    return "Price unavailable";
  }

  return `₹${Number(price).toLocaleString("en-IN")}`;
}

// ==========================================
// MAIN PRODUCTS COMPONENT
// ==========================================

function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  // ========================================
  // NAVIGATE TO USER DASHBOARD
  // ========================================

  const goToDashboard = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    navigate(DASHBOARD_PATH);
  };

  // ========================================
  // FETCH PRODUCTS
  // ========================================

  const fetchProducts = async (signal) => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/products`,
        signal ? { signal } : {}
      );

      const productData = extractProducts(
        response.data
      );

      const sortedProducts = [...productData].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );

      if (!signal?.aborted) {
        setProducts(sortedProducts);
      }
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

      if (!signal?.aborted) {
        setError(
          err.response?.data?.message ||
            "Failed to load products. Please try again."
        );
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    fetchProducts(controller.signal);

    return () => controller.abort();
  }, []);

  // ========================================
  // SEARCH AND CATEGORY FILTER
  // ========================================

  const filteredProducts = products.filter(
    (product) => {
      const search = searchTerm
        .trim()
        .toLowerCase();

      const name = String(
        product.name ||
          product.productName ||
          ""
      ).toLowerCase();

      const description = String(
        product.description || ""
      ).toLowerCase();

      const category = String(
        product.category || ""
      )
        .trim()
        .toLowerCase();

      const matchesSearch =
        name.includes(search) ||
        description.includes(search) ||
        category.includes(search);

      if (selectedCategory === "All") {
        return matchesSearch;
      }

      const selected = CATEGORIES.find(
        (item) =>
          item.value === selectedCategory
      );

      const matchesCategory =
        selected?.aliases.includes(category) ||
        category ===
          selectedCategory.toLowerCase() ||
        category ===
          selected?.label.toLowerCase();

      return matchesSearch && matchesCategory;
    }
  );

  // ========================================
  // VIEW PRODUCT DETAILS
  // ========================================

  const handleViewDetails = (product) => {
    const productId =
      product?._id || product?.id;

    if (!productId) {
      setError(
        "Product details are unavailable."
      );
      return;
    }

    navigate(`/product/${productId}`);
  };

  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="products-page">
      {/* NAVBAR */}

      <nav className="products-navbar">
        <div
          className="products-logo"
          onClick={goToDashboard}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              goToDashboard();
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
            onClick={goToDashboard}
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
            onClick={() =>
              navigate("/my-products")
            }
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
            onClick={() =>
              navigate("/complaints")
            }
          >
            Complaints
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/profile")
            }
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

      {/* HERO SECTION */}

      <section className="products-hero">
        <div className="products-hero-content">
          <p className="products-label">
            C-MART • CAMPUS MARKETPLACE
          </p>

          <h1>
            Explore the{" "}
            <span>Marketplace</span>
          </h1>

          <p className="products-description">
            Discover books, calculators,
            electronics, lab materials and
            other useful college products
            from your campus community.
          </p>

          <div className="products-hero-buttons">
            <button
              type="button"
              className="back-dashboard"
              onClick={goToDashboard}
            >
              ← Dashboard
            </button>

            <button
              type="button"
              className="orders-button"
              onClick={() =>
                navigate("/orders")
              }
            >
              📦 My Orders
            </button>
          </div>
        </div>

        <div className="marketplace-visual">
          <div className="market-circle" />

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

      {/* PRODUCTS SECTION */}

      <section className="products-section">
        {/* MODERN PRODUCTS HEADER */}

        <div className="products-section-heading buy-products-header">
          <div className="buy-header-content">
            <div className="buy-header-label">
              <span className="buy-label-dot" />
              AVAILABLE PRODUCTS
            </div>

            <h2>
              Shop from{" "}
              <span>Your Campus</span>
            </h2>

            <p className="buy-header-description">
              Discover books, electronics,
              calculators, stationery and
              other useful products from
              your campus community.
            </p>

            <div className="buy-header-bottom">
              <div className="buy-products-count">
                <span className="buy-count-icon">
                  🛍️
                </span>

                <span>
                  <strong>
                    {products.length}
                  </strong>{" "}
                  product
                  {products.length !== 1
                    ? "s"
                    : ""}{" "}
                  available
                </span>
              </div>

              <button
                type="button"
                className="buy-refresh-btn"
                onClick={() =>
                  fetchProducts()
                }
                disabled={loading}
              >
                <span>↻</span>

                {loading
                  ? "Refreshing..."
                  : "Refresh Products"}
              </button>
            </div>
          </div>

          <div
            className="buy-header-decoration"
            aria-hidden="true"
          >
            <span>🛍️</span>
          </div>
        </div>

        {/* SEARCH AND CATEGORIES */}

        <div className="marketplace-filters">
          <div className="marketplace-search">
            <span>🔍</span>

            <input
              type="search"
              placeholder="Search books, calculators, laptops..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />

            {searchTerm && (
              <button
                type="button"
                className="clear-search"
                onClick={() =>
                  setSearchTerm("")
                }
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <h3>Shop by Category</h3>

          <div className="marketplace-categories">
            {CATEGORIES.map((category) => (
              <button
                key={category.value}
                type="button"
                className={
                  selectedCategory ===
                  category.value
                    ? "category-btn selected"
                    : "category-btn"
                }
                onClick={() =>
                  setSelectedCategory(
                    category.value
                  )
                }
              >
                <span>
                  {category.icon}
                </span>

                {category.label}
              </button>
            ))}
          </div>

          <p className="filter-results">
            Showing{" "}
            {filteredProducts.length} of{" "}
            {products.length} products
          </p>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="products-loading">
            <div className="loading-box">
              🛍️
            </div>

            <h2>
              Loading Marketplace...
            </h2>

            <p>
              Finding products available
              on C-Mart.
            </p>
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="products-error">
            <p>⚠️ {error}</p>

            <button
              type="button"
              onClick={() =>
                fetchProducts()
              }
            >
              Try Again
            </button>
          </div>
        )}

        {/* NO PRODUCTS */}

        {!loading &&
          !error &&
          products.length === 0 && (
            <div className="no-products">
              <div className="no-products-icon">
                🛒
              </div>

              <h2>
                No products available
              </h2>

              <p>
                There are no products
                listed on C-Mart yet.
                Please check again later.
              </p>

              <button
                type="button"
                onClick={goToDashboard}
              >
                ← Back to Dashboard
              </button>
            </div>
          )}

        {/* NO FILTER MATCHES */}

        {!loading &&
          !error &&
          products.length > 0 &&
          filteredProducts.length === 0 && (
            <div className="no-products">
              <div className="no-products-icon">
                🔍
              </div>

              <h2>
                No matching products found
              </h2>

              <p>
                Try another search or
                select a different category.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                }}
              >
                Clear Filters
              </button>
            </div>
          )}

        {/* PRODUCT CARDS */}

        {!loading &&
          !error &&
          filteredProducts.length > 0 && (
            <div className="product-grid">
              {filteredProducts.map(
                (product, index) => {
                  const productId =
                    product._id ||
                    product.id;

                  return (
                    <article
                      className="product-card"
                      key={
                        productId ||
                        index
                      }
                    >
                      <button
                        type="button"
                        className="product-image-wrapper"
                        onClick={() =>
                          handleViewDetails(
                            product
                          )
                        }
                        aria-label={`View ${
                          product.name ||
                          "product"
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
                          {formatPrice(
                            product.price
                          )}
                        </div>

                        <button
                          type="button"
                          className="buy-button"
                          onClick={() =>
                            handleViewDetails(
                              product
                            )
                          }
                        >
                          View Details →
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
      </section>

      {/* BOTTOM BANNER */}

      <section className="marketplace-banner">
        <div>
          <p>
            CAMPUS SHOPPING MADE EASY
          </p>

          <h2>
            Find it. Check it.
            Choose it.
          </h2>

          <span>
            View product details and
            reviews before making
            your purchase.
          </span>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/orders")
          }
        >
          View My Orders →
        </button>
      </section>

      {/* FOOTER */}

      <footer className="products-footer">
        <div className="products-footer-logo">
          🛍️ C-Mart
        </div>

        <p>
          Campus Marketplace • Buy •
          Sell • Swap • Rent
        </p>
      </footer>
    </div>
  );
}

export default Products;
