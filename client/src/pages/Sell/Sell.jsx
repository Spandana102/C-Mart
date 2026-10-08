import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Sell.css";

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

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Check login
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        alert("Please login before selling a product.");
        navigate("/login");
        return;
      }

      const user = JSON.parse(storedUser);

      if (!user._id) {
        alert("User information is missing. Please login again.");
        navigate("/login");
        return;
      }

      // Basic validation
      if (
        !formData.name ||
        !formData.category ||
        !formData.price ||
        !formData.condition ||
        !formData.description
      ) {
        alert("Please fill all required fields.");
        return;
      }

      setLoading(true);

      /*
       * For now, image URLs are kept empty.
       * Cloudinary upload can be connected here later.
       */
      const imageUrls = [];

      const productData = {
        seller: user._id,
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        mrp: formData.mrp ? Number(formData.mrp) : 0,
        condition: formData.condition,
        description: formData.description,
        stock: Number(formData.stock) || 1,
        images: imageUrls,
      };

      const response = await axios.post(
        "http://localhost:5000/api/products",
        productData
      );

      console.log("Product created:", response.data);

      alert("Product listed successfully!");

      // Clear form
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

      // Go to marketplace
      navigate("/products");
    } catch (error) {
      console.error("Sell product error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to list product. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sell-page">

      {/* Navbar */}
      <nav className="sell-navbar">
        <div
          className="sell-logo"
          onClick={() => navigate("/")}
        >
          <span>🛍️</span>
          <span>C-Mart</span>
        </div>

        <div className="sell-nav-links">
          <button onClick={() => navigate("/")}>
            Home
          </button>

          <button onClick={() => navigate("/products")}>
            Marketplace
          </button>

          <button onClick={() => navigate("/orders")}>
            Orders
          </button>

          <button onClick={() => navigate("/profile")}>
            Profile
          </button>

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

      {/* Header */}
      <section className="sell-header">
        <div>
          <p className="sell-label">
            SELL ON C-MART
          </p>

          <h1>
            Sell Your Product
          </h1>

          <p>
            Give your unused products a second life by
            selling them to students in your campus community.
          </p>
        </div>

        <div className="sell-header-icon">
          🏷️
        </div>
      </section>

      {/* Main Content */}
      <main className="sell-container">

        <div className="sell-form-card">

          <div className="form-title">
            <h2>Product Information</h2>
            <p>
              Enter the details of the product you want to sell.
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
              />
            </div>

            {/* Category + Condition */}
            <div className="form-row">

              <div className="form-group">
                <label>
                  Category <span>*</span>
                </label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
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
                >
                  <option value="">
                    Select Condition
                  </option>

                  <option value="New">
                    New
                  </option>

                  <option value="Like New">
                    Like New
                  </option>

                  <option value="Good">
                    Good
                  </option>

                  <option value="Used">
                    Used
                  </option>
                </select>
              </div>

            </div>

            {/* Price + MRP + Stock */}
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
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  MRP
                </label>

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
                placeholder="Describe the product, its usage, condition and any important details..."
                rows="5"
              />
            </div>

            {/* Image Upload */}
            <div className="form-group">

              <label>
                Product Images
              </label>

              <div className="image-upload-box">

                <div className="upload-icon">
                  📷
                </div>

                <h3>
                  Upload Product Images
                </h3>

                <p>
                  Add clear images of your product
                </p>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                />

                {images.length > 0 && (
                  <p className="selected-images">
                    {images.length} image
                    {images.length > 1 ? "s" : ""} selected
                  </p>
                )}

              </div>
            </div>

            {/* Submit */}
            <div className="form-actions">

              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate("/")}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="post-product-btn"
                disabled={loading}
              >
                {loading
                  ? "Listing Product..."
                  : "🚀 Post Product"}
              </button>

            </div>

          </form>
        </div>

        {/* Side Information */}
        <aside className="sell-info-card">

          <div className="info-icon">
            💡
          </div>

          <h2>
            Selling Tips
          </h2>

          <div className="tip">
            <span>✓</span>
            <p>
              Use a clear and descriptive product name.
            </p>
          </div>

          <div className="tip">
            <span>✓</span>
            <p>
              Mention the actual condition of the product.
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
            <strong>Campus Marketplace</strong>

            <p>
              Sell your unused products and help
              fellow students find useful items at
              affordable prices.
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
          Campus Marketplace • Buy • Sell • Swap • Rent
        </p>
      </footer>

    </div>
  );
}

export default Sell;