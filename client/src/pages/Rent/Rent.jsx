import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { API_ORIGIN, API_URL } from "../../services/apiConfig";
import "./Rent.css";

const API_BASE = `${API_URL}/rent`;

const UPLOAD_URL = `${API_URL}/upload`;

const CATEGORIES = [

  "Books",

  "Accessories",

  "Study",

  "Electronics",

  "Other",

];

const CONDITIONS = [

  "New",

  "Excellent",

  "Good",

  "Used",

  "Fair",

];

const EMPTY_PRODUCT = {

  name: "",

  category: "Books",

  condition: "Good",

  description: "",

  rentPrice: "",

  image: "",

};

const getId = (value) =>

  String(value?._id || value?.id || value || "");

const getToken = () =>

  localStorage.getItem("token") || "";

const getCurrentUserId = () => {

  try {

    const stored = JSON.parse(

      localStorage.getItem("user") || "{}"

    );

    return getId(stored.user || stored);

  } catch {

    return "";

  }

};

const todayLocal = () => {

  const date = new Date();

  return [

    date.getFullYear(),

    String(date.getMonth() + 1).padStart(2, "0"),

    String(date.getDate()).padStart(2, "0"),

  ].join("-");

};

const addDays = (dateString, count) => {

  if (!dateString) return "";

  const date = new Date(`${dateString}T12:00:00`);

  date.setDate(date.getDate() + Number(count));

  return [

    date.getFullYear(),

    String(date.getMonth() + 1).padStart(2, "0"),

    String(date.getDate()).padStart(2, "0"),

  ].join("-");

};

const dateInputValue = (value) => {

  if (!value) return "";

  const date = new Date(value);

  return Number.isNaN(date.getTime())

    ? ""

    : date.toISOString().slice(0, 10);

};

const displayDate = (value) => {

  if (!value) return "Not selected";

  const date = new Date(value);

  return Number.isNaN(date.getTime())

    ? String(value)

    : date.toLocaleDateString("en-IN", {

        day: "numeric",

        month: "short",

        year: "numeric",

        timeZone: "UTC",

      });

};

const currency = (amount) =>

  `₹${Number(amount || 0).toLocaleString("en-IN", {

    maximumFractionDigits: 2,

  })}`;

const getImageUrl = (value) => {

  if (!value) return "";

  if (Array.isArray(value)) {

    for (const item of value) {

      const url = getImageUrl(item);

      if (url) return url;

    }

    return "";

  }

  if (typeof value === "object") {

    return getImageUrl(

      value.secure_url ||

      value.secureUrl ||

      value.url ||

      value.imageUrl ||

      value.image ||

      value.images ||

      value.path ||

      value.src ||

      value.result ||

      value.data ||

      value.file ||

      ""

    );

  }

  if (typeof value !== "string") return "";

  const url = value.trim().replace(/\\/g, "/");

  if (!url) return "";

  if (

    /^https?:\/\//i.test(url) ||

    url.startsWith("data:image/")

  ) {

    return url;

  }

  if (url.startsWith("//")) {

    return `https:${url}`;

  }

  return `${API_ORIGIN}/${url.replace(/^\/+/, "")}`;

};

const getProductImages = (product) => {
  const candidates = [
    product?.images,
    product?.imageUrls,
    product?.photos,
    product?.image,
    product?.imageUrl,
    product?.photo,
  ];

  const result = [];
  const collect = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }
    if (typeof value === "object") {
      const direct = value.secure_url || value.secureUrl || value.url ||
        value.imageUrl || value.path || value.src;
      if (direct) collect(direct);
      else collect(value.images || value.photos || value.image || value.data);
      return;
    }
    const url = getImageUrl(value);
    if (url && !result.includes(url)) result.push(url);
  };
  candidates.forEach(collect);
  return result;
};

const getProductImage = (product) => getProductImages(product)[0] || "";

function ProductImage({ product }) {
  const images = useMemo(() => getProductImages(product), [product]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState([]);
  const galleryKey = images.join("|");

  useEffect(() => {
    setActiveIndex(0);
    setFailedUrls([]);
  }, [galleryKey]);

  const availableImages = images.filter((url) => !failedUrls.includes(url));
  const index = Math.min(activeIndex, Math.max(0, availableImages.length - 1));
  const currentImage = availableImages[index];
  const move = (step) => {
    setActiveIndex((current) => {
      const count = availableImages.length;
      return count ? (Math.min(current, count - 1) + step + count) % count : 0;
    });
  };

  return (
    <div className="rent-product-gallery">
      <div className="rent-product-image">
        {currentImage ? (
          <img
            src={currentImage}
            alt={`${product.name || "Rental product"} - image ${index + 1}`}
            loading="lazy"
            onError={() => setFailedUrls((previous) =>
              previous.includes(currentImage) ? previous : [...previous, currentImage]
            )}
          />
        ) : (
          <div className="rent-no-image">
            <span aria-hidden="true">📦</span>
            <p>{images.length ? "Image unavailable" : "No Image Available"}</p>
          </div>
        )}
        {availableImages.length > 1 && (
          <>
            <button type="button" className="rent-gallery-arrow rent-gallery-prev"
              aria-label="Previous product image" onClick={() => move(-1)}>‹</button>
            <button type="button" className="rent-gallery-arrow rent-gallery-next"
              aria-label="Next product image" onClick={() => move(1)}>›</button>
            <span className="rent-gallery-count">{index + 1} / {availableImages.length}</span>
          </>
        )}
      </div>
      {availableImages.length > 1 && (
        <div className="rent-gallery-thumbnails" aria-label="Product images">
          {availableImages.map((url, thumbIndex) => (
            <button key={url} type="button"
              className={`rent-gallery-thumb ${thumbIndex === index ? "active" : ""}`}
              aria-label={`View image ${thumbIndex + 1}`}
              aria-pressed={thumbIndex === index}
              onClick={() => setActiveIndex(thumbIndex)}>
              <img src={url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

async function apiRequest(path, options = {}) {

  const token = getToken();

  const response = await fetch(`${API_BASE}${path}`, {

    ...options,

    headers: {

      "Content-Type": "application/json",

      ...(token

        ? { Authorization: `Bearer ${token}` }

        : {}),

      ...options.headers,

    },

  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {

    throw new Error(

      data.message || `Request failed (${response.status})`

    );

  }

  return data;

}

async function uploadFile(file) {

  if (!file || !file.type.startsWith("image/")) {

    throw new Error("Select a valid image.");

  }

  if (file.size > 5 * 1024 * 1024) {

    throw new Error("Image must be smaller than 5 MB.");

  }

  const formData = new FormData();

  formData.append("image", file);

  const response = await fetch(UPLOAD_URL, {

    method: "POST",

    headers: {

      Authorization: `Bearer ${getToken()}`,

    },

    body: formData,

  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {

    throw new Error(data.message || "Image upload failed.");

  }

  const url = getImageUrl(data);

  if (!url) {

    throw new Error(

      "Upload API did not return an image URL."

    );

  }

  return url;

}

function StatusBadge({ status }) {

  const value = String(status || "Pending");

  return (

    <span

      className={`rent-status rent-status-${value

        .toLowerCase()

        .replace(/\s+/g, "-")}`}

    >

      {value}

    </span>

  );

}

function Rent() {

  const userId = getCurrentUserId();

  const [products, setProducts] = useState([]);

  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);

  const [busy, setBusy] = useState(false);

  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [categoryFilter, setCategoryFilter] =

    useState("All");

  const [conditionFilter, setConditionFilter] =

    useState("All");

  const [showProductForm, setShowProductForm] =

    useState(false);

  const [editingProductId, setEditingProductId] =

    useState(null);

  const [productForm, setProductForm] =

    useState({ ...EMPTY_PRODUCT });

  const [selectedProduct, setSelectedProduct] =

    useState(null);

  const rentRequestFormRef = useRef(null);

  useEffect(() => {
    if (selectedProduct && rentRequestFormRef.current) {
      rentRequestFormRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedProduct]);

  const [rentStart, setRentStart] =

    useState(todayLocal());

  const [rentDuration, setRentDuration] =

    useState(1);

  const [returnForms, setReturnForms] = useState({});
  const [openReturnForm, setOpenReturnForm] = useState(null);

  const [meetingForms, setMeetingForms] = useState({});

  const [openMeetingForm, setOpenMeetingForm] =

    useState(null);

  const [paymentForms, setPaymentForms] = useState({});

  const [paymentProofs, setPaymentProofs] = useState({});

  const [uploadingProofId, setUploadingProofId] =

    useState(null);

  const notify = (message, isError = false) => {

    if (isError) {

      setError(message);

      setSuccess("");

    } else {

      setSuccess(message);

      setError("");

    }

  };

  const loadData = useCallback(async () => {

    try {

      const productsData = await apiRequest("/products");

      setProducts(

        productsData.products ||

        productsData.rentProducts ||

        []

      );

      if (getToken()) {

        const requestsData = await apiRequest("/requests");

        setRequests(requestsData.requests || []);

      } else {

        setRequests([]);

      }

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }

  }, []);

  useEffect(() => {

    loadData();

  }, [loadData]);

  const myProducts = useMemo(

    () =>

      products.filter(

        (product) =>

          userId &&

          getId(product.ownerId || product.sellerId) ===

            userId

      ),

    [products, userId]

  );

  const sentRequests = useMemo(

    () =>

      requests.filter(

        (request) =>

          getId(request.renterId || request.buyerId) ===

          userId

      ),

    [requests, userId]

  );

  const receivedRequests = useMemo(

    () =>

      requests.filter(

        (request) =>

          getId(request.ownerId || request.sellerId) ===

          userId

      ),

    [requests, userId]

  );

  const filteredProducts = useMemo(

    () =>

      products.filter((product) => {

        const name = String(

          product.name || ""

        ).toLowerCase();

        return (

          name.includes(searchTerm.toLowerCase()) &&

          (categoryFilter === "All" ||

            product.category === categoryFilter) &&

          (conditionFilter === "All" ||

            product.condition === conditionFilter)

        );

      }),

    [

      products,

      searchTerm,

      categoryFilter,

      conditionFilter,

    ]

  );

  const runAction = async (action, message) => {

    try {

      setBusy(true);

      await action();

      await loadData();

      notify(message);

    } catch (err) {

      notify(err.message, true);

    } finally {

      setBusy(false);

    }

  };

  // ========================================

  // PRODUCT MANAGEMENT

  // ========================================

  const startAddProduct = () => {

    setEditingProductId(null);

    setProductForm({ ...EMPTY_PRODUCT });

    setShowProductForm(true);

  };

  const startEditProduct = (product) => {

    setEditingProductId(getId(product));

    setProductForm({

      name: product.name || "",

      category: product.category || "Books",

      condition: product.condition || "Good",

      description: product.description || "",

      rentPrice: String(product.rentPrice || ""),

      image: getProductImage(product),

    });

    setShowProductForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });

  };

  const uploadProductImage = async (file) => {

    if (!file) return;

    try {

      setUploading(true);

      const url = await uploadFile(file);

      setProductForm((previous) => ({

        ...previous,

        image: url,

      }));

      notify("Product image uploaded successfully.");

    } catch (err) {

      notify(err.message, true);

    } finally {

      setUploading(false);

    }

  };

  const saveProduct = async (event) => {

    event.preventDefault();

    if (!getToken()) {

      notify("Please login first.", true);

      return;

    }

    const price = Number(productForm.rentPrice);

    if (

      !productForm.name.trim() ||

      !Number.isFinite(price) ||

      price <= 0

    ) {

      notify(

        "Enter product name and valid daily price.",

        true

      );

      return;

    }

    const editing = Boolean(editingProductId);

    await runAction(async () => {

      await apiRequest(

        editing

          ? `/products/${editingProductId}`

          : "/products",

        {

          method: editing ? "PUT" : "POST",

          body: JSON.stringify({

            ...productForm,

            name: productForm.name.trim(),

            description: productForm.description.trim(),

            rentPrice: price,

          }),

        }

      );

      setShowProductForm(false);

      setEditingProductId(null);

      setProductForm({ ...EMPTY_PRODUCT });

    },

    editing

      ? "Rental product updated."

      : "Rental product listed successfully.");

  };

  const deleteProduct = async (product) => {

    if (

      !window.confirm(

        `Delete "${product.name}" from rentals?`

      )

    ) {

      return;

    }

    await runAction(

      () =>

        apiRequest(`/products/${getId(product)}`, {

          method: "DELETE",

        }),

      "Rental product deleted."

    );

  };

  // ========================================

  // RENT REQUEST

  // ========================================

  const openRentRequest = (product) => {

    if (!getToken()) {

      notify("Please login first.", true);

      return;

    }

    if (

      getId(product.ownerId || product.sellerId) ===

      userId

    ) {

      notify("You cannot rent your own product.", true);

      return;

    }

    setSelectedProduct(product);

    setRentStart(todayLocal());

    setRentDuration(1);

  };

  const duration = Number(rentDuration);

  const validDuration =

    Number.isInteger(duration) &&

    duration >= 1 &&

    duration <= 90;

  const rentEnd =

    validDuration && rentStart

      ? addDays(rentStart, duration - 1)

      : "";

  const totalAmount =

    selectedProduct && validDuration

      ? Math.round(

          duration *

            Number(selectedProduct.rentPrice || 0) *

            100

        ) / 100

      : 0;

  const submitRentRequest = async (event) => {

    event.preventDefault();

    if (!selectedProduct) return;

    if (

      !validDuration ||

      !rentStart ||

      rentStart < todayLocal()

    ) {

      notify(

        "Select valid start date and 1–90 rental days.",

        true

      );

      return;

    }

    await runAction(async () => {

      await apiRequest("/requests", {

        method: "POST",

        body: JSON.stringify({

          productId: getId(selectedProduct),

          startDate: rentStart,

          endDate: rentEnd,

          days: duration,

        }),

      });

      setSelectedProduct(null);

    }, "Rental request sent to seller.");

  };

  // ========================================

  // SELLER ACCEPT / REJECT

  // ========================================

  const updateRequestStatus = (request, status) =>

    runAction(

      () =>

        apiRequest(

          `/requests/${getId(request)}/status`,

          {

            method: "PATCH",

            body: JSON.stringify({ status }),

          }

        ),

      `Rental request ${status.toLowerCase()}.`

    );

  // ========================================

  // MEET POINT

  // ========================================

  const scheduleMeeting = async (request, event) => {

    event.preventDefault();

    const id = getId(request);

    const form = meetingForms[id] || {};

    if (

      !form.meetPoint ||

      !form.meetingDate ||

      !form.meetingTime

    ) {

      notify(

        "Enter meet point, date and time.",

        true

      );

      return;

    }

    await runAction(async () => {

      await apiRequest(`/requests/${id}/meetpoint`, {

        method: "PATCH",

        body: JSON.stringify(form),

      });

      setOpenMeetingForm(null);

    }, "Meet point scheduled.");

  };

  const confirmAction = (

    request,

    action,

    message

  ) =>

    runAction(

      () =>

        apiRequest(

          `/requests/${getId(request)}/${action}`,

          {

            method: "PATCH",

            body: JSON.stringify({}),

          }

        ),

      message

    );

  // ========================================
  // RETURN SCHEDULE
  // ========================================

  const scheduleReturn = async (request, event) => {
    event.preventDefault();
    const id = getId(request);
    const form = returnForms[id] || {};
    if (!form.returnDate || !form.returnTime || !form.returnMeetPoint?.trim()) {
      notify("Enter return date, time and meet point.", true);
      return;
    }
    await runAction(async () => {
      await apiRequest(`/requests/${id}/return-schedule`, {
        method: "PATCH",
        body: JSON.stringify({
          returnDate: form.returnDate,
          returnTime: form.returnTime,
          returnMeetPoint: form.returnMeetPoint.trim(),
        }),
      });
      setOpenReturnForm(null);
    }, "Return schedule saved. Waiting for renter confirmation.");
  };

  // ========================================

  // PAYMENT SETTINGS

  // ========================================

  const updatePaymentSettings = (request, form) => {
    const paymentRequired = Boolean(form.paymentRequired);
    const paymentMethod = paymentRequired ? form.paymentMethod : "None";
    const sellerUpiId = String(form.sellerUpiId || "").trim();
    const sellerUpiNumber = String(form.sellerUpiNumber || "").trim();

    if (paymentRequired && paymentMethod === "UPI") {
      if (!/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z0-9.-]{2,64}$/.test(sellerUpiId)) {
        notify("Enter a valid seller UPI ID (example: name@bank).", true);
        return;
      }
      if (sellerUpiNumber && !/^[6-9]\d{9}$/.test(sellerUpiNumber)) {
        notify("Enter a valid 10-digit mobile number or leave it blank.", true);
        return;
      }
    }

    return runAction(
      () => apiRequest(`/requests/${getId(request)}/payment-settings`, {
        method: "PATCH",
        body: JSON.stringify({
          paymentRequired,
          paymentMethod,
          sellerUpiId: paymentMethod === "UPI" ? sellerUpiId : "",
          sellerUpiNumber: paymentMethod === "UPI" ? sellerUpiNumber : "",
        }),
      }),
      "Payment settings updated."
    );
  };

  const copyUpiId = async (upiId) => {
    try {
      await navigator.clipboard.writeText(upiId);
      notify("Seller UPI ID copied.");
    } catch {
      notify("Copy failed. Please select and copy the UPI ID manually.", true);
    }
  };

  // ========================================

  // UPI PAYMENT SCREENSHOT

  // ========================================

  const uploadPaymentProof = async (

    request,

    file

  ) => {

    if (!file) return;

    const id = getId(request);

    try {

      setUploadingProofId(id);

      const url = await uploadFile(file);

      setPaymentProofs((previous) => ({

        ...previous,

        [id]: url,

      }));

      notify(

        "Screenshot uploaded. Click Submit Payment Proof."

      );

    } catch (err) {

      notify(err.message, true);

    } finally {

      setUploadingProofId(null);

    }

  };

  const submitPaymentProof = (request) => {

    const id = getId(request);

    const url = paymentProofs[id];

    if (!url) {

      notify(

        "Upload payment screenshot first.",

        true

      );

      return;

    }

    return runAction(

      () =>

        apiRequest(

          `/requests/${id}/payment-proof`,

          {

            method: "PATCH",

            body: JSON.stringify({

              paymentScreenshot: url,

            }),

          }

        ),

      "Payment proof sent to seller."

    );

  };

  // ========================================

  // PAYMENT VERIFICATION

  // CASH / UPI

  // ========================================

  const verifyPayment = (request, decision) => {

    const isCash = request.paymentMethod === "Cash";

    if (decision === "Verified") {

      const message = isCash

        ? "Have you physically received the cash from the renter at the meet point?"

        : "Have you independently confirmed that the UPI payment was received?";

      if (!window.confirm(message)) {

        return;

      }

    }

    const rejectionReason = decision === "Rejected"
      ? window.prompt("Why are you rejecting this payment proof?")
      : "";

    if (decision === "Rejected" && !rejectionReason?.trim()) {
      notify("Enter a reason for rejecting payment proof.", true);
      return;
    }

    return runAction(

      () =>

        apiRequest(

          `/requests/${getId(request)}/verify-payment`,

          {

            method: "PATCH",

            body: JSON.stringify({

              decision,
              rejectionReason: rejectionReason?.trim() || "",

            }),

          }

        ),

      decision === "Verified"

        ? isCash

          ? "Cash payment received and verified."

          : "UPI payment verified."

        : "Payment proof rejected."

    );

  };

  // ========================================

  // REQUEST CARD

  // ========================================

  const renderRequest = (request, role) => {

    const id = getId(request);

    const product = request.productId || {};

    const name =

      typeof product === "object"

        ? product.name || "Rental Product"

        : "Rental Product";

    const status = request.status || "Pending";

    const isRenter = role === "renter";

    const isOwner = !isRenter;

    const ownMeetConfirmed = isRenter

      ? request.meetConfirmedByRenter

      : request.meetConfirmedByOwner;

    const otherMeetConfirmed = isRenter

      ? request.meetConfirmedByOwner

      : request.meetConfirmedByRenter;

    const ownHandoverConfirmed = isRenter

      ? request.handoverConfirmedByRenter

      : request.handoverConfirmedByOwner;

    const otherHandoverConfirmed = isRenter

      ? request.handoverConfirmedByOwner

      : request.handoverConfirmedByRenter;

    const ownReturnConfirmed = isRenter

      ? request.returnConfirmedByRenter

      : request.returnConfirmedByOwner;

    const otherReturnConfirmed = isRenter

      ? request.returnConfirmedByOwner

      : request.returnConfirmedByRenter;

    const paymentRequired =

      request.paymentRequired === true;

    const paymentMethod =

      request.paymentMethod || "None";

    const paymentStatus =

      request.paymentStatus ||

      (paymentRequired ? "Pending" : "Not Required");

    const orderStatus =

      request.orderStatus || "Not Confirmed";

    const meetingForm = meetingForms[id] || {

      meetPoint: request.meetPoint || "",

      meetingDate: dateInputValue(

        request.meetingDate

      ),

      meetingTime: request.meetingTime || "",

    };

    const paymentForm = paymentForms[id] || {

      paymentRequired,

      paymentMethod: paymentMethod === "None" ? "Cash" : paymentMethod,
      sellerUpiId: request.sellerUpiId || "",
      sellerUpiNumber: request.sellerUpiNumber || "",

    };

    const updateMeetingField = (field, value) =>

      setMeetingForms((previous) => ({

        ...previous,

        [id]: {

          ...meetingForm,

          [field]: value,

        },

      }));

    const updatePaymentField = (field, value) =>

      setPaymentForms((previous) => ({

        ...previous,

        [id]: {

          ...paymentForm,

          [field]: value,

        },

      }));

    const activeStatuses = [

      "Accepted",

      "Active",

      "Return Pending",

      "Completed",

    ];

    const canEditMeeting =

      status === "Accepted" &&

      orderStatus === "Not Confirmed";

    const canEditPayment =

      isOwner &&

      status === "Accepted" &&

      orderStatus === "Not Confirmed";

    const canConfirmOrder =

      status === "Accepted" &&

      request.meetStatus === "Confirmed" &&

      orderStatus === "Not Confirmed" &&

      (

        !paymentRequired ||

        paymentStatus === "Verified"

      );

    const canVerifyCash =

      isOwner &&

      status === "Accepted" &&

      paymentRequired &&

      paymentMethod === "Cash" &&

      ["Pending", "Rejected"].includes(paymentStatus) &&

      orderStatus === "Not Confirmed";

    const canVerifyUPI =

      isOwner &&

      status === "Accepted" &&

      paymentRequired &&

      paymentMethod === "UPI" &&

      paymentStatus === "Submitted";

    const canHandover =

      status === "Accepted" &&

      orderStatus === "Confirmed" &&

      (

        !paymentRequired ||

        paymentStatus === "Verified"

      );

    return (

      <article

        className="rent-request-card"

        key={id}

      >

        <div className="rent-request-top">

          <h3>{name}</h3>

          <StatusBadge status={status} />

        </div>

        <p>

          <strong>

            {isRenter ? "Seller" : "Renter"}:

          </strong>{" "}

          {isRenter

            ? request.ownerId?.fullName || "Student"

            : request.renterId?.fullName || "Student"}

        </p>

        <div className="rent-request-info">

          <p>

            <strong>Start:</strong>{" "}

            {displayDate(request.startDate)}

          </p>

          <p>

            <strong>Return:</strong>{" "}

            {displayDate(request.endDate)}

          </p>

          <p>

            <strong>Duration:</strong>{" "}

            {request.days} days

          </p>

          <p>

            <strong>Daily Rent:</strong>{" "}

            {currency(request.dailyPrice)}

          </p>

          <p>

            <strong>Total Amount:</strong>{" "}

            {currency(request.totalPrice)}

          </p>

        </div>

        {/* SELLER ACCEPT / REJECT */}

        {isOwner && status === "Pending" && (

          <div className="rent-actions">

            <button

              type="button"

              className="rent-success-btn"

              disabled={busy}

              onClick={() =>

                updateRequestStatus(

                  request,

                  "Accepted"

                )

              }

            >

              Accept Request

            </button>

            <button

              type="button"

              className="rent-danger-btn"

              disabled={busy}

              onClick={() =>

                updateRequestStatus(

                  request,

                  "Rejected"

                )

              }

            >

              Reject Request

            </button>

          </div>

        )}

        {status === "Pending" && (

          <p>Waiting for seller approval.</p>

        )}

        {status === "Rejected" && (

          <p>Seller rejected this rental request.</p>

        )}

        {/* ACCEPTED RENTAL WORKFLOW */}

        {activeStatuses.includes(status) && (

          <section className="rent-exchange-box">

            {/* MEET POINT */}

            <div className="rent-confirmation">

              <h4>📍 Rental Meet Point</h4>

              {request.meetPoint ? (

                <div className="rent-meeting-info">

                  <p>

                    <strong>Location:</strong>{" "}

                    {request.meetPoint}

                  </p>

                  <p>

                    <strong>Date:</strong>{" "}

                    {displayDate(

                      request.meetingDate

                    )}

                  </p>

                  <p>

                    <strong>Time:</strong>{" "}

                    {request.meetingTime}

                  </p>

                  <p>

                    <strong>Status:</strong>{" "}

                    {request.meetStatus}

                  </p>

                </div>

              ) : (

                <p>

                  Select a public campus meet point

                  for product exchange.

                </p>

              )}

              {canEditMeeting && (

                <>

                  <button

                    type="button"

                    className="rent-secondary-btn"

                    disabled={busy}

                    onClick={() =>

                      setOpenMeetingForm(

                        openMeetingForm === id

                          ? null

                          : id

                      )

                    }

                  >

                    {request.meetPoint

                      ? "Reschedule Meet Point"

                      : "Schedule Meet Point"}

                  </button>

                  {openMeetingForm === id && (

                    <form

                      className="rent-meeting-form"

                      onSubmit={(event) =>

                        scheduleMeeting(

                          request,

                          event

                        )

                      }

                    >

                      <label>

                        Campus Meet Point

                        <input

                          required

                          maxLength={150}

                          placeholder="College Library"

                          value={

                            meetingForm.meetPoint

                          }

                          onChange={(event) =>

                            updateMeetingField(

                              "meetPoint",

                              event.target.value

                            )

                          }

                        />

                      </label>

                      <label>

                        Meeting Date

                        <input

                          required

                          type="date"

                          min={todayLocal()}

                          value={

                            meetingForm.meetingDate

                          }

                          onChange={(event) =>

                            updateMeetingField(

                              "meetingDate",

                              event.target.value

                            )

                          }

                        />

                      </label>

                      <label>

                        Meeting Time

                        <input

                          required

                          type="time"

                          value={

                            meetingForm.meetingTime

                          }

                          onChange={(event) =>

                            updateMeetingField(

                              "meetingTime",

                              event.target.value

                            )

                          }

                        />

                      </label>

                      <button

                        type="submit"

                        className="rent-primary-btn"

                        disabled={busy}

                      >

                        Save Meet Point

                      </button>

                    </form>

                  )}

                </>

              )}

              {status === "Accepted" &&

                request.meetPoint && (

                  <>

                    <p>

                      Your confirmation:{" "}

                      {ownMeetConfirmed

                        ? "Confirmed ✓"

                        : "Pending"}

                    </p>

                    <p>

                      Other student:{" "}

                      {otherMeetConfirmed

                        ? "Confirmed ✓"

                        : "Pending"}

                    </p>

                    {!ownMeetConfirmed &&

                      orderStatus ===

                        "Not Confirmed" && (

                        <button

                          type="button"

                          className="rent-primary-btn"

                          disabled={busy}

                          onClick={() =>

                            confirmAction(

                              request,

                              "confirm-meet",

                              "Meeting confirmed."

                            )

                          }

                        >

                          Confirm Meeting

                        </button>

                      )}

                  </>

                )}

            </div>

            {/* PAYMENT SECTION */}

            <div className="rent-confirmation">

              <h4>💳 Rental Payment</h4>

              <p>

                <strong>Total Rental Amount:</strong>{" "}

                {currency(request.totalPrice)}

              </p>

              <p>

                <strong>Payment Method:</strong>{" "}

                {paymentMethod === "Cash"

                  ? "Cash at Meet Point"

                  : paymentMethod === "UPI"

                    ? "UPI Payment"

                    : "No Advance Payment"}

              </p>

              <p>

                <strong>Payment Status:</strong>{" "}

                <StatusBadge

                  status={paymentStatus}

                />

              </p>

              {/* SELLER PAYMENT SETTINGS */}

              {canEditPayment && (

                <div className="rent-meeting-form">

                  <label>

                    Payment Option

                    <select

                      value={

                        paymentForm.paymentRequired

                          ? "Required"

                          : "Not Required"

                      }

                      onChange={(event) =>

                        updatePaymentField(

                          "paymentRequired",

                          event.target.value ===

                            "Required"

                        )

                      }

                    >

                      <option value="Not Required">

                        No Payment Verification

                      </option>

                      <option value="Required">

                        Payment Required

                      </option>

                    </select>

                  </label>

                  {paymentForm.paymentRequired && (

                    <label>

                      Payment Method

                      <select

                        value={

                          paymentForm.paymentMethod

                        }

                        onChange={(event) =>

                          updatePaymentField(

                            "paymentMethod",

                            event.target.value

                          )

                        }

                      >

                        <option value="Cash">

                          Cash at Meet Point

                        </option>

                        <option value="UPI">

                          UPI Payment

                        </option>

                      </select>

                    </label>

                  )}

                  {paymentForm.paymentRequired &&

                    paymentForm.paymentMethod ===

                      "Cash" && (

                      <p>

                        💵 Renter will pay cash

                        at the agreed meet point.

                        Seller confirms payment

                        after receiving cash.

                      </p>

                    )}

                  {paymentForm.paymentRequired &&
                    paymentForm.paymentMethod === "UPI" && (
                      <div className="rent-meeting-form">
                        <label>
                          Seller UPI ID *
                          <input
                            type="text"
                            required
                            maxLength={320}
                            placeholder="yourname@bank"
                            value={paymentForm.sellerUpiId || ""}
                            onChange={(event) => updatePaymentField("sellerUpiId", event.target.value)}
                          />
                        </label>
                        <label>
                          UPI Mobile Number (optional)
                          <input
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="10-digit mobile number"
                            value={paymentForm.sellerUpiNumber || ""}
                            onChange={(event) => updatePaymentField("sellerUpiNumber", event.target.value)}
                          />
                        </label>
                        <p>Buyer will see these payment details after you save them.</p>
                      </div>
                    )}

                  {paymentForm.paymentRequired &&

                    paymentForm.paymentMethod ===

                      "UPI" && (

                      <p>

                        📱 Renter pays through UPI

                        and uploads payment proof.

                        Seller verifies receipt.

                      </p>

                    )}

                  <button

                    type="button"

                    className="rent-secondary-btn"

                    disabled={busy}

                    onClick={() =>

                      updatePaymentSettings(

                        request,

                        paymentForm

                      )

                    }

                  >

                    Save Payment Settings

                  </button>

                </div>

              )}

              {/* CASH ON MEET POINT */}

              {paymentRequired &&

                paymentMethod === "Cash" && (

                  <div className="rent-meeting-info">

                    <h4>💵 Cash at Meet Point</h4>

                    <p>

                      Amount to Pay:{" "}

                      <strong>

                        {currency(

                          request.totalPrice

                        )}

                      </strong>

                    </p>

                    <p>

                      Meet Point:{" "}

                      <strong>

                        {request.meetPoint ||

                          "Not scheduled"}

                      </strong>

                    </p>

                    {isRenter && (

                      <p>

                        Bring the agreed rental

                        amount to the campus meet

                        point. Pay the seller

                        directly during handover.

                      </p>

                    )}

                    {isOwner && (

                      <p>

                        Confirm cash payment only

                        after receiving the full

                        rental amount.

                      </p>

                    )}

                    {paymentStatus ===

                      "Verified" ? (

                      <p>

                        ✅ Cash Payment Received

                      </p>

                    ) : (

                      <p>

                        ⏳ Waiting for cash payment

                        at meet point.

                      </p>

                    )}

                    {canVerifyCash && (

                      <button

                        type="button"

                        className="rent-success-btn"

                        disabled={busy}

                        onClick={() =>

                          verifyPayment(

                            request,

                            "Verified"

                          )

                        }

                      >

                        Confirm Cash Received

                      </button>

                    )}

                  </div>

                )}

              {/* UPI PAYMENT */}

              {paymentRequired &&

                paymentMethod === "UPI" && (

                  <div className="rent-meeting-info">

                    <h4>📱 UPI Payment</h4>
                    {request.sellerUpiId ? (
                      <div className="rent-meeting-info">
                        <p><strong>Seller UPI ID:</strong> {request.sellerUpiId}</p>
                        <button type="button" className="rent-secondary-btn"
                          onClick={() => copyUpiId(request.sellerUpiId)}>
                          Copy UPI ID
                        </button>
                        {request.sellerUpiNumber && (
                          <p><strong>UPI Mobile:</strong> {request.sellerUpiNumber}</p>
                        )}
                        <p>Verify the seller's name in your UPI app before paying. A screenshot alone does not confirm receipt.</p>
                      </div>
                    ) : (
                      <p>Waiting for seller to save their UPI payment details.</p>
                    )}

                    <p>

                      Amount:{" "}

                      {currency(

                        request.totalPrice

                      )}

                    </p>

                    {isRenter &&

                      status === "Accepted" &&

                      ["Pending", "Rejected"].includes(paymentStatus) &&
                      Boolean(request.sellerUpiId) && (

                        <div className="rent-meeting-form">

                          <p>

                            Confirm the seller's

                            payment details directly

                            before paying.

                          </p>

                          <label>

                            Upload Payment Screenshot

                            <input

                              type="file"

                              accept="image/*"

                              disabled={

                                uploadingProofId === id

                              }

                              onChange={(event) =>

                                uploadPaymentProof(

                                  request,

                                  event.target

                                    .files?.[0]

                                )

                              }

                            />

                          </label>

                          {uploadingProofId === id && (

                            <p>Uploading screenshot...</p>

                          )}

                          {paymentProofs[id] && (

                            <img

                              src={

                                paymentProofs[id]

                              }

                              alt="Payment proof preview"

                              className="rent-preview-image"

                            />

                          )}

                          <button

                            type="button"

                            className="rent-primary-btn"

                            disabled={

                              busy ||

                              !paymentProofs[id]

                            }

                            onClick={() =>

                              submitPaymentProof(

                                request

                              )

                            }

                          >

                            Submit Payment Proof

                          </button>

                        </div>

                      )}

                    {request.paymentScreenshot && (

                      <div>

                        <p>

                          Uploaded Payment Proof:

                        </p>

                        <img

                          src={

                            request.paymentScreenshot

                          }

                          alt="Uploaded payment proof"

                          className="rent-preview-image"

                        />

                      </div>

                    )}

                    {canVerifyUPI && (

                      <div className="rent-actions">

                        <button

                          type="button"

                          className="rent-success-btn"

                          disabled={busy}

                          onClick={() =>

                            verifyPayment(

                              request,

                              "Verified"

                            )

                          }

                        >

                          Verify UPI Payment

                        </button>

                        <button

                          type="button"

                          className="rent-danger-btn"

                          disabled={busy}

                          onClick={() =>

                            verifyPayment(

                              request,

                              "Rejected"

                            )

                          }

                        >

                          Reject Proof

                        </button>

                      </div>

                    )}

                    {paymentStatus ===

                      "Rejected" && (

                      <p>

                        Payment proof rejected.

                        Upload a new screenshot.

                      </p>

                    )}

                  </div>

                )}

            </div>

            {/* ORDER CONFIRMATION */}

            <div className="rent-confirmation">

              <h4>📦 Rental Order Confirmation</h4>

              <p>

                <strong>Order Status:</strong>{" "}

                <StatusBadge

                  status={orderStatus}

                />

              </p>

              {orderStatus ===

                "Not Confirmed" && (

                <>

                  <p>

                    Both students must confirm

                    the meeting before the rental

                    order can be confirmed.

                  </p>

                  {paymentMethod === "Cash" &&

                    paymentRequired && (

                      <p>

                        Cash will be collected

                        at the meet point.

                        Seller must confirm cash receipt

                        before the rental order is confirmed.

                      </p>

                    )}

                  <button

                    type="button"

                    className="rent-success-btn"

                    disabled={

                      busy || !canConfirmOrder

                    }

                    onClick={() =>

                      confirmAction(

                        request,

                        "confirm-order",

                        "Rental order confirmed."

                      )

                    }

                  >

                    Confirm Rental Order

                  </button>

                </>

              )}

              {orderStatus === "Confirmed" && (

                <p>

                  Rental order confirmed.

                  Complete payment verification

                  if required, then hand over

                  the product.

                </p>

              )}

              {orderStatus === "In Progress" && (

                <p>

                  Rental is currently in progress.

                </p>

              )}

              {orderStatus === "Completed" && (

                <p>

                  Rental order completed.

                </p>

              )}

            </div>

            {/* HANDOVER */}

            {orderStatus === "Confirmed" &&

              status === "Accepted" && (

                <div className="rent-confirmation">

                  <h4>🤝 Product Handover</h4>

                  <p>

                    Your confirmation:{" "}

                    {ownHandoverConfirmed

                      ? "Confirmed ✓"

                      : "Pending"}

                  </p>

                  <p>

                    Other student:{" "}

                    {otherHandoverConfirmed

                      ? "Confirmed ✓"

                      : "Pending"}

                  </p>

                  {paymentRequired &&

                    paymentStatus !==

                      "Verified" && (

                      <p>

                        Payment must be verified

                        before handover.

                      </p>

                    )}

                  {!ownHandoverConfirmed && (

                    <button

                      type="button"

                      className="rent-success-btn"

                      disabled={

                        busy || !canHandover

                      }

                      onClick={() =>

                        confirmAction(

                          request,

                          "confirm-handover",

                          "Handover confirmation saved."

                        )

                      }

                    >

                      Confirm Product Handover

                    </button>

                  )}

                </div>

              )}

            {/* RETURN SCHEDULE AND PRODUCT RETURN */}
            {["Active", "Return Pending"].includes(status) && (
              <div className="rent-confirmation">
                <h4>↩ Product Return</h4>
                <p><strong>Rental End Date:</strong> {displayDate(request.endDate)}</p>
                <p><strong>Return Schedule Status:</strong> <StatusBadge status={request.returnStatus || "Not Scheduled"} /></p>

                {request.returnDate && (
                  <div className="rent-meeting-info">
                    <p><strong>Return Date:</strong> {displayDate(request.returnDate)}</p>
                    <p><strong>Return Time:</strong> {request.returnTime || "Not selected"}</p>
                    <p><strong>Return Meet Point:</strong> {request.returnMeetPoint || "Not selected"}</p>
                  </div>
                )}

                {isOwner && status === "Active" &&
                  !request.returnConfirmedByOwner &&
                  !request.returnConfirmedByRenter && (
                  <>
                    <button
                      type="button"
                      className="rent-secondary-btn"
                      disabled={busy}
                      onClick={() => {
                        setOpenReturnForm(openReturnForm === id ? null : id);
                        setReturnForms(previous => ({
                          ...previous,
                          [id]: previous[id] || {
                            returnDate: dateInputValue(request.returnDate) || dateInputValue(request.endDate),
                            returnTime: request.returnTime || "",
                            returnMeetPoint: request.returnMeetPoint || request.meetPoint || "",
                          },
                        }));
                      }}
                    >
                      {request.returnDate ? "Reschedule Product Return" : "Schedule Product Return"}
                    </button>
                    {openReturnForm === id && (
                      <form className="rent-meeting-form" onSubmit={event => scheduleReturn(request, event)}>
                        <label>Return Date
                          <input type="date" required min={todayLocal()}
                            value={returnForms[id]?.returnDate || ""}
                            onChange={event => setReturnForms(previous => ({
                              ...previous,
                              [id]: { ...previous[id], returnDate: event.target.value },
                            }))} />
                        </label>
                        <label>Return Time
                          <input type="time" required
                            value={returnForms[id]?.returnTime || ""}
                            onChange={event => setReturnForms(previous => ({
                              ...previous,
                              [id]: { ...previous[id], returnTime: event.target.value },
                            }))} />
                        </label>
                        <label>Return Meet Point
                          <input required maxLength={150} placeholder="College Main Gate"
                            value={returnForms[id]?.returnMeetPoint || ""}
                            onChange={event => setReturnForms(previous => ({
                              ...previous,
                              [id]: { ...previous[id], returnMeetPoint: event.target.value },
                            }))} />
                        </label>
                        <button type="submit" className="rent-primary-btn" disabled={busy}>
                          Save Return Schedule
                        </button>
                      </form>
                    )}
                  </>
                )}

                {request.returnDate && (
                  <div className="rent-meeting-info">
                    <p>Your schedule confirmation: {
                      (isRenter ? request.returnScheduleConfirmedByRenter : request.returnScheduleConfirmedByOwner)
                        ? "Confirmed ✓" : "Pending"
                    }</p>
                    <p>Other student's schedule confirmation: {
                      (isRenter ? request.returnScheduleConfirmedByOwner : request.returnScheduleConfirmedByRenter)
                        ? "Confirmed ✓" : "Pending"
                    }</p>
                    {isRenter &&
                      request.returnStatus === "Scheduled" &&
                      request.returnScheduleConfirmedByOwner &&
                      !request.returnScheduleConfirmedByRenter && (
                      <button type="button" className="rent-primary-btn" disabled={busy}
                        onClick={() => confirmAction(request, "confirm-return-schedule", "Return schedule confirmed.")}>
                        Confirm Return Date & Time
                      </button>
                    )}
                  </div>
                )}

                {request.returnStatus === "Confirmed" && (
                  <div className="rent-meeting-info">
                    <p><strong>Actual Product Return</strong></p>
                    <p>Your confirmation: {ownReturnConfirmed ? "Confirmed ✓" : "Pending"}</p>
                    <p>Other student: {otherReturnConfirmed ? "Confirmed ✓" : "Pending"}</p>
                    <p>Confirm only after the product has actually been returned at the agreed meet point and time.</p>
                    {!ownReturnConfirmed && (
                      <button type="button" className="rent-success-btn" disabled={busy || !request.returnDate || !request.returnTime}
                        onClick={() => {
                          if (window.confirm("Has the product actually been returned at the agreed meet point?")) {
                            confirmAction(request, "confirm-return", "Product return confirmation saved.");
                          }
                        }}>
                        Confirm Product Return
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* COMPLETED */}

            {status === "Completed" && (

              <div className="rent-completed-box">

                <h4>

                  Product Returned Successfully!

                </h4>

                <p>

                  Both students confirmed

                  product return.

                </p>

              </div>

            )}

          </section>

        )}

      </article>

    );

  };

  // ========================================

  // MAIN RENT PAGE

  // ========================================

  return (

    <main className="rent-container">

      {/* HERO */}

      <section className="rent-hero">

        <div>

          <span className="rent-eyebrow">

            C-MART CAMPUS RENTALS

          </span>

          <h1>Rent Products, Save More</h1>

          <p>

            Rent books, calculators, electronics

            and study essentials from students

            on your campus.

          </p>

          <button

            type="button"

            className="rent-primary-btn"

            onClick={startAddProduct}

          >

            + List a Product for Rent

          </button>

        </div>

        <div

          className="rent-hero-icon"

          aria-hidden="true"

        >

          📚

        </div>

      </section>

      {/* STATS */}

      <section className="rent-stats">

        <div>

          <strong>{products.length}</strong>

          <span>Rental Products</span>

        </div>

        <div>

          <strong>{myProducts.length}</strong>

          <span>My Listings</span>

        </div>

        <div>

          <strong>{sentRequests.length}</strong>

          <span>My Rent Requests</span>

        </div>

      </section>

      {error && (

        <div

          className="rent-alert rent-alert-error"

          role="alert"

        >

          {error}

        </div>

      )}

      {success && (

        <div

          className="rent-alert rent-alert-success"

          role="status"

        >

          {success}

        </div>

      )}

      {/* ADD / EDIT PRODUCT */}

      <section id="rent-product-form">

        {showProductForm && (

          <form

            className="rent-form"

            onSubmit={saveProduct}

          >

            <div className="rent-section-heading">

              <h2>

                {editingProductId

                  ? "Edit Rental Product"

                  : "List a Product for Rent"}

              </h2>

            </div>

            <div className="rent-form-grid">

              <label>

                Product Name

                <input

                  required

                  maxLength={100}

                  value={productForm.name}

                  onChange={(event) =>

                    setProductForm({

                      ...productForm,

                      name: event.target.value,

                    })

                  }

                  placeholder="Scientific Calculator"

                />

              </label>

              <label>

                Category

                <select

                  value={productForm.category}

                  onChange={(event) =>

                    setProductForm({

                      ...productForm,

                      category: event.target.value,

                    })

                  }

                >

                  {CATEGORIES.map((category) => (

                    <option

                      key={category}

                      value={category}

                    >

                      {category}

                    </option>

                  ))}

                </select>

              </label>

              <label>

                Condition

                <select

                  value={productForm.condition}

                  onChange={(event) =>

                    setProductForm({

                      ...productForm,

                      condition: event.target.value,

                    })

                  }

                >

                  {CONDITIONS.map((condition) => (

                    <option

                      key={condition}

                      value={condition}

                    >

                      {condition}

                    </option>

                  ))}

                </select>

              </label>

              <label>

                Rent Price Per Day (₹)

                <input

                  required

                  type="number"

                  min="1"

                  step="0.01"

                  value={productForm.rentPrice}

                  onChange={(event) =>

                    setProductForm({

                      ...productForm,

                      rentPrice: event.target.value,

                    })

                  }

                  placeholder="20"

                />

              </label>

              <label className="rent-full-width">

                Description

                <textarea

                  rows={4}

                  value={productForm.description}

                  onChange={(event) =>

                    setProductForm({

                      ...productForm,

                      description:

                        event.target.value,

                    })

                  }

                  placeholder="Describe your product..."

                />

              </label>

              <label className="rent-full-width">

                Product Image

                <input

                  type="file"

                  accept="image/*"

                  disabled={uploading}

                  onChange={(event) =>

                    uploadProductImage(

                      event.target.files?.[0]

                    )

                  }

                />

              </label>

              {uploading && (

                <p>Uploading image...</p>

              )}

              {productForm.image && (

                <img

                  className="rent-preview-image"

                  src={productForm.image}

                  alt="Rental product preview"

                />

              )}

            </div>

            <div className="rent-actions">

              <button

                type="submit"

                className="rent-primary-btn"

                disabled={busy || uploading}

              >

                {editingProductId

                  ? "Update Product"

                  : "Add Rental Product"}

              </button>

              <button

                type="button"

                className="rent-secondary-btn"

                onClick={() =>

                  setShowProductForm(false)

                }

              >

                Cancel

              </button>

            </div>

          </form>

        )}

      </section>

      {/* PRODUCT LIST */}

      <section className="rent-products-section">

        <div className="rent-section-heading">

          <div>

            <span className="rent-kicker">

              EXPLORE RENTALS

            </span>

            <h2>Available Rental Products</h2>

            <p>

              {filteredProducts.length} products found

            </p>

          </div>

          <button

            type="button"

            className="rent-secondary-btn"

            onClick={loadData}

          >

            Refresh

          </button>

        </div>

        <div className="rent-search-filter">

          <input

            type="search"

            placeholder="Search rental products..."

            value={searchTerm}

            onChange={(event) =>

              setSearchTerm(event.target.value)

            }

          />

          <select

            value={categoryFilter}

            onChange={(event) =>

              setCategoryFilter(event.target.value)

            }

          >

            <option value="All">

              All Categories

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

          <select

            value={conditionFilter}

            onChange={(event) =>

              setConditionFilter(event.target.value)

            }

          >

            <option value="All">

              All Conditions

            </option>

            {CONDITIONS.map((condition) => (

              <option

                key={condition}

                value={condition}

              >

                {condition}

              </option>

            ))}

          </select>

        </div>

        {loading ? (

          <div className="rent-empty">

            Loading rental products...

          </div>

        ) : filteredProducts.length === 0 ? (

          <div className="rent-empty">

            No rental products found.

          </div>

        ) : (

          <div className="rent-product-list">

            {filteredProducts.map((product) => {

              const id = getId(product);

              const owner =

                getId(

                  product.ownerId ||

                  product.sellerId

                ) === userId;

              const existingRequest =

                sentRequests.find(

                  (request) =>

                    getId(request.productId) ===

                      id &&

                    [

                      "Pending",

                      "Accepted",

                      "Active",

                      "Return Pending",

                    ].includes(request.status)

                );

              return (

                <article

                  className="rent-product-card"

                  key={id}

                >

                  <ProductImage product={product} />

                  <div className="rent-product-content">

                    <span className="rent-category">

                      {product.category || "Other"}

                    </span>

                    <h3>{product.name}</h3>

                    <p className="rent-card-condition">

                      Condition: <strong>{product.condition || "Used"}</strong>

                    </p>

                    {product.description && (

                      <p className="rent-card-description">{product.description}</p>

                    )}

                    <div className="rent-price">

                      {currency(product.rentPrice)}

                      <span> / day</span>

                    </div>

                    <div className="rent-actions">

                      {owner ? (

                        <>

                          <button

                            type="button"

                            className="rent-secondary-btn"

                            onClick={() =>

                              startEditProduct(

                                product

                              )

                            }

                          >

                            Edit

                          </button>

                          <button

                            type="button"

                            className="rent-danger-btn"

                            disabled={busy}

                            onClick={() =>

                              deleteProduct(product)

                            }

                          >

                            Delete

                          </button>

                        </>

                      ) : existingRequest ? (

                        <StatusBadge

                          status={

                            existingRequest.status

                          }

                        />

                      ) : (

                        <button

                          type="button"

                          className="rent-primary-btn"

                          disabled={

                            product.isAvailable ===

                            false

                          }

                          onClick={() =>

                            openRentRequest(product)

                          }

                        >

                          {product.isAvailable === false

                            ? "Unavailable"

                            : "Rent Now"}

                        </button>

                      )}

                    </div>

                  </div>

                </article>

              );

            })}

          </div>

        )}

      </section>

      {/* RENT REQUEST FORM */}

      {selectedProduct && (

        <section ref={rentRequestFormRef} className="rent-form" style={{ scrollMarginTop: "90px" }}>

          <div className="rent-section-heading">

            <h2>

              Request Rental:{" "}

              {selectedProduct.name}

            </h2>

          </div>

          <form onSubmit={submitRentRequest}>

            <div className="rent-form-grid">

              <label>

                Rental Start Date

                <input

                  required

                  type="date"

                  min={todayLocal()}

                  value={rentStart}

                  onChange={(event) =>

                    setRentStart(

                      event.target.value

                    )

                  }

                />

              </label>

              <label>

                Number of Rental Days

                <input

                  required

                  type="number"

                  min="1"

                  max="90"

                  step="1"

                  value={rentDuration}

                  onChange={(event) =>

                    setRentDuration(

                      event.target.value

                    )

                  }

                />

              </label>

            </div>

            <div className="rent-request-info">

              <p>

                <strong>Daily Price:</strong>{" "}

                {currency(

                  selectedProduct.rentPrice

                )}

              </p>

              <p>

                <strong>Return Date:</strong>{" "}

                {rentEnd

                  ? displayDate(

                      `${rentEnd}T00:00:00Z`

                    )

                  : "Select valid days"}

              </p>

              <p>

                <strong>Total Rental Cost:</strong>{" "}

                {currency(totalAmount)}

              </p>

              <p>

                Payment method will be confirmed

                after seller accepts your request.

              </p>

            </div>

            <div className="rent-actions">

              <button

                type="submit"

                className="rent-primary-btn"

                disabled={

                  busy || !validDuration

                }

              >

                Send Rent Request

              </button>

              <button

                type="button"

                className="rent-secondary-btn"

                onClick={() =>

                  setSelectedProduct(null)

                }

              >

                Cancel

              </button>

            </div>

          </form>

        </section>

      )}

      {/* RECEIVED REQUESTS */}

      <section className="rent-requests-section">

        <h2>

          📥 Received Rent Requests (

          {receivedRequests.length})

        </h2>

        <div className="rent-requests-list">

          {receivedRequests.length ? (

            receivedRequests.map((request) =>

              renderRequest(request, "owner")

            )

          ) : (

            <div className="rent-empty">

              No rental requests received yet.

            </div>

          )}

        </div>

      </section>

      {/* SENT REQUESTS */}

      <section className="rent-requests-section">

        <h2>

          📤 My Sent Rent Requests (

          {sentRequests.length})

        </h2>

        <div className="rent-requests-list">

          {sentRequests.length ? (

            sentRequests.map((request) =>

              renderRequest(request, "renter")

            )

          ) : (

            <div className="rent-empty">

              You have not requested any

              rental products yet.

            </div>

          )}

        </div>

      </section>

    </main>

  );

}

export default Rent;
