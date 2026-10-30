import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import ProductCard from "../../components/ProductCard";
import "./Swap.css";

const API = "http://localhost:5000/api";
const SWAP_API = `${API}/swap`;
 const UPLOAD_API = `${API}/upload/image`;
const EMPTY_FORM = { name: "", category: "Books", condition: "Good", image: "" };
const CATEGORIES = ["Books", "Electronics", "Accessories", "Sports", "Study", "Other"];
const CONDITIONS = ["Good", "Excellent", "Used", "Fair", "New"];

function getId(value) {
  if (!value) return "";
  if (typeof value === "object") return String(value._id || value.id || "");
  return String(value);
}

function getImageUrl(value) {
  if (!value) return "";
  if (Array.isArray(value)) return getImageUrl(value[0]);
  if (typeof value === "object") {
    return getImageUrl(value.secure_url || value.url || value.imageUrl || value.path);
  }
  const text = String(value).trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(text) || text.startsWith("data:image/")) return text;
  return `http://localhost:5000/${text.replace(/^\/+/, "")}`;
}

function getList(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function authConfig() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } };
}

function Swap() {
  const [products, setProducts] = useState([]);
  const [swapRequests, setSwapRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [conditionFilter, setConditionFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  const token = localStorage.getItem("token");
  const currentUser = getCurrentUser();
  const currentUserId = getId(currentUser._id || currentUser.id || currentUser.user?._id);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const productResponse = await axios.get(`${SWAP_API}/products`);
      setProducts(getList(productResponse.data, "products"));

      if (localStorage.getItem("token")) {
        try {
          const requestResponse = await axios.get(`${SWAP_API}/requests`, authConfig());
          setSwapRequests(getList(requestResponse.data, "requests"));
        } catch {
          setSwapRequests([]);
          // Product listing should still work if the requests endpoint fails.
        }
      } else {
        setSwapRequests([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not load products. Check the swap backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  const isOwner = (product) => {
    const owner = getId(product.sellerId || product.seller || product.owner || product.userId || product.createdBy);
    return Boolean(currentUserId && owner && owner === currentUserId);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowForm(false);
  };

  const startEdit = (product) => {
    setEditingId(getId(product));
    setForm({
      name: product.name || product.title || "",
      category: product.category || "Books",
      condition: product.condition || "Good",
      image: getImageUrl(product.image || product.images)
    });
    setImageFile(null);
    setImagePreview("");
    setShowForm(true);
    setError("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }
    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!imageFile) return form.image;
    const body = new FormData();
    body.append("image", imageFile); // Must match multer field name on server
    const response = await axios.post(UPLOAD_API, body, authConfig());
    const data = response.data;
    const url = data?.secure_url || data?.url || data?.imageUrl ||
      data?.image?.secure_url || data?.image?.url || data?.data?.secure_url || data?.data?.url;
    if (!url) throw new Error("Upload succeeded but no image URL was returned.");
    return url;
  };

  const handleAddOrEdit = async (event) => {
    event.preventDefault();
    if (!localStorage.getItem("token")) {
      setError("Please log in to add a swap product.");
      return;
    }
    if (!form.name.trim()) {
      setError("Enter a product name.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const image = await uploadImage();
      const payload = {
        name: form.name.trim(),
        category: form.category,
        condition: form.condition,
        image: image || ""
      };
      if (editingId) {
        await axios.put(`${SWAP_API}/products/${editingId}`, payload, authConfig());
        setMessage("Product updated successfully!");
      } else {
        await axios.post(`${SWAP_API}/products`, payload, authConfig());
        setMessage("Product posted! Other students can see it when the backend is connected.");
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestSwap = async (productId) => {
    if (!localStorage.getItem("token")) {
      setError("Please log in to request a swap.");
      return;
    }
    setBusyId(productId);
    setError("");
    try {
      await axios.post(`${SWAP_API}/requests`, { productId }, authConfig());
      setMessage("Swap request sent!");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not send swap request.");
    } finally {
      setBusyId("");
    }
  };

  const handleRequestStatus = async (requestId, status) => {
    setBusyId(requestId);
    setError("");
    try {
      await axios.patch(`${SWAP_API}/requests/${requestId}/status`, { status }, authConfig());
      setMessage(`Swap request ${status.toLowerCase()}!`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update request.");
    } finally {
      setBusyId("");
    }
  };

  const handleDelete = async (product) => {
    const id = getId(product);
    if (!window.confirm(`Delete "${product.name || product.title}"?`)) return;
    setBusyId(id);
    setError("");
    try {
      await axios.delete(`${SWAP_API}/products/${id}`, authConfig());
      setMessage("Product deleted.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete product.");
    } finally {
      setBusyId("");
    }
  };

  const filteredProducts = products.filter((product) => {
    const name = String(product.name || product.title || "");
    const category = String(product.category || "");
    const condition = String(product.condition || "");
    const term = searchTerm.trim().toLowerCase();
    return [name, category, condition].some(v => v.toLowerCase().includes(term)) &&
      (categoryFilter === "All" || category.toLowerCase() === categoryFilter.toLowerCase()) &&
      (conditionFilter === "All" || condition.toLowerCase() === conditionFilter.toLowerCase());
  });

  return (
    <main className="swap-container">
      <section className="swap-hero">
        <div>
          <span className="swap-eyebrow">C-MART • CAMPUS EXCHANGE</span>
          <h1>Give your items a new story. <span>Swap smarter.</span></h1>
          <p>List something you no longer need, discover useful items, and exchange with students on campus.</p>
          <div className="swap-hero-actions">
            <button type="button" className="swap-primary-btn" onClick={() => {
              resetForm();
              setShowForm(true);
              setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
            }}>＋ List an Item</button>
            <a href="#swap-discover" className="swap-outline-btn">Explore Items ↓</a>
          </div>
        </div>
        <div className="swap-hero-art" aria-hidden="true">
          <div className="swap-art-circle">↔</div>
          <span>Books</span><span>Gadgets</span><span>More</span>
        </div>
      </section>

      <div className="swap-stats">
        <div><strong>{products.length}</strong><span>Listed items</span></div>
        <div><strong>{swapRequests.length}</strong><span>Visible requests</span></div>
        <div><strong>{CATEGORIES.length}</strong><span>Categories</span></div>
      </div>

      <section className="swap-form-section" ref={formRef}>
        <div className="swap-section-heading">
          <div><span className="swap-kicker">YOUR LISTING</span><h2>{editingId ? "Edit your item" : "Have something to exchange?"}</h2></div>
          <button type="button" className="swap-secondary-btn" onClick={() => showForm ? resetForm() : setShowForm(true)}>
            {showForm ? "Close Form" : "＋ Add Swap Product"}
          </button>
        </div>

        {showForm && (
          <form className="add-swap-form" onSubmit={handleAddOrEdit}>
            <div className="swap-field">
              <label htmlFor="swap-name">Product name</label>
              <input id="swap-name" placeholder="e.g. Engineering Mathematics Book" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required maxLength={100} />
            </div>
            <div className="swap-field">
              <label htmlFor="swap-category">Category</label>
              <select id="swap-category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="swap-field">
              <label htmlFor="swap-condition">Condition</label>
              <select id="swap-condition" value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="swap-field swap-upload-field">
              <label htmlFor="swap-image">Product photo</label>
              <label className="swap-upload-box" htmlFor="swap-image">
                {imagePreview || form.image ? (
                  <img className="swap-preview-image" src={imagePreview || getImageUrl(form.image)} alt="Selected product preview" />
                ) : <span className="swap-upload-icon">📷</span>}
                <span><strong>Choose File</strong><small>JPG, PNG or WEBP • Max 5 MB</small></span>
              </label>
              <input ref={fileInputRef} id="swap-image" className="swap-file-input" type="file" accept="image/*" onChange={handleImageChange} />
              {imageFile && <p className="swap-file-name">{imageFile.name}</p>}
            </div>
            <div className="swap-form-actions">
              <button className="swap-primary-btn" type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Save Changes" : "Post Swap Product"}
              </button>
              <button type="button" className="swap-quiet-btn" onClick={resetForm} disabled={saving}>Cancel</button>
            </div>
          </form>
        )}
      </section>

      <section id="swap-discover" className="swap-discover">
        <div className="swap-section-heading">
          <div><span className="swap-kicker">EXPLORE THE MARKETPLACE</span><h2>Available Swap Products</h2></div>
          <button type="button" className="swap-secondary-btn" onClick={loadData} disabled={loading}>↻ Refresh</button>
        </div>

        <div className="search-filter">
          <div className="search-controls">
            <input aria-label="Search products" placeholder="🔎  Search books, electronics, accessories..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)} />
            <select aria-label="Filter category" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select aria-label="Filter condition" value={conditionFilter} onChange={e => setConditionFilter(e.target.value)}>
              <option value="All">All Conditions</option>
              {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="swap-alert swap-error" role="alert">{error}</p>}
        {message && <p className="swap-alert swap-success" role="status">{message}</p>}
        <p className="swap-results">{filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found</p>

        {loading ? <div className="swap-empty">Loading swap products...</div> : (
          <div className="product-list">
            {filteredProducts.length === 0 ? (
              <div className="swap-empty"><span>📦</span><h3>No products found</h3><p>Try another filter, or be the first to list an item.</p></div>
            ) : filteredProducts.map(product => {
              const productId = getId(product);
              const owner = isOwner(product);
              const matching = swapRequests.filter(r => getId(r.productId || r.product) === productId);
              const myRequest = matching.find(r => getId(r.buyerId || r.requester || r.userId) === currentUserId);
              const incoming = owner ? matching.find(r => String(r.status).toLowerCase() === "pending") : null;
              return (
                <ProductCard
                  key={productId}
                  name={product.name || product.title}
                  category={product.category}
                  condition={product.condition}
                  image={getImageUrl(product.image || product.images)}
                  onRequestSwap={!owner && busyId !== productId ? () => handleRequestSwap(productId) : undefined}
                  swapRequested={Boolean(myRequest && String(myRequest.status).toLowerCase() !== "rejected")}
                  requestStatus={owner ? incoming?.status || "" : myRequest?.status || ""}
                  onAccept={owner && incoming && busyId !== getId(incoming) ? () => handleRequestStatus(getId(incoming), "Accepted") : undefined}
                  onReject={owner && incoming && busyId !== getId(incoming) ? () => handleRequestStatus(getId(incoming), "Rejected") : undefined}
                  onEdit={owner ? () => startEdit(product) : undefined}
                  onDelete={owner && busyId !== productId ? () => handleDelete(product) : undefined}
                />
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default Swap;
