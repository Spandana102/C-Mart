



import { useEffect, useState } from "react";



import axios from "axios";



import { useNavigate, useParams } from "react-router-dom";


import "./ProductDetails.css";

import { API_ORIGIN, API_URL } from "../../services/apiConfig";

const SERVER_URL = API_ORIGIN;



// ==========================================



// IMAGE HELPERS



// ==========================================



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



      image.src



    );



  }



  const value = String(image).trim().replace(/\\/g, "/");



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



function getProductImages(product) {



  const raw = [



    ...(Array.isArray(product?.images)



      ? product.images



      : product?.images



      ? [product.images]



      : []),



    product?.image,



    product?.imageUrl,



    product?.productImage,



  ];



  return [



    ...new Set(raw.map(getImageUrl).filter(Boolean)),



  ];



}



// ==========================================



// STAR RATING COMPONENT



// ==========================================



function StarRating({ rating, size = 22 }) {



  const value = Math.max(



    0,



    Math.min(5, Number(rating) || 0)



  );



  return (



    <span



      style={{



        color: "#f59e0b",



        fontSize: size,



      }}



      aria-label={`${value} out of 5 stars`}



    >



      {[1, 2, 3, 4, 5].map((star) => (



        <span key={star}>



          {star <= Math.round(value) ? "★" : "☆"}



        </span>



      ))}



    </span>



  );



}



// ==========================================



// DATA HELPERS



// ==========================================



function extractReviews(data) {



  if (Array.isArray(data)) return data;



  if (Array.isArray(data?.reviews)) return data.reviews;



  if (Array.isArray(data?.data)) return data.data;



  return [];



}



function extractWishlist(data) {



  if (Array.isArray(data)) return data;



  if (Array.isArray(data?.wishlist)) return data.wishlist;



  if (Array.isArray(data?.items)) return data.items;



  if (Array.isArray(data?.products)) return data.products;



  if (Array.isArray(data?.data)) return data.data;



  return [];



}



function getSavedProductId(item) {



  const product =



    item?.productId ||



    item?.product ||



    item;



  if (



    typeof product === "object" &&



    product !== null



  ) {



    return String(product._id || product.id || "");



  }



  return String(product || "");



}



// ==========================================



// PRODUCT DETAILS COMPONENT



// ==========================================



function ProductDetails() {



  const { id, productId } = useParams();



  const navigate = useNavigate();

  // Return authenticated users to their dashboard.
  // If the session token is missing, send them to login.
  const goToDashboard = () => {
    const savedToken = localStorage.getItem("token");

    if (!savedToken) {
      navigate("/login", { replace: true });
      return;
    }

    navigate("/dashboard", { replace: true });
  };



  const currentId = productId || id;



  // ========================================



  // PRODUCT STATES



  // ========================================



  const [product, setProduct] = useState(null);



  const [images, setImages] = useState([]);



  const [activeImage, setActiveImage] = useState("");



  const [imageFailed, setImageFailed] = useState(false);



  const [loading, setLoading] = useState(true);



  const [error, setError] = useState("");



  // ========================================



  // WISHLIST STATES



  // ========================================



  const [isWishlisted, setIsWishlisted] = useState(false);



  const [wishlistLoading, setWishlistLoading] =



    useState(false);



  const [wishlistChecking, setWishlistChecking] =



    useState(true);



  const [wishlistError, setWishlistError] =



    useState("");



  const [wishlistMessage, setWishlistMessage] =



    useState("");



  // ========================================



  // REVIEWS STATES



  // ========================================



  const [reviews, setReviews] = useState([]);



  const [reviewsLoading, setReviewsLoading] =



    useState(true);



  const [reviewsError, setReviewsError] =



    useState("");



  const [rating, setRating] = useState(5);



  const [comment, setComment] = useState("");



  const [reviewLoading, setReviewLoading] =



    useState(false);



  const [reviewMessage, setReviewMessage] =



    useState("");



  const [reviewError, setReviewError] =



    useState("");



  // ========================================



  // REPORT STATES



  // ========================================



  const [showReportForm, setShowReportForm] =



    useState(false);



  const [reportReason, setReportReason] =



    useState("");



  const [reportDescription, setReportDescription] =



    useState("");



  const [reportLoading, setReportLoading] =



    useState(false);



  const [reportError, setReportError] =



    useState("");



  const [reportSuccess, setReportSuccess] =



    useState("");



  const token = localStorage.getItem("token");



  const authHeaders = () => ({



    headers: {



      Authorization: `Bearer ${localStorage.getItem(



        "token"



      )}`,



    },



  });



  // ========================================



  // FETCH PRODUCT DETAILS



  // ========================================



  useEffect(() => {



    let active = true;



    const fetchProduct = async () => {



      try {



        setLoading(true);



        setError("");



        const response = await axios.get(



          `${API_URL}/products/${currentId}`



        );



        const item =



          response.data.product ||



          response.data.data ||



          response.data;



        if (!active) return;



        if (



          !item ||



          typeof item !== "object" ||



          Array.isArray(item)



        ) {



          throw new Error("Invalid product data.");



        }



        const productImages =



          getProductImages(item);



        setProduct(item);



        setImages(productImages);



        setActiveImage(productImages[0] || "");



        setImageFailed(false);



      } catch (err) {



        if (active) {



          setError(



            err.response?.data?.message ||



            err.message ||



            "Unable to load product."



          );



        }



      } finally {



        if (active) {



          setLoading(false);



        }



      }



    };



    if (currentId) {



      fetchProduct();



    } else {



      setLoading(false);



      setError("Product ID is missing.");



    }



    return () => {



      active = false;



    };



  }, [currentId]);



  // ========================================



  // CHECK IF PRODUCT IS IN WISHLIST



  // ========================================



  useEffect(() => {



    let active = true;



    const checkWishlist = async () => {



      setIsWishlisted(false);



      setWishlistError("");



      setWishlistMessage("");



      const savedToken =



        localStorage.getItem("token");



      if (!currentId || !savedToken) {



        setWishlistChecking(false);



        return;



      }



      try {



        setWishlistChecking(true);



        const response = await axios.get(



          `${API_URL}/wishlist`,



          {



            headers: {



              Authorization: `Bearer ${savedToken}`,



            },



          }



        );



        const items =



          extractWishlist(response.data);



        const alreadySaved = items.some(



          (item) =>



            getSavedProductId(item) ===



            String(currentId)



        );



        if (active) {



          setIsWishlisted(alreadySaved);



        }



      } catch (err) {



        if (active) {



          setWishlistError(



            err.response?.data?.message ||



            "Unable to check wishlist status."



          );



        }



      } finally {



        if (active) {



          setWishlistChecking(false);



        }



      }



    };



    checkWishlist();



    return () => {



      active = false;



    };



  }, [currentId]);



  // ========================================



  // ADD / REMOVE WISHLIST



  // ========================================



  const toggleWishlist = async () => {



    const savedToken =



      localStorage.getItem("token");



    if (!savedToken) {



      alert("Please login to use Wishlist.");



      navigate("/login");



      return;



    }



    if (



      !currentId ||



      wishlistLoading ||



      wishlistChecking



    ) {



      return;



    }



    try {



      setWishlistLoading(true);



      setWishlistError("");



      setWishlistMessage("");



      if (isWishlisted) {



        // Remove only this saved product



        await axios.delete(



          `${API_URL}/wishlist/${currentId}`,



          {



            headers: {



              Authorization: `Bearer ${savedToken}`,



            },



          }



        );



        setIsWishlisted(false);



        setWishlistMessage(



          "Product removed from your wishlist."



        );



      } else {



        // Save product only when user clicks



        await axios.post(



          `${API_URL}/wishlist/${currentId}`,



          {},



          {



            headers: {



              Authorization: `Bearer ${savedToken}`,



            },



          }



        );



        setIsWishlisted(true);



        setWishlistMessage(



          "Product added to your wishlist!"



        );



      }



    } catch (err) {



      console.error(



        "Wishlist action error:",



        err.response?.data || err.message



      );



      setWishlistError(



        err.response?.data?.message ||



        "Wishlist action failed."



      );



    } finally {



      setWishlistLoading(false);



    }



  };



  // ========================================



  // FETCH REVIEWS



  // ========================================



  const fetchReviews = async () => {



    if (!currentId) return;



    try {



      setReviewsLoading(true);



      setReviewsError("");



      const response = await axios.get(



        `${API_URL}/reviews`,



        {



          params: {



            product: currentId,



          },



        }



      );



      const filtered = extractReviews(



        response.data



      ).filter((review) => {



        const value =



          review.product ||



          review.productId;



        const reviewProductId =



          typeof value === "object"



            ? value?._id || value?.id



            : value;



        return (



          String(reviewProductId) ===



          String(currentId)



        );



      });



      setReviews(filtered);



    } catch (err) {



      setReviewsError(



        err.response?.data?.message ||



        "Unable to load reviews."



      );



    } finally {



      setReviewsLoading(false);



    }



  };



  useEffect(() => {



    fetchReviews();



  }, [currentId]);



  // ========================================



  // RATING CALCULATIONS



  // ========================================



  const totalReviews = reviews.length;



  const averageRating = totalReviews



    ? reviews.reduce(



        (sum, review) =>



          sum + (Number(review.rating) || 0),



        0



      ) / totalReviews



    : 0;



  const ratingCounts = [5, 4, 3, 2, 1].map(



    (star) => ({



      star,



      count: reviews.filter(



        (review) =>



          Number(review.rating) === star



      ).length,



    })



  );



  // ========================================



  // PRODUCT INFORMATION



  // ========================================



  const price =



    product?.price ??



    product?.rentPrice ??



    product?.amount;



  const sellerData =



    product?.sellerId ||



    product?.seller ||



    product?.owner;



  const sellerId =



    typeof sellerData === "object" &&



    sellerData !== null



      ? sellerData._id || sellerData.id



      : sellerData;



  const seller =



    (



      typeof sellerData === "object" &&



      sellerData !== null



        ? sellerData.fullName ||



          sellerData.name



        : null



    ) ||



    product?.sellerName ||



    "Seller information unavailable";



  const college =



    product?.college ||



    (



      typeof sellerData === "object" &&



      sellerData !== null



        ? sellerData.college ||



          sellerData.collegeName ||



          sellerData.collegeId



        : null



    );



  const hasSeller = Boolean(sellerId);



  const isOutOfStock =



    product?.stock != null &&



    Number(product.stock) <= 0;



  const validPrice =



    price != null &&



    Number.isFinite(Number(price)) &&



    Number(price) > 0;



  // ========================================



  // BARGAIN FUNCTION



  // ========================================



  // ========================================

  // CHAT WITH SELLER

  // ========================================



  const handleChatWithSeller = () => {

    const savedToken = localStorage.getItem("token");



    if (!savedToken) {

      navigate("/login");

      return;

    }



    if (!hasSeller) {

      alert("Seller information is unavailable for this product.");

      return;

    }



    navigate(

      `/chat?sellerId=${encodeURIComponent(String(sellerId))}&productId=${encodeURIComponent(String(currentId))}`

    );

  };



  const handleBargain = () => {



    if (!token) {



      navigate("/login");



      return;



    }



    if (!hasSeller) {



      alert(



        "Seller information is unavailable."



      );



      return;



    }



    navigate(



      `/bargain?productId=${encodeURIComponent(



        currentId



      )}`,



      {



        state: {



          product: {



            ...product,



            _id: product._id || currentId,



          },



          productId: currentId,



          sellerId,



        },



      }



    );



  };



  // ========================================



  // BUY NOW FUNCTION



  // ========================================



  const handleBuyNow = () => {



    if (!token) {



      navigate("/login");



      return;



    }



    if (



      !hasSeller ||



      !validPrice ||



      isOutOfStock



    ) {



      alert(



        "This product is currently unavailable for purchase."



      );



      return;



    }



    const selectedProduct = {



      ...product,



      _id: product._id || currentId,



    };



    navigate("/meetpoint", {



      state: {



        source: "buy",



        product: selectedProduct,



        productId: selectedProduct._id,



        sellerId,



        sellerName: seller,



        productName:



          product.name ||



          product.title ||



          "Product",



        price: Number(price),



        quantity: 1,



        image: images[0] || "",



      },



    });



  };



  // ========================================



  // SUBMIT REVIEW



  // ========================================



  const handleReviewSubmit = async (event) => {



    event.preventDefault();



    setReviewError("");



    setReviewMessage("");



    if (!token) {



      setReviewError(



        "Please login to submit a review."



      );



      return;



    }



    if (!comment.trim()) {



      setReviewError(



        "Please write your review."



      );



      return;



    }



    try {



      setReviewLoading(true);



      const response = await axios.post(



        `${API_URL}/reviews`,



        {



          product: currentId,



          rating: Number(rating),



          comment: comment.trim(),



        },



        authHeaders()



      );



      if (response.data?.success === false) {



        throw new Error(



          response.data.message ||



          "Review failed."



        );



      }



      setReviewMessage(



        "Review submitted successfully."



      );



      setComment("");



      setRating(5);



      await fetchReviews();



    } catch (err) {



      setReviewError(



        err.response?.data?.message ||



        err.message ||



        "Unable to submit review."



      );



    } finally {



      setReviewLoading(false);



    }



  };



  // ========================================



  // SUBMIT PRODUCT REPORT



  // ========================================



  const handleReportSubmit = async (event) => {



    event.preventDefault();



    setReportError("");



    setReportSuccess("");



    if (!token) {



      navigate("/login");



      return;



    }



    try {



      setReportLoading(true);



      await axios.post(



        `${API_URL}/reports`,



        {



          reportedProduct: currentId,



          reason: reportReason,



          description:



            reportDescription.trim(),



        },



        authHeaders()



      );



      setReportSuccess(



        "Report submitted successfully."



      );



      setReportReason("");



      setReportDescription("");



      setShowReportForm(false);



    } catch (err) {



      setReportError(



        err.response?.data?.message ||



        "Report submission failed."



      );



    } finally {



      setReportLoading(false);



    }



  };



  // ========================================



  // LOADING SCREEN



  // ========================================



  if (loading) {



    return (



      <div className="product-details-message">



        Loading product details...



      </div>



    );



  }



  // ========================================



  // ERROR SCREEN



  // ========================================



  if (error || !product) {



    return (



      <div className="product-details-page">



        <button



          type="button"



          className="pd-back-btn"



          onClick={() => navigate("/products")}



        >



          ← Back to Marketplace



        </button>



        <p className="product-details-message">



          {error || "Product not found."}



        </p>



      </div>



    );



  }



  // ========================================



  // MAIN PRODUCT DETAILS UI



  // ========================================



  return (



    <div className="product-details-page">



      {/* HEADER */}



      <header className="pd-header">



        <button



          type="button"



          className="pd-back-btn"



          onClick={() => navigate("/products")}



        >



          ← Back



        </button>



        <h2>C-Mart</h2>



        <span className="pd-header-label">



          Product Details



        </span>



      </header>



      {/* PRODUCT DETAILS */}



      <main className="pd-container">



        {/* PRODUCT IMAGES */}



        <div className="pd-image-section">



          <div className="pd-image-frame">



            {activeImage && !imageFailed ? (



              <img



                src={activeImage}



                alt={



                  product.name ||



                  product.title ||



                  "Product"



                }



                className="pd-product-image"



                onError={() =>



                  setImageFailed(true)



                }



              />



            ) : (



              <div className="pd-no-image">



                📦 No Image Available



              </div>



            )}



          </div>



          {images.length > 1 && (



            <div className="pd-thumbnails">



              {images.map((image, index) => (



                <button



                  key={index}



                  type="button"



                  className={`pd-thumbnail ${



                    activeImage === image



                      ? "active"



                      : ""



                  }`}



                  onClick={() => {



                    setActiveImage(image);



                    setImageFailed(false);



                  }}



                >



                  <img



                    src={image}



                    alt={`View ${index + 1}`}



                  />



                </button>



              ))}



            </div>



          )}



        </div>



        {/* PRODUCT INFORMATION */}



        <section className="pd-info-section">



          <span className="pd-category">



            {product.category || "General"}



          </span>



          <h1>



            {product.name ||



              product.title ||



              "Product"}



          </h1>



          {/* RATING SUMMARY */}



          <div className="pd-rating-summary">



            {totalReviews > 0 ? (



              <>



                <StarRating



                  rating={averageRating}



                />



                <strong>



                  {averageRating.toFixed(1)} / 5



                </strong>



                <span>



                  ({totalReviews} reviews)



                </span>



              </>



            ) : (



              <span>No ratings yet</span>



            )}



          </div>



          {/* PRICE */}



          <p className="pd-price">



            {price != null &&



            Number.isFinite(Number(price))



              ? `₹${Number(



                  price



                ).toLocaleString("en-IN")}`



              : "Price not available"}



          </p>



          {/* CONDITION */}



          <p className="pd-condition">



            <strong>Condition:</strong>{" "}



            {product.condition ||



              "Not specified"}



          </p>



          {product.brand && (



            <p className="pd-condition">



              <strong>Brand:</strong>{" "}



              {product.brand}



            </p>



          )}



          {product.stock != null && (



            <p className="pd-condition">



              <strong>Stock:</strong>{" "}



              {product.stock}



            </p>



          )}



          <div className="pd-divider" />



          {/* DESCRIPTION */}



          <h3>Description</h3>



          <p className="pd-description">



            {product.description ||



              "No description available."}



          </p>



          <div className="pd-divider" />



          {/* SELLER */}



          <h3>Seller Information</h3>



          <p className="pd-seller">



            <strong>Seller:</strong>{" "}



            {seller}



          </p>



          {college && (



            <p className="pd-seller">



              <strong>College:</strong>{" "}



              {college}



            </p>



          )}



          {product.location && (



            <p className="pd-seller">



              <strong>Location:</strong>{" "}



              {product.location}



            </p>



          )}



          {!hasSeller && (



            <p



              style={{



                color: "#b45309",



                fontWeight: 600,



              }}



            >



              Seller information is missing.



              Buying and bargaining are



              unavailable.



            </p>



          )}



          {/* ==================================



              ACTION BUTTONS



          ================================== */}



          <div className="pd-actions">



            {/* BUY NOW */}



            <button



              type="button"



              className="pd-buy-btn"



              onClick={handleBuyNow}



              disabled={isOutOfStock}



            >



              {isOutOfStock



                ? "Out of Stock"



                : "Buy Now"}



            </button>



            {/* BARGAIN */}



            <button



              type="button"



              className="pd-bargain-btn"



              onClick={handleBargain}



              disabled={!hasSeller}



            >



              🤝 Bargain



            </button>



            {/* CHAT WITH SELLER */}



            <button

              type="button"

              className="pd-chat-btn"

              onClick={handleChatWithSeller}

              disabled={!hasSeller}

            >

              💬 Chat with Seller

            </button>



            {/* ADD / REMOVE WISHLIST */}



            <button



              type="button"



              className={`pd-wishlist-btn ${



                isWishlisted



                  ? "wishlisted"



                  : ""



              }`}



              onClick={toggleWishlist}



              disabled={



                wishlistLoading ||



                wishlistChecking



              }



              aria-pressed={isWishlisted}



            >



              {wishlistChecking



                ? "Checking Wishlist..."



                : wishlistLoading



                ? "Please wait..."



                : isWishlisted



                ? "♥ Added to Wishlist"



                : "♡ Add to Wishlist"}



            </button>



            {/* VIEW WISHLIST */}



            <button



              type="button"



              className="pd-home-btn"



              onClick={() =>



                navigate("/wishlist")



              }



            >



              ❤️ View My Wishlist



            </button>



            {/* REPORT PRODUCT */}



            <button



              type="button"



              className="pd-report-btn"



              onClick={() => {



                if (!token) {



                  navigate("/login");



                  return;



                }



                setShowReportForm(



                  (previous) => !previous



                );



              }}



            >



              🚩 Report Product



            </button>



            {/* DASHBOARD */}



            <button



              type="button"



              className="pd-home-btn"



              onClick={goToDashboard}



            >



              Back to Dashboard



            </button>



          </div>



          {/* WISHLIST MESSAGES */}



          {wishlistMessage && (



            <p



              role="status"



              style={{



                color: "#15803d",



                fontWeight: 600,



                marginTop: 14,



              }}



            >



              {wishlistMessage}



            </p>



          )}



          {wishlistError && (



            <p



              role="alert"



              style={{



                color: "#dc2626",



                marginTop: 14,



              }}



            >



              {wishlistError}



            </p>



          )}



          {/* REPORT SUCCESS */}



          {reportSuccess && (



            <p



              role="status"



              style={{



                color: "#15803d",



              }}



            >



              {reportSuccess}



            </p>



          )}



          {/* ==================================



              REPORT FORM



          ================================== */}



          {showReportForm && (



            <form



              onSubmit={handleReportSubmit}



              style={{



                display: "grid",



                gap: 12,



                marginTop: 20,



                padding: 20,



                background: "#ffffff",



                border:



                  "1px solid #e5e7eb",



                borderRadius: 12,



              }}



            >



              <h3>Report this product</h3>



              <label>



                Reason for reporting



              </label>



              <select



                value={reportReason}



                onChange={(e) =>



                  setReportReason(



                    e.target.value



                  )



                }



                required



              >



                <option value="">



                  Select a reason



                </option>



                <option value="Fake Product">



                  Fake Product



                </option>



                <option value="Wrong Information">



                  Wrong Information



                </option>



                <option value="Inappropriate Content">



                  Inappropriate Content



                </option>



                <option value="Fraud or Scam">



                  Fraud or Scam



                </option>



                <option value="Other">



                  Other



                </option>



              </select>



              <label>



                Description (optional)



              </label>



              <textarea



                rows={4}



                maxLength={1000}



                value={reportDescription}



                onChange={(e) =>



                  setReportDescription(



                    e.target.value



                  )



                }



              />



              {reportError && (



                <p



                  style={{



                    color: "#dc2626",



                  }}



                >



                  {reportError}



                </p>



              )}



              <div className="pd-actions">



                <button



                  type="submit"



                  disabled={reportLoading}



                >



                  {reportLoading



                    ? "Submitting..."



                    : "Submit Report"}



                </button>



                <button



                  type="button"



                  onClick={() =>



                    setShowReportForm(false)



                  }



                >



                  Cancel



                </button>



              </div>



            </form>



          )}



        </section>



      </main>



      {/* ==================================



          REVIEWS AND RATINGS



      ================================== */}



      <section className="pd-reviews-section">



        <div className="pd-reviews-header">



          <h2>



            ⭐ Customer Ratings & Reviews



          </h2>



          <p>



            See what students say about



            this product.



          </p>



        </div>



        {/* RATING OVERVIEW */}



        <div className="pd-rating-overview">



          <div className="pd-rating-score">



            <h2>



              {averageRating.toFixed(1)}



              <span> / 5</span>



            </h2>



            <StarRating



              rating={averageRating}



              size={28}



            />



            <p>



              {totalReviews} customer reviews



            </p>



          </div>



          {/* RATING BARS */}



          <div className="pd-rating-bars">



            {ratingCounts.map(



              ({ star, count }) => (



                <div



                  className="pd-rating-bar-row"



                  key={star}



                >



                  <span>{star} ★</span>



                  <div className="pd-rating-bar-track">



                    <div



                      className="pd-rating-bar-fill"



                      style={{



                        width: totalReviews



                          ? `${



                              (count /



                                totalReviews) *



                              100



                            }%`



                          : "0%",



                      }}



                    />



                  </div>



                  <span>{count}</span>



                </div>



              )



            )}



          </div>



        </div>



        <div className="pd-divider" />



        {/* WRITE REVIEW */}



        <h3>Write a Review</h3>



        {!token ? (



          <p>



            Please{" "}



            <button



              type="button"



              onClick={() =>



                navigate("/login")



              }



            >



              log in



            </button>{" "}



            to submit a review.



          </p>



        ) : (



          <form



            className="pd-review-form"



            onSubmit={handleReviewSubmit}



          >



            <label>Your Rating</label>



            <div className="pd-star-picker">



              {[1, 2, 3, 4, 5].map(



                (star) => (



                  <button



                    key={star}



                    type="button"



                    className={`pd-star-button ${



                      star <= rating



                        ? "selected"



                        : ""



                    }`}



                    onClick={() =>



                      setRating(star)



                    }



                  >



                    ★



                  </button>



                )



              )}



            </div>



            <label>Your Review</label>



            <textarea



              value={comment}



              onChange={(e) =>



                setComment(e.target.value)



              }



              rows={4}



              maxLength={1000}



              required



              placeholder="Share your experience..."



            />



            <button



              type="submit"



              className="pd-submit-review-btn"



              disabled={reviewLoading}



            >



              {reviewLoading



                ? "Submitting..."



                : "Submit Review"}



            </button>



          </form>



        )}



        {reviewMessage && (



          <p className="pd-review-success">



            {reviewMessage}



          </p>



        )}



        {reviewError && (



          <p className="pd-review-error">



            {reviewError}



          </p>



        )}



        <div className="pd-divider" />



        {/* STUDENT REVIEWS */}



        <div className="pd-reviews-list">



          <h3>



            Student Reviews ({totalReviews})



          </h3>



          {reviewsLoading ? (



            <p>Loading reviews...</p>



          ) : reviewsError ? (



            <p className="pd-review-error">



              {reviewsError}



            </p>



          ) : totalReviews === 0 ? (



            <div className="pd-no-reviews">



              <p>⭐ No reviews yet.</p>



              <p>



                Be the first to share



                your experience.



              </p>



            </div>



          ) : (



            <div className="pd-review-list">



              {reviews.map(



                (review, index) => (



                  <article



                    className="pd-review-card"



                    key={



                      review._id || index



                    }



                  >



                    <div className="pd-review-top">



                      <div className="pd-review-avatar">



                        👤



                      </div>



                      <div>



                        <strong>



                          {review.user



                            ?.fullName ||



                            review.user



                              ?.name ||



                            "C-Mart Student"}



                        </strong>



                        <p>



                          {review.createdAt



                            ? new Date(



                                review.createdAt



                              ).toLocaleDateString(



                                "en-IN"



                              )



                            : ""}



                        </p>



                      </div>



                    </div>



                    <StarRating



                      rating={review.rating}



                      size={20}



                    />



                    <p className="pd-review-comment">



                      {review.comment}



                    </p>



                  </article>



                )



              )}



            </div>



          )}



        </div>



      </section>



    </div>



  );



}



export default ProductDetails;
