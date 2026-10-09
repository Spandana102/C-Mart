
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./ProductDetails.css";

const API_URL = "http://localhost:5000/api";

function getImageUrl(image) {
  if (!image) return "";

  if (typeof image === "string") {
    return image.startsWith("http")
      ? image
      : `http://localhost:5000/${image.replace(/^\/+/, "")}`;
  }

  if (typeof image === "object") {
    return (
      image.url ||
      image.secure_url ||
      image.path ||
      image.imageUrl ||
      ""
    );
  }

  return "";
}

function ProductDetails() {
  const { id, productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentId = productId || id;

  useEffect(() => {
    let active = true;

    async function fetchProduct() {
      if (!currentId) {
        setError("Product ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        const response = await axios.get(
          `${API_URL}/products/${currentId}`,
          token
            ? {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            : {}
        );

        const data = response.data;
        const item = data.product || data.data || data;

        if (active) {
          setProduct(item);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load product details. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchProduct();

    return () => {
      active = false;
    };
  }, [currentId]);

  const imageSource = product
    ? getImageUrl(
        product.images?.[0] ||
          product.image ||
          product.imageUrl ||
          product.productImage
      )
    : "";

  const price = product
    ? product.price ?? product.rentPrice ?? product.amount
    : null;

  const seller =
    product?.seller?.fullName ||
    product?.seller?.name ||
    product?.sellerName ||
    product?.owner?.fullName ||
    "Seller information unavailable";

  const handleBuyNow = () => {
    if (!product) return;

    navigate("/buy", {
      state: { product },
    });
  };

  if (loading) {
    return (
      <div className="product-details-page">
        <div className="product-details-message">
          Loading product details...
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-details-page">
        <button
          className="pd-back-btn"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <div className="product-details-message">
          {error || "Product not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="product-details-page">
      <header className="pd-header">
        <button
          className="pd-back-btn"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <h2>C-Mart</h2>
        <span className="pd-header-label">Product Details</span>
      </header>

      <main className="pd-container">
        <div className="pd-image-section">
          {imageSource ? (
            <img
              src={imageSource}
              alt={product.name || product.title || "Product"}
              className="pd-product-image"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="pd-no-image">
              No Image Available
            </div>
          )}
        </div>

        <section className="pd-info-section">
          <span className="pd-category">
            {product.category || "General"}
          </span>

          <h1>{product.name || product.title || "Untitled Product"}</h1>

          <p className="pd-price">
            {price !== null && price !== undefined
              ? `₹${price}`
              : "Price not available"}
          </p>

          <p className="pd-condition">
            Condition: {product.condition || "Not specified"}
          </p>

          <div className="pd-divider" />

          <h3>Description</h3>
          <p className="pd-description">
            {product.description || "No description available."}
          </p>

          <div className="pd-divider" />

          <h3>Seller Information</h3>
          <p className="pd-seller">
            <strong>Seller:</strong> {seller}
          </p>

          {product.location && (
            <p className="pd-seller">
              <strong>Location:</strong> {product.location}
            </p>
          )}

          {product.college && (
            <p className="pd-seller">
              <strong>College:</strong> {product.college}
            </p>
          )}

          <div className="pd-actions">
            <button
              className="pd-buy-btn"
              onClick={handleBuyNow}
            >
              Buy Now
            </button>

            <button
              className="pd-home-btn"
              onClick={() => navigate("/")}
            >
              Back to Dashboard
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ProductDetails;