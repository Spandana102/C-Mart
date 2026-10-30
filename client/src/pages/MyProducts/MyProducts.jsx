
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./MyProducts.css";

const API = "http://localhost:5000/api";

function MyProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(
          `${API}/products/my-products`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setProducts(response.data.products || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load your products"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [navigate]);

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(`${API}/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProducts((prev) =>
        prev.filter((product) => product._id !== id)
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete product"
      );
    }
  };

  return (
    <div className="my-products-page">
      <div className="my-products-header">
        <div>
          <h1>My Products</h1>
          <p>Manage your uploaded products</p>
        </div>

        <button onClick={() => navigate("/sell")}>
          + Add Product
        </button>
      </div>

      {error && <p className="my-products-error">{error}</p>}

      {loading ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <div className="my-products-empty">
          <h2>No Products Yet</h2>
          <p>You haven't uploaded any products.</p>
          <button onClick={() => navigate("/sell")}>
            Sell Product
          </button>
        </div>
      ) : (
        <div className="my-products-grid">
          {products.map((product) => (
            <div className="my-product-card" key={product._id}>
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                />
              ) : (
                <p>No Image Available</p>
              )}

              <div className="my-product-info">
                <h3>{product.name}</h3>
                <h2>₹{product.price}</h2>
                <p>Condition: {product.condition}</p>

                <div className="my-product-actions">
                  <button
                    onClick={() =>
                      navigate(`/product/${product._id}`)
                    }
                  >
                    View Details
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => deleteProduct(product._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyProducts;
