
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_ORIGIN, API_URL } from "../../services/apiConfig";
import "./MyProducts.css";

const API = API_URL;
const SERVER_URL = API_ORIGIN;
const DASHBOARD_PATH = "/dashboard";

// ==========================================
// GET PRODUCT IMAGE
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

// ==========================================
// PRODUCT IMAGE COMPONENT
// ==========================================

function MyProductImage({ product }) {
  const imageUrl = getImageUrl(
    product.images ||
    product.image ||
    product.imageUrl
  );

  const [imageError, setImageError] = useState(false);

  if (!imageUrl || imageError) {
    return (
      <div className="my-product-no-image">
        <span>📦</span>
        <p>No Image Available</p>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={product.name || "Product"}
      loading="lazy"
      onError={() => setImageError(true)}
    />
  );
}

// ==========================================
// EXTRACT PRODUCTS
// ==========================================

function extractProducts(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.products)) {
    return data.products;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

// ==========================================
// MAIN COMPONENT
// ==========================================

function MyProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // ==========================================
  // DASHBOARD NAVIGATION
  // ==========================================

  const goToDashboard = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    navigate(DASHBOARD_PATH);
  };

  // ==========================================
  // FETCH LOGGED-IN USER PRODUCTS
  // ==========================================

  const fetchMyProducts = useCallback(
    async (signal, isRefresh = false) => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await axios.get(
          `${API}/products/my-products`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal,
            timeout: 30000,
          }
        );

        if (response.data?.success === false) {
          throw new Error(
            response.data?.message ||
            "Unable to load your products."
          );
        }

        const productList = extractProducts(
          response.data
        );

        const sortedProducts = [...productList].sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );

        if (!signal?.aborted) {
          setProducts(sortedProducts);
        }
      } catch (err) {
        if (
          axios.isCancel(err) ||
          err.code === "ERR_CANCELED"
        ) {
          return;
        }

        console.error(
          "My Products error:",
          err.response?.data || err
        );

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          navigate("/login", { replace: true });
          return;
        }

        if (!signal?.aborted) {
          if (err.response?.status === 404) {
            setError(
              "My Products API was not found. Check backend product routes."
            );
          } else {
            setError(
              err.response?.data?.message ||
              err.message ||
              "Unable to load your products."
            );
          }
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [navigate]
  );

  // ==========================================
  // LOAD PRODUCTS ON PAGE OPEN
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    fetchMyProducts(controller.signal);

    return () => controller.abort();
  }, [fetchMyProducts]);

  // ==========================================
  // DELETE PRODUCT
  // ==========================================

  const deleteProduct = async (id) => {
    if (!id || deletingId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const response = await axios.delete(
        `${API}/products/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 30000,
        }
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data?.message ||
          "Failed to delete product."
        );
      }

      setProducts((previous) =>
        previous.filter(
          (product) =>
            String(product._id || product.id) !==
            String(id)
        )
      );

      setSuccess(
        "Product deleted successfully!"
      );
    } catch (err) {
      console.error(
        "Delete product error:",
        err.response?.data || err
      );

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to delete product."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="my-products-page">

      {/* NAVBAR */}

      <nav className="my-products-navbar">
        <button
          type="button"
          className="my-products-logo"
          onClick={goToDashboard}
        >
          🛍️ C-Mart
        </button>

        <div className="my-products-nav-links">
          <button
            type="button"
            onClick={goToDashboard}
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => navigate("/products")}
          >
            Marketplace
          </button>

          <button
            type="button"
            onClick={() => navigate("/sell")}
          >
            Sell Product
          </button>

          <button
            type="button"
            className="active-nav"
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
            onClick={() => navigate("/profile")}
          >
            Profile
          </button>

          <button
            type="button"
            className="my-products-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* HEADER */}

      <section className="my-products-header">
        <div>
          <p className="my-products-label">
            MY CAMPUS STORE
          </p>

          <h1>My Products</h1>

          <p>
            Manage products you have listed
            on C-Mart.
          </p>

          <div className="my-products-count">
            📦 {products.length} Product
            {products.length !== 1 ? "s" : ""} Listed
          </div>
        </div>

        <div className="my-products-header-actions">
          <button
            type="button"
            className="my-products-refresh-btn"
            onClick={() =>
              fetchMyProducts(undefined, true)
            }
            disabled={loading || refreshing}
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>

          <button
            type="button"
            className="my-products-add-btn"
            onClick={() => navigate("/sell")}
          >
            + Add Product
          </button>
        </div>
      </section>

      {/* MAIN CONTENT */}

      <main className="my-products-content">

        {/* BACK BUTTON */}

        <button
          type="button"
          className="my-products-back-btn"
          onClick={goToDashboard}
        >
          ← Back to Dashboard
        </button>

        {/* ERROR MESSAGE */}

        {error && (
          <div
            className="my-products-error"
            role="alert"
          >
            <p>⚠️ {error}</p>

            <button
              type="button"
              onClick={() =>
                fetchMyProducts(undefined, true)
              }
            >
              Try Again
            </button>
          </div>
        )}

        {/* SUCCESS MESSAGE */}

        {success && (
          <p
            className="my-products-success"
            role="status"
          >
            ✓ {success}
          </p>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="my-products-loading">
            <div className="my-products-loader">
              📦
            </div>

            <h2>Loading Your Products...</h2>

            <p>
              Fetching products from your
              C-Mart account.
            </p>
          </div>
        ) : error && products.length === 0 ? null : products.length === 0 ? (

          /* EMPTY PRODUCTS */

          <div className="my-products-empty">
            <div className="my-products-empty-icon">
              📦
            </div>

            <h2>No Products Yet</h2>

            <p>
              You haven't uploaded any products.
              Start selling your unused college
              items on C-Mart.
            </p>

            <button
              type="button"
              onClick={() => navigate("/sell")}
            >
              + Sell Your First Product
            </button>
          </div>

        ) : (

          /* PRODUCT GRID */

          <div className="my-products-grid">
            {products.map((product) => {
              const productId =
                product._id || product.id;

              return (
                <article
                  className="my-product-card"
                  key={productId}
                >
                  <div className="my-product-image-wrapper">
                    <MyProductImage
                      product={product}
                    />

                    <span className="my-product-condition">
                      {product.condition || "Used"}
                    </span>
                  </div>

                  <div className="my-product-info">
                    <span className="my-product-category">
                      {product.category ||
                        "General"}
                    </span>

                    <h3>
                      {product.name ||
                        "Unnamed Product"}
                    </h3>

                    <h2>
                      ₹
                      {Number(
                        product.price || 0
                      ).toLocaleString("en-IN")}
                    </h2>

                    <p>
                      Stock: {product.stock ?? 1}
                    </p>

                    <div className="my-product-actions">
                      <button
                        type="button"
                        className="view-btn"
                        onClick={() =>
                          navigate(
                            `/product/${productId}`
                          )
                        }
                      >
                        View Details
                      </button>

                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() =>
                          deleteProduct(productId)
                        }
                        disabled={
                          deletingId === productId
                        }
                      >
                        {deletingId === productId
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* FOOTER */}

      <footer className="my-products-footer">
        <strong>🛍️ C-Mart</strong>

        <p>
          Campus Marketplace • Buy • Sell •
          Swap • Rent
        </p>
      </footer>
    </div>
  );
}

export default MyProducts;
