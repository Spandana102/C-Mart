import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./ProductDetails.css";

const API_URL = "http://localhost:5000/api";

function getImageUrl(image) {
if (typeof image === "string") return image;

if (image && typeof image === "object") {
return image.url || image.secure_url || image.imageUrl || "";
}

return "";
}

function ProductDetails() {
const { id } = useParams();
const navigate = useNavigate();

const [product, setProduct] = useState(null);
const [activeImage, setActiveImage] = useState("");
const [reviews, setReviews] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [reviewLoading, setReviewLoading] = useState(false);

useEffect(() => {
let cancelled = false;

```
async function fetchProduct() {
  setLoading(true);
  setError("");

  try {
    if (!id) {
      throw new Error("Product ID is missing from the URL.");
    }

    let foundProduct;

    try {
      const response = await axios.get(
        `${API_URL}/products/${id}`
      );

      foundProduct =
        response.data?.product ??
        response.data?.data ??
        response.data;
    } catch (detailError) {
      const response = await axios.get(`${API_URL}/products`);

      const list = Array.isArray(response.data)
        ? response.data
        : response.data?.products ??
          response.data?.data ??
          [];

      foundProduct = list.find(
        (item) => String(item._id) === String(id)
      );

      if (!foundProduct && !list.length) {
        throw detailError;
      }
    }

    if (!foundProduct?._id) {
      throw new Error("Product not found.");
    }

    if (cancelled) return;

    setProduct(foundProduct);

    const productImages = [
      ...(Array.isArray(foundProduct.images)
        ? foundProduct.images.map(getImageUrl)
        : []),
      getImageUrl(foundProduct.image),
      getImageUrl(foundProduct.imageUrl),
      getImageUrl(foundProduct.photo),
      getImageUrl(foundProduct.thumbnail),
    ].filter(Boolean);

    setActiveImage([...new Set(productImages)][0] || "");
  } catch (err) {
    if (!cancelled) {
      console.error("Product details error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load product details."
      );
    }
  } finally {
    if (!cancelled) setLoading(false);
  }
}

fetchProduct();

return () => {
  cancelled = true;
};
```

}, [id]);

useEffect(() => {
let cancelled = false;

```
async function fetchReviews() {
  if (!id) return;

  setReviewLoading(true);

  try {
    const response = await axios.get(
      `${API_URL}/reviews/product/${id}`
    );

    const data =
      response.data?.reviews ??
      response.data?.data ??
      response.data;

    if (!cancelled && Array.isArray(data)) {
      setReviews(data);
    }
  } catch (err) {
    console.warn("Could not load reviews:", err.message);
  } finally {
    if (!cancelled) setReviewLoading(false);
  }
}

fetchReviews();

return () => {
  cancelled = true;
};
```

}, [id]);

function selectOption(type) {
if (!product) return;

```
const token = localStorage.getItem("token");

let user = null;

try {
  user = JSON.parse(localStorage.getItem("user") || "null");
} catch {
  user = null;
}

if (!token || !user) {
  alert("Please login to continue.");
  navigate("/login");
  return;
}

const sellerId =
  typeof product.sellerId === "object"
    ? product.sellerId?._id
    : product.sellerId;

const currentUserId = user._id || user.id || user.userId;

if (
  sellerId &&
  currentUserId &&
  String(sellerId) === String(currentUserId)
) {
  alert("You cannot send a request for your own product.");
  return;
}

if (type === "Bargain") {
  navigate("/bargain", {
    state: { product, requestType: "Bargain" },
  });
} else if (type === "Buy") {
  navigate("/meetpoint", {
    state: { product, requestType: "Buy" },
  });
}
```

}

if (loading) {
return ( <div className="pd-page"> <div className="pd-message"> <h2>Loading product details...</h2> <p>Please wait.</p> </div> </div>
);
}

if (error || !product) {
return ( <div className="pd-page"> <header className="pd-navbar">
<button
type="button"
className="pd-logo"
onClick={() => navigate("/")}
>
🛍️ C-Mart </button>

```
      <button
        type="button"
        className="pd-back"
        onClick={() => navigate("/products")}
      >
        ← Marketplace
      </button>
    </header>

    <main className="pd-container">
      <div className="pd-message">
        <h2>Unable to load product</h2>
        <p>{error || "Product not found."}</p>

        <button
          type="button"
          className="pd-back"
          onClick={() => navigate("/products")}
        >
          Back to Marketplace
        </button>
      </div>
    </main>
  </div>
);
```

}

const images = [
...(Array.isArray(product.images)
? product.images.map(getImageUrl)
: []),
getImageUrl(product.image),
getImageUrl(product.imageUrl),
getImageUrl(product.photo),
getImageUrl(product.thumbnail),
].filter(Boolean);

const uniqueImages = [...new Set(images)];
const stock = Number(product.stock ?? 0);

const sellerName =
typeof product.sellerId === "object"
? product.sellerId?.fullName ||
product.sellerId?.name ||
"Campus Seller"
: product.sellerName || "Campus Seller";

const averageRating =
reviews.length > 0
? (
reviews.reduce(
(total, review) =>
total + (Number(review.rating) || 0),
0
) / reviews.length
).toFixed(1)
: null;

return ( <div className="pd-page"> <header className="pd-navbar">
<button
type="button"
className="pd-logo"
onClick={() => navigate("/")}
>
🛍️ C-Mart </button>

```
    <button
      type="button"
      className="pd-back"
      onClick={() => navigate("/products")}
    >
      ← Marketplace
    </button>
  </header>

  <main className="pd-container">
    <p className="pd-breadcrumb">
      Marketplace / {product.category || "Products"} /{" "}
      {product.name || "Product"}
    </p>

    <div className="pd-layout">
      <section className="pd-gallery">
        <div className="pd-main-image">
          {activeImage ? (
            <img
              src={activeImage}
              alt={product.name || "Product"}
              onError={() => {
                const nextImage = uniqueImages.find(
                  (image) => image !== activeImage
                );
                setActiveImage(nextImage || "");
              }}
            />
          ) : (
            <div className="pd-no-image">
              <span>📦</span>
              <span>Image unavailable</span>
            </div>
          )}
        </div>

        {uniqueImages.length > 1 && (
          <div className="pd-thumbnails">
            {uniqueImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className={
                  activeImage === image
                    ? "pd-thumb active"
                    : "pd-thumb"
                }
                onClick={() => setActiveImage(image)}
                aria-label={`View product image ${index + 1}`}
              >
                <img
                  src={image}
                  alt={`Product view ${index + 1}`}
                />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="pd-info">
        <span className="pd-category">
          {product.category || "Campus Product"}
        </span>

        <h1>{product.name || "Untitled Product"}</h1>

        <div className="pd-price">
          ₹{Number(product.price || 0).toLocaleString("en-IN")}
        </div>

        {Number(product.mrp) > Number(product.price) && (
          <p className="pd-mrp">
            Original price:{" "}
            <s>
              ₹{Number(product.mrp).toLocaleString("en-IN")}
            </s>
          </p>
        )}

        <div className="pd-divider" />

        <h3>Product Description</h3>
        <p className="pd-description">
          {product.description ||
            "No description provided by the seller."}
        </p>

        <div className="pd-facts">
          <div>
            <span>Condition</span>
            <strong>{product.condition || "Not specified"}</strong>
          </div>

          <div>
            <span>Brand</span>
            <strong>{product.brand || "Not specified"}</strong>
          </div>

          <div>
            <span>Available Stock</span>
            <strong>{product.stock ?? "Not specified"}</strong>
          </div>
        </div>

        <div className="pd-divider" />

        <h3>Seller Information</h3>
        <p>{sellerName}</p>

        <h3 className="pd-choice-title">
          What would you like to do?
        </h3>

        <p className="pd-note">
          Choose an option to continue with this product.
        </p>

        <div className="pd-actions">
          <button
            type="button"
            className="pd-bargain"
            disabled={stock <= 0}
            onClick={() => selectOption("Bargain")}
          >
            💬 Bargain
          </button>

          <button
            type="button"
            className="pd-buy"
            disabled={stock <= 0}
            onClick={() => selectOption("Buy")}
          >
            🛒 Buy Now
          </button>
        </div>

        <p className="pd-note">
          {stock <= 0
            ? "This product is currently out of stock."
            : "Your request may require seller confirmation before it is finalized."}
        </p>
      </section>
    </div>

    <section className="pd-reviews">
      <h2>Reviews & Ratings</h2>

      {averageRating !== null && (
        <p className="pd-average-rating">
          ⭐ {averageRating} / 5 ({reviews.length}{" "}
          {reviews.length === 1 ? "review" : "reviews"})
        </p>
      )}

      {reviewLoading ? (
        <p>Loading reviews...</p>
      ) : reviews.length > 0 ? (
        <div className="pd-review-list">
          {reviews.map((review, index) => (
            <article
              className="pd-review-item"
              key={review._id || index}
            >
              <h4>
                {review.user?.fullName ||
                  review.user?.name ||
                  review.userName ||
                  "Campus User"}
              </h4>

              <p>
                {"⭐".repeat(
                  Math.max(
                    0,
                    Math.min(5, Number(review.rating) || 0)
                  )
                )}{" "}
                ({Number(review.rating) || 0}/5)
              </p>

              <p>
                {review.comment ||
                  review.review ||
                  "No written comment."}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p>
          No reviews available yet. Reviews will appear here
          when users submit ratings and comments.
        </p>
      )}
      ```jsx
      </section>
    </main>
  </div>
  );
}

export default ProductDetails;
```
