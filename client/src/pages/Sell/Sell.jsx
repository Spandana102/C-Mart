
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Sell.css";

const API_URL = "http://localhost:5000/api";

const initialForm = {
  name: "",
  category: "",
  price: "",
  mrp: "",
  condition: "",
  description: "",
  stock: 1,
};

function Sell() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");

  // Generate image previews
  useEffect(() => {
    const urls = images.map((file) =>
      URL.createObjectURL(file)
    );

    setPreviews(urls);

    return () => {
      urls.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [images]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate selected images
  const handleImageChange = (e) => {
    const selectedFiles = Array.from(
      e.target.files || []
    );

    if (selectedFiles.length > 5) {
      setError("Maximum 5 images are allowed.");
      e.target.value = "";
      setImages([]);
      return;
    }

    const invalidFile = selectedFiles.find(
      (file) =>
        !file.type.startsWith("image/") ||
        file.size > 5 * 1024 * 1024
    );

    if (invalidFile) {
      setError(
        "Please select valid images under 5 MB each."
      );
      e.target.value = "";
      setImages([]);
      return;
    }

    setImages(selectedFiles);
    setError("");
  };

  // Upload image to Cloudinary through backend
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
      }
    );

    const imageUrl =
      response.data?.imageUrl;

    if (!response.data?.success || !imageUrl) {
      throw new Error(
        response.data?.message ||
          "Image upload failed."
      );
    }

    return imageUrl;
  };

  // Submit product
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setUploadStatus("");

    const token = localStorage.getItem("token");

    if (!token) {
      setError(
        "Please login before selling a product."
      );
      navigate("/login");
      return;
    }

    // Required fields
    if (
      !formData.name.trim() ||
      !formData.category ||
      !formData.condition ||
      !formData.description.trim() ||
      formData.price === ""
    ) {
      setError("Please fill all required fields.");
      return;
    }

    const price = Number(formData.price);
    const mrp =
      formData.mrp === ""
        ? 0
        : Number(formData.mrp);
    const stock = Number(formData.stock);

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setError(
        "Please enter a valid selling price."
      );
      return;
    }

    if (
      !Number.isFinite(mrp) ||
      mrp < 0
    ) {
      setError("Please enter a valid MRP.");
      return;
    }

    if (
      !Number.isInteger(stock) ||
      stock < 1
    ) {
      setError("Stock must be at least 1.");
      return;
    }

    if (images.length === 0) {
      setError(
        "Please select at least one product image."
      );
      return;
    }

    setLoading(true);

    try {
      // STEP 1: Upload images to Cloudinary
      const imageUrls = [];

      for (let i = 0; i < images.length; i++) {
        setUploadStatus(
          `Uploading image ${i + 1} of ${images.length}...`
        );

        const imageUrl = await uploadImage(
          images[i],
          token
        );

        imageUrls.push(imageUrl);
      }

      // STEP 2: Save product to MongoDB
      setUploadStatus("Saving product...");

      const productData = {
        name: formData.name.trim(),
        category: formData.category,
        price,
        mrp,
        condition: formData.condition,
        description: formData.description.trim(),
        stock,
        images: imageUrls,
      };

      const response = await axios.post(
        `${API_URL}/products`,
        productData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Accept successful HTTP responses
      // unless API explicitly reports failure.
      if (response.data?.success === false) {
        throw new Error(
          response.data?.message ||
            "Product creation failed."
        );
      }

      setFormData({ ...initialForm });
      setImages([]);
      setUploadStatus("");

      alert("Product listed successfully!");

      // Redirect seller to their products
      navigate("/my-products");
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

        navigate("/login");
      } else if (status === 404) {
        setError(
          "API endpoint not found. Check the upload and product routes."
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <div className="sell-page">
      {/* Navbar */}
      <nav className="sell-navbar">
        <div
          className="sell-logo"
          onClick={() => navigate("/")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" ||
              e.key === " "
            ) {
              e.preventDefault();
              navigate("/");
            }
          }}
        >
          <span>🛍️</span>
          <span>C-Mart</span>
        </div>

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

      {/* Header */}
      <section className="sell-header">
        <div>
          <p className="sell-label">
            SELL ON C-MART
          </p>

          <h1>Sell Your Product</h1>

          <p>
            Give your unused products a second
            life by selling them to students in
            your campus community.
          </p>
        </div>

        <div className="sell-header-icon">
          🏷️
        </div>
      </section>

      <main className="sell-container">
        <div className="sell-form-card">
          <div className="form-title">
            <h2>Product Information</h2>
            <p>
              Enter the details of the product
              you want to sell.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Product Name */}
            <div className="form-group">
              <label>
                Product Name <span>*</span>
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Example: Engineering Calculator"
                required
              />
            </div>

            {/* Category & Condition */}
            <div className="form-row">
              <div className="form-group">
                <label>
                  Category <span>*</span>
                </label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Category
                  </option>
                  <option value="Electronics">
                    Electronics
                  </option>
                  <option value="Books">
                    Books
                  </option>
                  <option value="Stationery">
                    Stationery
                  </option>
                  <option value="Furniture">
                    Furniture
                  </option>
                  <option value="Clothing">
                    Clothing
                  </option>
                  <option value="Sports">
                    Sports
                  </option>
                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  Condition <span>*</span>
                </label>

                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Condition
                  </option>
                  <option value="New">
                    New
                  </option>
                  <option value="Used">
                    Used
                  </option>
                </select>
              </div>
            </div>

            {/* Price, MRP & Stock */}
            <div className="form-row three-columns">
              <div className="form-group">
                <label>
                  Selling Price <span>*</span>
                </label>

                <div className="price-input">
                  <span>₹</span>

                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="500"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>MRP</label>

                <div className="price-input">
                  <span>₹</span>

                  <input
                    type="number"
                    name="mrp"
                    value={formData.mrp}
                    onChange={handleChange}
                    placeholder="800"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Stock <span>*</span>
                </label>

                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="1"
                  step="1"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label>
                Description <span>*</span>
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the product, its usage, condition and important details..."
                rows={5}
                required
              />
            </div>

            {/* Product Images */}
            <div className="form-group">
              <label>
                Product Images <span>*</span>
              </label>

              <div className="image-upload-box">
                <div className="upload-icon">
                  📷
                </div>

                <h3>Upload Product Images</h3>

                <p>
                  Select up to 5 images,
                  maximum 5 MB each.
                </p>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  disabled={loading}
                />

                {images.length > 0 && (
                  <p className="selected-images">
                    {images.length} image
                    {images.length !== 1
                      ? "s"
                      : ""}{" "}
                    selected
                  </p>
                )}

                {/* Image Previews */}
                {previews.length > 0 && (
                  <div className="image-preview-container">
                    {previews.map((url, index) => (
                      <img
                        key={url}
                        src={url}
                        alt={`Product preview ${
                          index + 1
                        }`}
                        className="image-preview"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <p
                role="alert"
                style={{
                  color: "#dc2626",
                  marginBottom: "15px",
                }}
              >
                {error}
              </p>
            )}

            {/* Upload Status */}
            {uploadStatus && (
              <p
                role="status"
                style={{
                  color: "#2563eb",
                  marginBottom: "15px",
                }}
              >
                {uploadStatus}
              </p>
            )}

            {/* Actions */}
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

        {/* Selling Tips */}
        <aside className="sell-info-card">
          <div className="info-icon">
            💡
          </div>

          <h2>Selling Tips</h2>

          <div className="tip">
            <span>✓</span>
            <p>
              Use a clear and descriptive product
              name.
            </p>
          </div>

          <div className="tip">
            <span>✓</span>
            <p>
              Mention the actual condition of
              the product.
            </p>
          </div>

          <div className="tip">
            <span>✓</span>
            <p>
              Add a reasonable selling price.
            </p>
          </div>

          <div className="tip">
            <span>✓</span>
            <p>
              Upload clear product images.
            </p>
          </div>

          <div className="tip">
            <span>✓</span>
            <p>
              Give an honest product description.
            </p>
          </div>

          <div className="sell-note">
            <strong>
              Campus Marketplace
            </strong>

            <p>
              Sell your unused products and help
              fellow students find useful items
              at affordable prices.
            </p>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="sell-footer">
        <div className="footer-logo">
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

export default Sell;
