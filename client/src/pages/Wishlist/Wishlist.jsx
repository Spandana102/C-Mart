
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Wishlist.css";

const API_URL = "http://localhost:5000/api";
const SERVER_URL = "http://localhost:5000";
const DASHBOARD_PATH = "/dashboard";

// ========================================
// GET PRODUCT IMAGE
// ========================================

function getImageUrl(image) {
  if (!image) return "";

  if (Array.isArray(image)) {
    return image.map(getImageUrl).find(Boolean) || "";
  }

  if (typeof image === "object") {
    return getImageUrl(
      image.secure_url ||
        image.url ||
        image.imageUrl ||
        image.path ||
        image.src ||
        ""
    );
  }

  const value = String(image)
    .trim()
    .replace(/\\/g, "/");

  if (!value) return "";

  if (
    /^https?:\/\//i.test(value) ||
    value.startsWith("data:image/") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  return `${SERVER_URL}/${value.replace(/^\/+/, "")}`;
}

function getProductImage(product) {
  return getImageUrl(
    product?.images ||
      product?.image ||
      product?.imageUrl ||
      product?.productImage
  );
}

// ========================================
// NORMALIZE SAVED WISHLIST ITEMS
// ========================================

function extractSavedProducts(data) {
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.wishlist)
    ? data.wishlist
    : Array.isArray(data?.data?.wishlist)
    ? data.data.wishlist
    : [];

  const products = items
    .map((item) => {
      if (
        item?.product &&
        typeof item.product === "object"
      ) {
        return item.product;
      }

      if (
        item?.productId &&
        typeof item.productId === "object"
      ) {
        return item.productId;
      }

      return item;
    })
    .filter(
      (product) =>
        product &&
        typeof product === "object" &&
        (product._id || product.id)
    );

  return [
    ...new Map(
      products.map((product) => [
        String(product._id || product.id),
        product,
      ])
    ).values(),
  ];
}

// ========================================
// PRODUCT IMAGE COMPONENT
// ========================================

function WishlistProductImage({ product, name }) {
  const imageUrl = getProductImage(product);
  const [failedUrl, setFailedUrl] = useState("");

  if (!imageUrl || failedUrl === imageUrl) {
    return <span>🛍️</span>;
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      loading="lazy"
      onError={() => setFailedUrl(imageUrl)}
    />
  );
}

// ========================================
// MY WISHLIST COMPONENT
// ========================================

function Wishlist() {
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  // ========================================
  // DASHBOARD NAVIGATION
  // ========================================

  const goToDashboard = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    navigate(DASHBOARD_PATH);
  };

  // ========================================
  // FETCH LOGGED-IN USER WISHLIST
  // ========================================

  const fetchWishlist = useCallback(
    async (signal) => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `${API_URL}/wishlist`,
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
            response.data.message ||
              "Unable to load wishlist."
          );
        }

        const savedProducts =
          extractSavedProducts(response.data);

        if (!signal?.aborted) {
          setWishlist(savedProducts);
        }
      } catch (err) {
        if (
          axios.isCancel(err) ||
          err.code === "ERR_CANCELED"
        ) {
          return;
        }

        console.error(
          "Wishlist Fetch Error:",
          err.response?.data || err.message
        );

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          navigate("/login", { replace: true });
          return;
        }

        if (!signal?.aborted) {
          setWishlist([]);
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load wishlist."
          );
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [navigate]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchWishlist(controller.signal);

    return () => controller.abort();
  }, [fetchWishlist]);

  // ========================================
  // REMOVE PRODUCT FROM WISHLIST
  // ========================================

  const removeFromWishlist = async (productId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setRemovingId(String(productId));
      setError("");

      const response = await axios.delete(
        `${API_URL}/wishlist/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 30000,
        }
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data.message ||
            "Unable to remove product."
        );
      }

      setWishlist((previous) =>
        previous.filter(
          (product) =>
            String(product._id || product.id) !==
            String(productId)
        )
      );
    } catch (err) {
      console.error(
        "Remove Wishlist Error:",
        err.response?.data || err.message
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
          "Unable to remove product."
      );
    } finally {
      setRemovingId(null);
    }
  };

  // ========================================
  // WISHLIST UI
  // ========================================

  return (
    <div className="wishlist-page">
      {/* HEADER */}

      <header className="wishlist-header">
        <button
          type="button"
          onClick={goToDashboard}
        >
          ← Dashboard
        </button>

        <h1>❤️ My Wishlist</h1>

        <p>
          Only products saved from Product Details
        </p>
      </header>

      {/* MAIN CONTENT */}

      <main className="wishlist-container">
        {loading ? (
          <div className="wishlist-empty">
            <p>Loading your wishlist...</p>
          </div>
        ) : error && wishlist.length === 0 ? (
          <div className="wishlist-empty">
            <h2>Unable to load Wishlist</h2>

            <p>{error}</p>

            <button
              type="button"
              onClick={() => fetchWishlist()}
            >
              Try Again
            </button>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="wishlist-empty">
            <h2>♡ Your Wishlist is Empty</h2>

            <p>
              You haven't saved any products yet.
              Open Product Details and click
              Add to Wishlist.
            </p>

            <button
              type="button"
              onClick={() => navigate("/products")}
            >
              Explore Products
            </button>
          </div>
        ) : (
          <>
            {error && (
              <p role="alert" className="wishlist-error">
                {error}
              </p>
            )}

            <h2>
              My Saved Products ({wishlist.length})
            </h2>

            <div className="wishlist-grid">
              {wishlist.map((product) => {
                const productId =
                  product._id || product.id;

                const name =
                  product.name ||
                  product.productName ||
                  product.title ||
                  "Product";

                const price =
                  product.price ??
                  product.amount ??
                  product.rentPrice;

                return (
                  <article
                    className="wishlist-card"
                    key={productId}
                  >
                    <div className="wishlist-image">
                      <WishlistProductImage
                        product={product}
                        name={name}
                      />
                    </div>

                    <div className="wishlist-info">
                      <h3>{name}</h3>

                      <p className="wishlist-price">
                        {price != null &&
                        price !== "" &&
                        Number.isFinite(Number(price))
                          ? `₹${Number(
                              price
                            ).toLocaleString("en-IN")}`
                          : "Price not available"}
                      </p>

                      {product.condition && (
                        <p>
                          Condition: {product.condition}
                        </p>
                      )}

                      <div className="wishlist-actions">
                        <button
                          type="button"
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
                          className="wishlist-remove"
                          disabled={
                            removingId === String(productId)
                          }
                          onClick={() =>
                            removeFromWishlist(productId)
                          }
                        >
                          {removingId === String(productId)
                            ? "Removing..."
                            : "♥ Remove"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Wishlist;
