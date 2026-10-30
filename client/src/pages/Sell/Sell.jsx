
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Sell.css";

const API_URL = "http://localhost:5000/api";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const CATEGORIES = [
  "Books",
  "Stationery",
  "Electronics",
  "Lab Materials",
  "College Essentials",
  "Workshop Tools",
  "Furniture",
  "Clothing",
  "Sports",
  "Other",
];

const initialForm = {
  name: "",
  category: "",
  price: "",
  mrp: "",
  condition: "Used",
  description: "",
  stock: 1,
  brand: "",
};

function Sell() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // ==========================================
  // IMAGE PREVIEWS
  // ==========================================

  useEffect(() => {
    const urls = images.map((file) =>
      URL.createObjectURL(file)
    );

    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // ==========================================
  // HANDLE IMAGE SELECTION
  // ==========================================

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    setError("");

    if (selectedFiles.length > MAX_IMAGES) {
      setError("Maximum 5 images are allowed.");
      event.target.value = "";
      return;
    }

    const invalidFile = selectedFiles.find(
      (file) =>
        !file.type.startsWith("image/") ||
        file.size > MAX_FILE_SIZE
    );

    if (invalidFile) {
      setError(
        "Please select valid images under 5 MB each."
      );
      event.target.value = "";
      return;
    }

    setImages(selectedFiles);
  };

  // ==========================================
  // REMOVE SELECTED IMAGE
  // ==========================================

  const removeImage = (index) => {
    if (loading) return;

    setImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    );
  };

  // ==========================================
  // UPLOAD IMAGE TO CLOUDINARY
  // ==========================================

  const uploadImage = async (file, token) => {
    const imageFormData = new FormData();
    imageFormData.append("image", file);

    const response = await axios.post(
      `${API_URL}/upload/image`,
      imageFormData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 60000,
      }
    );

    const imageUrl =
      response.data?.imageUrl ||
      response.data?.secure_url ||
      response.data?.url;

    if (
      response.data?.success === false ||
      !imageUrl
    ) {
      throw new Error(
        response.data?.message || "Image upload failed."
      );
    }

    if (
      typeof imageUrl !== "string" ||
      !imageUrl.startsWith(
        "https://res.cloudinary.com/"
      )
    ) {
      throw new Error(
        "Upload API did not return a valid Cloudinary image URL."
      );
    }

    return imageUrl;
  };

  // ==========================================
  // VALIDATE PRODUCT
  // ==========================================

  const validateForm = () => {
    if (!formData.name.trim()) {
      return "Please enter the product name.";
    }

    if (!formData.category) {
      return "Please select a category.";
    }

    if (!["New", "Used"].includes(formData.condition)) {
      return "Please select a valid product condition.";
    }

    if (!formData.description.trim()) {
      return "Please enter a product description.";
    }

    if (formData.price === "") {
      return "Please enter a selling price.";
    }

    const price = Number(formData.price);
    const mrp =
      formData.mrp === "" ? 0 : Number(formData.mrp);
    const stock = Number(formData.stock);

    if (!Number.isFinite(price) || price <= 0) {
      return "Please enter a valid selling price.";
    }

    if (!Number.isFinite(mrp) || mrp < 0) {
      return "Please enter a valid MRP.";
    }

    if (
      !Number.isInteger(stock) ||
      stock < 1
    ) {
      return "Stock must be at least 1.";
    }

    if (images.length === 0) {
      return "Please upload at least one product image.";
    }

    if (images.length > MAX_IMAGES) {
      return "Maximum 5 images are allowed.";
    }

    return "";
  };

  // ==========================================
  // SUBMIT PRODUCT
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");
    setUploadStatus("");
    setUploadProgress(0);

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login before selling a product.");
      navigate("/login");
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      // STEP 1: UPLOAD IMAGES
      const imageUrls = [];

      for (let index = 0; index < images.length; index++) {
        setUploadStatus(
          `Uploading image ${index + 1} of ${images.length}...`
        );

        const imageUrl = await uploadImage(
          images[index],
          token
        );

        imageUrls.push(imageUrl);

        setUploadProgress(
          Math.round(
            ((index + 1) / images.length) * 100
          )
        );
      }

      // STEP 2: CREATE PRODUCT
      setUploadStatus("Saving product to marketplace...");

      const productData = {
        name: formData.name.trim(),
        category: formData.category,
        price: Number(formData.price),
        mrp:
          formData.mrp === ""
            ? 0
            : Number(formData.mrp),
        condition: formData.condition,
        description: formData.description.trim(),
        stock: Number(formData.stock),
        brand: formData.brand.trim(),
        images: imageUrls,
      };

      // sellerId is assigned securely by backend
      // from the logged-in user's JWT token.

      const response = await axios.post(
        `${API_URL}/products`,
        productData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 30000,
        }
      );

      if (
        response.data?.success === false ||
        !response.data?.product?._id
      ) {
        throw new Error(
          response.data?.message ||
            "Product could not be saved."
        );
      }

      setSuccess("Product listed successfully!");
      setUploadStatus("");
      setUploadProgress(100);

      setFormData({ ...initialForm });
      setImages([]);

      navigate("/my-products", {
        state: {
          success: "Product listed successfully!",
        },
      });
    } catch (err) {
      console.error(
        "Sell product error:",
        err.response?.data || err
      );

      const status = err.response?.status;

      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setError(
          "Your login session has expired. Please login again."
        );
      } else if (status === 404) {
        setError(
          "Upload or product API endpoint not found."
        );
      } else if (status === 413) {
        setError(
          "Image is too large for the server."
        );
      } else if (err.code === "ECONNABORTED") {
        setError(
          "Request timed out. Please check your connection."
        );
      } else if (!err.response && err.message === "Network Error") {
        setError(
          "Cannot connect to backend. Check that MongoDB and server are running."
        );
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to list product. Please try again."
        );
      }
    } finally {
      setLoading(false);
      setUploadStatus("");
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

  return (
    <div className="sell-page">
      {/* NAVBAR */}
      <nav className="sell-navbar">
        <button
          type="button"
          className="sell-logo"
          onClick={() => navigate("/")}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          <span>🛍️</span>
          <span>C-Mart</span>
        </button>

        <div className="sell-nav-links">
          <button
            type="button"
            onClick={() => navigate("/")}
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
            onClick={() => navigate("/my-products")}
          >
            My Products
          </button>

          <button
            type="button"
            onClick={() => navigate("/seller-offers")}
          >
            Seller Offers
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
            className="sell-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* HEADER */}
      <section className="sell-header">
        <div>
          <p className="sell-label">SELL ON C-MART</p>

          <h1>Sell Your Product</h1>

          <p>
            Give your unused products a second life
            by selling them to students in your
            campus community.
          </p>
        </div>

        <div className="sell-header-icon">🏷️</div>
      </section>

      <main className="sell-container">
        {/* PRODUCT FORM */}
        <div className="sell-form-card">
          <div className="form-title">
            <h2>Product Information</h2>

            <p>
              Enter the details of the product
              you want to sell.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* PRODUCT NAME */}
            <div className="form-group">
              <label htmlFor="sell-name">
                Product Name <span>*</span>
              </label>

              <input
                id="sell-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Example: Engineering Calculator"
                maxLength={120}
                required
                disabled={loading}
              />
            </div>

            {/* CATEGORY AND CONDITION */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sell-category">
                  Category <span>*</span>
                </label>

                <select
                  id="sell-category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">
                    Select Category
                  </option>

                  {CATEGORIES.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="sell-condition">
                  Condition <span>*</span>
                </label>

                <select
                  id="sell-condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="New">New</option>
                  <option value="Used">Used</option>
                </select>
              </div>
            </div>

            {/* PRICE, MRP, STOCK */}
            <div className="form-row three-columns">
              <div className="form-group">
                <label htmlFor="sell-price">
                  Selling Price <span>*</span>
                </label>

                <div className="price-input">
                  <span>₹</span>

                  <input
                    id="sell-price"
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="500"
                    min="0.01"
                    step="0.01"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="sell-mrp">MRP</label>

                <div className="price-input">
                  <span>₹</span>

                  <input
                    id="sell-mrp"
                    type="number"
                    name="mrp"
                    value={formData.mrp}
                    onChange={handleChange}
                    placeholder="800"
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="sell-stock">
                  Stock <span>*</span>
                </label>

                <input
                  id="sell-stock"
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="1"
                  step="1"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* BRAND */}
            <div className="form-group">
              <label htmlFor="sell-brand">
                Brand (Optional)
              </label>

              <input
                id="sell-brand"
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Example: Casio"
                maxLength={80}
                disabled={loading}
              />
            </div>

            {/* DESCRIPTION */}
            <div className="form-group">
              <label htmlFor="sell-description">
                Description <span>*</span>
              </label>

              <textarea
                id="sell-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe product usage, condition and important details..."
                rows={5}
                required
                disabled={loading}
              />
            </div>

            {/* PRODUCT IMAGES */}
            <div className="form-group">
              <label htmlFor="sell-images">
                Product Images <span>*</span>
              </label>

              <div className="image-upload-box">
                <div className="upload-icon">📷</div>

                <h3>Upload Product Images</h3>

                <p>
                  Select up to 5 images.
                  Maximum 5 MB each.
                </p>

                <input
                  id="sell-images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  disabled={loading}
                />

                {images.length > 0 && (
                  <p className="selected-images">
                    {images.length} image
                    {images.length !== 1 ? "s" : ""} selected
                  </p>
                )}

                {previews.length > 0 && (
                  <div className="image-preview-container">
                    {previews.map((url, index) => (
                      <div
                        key={url}
                        style={{
                          position: "relative",
                          display: "inline-block",
                        }}
                      >
                        <img
                          src={url}
                          alt={`Product preview ${index + 1}`}
                          className="image-preview"
                        />

                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          disabled={loading}
                          aria-label={`Remove image ${index + 1}`}
                          style={{
                            position: "absolute",
                            top: 5,
                            right: 5,
                            background: "#dc2626",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: 26,
                            height: 26,
                            cursor: "pointer",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <p
                role="alert"
                style={{
                  color: "#dc2626",
                  marginBottom: 15,
                  fontWeight: 600,
                }}
              >
                {error}
              </p>
            )}

            {/* SUCCESS MESSAGE */}
            {success && (
              <p
                role="status"
                style={{
                  color: "#16a34a",
                  marginBottom: 15,
                }}
              >
                {success}
              </p>
            )}

            {/* UPLOAD PROGRESS */}
            {loading && (
              <div style={{ marginBottom: 18 }}>
                <p
                  role="status"
                  style={{
                    color: "#2563eb",
                    fontWeight: 600,
                  }}
                >
                  {uploadStatus || "Processing..."}
                </p>

                <div
                  style={{
                    height: 9,
                    background: "#dbeafe",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${uploadProgress}%`,
                      background: "#2563eb",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            )}

            {/* FORM ACTIONS */}
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate("/")}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="post-product-btn"
                disabled={loading}
              >
                {loading
                  ? "Uploading & Listing..."
                  : "🚀 Post Product"}
              </button>
            </div>
          </form>
        </div>

        {/* SELLING TIPS */}
        <aside className="sell-info-card">
          <div className="info-icon">💡</div>

          <h2>Selling Tips</h2>

          <div className="tip">
            <span>✓</span>
            <p>Use a clear product name.</p>
          </div>

          <div className="tip">
            <span>✓</span>
            <p>Mention the actual product condition.</p>
          </div>

          <div className="tip">
            <span>✓</span>
            <p>Set a reasonable selling price.</p>
          </div>

          <div className="tip">
            <span>✓</span>
            <p>Upload clear product images.</p>
          </div>

          <div className="tip">
            <span>✓</span>
            <p>Provide an honest description.</p>
          </div>

          <div className="sell-note">
            <strong>Campus Marketplace</strong>

            <p>
              Sell unused products and help fellow
              students find useful items.
            </p>
          </div>
        </aside>
      </main>

      {/* FOOTER */}
      <footer className="sell-footer">
        <div className="footer-logo">🛍️ C-Mart</div>

        <p>
          Campus Marketplace • Buy • Sell • Swap • Rent
        </p>
      </footer>
    </div>
  );
}

export default Sell;
