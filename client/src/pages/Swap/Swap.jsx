

import { useCallback, useEffect, useRef, useState } from "react";

import axios from "axios";

import "./Swap.css";

const API = "http://localhost:5000/api";

const SWAP_API = `${API}/swap`;

const UPLOAD_API = `${API}/upload/image`;

const CATEGORIES = [

  "Books",

  "Electronics",

  "Accessories",

  "Sports",

  "Study",

  "Other",

];

const CONDITIONS = ["Good", "Excellent", "Used", "Fair", "New"];

const MEET_POINTS = [

  "College Library",

  "College Main Gate",

  "College Canteen",

  "Academic Block",

  "Campus Ground",

  "Other Campus Location",

];

const EMPTY_PRODUCT = {

  name: "",

  category: "Books",

  condition: "Good",

  image: "",

};

const EMPTY_MEETING = {

  meetPoint: "",

  meetingDate: "",

  meetingTime: "",

};

const EMPTY_PAYMENT = {

  paymentRequired: false,

  additionalAmount: "",

  paymentPayer: "Buyer",

  paymentMethod: "Cash",

};

function getId(value) {

  if (!value) return "";

  if (typeof value === "object") {

    return String(value._id || value.id || "");

  }

  return String(value);

}

function getImageUrl(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.map(getImageUrl).find(Boolean) || "";
  if (typeof value === "object") {
    return getImageUrl(value.secure_url || value.url || value.imageUrl || value.image || value.images || value.path || value.src);
  }
  if (typeof value !== "string") return "";
  const url = value.trim().replace(/\\/g, "/");
  if (!url) return "";
  if (/^(https?:\/\/|data:image\/|blob:)/i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  return `http://localhost:5000/${url.replace(/^\/+/, "")}`;
}

function getProductImages(product) {
  const sources = [product?.images, product?.image, product?.imageUrl, product?.photo, product?.thumbnail];
  const urls = [];
  const visit = (item) => {
    if (!item) return;
    if (Array.isArray(item)) return item.forEach(visit);
    if (typeof item === "object" && Array.isArray(item.images)) visit(item.images);
    const url = getImageUrl(item);
    if (url && !urls.includes(url)) urls.push(url);
  };
  sources.forEach(visit);
  return urls;
}

function SwapProductCard({ product }) {
  const images = getProductImages(product);
  const [imageIndex, setImageIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState([]);
  const visibleImages = images.filter(url => !failedUrls.includes(url));
  const activeIndex = Math.min(imageIndex, Math.max(visibleImages.length - 1, 0));
  const activeImage = visibleImages[activeIndex];

  return (
    <div className="swap-product-content">
      <div className="swap-product-image-box swap-image-gallery">
        {activeImage ? (
          <img
            key={activeImage}
            src={activeImage}
            alt={productName(product)}
            loading="lazy"
            onError={() => { setFailedUrls(previous => [...previous, activeImage]); setImageIndex(0); }}
          />
        ) : (
          <div className="swap-image-placeholder">📷<span>No image available</span></div>
        )}
        {visibleImages.length > 1 && (
          <>
            <button type="button" className="swap-gallery-arrow swap-gallery-prev" aria-label="Previous image"
              onClick={() => setImageIndex((activeIndex - 1 + visibleImages.length) % visibleImages.length)}>‹</button>
            <button type="button" className="swap-gallery-arrow swap-gallery-next" aria-label="Next image"
              onClick={() => setImageIndex((activeIndex + 1) % visibleImages.length)}>›</button>
            <span className="swap-gallery-count">{activeIndex + 1} / {visibleImages.length}</span>
          </>
        )}
      </div>
      {visibleImages.length > 1 && (
        <div className="swap-gallery-thumbnails">
          {visibleImages.map((url, index) => (
            <button type="button" key={url} className={index === activeIndex ? "swap-thumb active" : "swap-thumb"}
              onClick={() => setImageIndex(index)} aria-label={`View image ${index + 1}`}>
              <img src={url} alt="" loading="lazy" onError={() => setFailedUrls(previous => [...previous, url])}/>
            </button>
          ))}
        </div>
      )}
      <div className="swap-product-info">
        <h3 title={productName(product)}>{productName(product)}</h3>
        <div className="swap-product-meta">
          <span>📚 {product.category || "Other"}</span>
          <span>✨ {product.condition || "Used"}</span>
        </div>
        {product.description && <p className="swap-product-description">{product.description}</p>}
      </div>
    </div>
  );
}

function getList(data, key) {

  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.[key])) return data[key];

  if (Array.isArray(data?.data)) return data.data;

  return [];

}

function getCurrentUserId() {

  try {

    const user = JSON.parse(

      localStorage.getItem("user") || "{}"

    );

    return getId(

      user._id ||

        user.id ||

        user.user?._id ||

        user.user?.id

    );

  } catch {

    return "";

  }

}

function authConfig() {

  return {

    headers: {

      Authorization: `Bearer ${

        localStorage.getItem("token") || ""

      }`,

    },

  };

}

function productName(product) {

  return product?.name || product?.title || "Unknown Product";

}

function getError(error, fallback) {

  return (

    error.response?.data?.message ||

    error.message ||

    fallback

  );

}

function formatDate(value) {

  if (!value) return "Not Scheduled";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {

    return "Not Scheduled";

  }

  return date.toLocaleDateString("en-IN", {

    day: "2-digit",

    month: "short",

    year: "numeric",

    timeZone: "UTC",

  });

}

function getUploadedUrl(data) {

  return (

    data?.secure_url ||

    data?.url ||

    data?.imageUrl ||

    data?.image?.secure_url ||

    data?.image?.url ||

    data?.data?.secure_url ||

    data?.data?.url ||

    ""

  );

}

async function uploadImageFile(file) {

  if (!file?.type?.startsWith("image/")) {

    throw new Error("Select a valid image file.");

  }

  if (file.size > 5 * 1024 * 1024) {

    throw new Error("Image must be smaller than 5 MB.");

  }

  const body = new FormData();

  body.append("image", file);

  const response = await axios.post(

    UPLOAD_API,

    body,

    authConfig()

  );

  const url = getUploadedUrl(response.data);

  if (!url || !/^https:\/\//i.test(url)) {

    throw new Error(

      "Upload did not return a valid HTTPS image URL."

    );

  }

  return url;

}

// =====================================

// SWAP PAYMENT COMPONENT

// =====================================

function SwapPaymentDetails({

  request,

  currentUserId,

  busyId,

  onAction,

}) {

  const requestId = getId(request);

  const accepted = request.status === "Accepted";

  const completed = request.status === "Completed";

  const sellerId = getId(request.sellerId);

  const buyerId = getId(request.buyerId);

  const isSeller = currentUserId === sellerId;

  const isBuyer = currentUserId === buyerId;

  const required = Boolean(request.paymentRequired);

  const paymentStatus =

    request.paymentStatus || "Not Required";

  const payerId =

    request.paymentPayer === "Seller"

      ? sellerId

      : request.paymentPayer === "Buyer"

      ? buyerId

      : "";

  const receiverId =

    request.paymentPayer === "Seller"

      ? buyerId

      : request.paymentPayer === "Buyer"

      ? sellerId

      : "";

  const isPayer =

    required && currentUserId === payerId;

  const isReceiver =

    required && currentUserId === receiverId;

  const sellerAgreed = Boolean(

    request.paymentAgreedBySeller

  );

  const buyerAgreed = Boolean(

    request.paymentAgreedByBuyer

  );

  const bothAgreed = sellerAgreed && buyerAgreed;

  const [editing, setEditing] = useState(false);

  const [paymentForm, setPaymentForm] = useState(

    EMPTY_PAYMENT

  );

  const [upiId, setUpiId] = useState("");

  const [proofFile, setProofFile] = useState(null);

  const [uploading, setUploading] = useState(false);

  const busy = busyId === requestId;

  if (!accepted && !completed) return null;

  const canEdit =

    accepted &&

    isSeller &&

    paymentStatus !== "Verified" &&

    !request.buyerExchangeConfirmed &&

    !request.sellerExchangeConfirmed;

  const startEditing = () => {

    setPaymentForm({

      paymentRequired: required,

      additionalAmount:

        request.additionalAmount || "",

      paymentPayer: ["Seller", "Buyer"].includes(

        request.paymentPayer

      )

        ? request.paymentPayer

        : "Buyer",

      paymentMethod: ["Cash", "UPI"].includes(

        request.paymentMethod

      )

        ? request.paymentMethod

        : "Cash",

    });

    setEditing(true);

  };

  const saveTerms = async (event) => {

    event.preventDefault();

    const requiredNow =

      paymentForm.paymentRequired;

    const amount = Number(

      paymentForm.additionalAmount

    );

    if (

      requiredNow &&

      (!Number.isFinite(amount) ||

        amount <= 0 ||

        amount > 1000000)

    ) {

      window.alert(

        "Enter a valid additional amount."

      );

      return;

    }

    const success = await onAction(

      requestId,

      "payment-settings",

      {

        paymentRequired: requiredNow,

        additionalAmount: requiredNow

          ? amount

          : 0,

        paymentPayer: requiredNow

          ? paymentForm.paymentPayer

          : "None",

        paymentMethod: requiredNow

          ? paymentForm.paymentMethod

          : "None",

      }

    );

    if (success) {

      setEditing(false);

    }

  };

  const confirmTerms = async () => {

    if (

      !window.confirm(

        "Do you agree to these swap terms?"

      )

    ) {

      return;

    }

    await onAction(

      requestId,

      "confirm-payment-terms",

      {}

    );

  };

  const saveUpi = async () => {

    const value = upiId.trim();

    if (!value) {

      window.alert("Enter your UPI ID.");

      return;

    }

    const success = await onAction(

      requestId,

      "receiver-upi",

      {

        receiverUpiId: value,

      }

    );

    if (success) {

      setUpiId("");

    }

  };

  const submitProof = async () => {

    if (!proofFile) {

      window.alert(

        "Select a payment screenshot first."

      );

      return;

    }

    try {

      setUploading(true);

      const imageUrl = await uploadImageFile(

        proofFile

      );

      const success = await onAction(

        requestId,

        "payment-proof",

        {

          paymentScreenshot: imageUrl,

        }

      );

      if (success) {

        setProofFile(null);

      }

    } catch (error) {

      window.alert(

        getError(

          error,

          "Payment screenshot upload failed."

        )

      );

    } finally {

      setUploading(false);

    }

  };

  const verifyPayment = async () => {

    if (

      !window.confirm(

        "Have you actually received the full payment? Verify your own Cash/UPI receipt before confirming."

      )

    ) {

      return;

    }

    await onAction(

      requestId,

      "verify-payment",

      {

        received: true,

      }

    );

  };

  const rejectProof = async () => {

    const reason = window.prompt(

      "Why are you rejecting this payment proof?"

    );

    if (!reason?.trim()) return;

    await onAction(

      requestId,

      "reject-payment",

      {

        reason: reason.trim(),

      }

    );

  };

  return (

    <section className="swap-exchange-details">

      <h4>💳 Swap Payment Details</h4>

      {canEdit && !editing && (

        <button

          type="button"

          className="swap-primary-btn"

          disabled={busy}

          onClick={startEditing}

        >

          {sellerAgreed

            ? "Edit Payment Terms"

            : "Set Swap Payment"}

        </button>

      )}

      {canEdit && editing && (

        <form

          className="swap-meeting-form"

          onSubmit={saveTerms}

        >

          <h4>Choose Swap Type</h4>

          <div className="swap-field">

            <label>Swap Type</label>

            <select

              value={

                paymentForm.paymentRequired

                  ? "paid"

                  : "free"

              }

              onChange={(event) =>

                setPaymentForm((previous) => ({

                  ...previous,

                  paymentRequired:

                    event.target.value === "paid",

                }))

              }

            >

              <option value="free">

                Free Swap

              </option>

              <option value="paid">

                Swap with Additional Payment

              </option>

            </select>

          </div>

          {paymentForm.paymentRequired && (

            <>

              <div className="swap-field">

                <label>Who Will Pay?</label>

                <select

                  value={paymentForm.paymentPayer}

                  onChange={(event) =>

                    setPaymentForm((previous) => ({

                      ...previous,

                      paymentPayer:

                        event.target.value,

                    }))

                  }

                >

                  <option value="Buyer">

                    Swap Requester Pays

                  </option>

                  <option value="Seller">

                    Product Owner Pays

                  </option>

                </select>

              </div>

              <div className="swap-field">

                <label>Additional Amount (₹)</label>

                <input

                  type="number"

                  min="0.01"

                  max="1000000"

                  step="0.01"

                  required

                  value={

                    paymentForm.additionalAmount

                  }

                  onChange={(event) =>

                    setPaymentForm((previous) => ({

                      ...previous,

                      additionalAmount:

                        event.target.value,

                    }))

                  }

                  placeholder="Enter amount"

                />

              </div>

              <div className="swap-field">

                <label>Payment Method</label>

                <select

                  value={paymentForm.paymentMethod}

                  onChange={(event) =>

                    setPaymentForm((previous) => ({

                      ...previous,

                      paymentMethod:

                        event.target.value,

                    }))

                  }

                >

                  <option value="Cash">

                    Cash

                  </option>

                  <option value="UPI">

                    UPI

                  </option>

                </select>

              </div>

            </>

          )}

          <div className="swap-card-actions">

            <button

              type="submit"

              className="swap-primary-btn"

              disabled={busy}

            >

              Save Payment Terms

            </button>

            <button

              type="button"

              className="swap-quiet-btn"

              onClick={() => setEditing(false)}

            >

              Cancel

            </button>

          </div>

        </form>

      )}

      {sellerAgreed ? (

        <div className="swap-meeting-summary">

          <h4>Payment Summary</h4>

          <p>

            <strong>Swap Type:</strong>{" "}

            {required

              ? "Paid Swap"

              : "Free Swap"}

          </p>

          {required && (

            <>

              <p>

                <strong>Amount:</strong> ₹

                {request.additionalAmount}

              </p>

              <p>

                <strong>Who Pays:</strong>{" "}

                {request.paymentPayer === "Seller"

                  ? "Product Owner"

                  : "Swap Requester"}

              </p>

              <p>

                <strong>Method:</strong>{" "}

                {request.paymentMethod}

              </p>

            </>

          )}

          <p>

            <strong>Owner Agreement:</strong>{" "}

            {sellerAgreed

              ? "Confirmed ✓"

              : "Pending"}

          </p>

          <p>

            <strong>Requester Agreement:</strong>{" "}

            {buyerAgreed

              ? "Confirmed ✓"

              : "Pending"}

          </p>

          <p>

            <strong>Payment Status:</strong>{" "}

            {paymentStatus}

          </p>

        </div>

      ) : (

        <p>

          Waiting for the Product Owner to

          propose Free Swap or Paid Swap terms.

        </p>

      )}

      {accepted &&

        isBuyer &&

        sellerAgreed &&

        !buyerAgreed && (

          <div className="swap-confirm-meeting">

            <p>

              Review the proposed terms carefully.

              Both students must agree before

              proceeding.

            </p>

            <button

              type="button"

              className="swap-confirm-btn"

              disabled={busy}

              onClick={confirmTerms}

            >

              ✓ Agree to Swap Terms

            </button>

          </div>

        )}

      {accepted &&

        required &&

        bothAgreed &&

        request.paymentMethod === "UPI" &&

        isReceiver &&

        !["Submitted", "Verified"].includes(

          paymentStatus

        ) && (

          <div className="swap-meeting-form">

            <h4>Receiver UPI Details</h4>

            <div className="swap-field">

              <label>Your UPI ID</label>

              <input

                type="text"

                value={upiId}

                placeholder={

                  request.receiverUpiId ||

                  "example@upi"

                }

                onChange={(event) =>

                  setUpiId(event.target.value)

                }

              />

            </div>

            <button

              type="button"

              className="swap-primary-btn"

              disabled={busy || !upiId.trim()}

              onClick={saveUpi}

            >

              Save UPI ID

            </button>

          </div>

        )}

      {required &&

        request.paymentMethod === "UPI" &&

        request.receiverUpiId && (

          <p>

            <strong>Receiver UPI ID:</strong>{" "}

            {request.receiverUpiId}

          </p>

        )}

      {accepted &&

        required &&

        bothAgreed &&

        isPayer &&

        request.paymentMethod === "UPI" &&

        request.receiverUpiId &&

        ["Pending", "Rejected"].includes(

          paymentStatus

        ) && (

          <div className="swap-meeting-form">

            <h4>Upload UPI Payment Proof</h4>

            <p>

              After making payment to the agreed

              UPI ID, upload the screenshot.

            </p>

            <input

              type="file"

              accept="image/*"

              onChange={(event) =>

                setProofFile(

                  event.target.files?.[0] || null

                )

              }

            />

            <button

              type="button"

              className="swap-primary-btn"

              disabled={

                busy || uploading || !proofFile

              }

              onClick={submitProof}

            >

              {uploading

                ? "Uploading..."

                : "Submit Payment Proof"}

            </button>

          </div>

        )}

      {required &&

        paymentStatus === "Submitted" &&

        isPayer && (

          <p>

            Payment proof submitted. Waiting for

            receiver verification.

          </p>

        )}

      {required &&

        request.paymentScreenshot &&

        isReceiver && (

          <div className="swap-meeting-summary">

            <h4>Submitted Payment Proof</h4>

            <a

              href={request.paymentScreenshot}

              target="_blank"

              rel="noopener noreferrer"

            >

              View Payment Screenshot

            </a>

            <p>

              A screenshot alone does not prove

              payment. Check your own UPI or bank

              transaction history.

            </p>

          </div>

        )}

      {accepted &&

        required &&

        bothAgreed &&

        isReceiver &&

        paymentStatus !== "Verified" &&

        (request.paymentMethod === "Cash" ||

          paymentStatus === "Submitted") && (

          <div className="swap-confirm-meeting">

            <h4>Confirm Payment Received</h4>

            <p>

              Confirm only after actually receiving

              ₹{request.additionalAmount}.

            </p>

            <div className="swap-card-actions">

              <button

                type="button"

                className="swap-confirm-btn"

                disabled={busy}

                onClick={verifyPayment}

              >

                ✓ Confirm Payment Received

              </button>

              {request.paymentMethod === "UPI" &&

                paymentStatus ===

                  "Submitted" && (

                  <button

                    type="button"

                    className="reject-swap-btn"

                    disabled={busy}

                    onClick={rejectProof}

                  >

                    Reject Payment Proof

                  </button>

                )}

            </div>

          </div>

        )}

      {required &&

        paymentStatus === "Rejected" && (

          <p className="swap-alert swap-error">

            Payment proof rejected:{" "}

            {request.paymentRejectionReason ||

              "Please submit valid proof."}

          </p>

        )}

      {required &&

        paymentStatus === "Verified" && (

          <p className="swap-alert swap-success">

            ✓ Payment Verified Successfully

          </p>

        )}

      {!required && bothAgreed && (

        <p className="swap-alert swap-success">

          ✓ Free Swap Agreed by Both Students

        </p>

      )}

    </section>

  );

}

// =====================================

// MEET POINT & EXCHANGE COMPONENT

// =====================================

function SwapExchangeDetails({

  request,

  currentUserId,

  busyId,

  onAction,

}) {

  const requestId = getId(request);

  const accepted = request.status === "Accepted";

  const completed = request.status === "Completed";

  const isBuyer =

    getId(request.buyerId) === currentUserId;

  const [editing, setEditing] = useState(false);

  const [meetingForm, setMeetingForm] = useState(

    EMPTY_MEETING

  );

  const meetStatus =

    request.meetStatus || "Not Scheduled";

  const scheduled = Boolean(

    request.meetPoint &&

      request.meetingDate &&

      request.meetingTime

  );

  const meetingConfirmed = [

    "Confirmed",

    "Completed",

  ].includes(meetStatus);

  const myMeetConfirmed = isBuyer

    ? request.meetConfirmedByBuyer

    : request.meetConfirmedBySeller;

  const otherMeetConfirmed = isBuyer

    ? request.meetConfirmedBySeller

    : request.meetConfirmedByBuyer;

  const myExchangeConfirmed = isBuyer

    ? request.buyerExchangeConfirmed

    : request.sellerExchangeConfirmed;

  const otherExchangeConfirmed = isBuyer

    ? request.sellerExchangeConfirmed

    : request.buyerExchangeConfirmed;

  const paymentReady = Boolean(

    request.paymentAgreedBySeller &&

      request.paymentAgreedByBuyer &&

      (!request.paymentRequired ||

        request.paymentStatus === "Verified")

  );

  const busy = busyId === requestId;

  const canSchedule =

    accepted &&

    !request.buyerExchangeConfirmed &&

    !request.sellerExchangeConfirmed;

  if (!accepted && !completed) return null;

  const startScheduling = () => {

    setMeetingForm({

      meetPoint: request.meetPoint || "",

      meetingDate: request.meetingDate

        ? new Date(request.meetingDate)

            .toISOString()

            .slice(0, 10)

        : "",

      meetingTime: request.meetingTime || "",

    });

    setEditing(true);

  };

  const saveMeeting = async (event) => {

    event.preventDefault();

    const success = await onAction(

      requestId,

      "meetpoint",

      meetingForm

    );

    if (success) {

      setEditing(false);

    }

  };

  const confirmMeeting = () =>

    onAction(requestId, "confirm-meet", {});

  const confirmExchange = async () => {

    if (

      !window.confirm(

        "Have you physically exchanged the products?"

      )

    ) {

      return;

    }

    await onAction(

      requestId,

      "confirm-exchange",

      {}

    );

  };

  return (

    <section className="swap-exchange-details">

      <h4>📍 Swap Meet Point & Exchange</h4>

      {completed && (

        <div className="swap-exchange-completed">

          <h4>🎉 Swap Completed Successfully!</h4>

          <p>

            Both students confirmed the product

            exchange.

          </p>

          {request.completedAt && (

            <p>

              Completed:{" "}

              {new Date(

                request.completedAt

              ).toLocaleString("en-IN")}

            </p>

          )}

        </div>

      )}

      {scheduled && (

        <div className="swap-meeting-summary">

          <p>

            <strong>Meet Point:</strong>{" "}

            {request.meetPoint}

          </p>

          <p>

            <strong>Meeting Date:</strong>{" "}

            {formatDate(request.meetingDate)}

          </p>

          <p>

            <strong>Meeting Time:</strong>{" "}

            {request.meetingTime}

          </p>

          <p>

            <strong>Meeting Status:</strong>{" "}

            {meetStatus}

          </p>

        </div>

      )}

      {canSchedule && !editing && (

        <button

          type="button"

          className="swap-schedule-btn"

          disabled={busy}

          onClick={startScheduling}

        >

          {scheduled

            ? "📍 Reschedule Meet Point"

            : "📍 Schedule Meet Point"}

        </button>

      )}

      {accepted && editing && (

        <form

          className="swap-meeting-form"

          onSubmit={saveMeeting}

        >

          <h4>Schedule Campus Meeting</h4>

          <div className="swap-field">

            <label>Meet Point</label>

            <select

              required

              value={meetingForm.meetPoint}

              onChange={(event) =>

                setMeetingForm((previous) => ({

                  ...previous,

                  meetPoint: event.target.value,

                }))

              }

            >

              <option value="">

                Choose Campus Location

              </option>

              {MEET_POINTS.map((point) => (

                <option

                  key={point}

                  value={point}

                >

                  {point}

                </option>

              ))}

            </select>

          </div>

          <div className="swap-field">

            <label>Meeting Date</label>

            <input

              type="date"

              required

              min={new Date()

                .toLocaleDateString("en-CA")}

              value={meetingForm.meetingDate}

              onChange={(event) =>

                setMeetingForm((previous) => ({

                  ...previous,

                  meetingDate:

                    event.target.value,

                }))

              }

            />

          </div>

          <div className="swap-field">

            <label>Meeting Time</label>

            <input

              type="time"

              required

              value={meetingForm.meetingTime}

              onChange={(event) =>

                setMeetingForm((previous) => ({

                  ...previous,

                  meetingTime:

                    event.target.value,

                }))

              }

            />

          </div>

          <div className="swap-card-actions">

            <button

              type="submit"

              className="swap-primary-btn"

              disabled={busy}

            >

              Save Meet Point

            </button>

            <button

              type="button"

              className="swap-quiet-btn"

              onClick={() => setEditing(false)}

            >

              Cancel

            </button>

          </div>

        </form>

      )}

      {accepted &&

        scheduled &&

        !meetingConfirmed && (

          <div className="swap-confirm-meeting">

            <h4>Meeting Confirmation</h4>

            <p>

              Your Confirmation:{" "}

              {myMeetConfirmed

                ? "Confirmed ✓"

                : "Pending"}

            </p>

            <p>

              Other Student:{" "}

              {otherMeetConfirmed

                ? "Confirmed ✓"

                : "Pending"}

            </p>

            {!myMeetConfirmed && (

              <button

                type="button"

                className="swap-confirm-btn"

                disabled={busy}

                onClick={confirmMeeting}

              >

                ✓ Confirm Meeting

              </button>

            )}

          </div>

        )}

      {(meetingConfirmed || completed) && (

        <div className="swap-exchange-confirmation">

          <h4>📦 Product Exchange</h4>

          <p>

            Your Confirmation:{" "}

            {myExchangeConfirmed

              ? "Confirmed ✓"

              : "Pending"}

          </p>

          <p>

            Other Student:{" "}

            {otherExchangeConfirmed

              ? "Confirmed ✓"

              : "Pending"}

          </p>

          {accepted && !paymentReady && (

            <p>

              Both students must agree to swap

              terms. For a paid swap, the receiver

              must also verify payment.

            </p>

          )}

          {accepted &&

            paymentReady &&

            !myExchangeConfirmed && (

              <button

                type="button"

                className="swap-complete-btn"

                disabled={busy}

                onClick={confirmExchange}

              >

                ✓ Confirm Product Exchange

              </button>

            )}

          {accepted && myExchangeConfirmed && (

            <p>

              Waiting for the other student to

              confirm the exchange.

            </p>

          )}

        </div>

      )}

    </section>

  );

}

// =====================================

// MAIN SWAP PAGE

// =====================================

export default function Swap() {

  const [products, setProducts] = useState([]);

  const [swapRequests, setSwapRequests] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [busyId, setBusyId] = useState("");

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(EMPTY_PRODUCT);

  const [imageFile, setImageFile] = useState(null);

  const [imagePreview, setImagePreview] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [categoryFilter, setCategoryFilter] =

    useState("All");

  const [conditionFilter, setConditionFilter] =

    useState("All");

  const [requestTarget, setRequestTarget] =

    useState(null);

  const [offeredProductId, setOfferedProductId] =

    useState("");

  const [offeredDescription, setOfferedDescription] =

    useState("");

  const formRef = useRef(null);

  const fileInputRef = useRef(null);

  const currentUserId = getCurrentUserId();

  const loggedIn = Boolean(

    localStorage.getItem("token")

  );

  // =====================================

  // LOAD DATA

  // =====================================

  const loadData = useCallback(

    async (showLoading = false) => {

      if (showLoading) {

        setLoading(true);

      }

      try {

        const [productResponse, requestResponse] =

          await Promise.all([

            axios.get(`${SWAP_API}/products`),

            localStorage.getItem("token")

              ? axios.get(

                  `${SWAP_API}/requests`,

                  authConfig()

                )

              : Promise.resolve({

                  data: { requests: [] },

                }),

          ]);

        setProducts(

          getList(productResponse.data, "products")

        );

        setSwapRequests(

          getList(requestResponse.data, "requests")

        );

        return true;

      } catch (err) {

        setError(

          getError(err, "Could not load swap data.")

        );

        return false;

      } finally {

        if (showLoading) {

          setLoading(false);

        }

      }

    },

    []

  );

  useEffect(() => {

    loadData(true);

  }, [loadData]);

  useEffect(() => {

    return () => {

      if (imagePreview) {

        URL.revokeObjectURL(imagePreview);

      }

    };

  }, [imagePreview]);

  // =====================================

  // PRODUCT OWNERSHIP

  // =====================================

  const isOwner = (product) => {

    const ownerId = getId(

      product?.sellerId ||

        product?.seller ||

        product?.owner ||

        product?.userId ||

        product?.createdBy

    );

    return Boolean(

      currentUserId &&

        ownerId &&

        ownerId === currentUserId

    );

  };

  const myProducts = products.filter(isOwner);

  const received = swapRequests.filter(

    (request) =>

      getId(request.sellerId) === currentUserId &&

      Boolean(currentUserId)

  );

  const sent = swapRequests.filter(

    (request) =>

      getId(request.buyerId) === currentUserId &&

      Boolean(currentUserId)

  );

  // =====================================

  // COMMON API ACTION

  // =====================================

  const performAction = async (

    requestId,

    endpoint,

    payload = {}

  ) => {

    setBusyId(requestId);

    setError("");

    setMessage("");

    try {

      const response = await axios.patch(

        `${SWAP_API}/requests/${requestId}/${endpoint}`,

        payload,

        authConfig()

      );

      setMessage(

        response.data?.message ||

          "Action completed successfully."

      );

      await loadData();

      return true;

    } catch (err) {

      setError(

        getError(err, "Unable to complete action.")

      );

      return false;

    } finally {

      setBusyId("");

    }

  };

  // =====================================

  // PRODUCT FORM

  // =====================================

  const resetForm = () => {

    setForm(EMPTY_PRODUCT);

    setEditingId(null);

    setImageFile(null);

    setImagePreview("");

    setShowForm(false);

    if (fileInputRef.current) {

      fileInputRef.current.value = "";

    }

  };

  const openAddForm = () => {

    resetForm();

    setShowForm(true);

  };

  const startEdit = (product) => {

    setEditingId(getId(product));

    setForm({

      name: productName(product),

      category: product.category || "Books",

      condition: product.condition || "Good",

      image: getImageUrl(

        product.image || product.images || product.imageUrl

      ),

    });

    setImageFile(null);

    setImagePreview("");

    setShowForm(true);

  };

  const handleImageChange = (event) => {

    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {

      setError("Select a valid image file.");

      return;

    }

    if (file.size > 5 * 1024 * 1024) {

      setError("Image must be under 5 MB.");

      return;

    }

    setError("");

    setImageFile(file);

    setImagePreview(URL.createObjectURL(file));

  };

  const handleSaveProduct = async (event) => {

    event.preventDefault();

    if (!loggedIn) {

      setError("Please login first.");

      return;

    }

    if (!form.name.trim()) {

      setError("Enter product name.");

      return;

    }

    setSaving(true);

    setError("");

    setMessage("");

    try {

      const image = imageFile

        ? await uploadImageFile(imageFile)

        : form.image;

      const payload = {

        name: form.name.trim(),

        category: form.category,

        condition: form.condition,

        image: image || "",

      };

      if (editingId) {

        await axios.put(

          `${SWAP_API}/products/${editingId}`,

          payload,

          authConfig()

        );

        setMessage(

          "Swap product updated successfully."

        );

      } else {

        await axios.post(

          `${SWAP_API}/products`,

          payload,

          authConfig()

        );

        setMessage(

          "Swap product added successfully."

        );

      }

      resetForm();

      await loadData();

    } catch (err) {

      setError(

        getError(err, "Could not save product.")

      );

    } finally {

      setSaving(false);

    }

  };

  const handleDelete = async (product) => {

    const productId = getId(product);

    if (

      !window.confirm(

        `Delete "${productName(product)}"?`

      )

    ) {

      return;

    }

    setBusyId(productId);

    setError("");

    setMessage("");

    try {

      await axios.delete(

        `${SWAP_API}/products/${productId}`,

        authConfig()

      );

      setMessage("Product deleted successfully.");

      await loadData();

    } catch (err) {

      setError(

        getError(err, "Could not delete product.")

      );

    } finally {

      setBusyId("");

    }

  };

  // =====================================

  // REQUEST A SWAP

  // =====================================

  const startRequest = (product) => {

    if (!loggedIn) {

      setError("Please login to request a swap.");

      return;

    }

    if (isOwner(product)) {

      setError(

        "You cannot request a swap for your own product."

      );

      return;

    }

    setRequestTarget(product);

    setOfferedProductId("");

    setOfferedDescription("");

    setError("");

    setMessage("");

  };

  const handleRequestSwap = async (event) => {

    event.preventDefault();

    if (!requestTarget) return;

    const offered = myProducts.find(

      (product) =>

        getId(product) === offeredProductId

    );

    if (!offered) {

      setError(

        "First list your product and select it as your swap offer."

      );

      return;

    }

    const targetId = getId(requestTarget);

    setBusyId(targetId);

    setError("");

    setMessage("");

    try {

      await axios.post(

        `${SWAP_API}/requests`,

        {

          productId: targetId,

          offeredProductId: getId(offered),

          offeredProductName:

            productName(offered),

          offeredProductDescription:

            offeredDescription.trim(),

        },

        authConfig()

      );

      setRequestTarget(null);

      setShowOfferModal(false);

      setOfferedProductId("");

      setOfferedDescription("");

      setMessage(

        "Swap request sent successfully!"

      );

      await loadData();

    } catch (err) {

      setError(

        getError(err, "Could not send swap request.")

      );

    } finally {

      setBusyId("");

    }

  };

  // =====================================

  // SEARCH & FILTER

  // =====================================

  const filteredProducts = products.filter(

    (product) => {

      const term = searchTerm

        .trim()

        .toLowerCase();

      const name = productName(product)

        .toLowerCase();

      const category = String(

        product.category || ""

      ).toLowerCase();

      const condition = String(

        product.condition || ""

      ).toLowerCase();

      return (

        [name, category, condition].some(

          (value) => value.includes(term)

        ) &&

        (categoryFilter === "All" ||

          category ===

            categoryFilter.toLowerCase()) &&

        (conditionFilter === "All" ||

          condition ===

            conditionFilter.toLowerCase())

      );

    }

  );

  // =====================================

  // REQUEST CARD

  // =====================================

  const renderRequestCard = (request, type) => {

    const requestId = getId(request);

    const pending = request.status === "Pending";

    const buyer = request.buyerId;

    const seller = request.sellerId;

    const product =

      request.productId || request.product;

    return (

      <article

        className="swap-request-panel"

        key={requestId}

      >

        <h3>{productName(product)}</h3>

        <p>

          <strong>

            {type === "received"

              ? "Requested By:"

              : "Product Owner:"}

          </strong>{" "}

          {type === "received"

            ? buyer?.fullName ||

              buyer?.email ||

              "Student"

            : seller?.fullName ||

              seller?.email ||

              "Student"}

        </p>

        <p>

          <strong>Offered Product:</strong>{" "}

          {request.offeredProductName}

        </p>

        {request.offeredProductDescription && (

          <p>

            <strong>Offer Details:</strong>{" "}

            {request.offeredProductDescription}

          </p>

        )}

        <p

          className={`swap-status ${String(

            request.status || "Pending"

          ).toLowerCase()}`}

        >

          Status: {request.status}

        </p>

        {type === "received" && pending && (

          <div className="swap-card-actions">

            <button

              type="button"

              className="accept-swap-btn"

              disabled={busyId === requestId}

              onClick={() =>

                performAction(

                  requestId,

                  "status",

                  {

                    status: "Accepted",

                  }

                )

              }

            >

              Accept

            </button>

            <button

              type="button"

              className="reject-swap-btn"

              disabled={busyId === requestId}

              onClick={() =>

                performAction(

                  requestId,

                  "status",

                  {

                    status: "Rejected",

                  }

                )

              }

            >

              Reject

            </button>

          </div>

        )}

        <details className="swap-request-details">

          <summary>Manage payment, meeting & exchange <span>⌄</span></summary>

          <div className="swap-request-details-body">

        <SwapPaymentDetails

          request={request}

          currentUserId={currentUserId}

          busyId={busyId}

          onAction={performAction}

        />

        <SwapExchangeDetails

          request={request}

          currentUserId={currentUserId}

          busyId={busyId}

          onAction={performAction}

        />

          </div>

        </details>

      </article>

    );

  };

  // =====================================

  // Clean navigation: only one main section is visible at a time.

  const [activeTab, setActiveTab] = useState("explore");

  const [showOfferModal, setShowOfferModal] = useState(false);

  const openListing = () => {

    openAddForm();

  };

  const tabItems = [

    { id: "explore", label: "Explore", count: products.length },

    { id: "mine", label: "My Listings", count: myProducts.length },

    { id: "received", label: "Received", count: received.length },

    { id: "sent", label: "Sent", count: sent.length },

  ];

  return (

    <main className="swap-container swap-clean">
      <style>{swapProductCardCSS}</style>

      <header className="swap-hero">

        <div className="swap-hero-copy">

          <span className="swap-eyebrow">C-MART / CAMPUS MARKETPLACE</span>

          <h1>Swap your items <span>with ease.</span></h1>

          <p>Exchange books, electronics and essentials with students on campus. Choose a free swap or agree on an additional payment.</p>

          <div className="swap-hero-actions">

            <button className="swap-primary-btn" type="button" onClick={openListing}>+ Add Swap Product</button>

            <button className="swap-outline-btn" type="button" onClick={() => setActiveTab("received")}>View Requests</button>

          </div>

        </div>

        <div className="swap-hero-art" aria-hidden="true"><div className="swap-art-circle">⇄</div><span>List</span><span>Request</span><span>Swap</span></div>

      </header>

      <div className="swap-stats">

        <div><strong>{products.length}</strong><span>Available Items</span></div>

        <div><strong>{myProducts.length}</strong><span>My Listings</span></div>

        <div><strong>{received.length}</strong><span>Received Requests</span></div>

        <div><strong>{sent.length}</strong><span>Sent Requests</span></div>

      </div>

      {error && <div className="swap-alert swap-error" role="alert">{error}<button type="button" onClick={() => setError("")}>×</button></div>}

      {message && <div className="swap-alert swap-success" role="status">{message}<button type="button" onClick={() => setMessage("")}>×</button></div>}

      <nav className="swap-tabs" aria-label="Swap sections">

        {tabItems.map(tab => (

          <button key={tab.id} type="button" className={activeTab === tab.id ? "swap-tab active" : "swap-tab"} onClick={() => setActiveTab(tab.id)}>

            {tab.label} <span>{tab.count}</span>

          </button>

        ))}

      </nav>

      {activeTab === "explore" && (

        <section className="swap-content-panel" id="swap-discover">

          <div className="swap-section-heading"><div><span className="swap-kicker">DISCOVER</span><h2>Explore Swap Products</h2><p>Find items available for exchange.</p></div></div>

          <div className="swap-filters">

            <input aria-label="Search products" type="search" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />

            <select aria-label="Category" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}><option value="All">All Categories</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>

            <select aria-label="Condition" value={conditionFilter} onChange={e => setConditionFilter(e.target.value)}><option value="All">All Conditions</option>{CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}</select>

          </div>

          {loading ? <div className="swap-empty">Loading products...</div> : filteredProducts.length === 0 ? <div className="swap-empty">No matching products found.</div> : (

            <div className="swap-products-grid">

              {filteredProducts.map(product => <article className="swap-product-wrapper" key={getId(product)}>

                <SwapProductCard product={product} />

                {isOwner(product) ? <span className="swap-owned-tag">Your listing</span> : <button type="button" className="swap-primary-btn swap-card-button" disabled={!loggedIn} onClick={() => { if (loggedIn) { startRequest(product); setShowOfferModal(true); } }}>{loggedIn ? "Request Swap" : "Login to Swap"}</button>}

              </article>)}

            </div>

          )}

        </section>

      )}

      {activeTab === "mine" && (

        <section className="swap-content-panel">

          <div className="swap-section-heading"><div><span className="swap-kicker">YOUR PRODUCTS</span><h2>My Swap Listings</h2><p>Manage the items you want to exchange.</p></div><button type="button" className="swap-secondary-btn" onClick={openListing}>+ Add Product</button></div>

          {myProducts.length === 0 ? <div className="swap-empty">You have not listed any items yet.<button type="button" className="swap-primary-btn" onClick={openListing}>List an Item</button></div> : (

            <div className="swap-products-grid">{myProducts.map(product => <article className="swap-product-wrapper" key={getId(product)}><SwapProductCard product={product}/><div className="swap-card-actions"><button type="button" className="swap-secondary-btn" onClick={() => startEdit(product)}>Edit</button><button type="button" className="reject-swap-btn" disabled={busyId === getId(product)} onClick={() => handleDelete(product)}>Delete</button></div></article>)}</div>

          )}

        </section>

      )}

      {activeTab === "received" && (

        <section className="swap-content-panel"><div className="swap-section-heading"><div><span className="swap-kicker">INBOX</span><h2>Received Swap Requests</h2><p>Review offers, accept requests and manage exchanges.</p></div></div>{!loggedIn ? <div className="swap-empty">Login to see your requests.</div> : received.length === 0 ? <div className="swap-empty">No received requests yet.</div> : <div className="swap-requests-list">{received.map(request => renderRequestCard(request,"received"))}</div>}</section>

      )}

      {activeTab === "sent" && (

        <section className="swap-content-panel"><div className="swap-section-heading"><div><span className="swap-kicker">OUTBOX</span><h2>My Sent Swap Requests</h2><p>Track your requests and complete accepted swaps.</p></div></div>{!loggedIn ? <div className="swap-empty">Login to see your requests.</div> : sent.length === 0 ? <div className="swap-empty">You haven't sent any swap requests yet.</div> : <div className="swap-requests-list">{sent.map(request => renderRequestCard(request,"sent"))}</div>}</section>

      )}

      {showForm && (

        <div className="swap-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) resetForm(); }}>

          <section className="swap-modal" role="dialog" aria-modal="true" aria-label={editingId ? "Edit swap product" : "Add swap product"} ref={formRef}>

            <div className="swap-modal-head"><div><span className="swap-kicker">SWAP LISTING</span><h2>{editingId ? "Edit Product" : "Add Swap Product"}</h2></div><button type="button" className="swap-icon-close" aria-label="Close" onClick={resetForm}>×</button></div>

            <form className="add-swap-form" onSubmit={handleSaveProduct}>

              <div className="swap-field"><label>Product Name</label><input required maxLength={100} value={form.name} placeholder="e.g. Mathematics Book" onChange={e => setForm(p => ({...p,name:e.target.value}))}/></div>

              <div className="swap-form-row"><div className="swap-field"><label>Category</label><select value={form.category} onChange={e => setForm(p => ({...p,category:e.target.value}))}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div><div className="swap-field"><label>Condition</label><select value={form.condition} onChange={e => setForm(p => ({...p,condition:e.target.value}))}>{CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}</select></div></div>

              <div className="swap-field"><label>Product Image</label><input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange}/></div>

              {(imagePreview || form.image) && <img className="swap-image-preview" src={imagePreview || getImageUrl(form.image)} alt="Product preview"/>}

              <div className="swap-card-actions"><button type="submit" className="swap-primary-btn" disabled={saving}>{saving ? "Saving..." : editingId ? "Update Product" : "Post Product"}</button><button type="button" className="swap-quiet-btn" onClick={resetForm}>Cancel</button></div>

            </form>

          </section>

        </div>

      )}

      {requestTarget && showOfferModal && (

        <div className="swap-modal-backdrop" onMouseDown={e => { if(e.target === e.currentTarget){setRequestTarget(null);setShowOfferModal(false);} }}>

          <section className="swap-modal" id="swap-offer-section" role="dialog" aria-modal="true" aria-label="Send swap request">

            <div className="swap-modal-head"><div><span className="swap-kicker">NEW REQUEST</span><h2>Request an Exchange</h2><p>For: {productName(requestTarget)}</p></div><button type="button" className="swap-icon-close" aria-label="Close" onClick={() => {setRequestTarget(null);setShowOfferModal(false);}}>×</button></div>

            <form className="add-swap-form" onSubmit={async e => { await handleRequestSwap(e); }}>

              <div className="swap-field"><label>Choose Your Offered Product</label><select required value={offeredProductId} onChange={e => setOfferedProductId(e.target.value)}><option value="">Select a product</option>{myProducts.map(p => <option key={getId(p)} value={getId(p)}>{productName(p)}</option>)}</select></div>

              {myProducts.length === 0 && <p className="swap-hint">You need to add your own swap product first.</p>}

              <div className="swap-field"><label>Offer Description (Optional)</label><textarea rows={3} maxLength={1000} value={offeredDescription} placeholder="Add a short note..." onChange={e => setOfferedDescription(e.target.value)}/></div>

              <div className="swap-card-actions"><button type="submit" className="swap-primary-btn" disabled={!offeredProductId || busyId === getId(requestTarget)}>Send Request</button><button type="button" className="swap-quiet-btn" onClick={() => {setRequestTarget(null);setShowOfferModal(false);}}>Cancel</button></div>

            </form>

          </section>

        </div>

      )}

    </main>

  );

}

const swapProductCardCSS = '\n/* Enhanced swap product cards: full Buy Products-style image display */\n.swap-products-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(245px, 1fr));\n  gap: 22px;\n  align-items: stretch;\n}\n.swap-product-wrapper {\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n  background: #fff;\n  border: 1px solid #e5e7eb;\n  border-radius: 16px;\n  overflow: hidden;\n  box-shadow: 0 5px 18px rgba(30, 41, 59, .06);\n  transition: transform .2s, box-shadow .2s;\n}\n.swap-product-wrapper:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(30,41,59,.12); }\n.swap-product-content { display: flex; flex-direction: column; flex: 1; min-width: 0; }\n.swap-product-image-box.swap-image-gallery {\n  width: 100%; height: 260px; min-height: 260px; position: relative;\n  background: #f5f7fc; border-radius: 0; overflow: hidden;\n  display: flex; align-items: center; justify-content: center;\n}\n.swap-image-gallery > img { display: block; width: 100%; height: 100%; object-fit: contain; padding: 12px; }\n.swap-image-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #64748b; font-size: 30px; }\n.swap-image-placeholder span { font-size: 13px; }\n.swap-gallery-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 34px; height: 38px; border: 0; border-radius: 9px; background: rgba(255,255,255,.93); color: #1e293b; font-size: 27px; cursor: pointer; box-shadow: 0 2px 8px #0002; z-index: 1; }\n.swap-gallery-prev { left: 9px; } .swap-gallery-next { right: 9px; }\n.swap-gallery-count { position: absolute; bottom: 9px; right: 10px; background: rgba(15,23,42,.7); color: white; border-radius: 20px; padding: 4px 9px; font-size: 11px; }\n.swap-gallery-thumbnails { display: flex; gap: 7px; padding: 9px 12px; overflow-x: auto; background: #fff; }\n.swap-thumb { width: 45px; height: 45px; flex: 0 0 45px; padding: 2px; border: 2px solid #e2e8f0; border-radius: 8px; background: #fff; cursor: pointer; }\n.swap-thumb.active { border-color: #635bdb; }\n.swap-thumb img { width: 100%; height: 100%; object-fit: contain; }\n.swap-product-info { padding: 15px 16px 16px; min-width: 0; }\n.swap-product-info h3 { margin: 0 0 12px; font-size: 18px; font-weight: 750; color: #1e293b; overflow-wrap: anywhere; }\n.swap-product-meta { display: flex; flex-wrap: wrap; gap: 8px; }\n.swap-product-meta span { display: inline-flex; padding: 6px 9px; background: #f1f5f9; color: #475569; border-radius: 7px; font-size: 12px; }\n.swap-product-description { margin: 12px 0 0; font-size: 13px; line-height: 1.55; color: #64748b; overflow-wrap: anywhere; }\n.swap-product-wrapper > .swap-card-button { margin: auto 15px 16px; width: calc(100% - 30px); }\n.swap-product-wrapper > .swap-card-actions { margin-top: auto; padding: 0 15px 16px; }\n.swap-owned-tag { align-self: flex-start; margin: auto 15px 16px; }\n@media (max-width: 640px) { .swap-products-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; } .swap-product-image-box.swap-image-gallery { height: 205px; min-height: 205px; } .swap-product-info { padding: 12px; } .swap-product-info h3 { font-size: 15px; } }\n';
