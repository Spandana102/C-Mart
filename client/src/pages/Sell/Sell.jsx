import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Sell.css";

const API_URL = "http://localhost:5000/api";

function Sell() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    mrp: "",
    condition: "",
    description: "",
    stock: 1,
  });

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter((file) =>
      file.type.startsWith("image/")
    );

    if (validFiles.length !== selectedFiles.length) {
      alert("Please select image files only.");
    }

    const oversizedFile = validFiles.find(
      (file) => file.size > 5 * 1024 * 1024
    );

    if (oversizedFile) {
      alert("Each image must be 5 MB or smaller.");
      e.target.value = "";
      return;
    }

    setImages(validFiles);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Upload image to Cloudinary through the backend.
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

    const imageUrl = response.data?.imageUrl;

    if (!response.data?.success || !imageUrl) {
      throw new Error(
        response.data?.message || "Image upload failed."
      );
    }

    return imageUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login before selling a product.");
      navigate("/login");
      return;
    }

    if (
      !formData.name.trim() ||
      !formData.category ||
      !formData.price ||
      !formData.condition ||
      !formData.description.trim()
    ) {
      alert("Please fill all required fields.");
      return;
    }

    if (images.length === 0) {
      alert("Please select at least one product image.");
      return;
    }

    const price = Number(formData.price);
    const mrp = formData.mrp === "" ? 0 : Number(formData.mrp);
    const stock = Number(formData.stock);

    if (!Number.isFinite(price) || price <= 0) {
      alert("Enter a valid selling price greater than zero.");
      return;
    }

    if (!Number.isFinite(mrp) || mrp < 0) {
      alert("Enter a valid MRP.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 1) {
      alert("Stock must be at least 1.");
      return;
    }

    setLoading(true);

    try {
      // Upload selected images and collect their Cloudinary URLs.
      const imageUrls = await Promise.all(
        images.map((file) => uploadImage(file, token))
      );

      // Create the product only after image uploads succeed.
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

      console.log("Product created:", response.data);

      alert("Product listed successfully!");

      setFormData({
        name: "",
        category: "",
        price: "",
        mrp: "",
        condition: "",
        description: "",
        stock: 1,
      });

      setImages([]);

      navigate("/products");
    } catch (error) {
      console.error(
        "Sell product error:",
        error.response?.data || error
      );

      const status = error.response?.status;
      const message =
        error.response?.data?.message || error.message;

      if (status === 401) {
        alert("Your session may have expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } else if (status === 404) {
        alert(
          "API endpoint not found. Check the upload route and product route."
        );
      } else {
        alert(message || "Failed to list product. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sell-page">
      <nav className="sell-navbar">
        <div className="sell-logo" onClick={() => navigate("/")}>
          <span>🛍️</span>
          <span>C-Mart</span>
        </div>

        <div className="sell-nav-links">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/products")}>
            Marketplace
          </button>
          <button onClick={() => navigate("/orders")}>Orders</button>
          <button onClick={() => navigate("/profile")}>Profile</button>
          <button
            className="sell-logout"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <section className="sell-header">
        <div>
          <p className="sell-label">SELL ON C-MART</p>
          <h1>Sell Your Product</h1>
          <p>
            Give your unused products a second life by selling them
            to students in your campus community.
          </p>
        </div>
        <div className="sell-header-icon">🏷️</div>
      </section>

      <main className="sell-container">
        <div className="sell-form-card">
          <div className="form-title">
            <h2>Product Information</h2>
            <p>Enter the details of the product you want to sell.</p>
          </div>

          <form onSubmit={handleSubmit}>
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
                  <option value="">Select Category</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Books">Books</option>
                  <option value="Stationery">Stationery</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Sports">Sports</option>
                  <option value="Other">Other</option>
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
                  <option value="">Select Condition</option>
                  <option value="New">New</option>
                  <option value="Used">Used</option>
                </select>
              </div>
            </div>

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

            <div className="form-group">
              <label>
                Description <span>*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Example: Engineering calculator in good working condition, ideal for students and everyday calculations."
                rows="5"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Product Images <span>*</span>
              </label>

              <div className="image-upload-box">
                <div className="upload-icon">📷</div>
                <h3>Upload Product Images</h3>
                <p>Add clear images of your product.</p>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  required
                />

                <p>You can select multiple images. Maximum 5 MB per image.</p>

                {images.length > 0 && (
                  <>
                    <p className="selected-images">
                      {images.length} image
                      {images.length > 1 ? "s" : ""} selected
                    </p>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "12px",
                        marginTop: "15px",
                      }}
                    >
                      {images.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          style={{ width: "100px" }}
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Product preview ${index + 1}`}
                            style={{
                              width: "100px",
                              height: "100px",
                              objectFit: "cover",
                              borderRadius: "8px",
                            }}
                          />
                          <p
                            style={{
                              fontSize: "12px",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

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
                {loading ? "Uploading & Listing..." : "🚀 Post Product"}
              </button>
            </div>
          </form>
        </div>

        <aside className="sell-info-card">
          <div className="info-icon">💡</div>
          <h2>Selling Tips</h2>

          <div className="tip">
            <span>✓</span>
            <p>Use a clear and descriptive product name.</p>
          </div>
          <div className="tip">
            <span>✓</span>
            <p>Mention the actual condition of the product.</p>
          </div>
          <div className="tip">
            <span>✓</span>
            <p>Add a reasonable selling price.</p>
          </div>
          <div className="tip">
            <span>✓</span>
            <p>Upload clear product images.</p>
          </div>
          <div className="tip">
            <span>✓</span>
            <p>Give an honest product description.</p>
          </div>

          <div className="sell-note">
            <strong>Campus Marketplace</strong>
            <p>
              Sell your unused products and help fellow students find
              useful items at affordable prices.
            </p>
          </div>
        </aside>
      </main>

      <footer className="sell-footer">
        <div className="footer-logo">🛍️ C-Mart</div>
        <p>Campus Marketplace • Buy • Sell • Swap • Rent</p>
      </footer>
    </div>
  );
}

export default Sell;
