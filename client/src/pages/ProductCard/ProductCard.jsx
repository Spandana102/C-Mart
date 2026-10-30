
import React from "react";

function ProductCard({
  name,
  category,
  condition,
  image,
  onRequestSwap,
  onAccept,
  onReject,
  swapRequested,
  requestStatus,
  onEdit,
  onDelete,
}) {
  const hasImage = Boolean(image);

  return (
    <div className="product-card">

      {/* PRODUCT IMAGE */}
      <div className="swap-product-image">
        {hasImage ? (
          <img
            src={image}
            alt={name || "Swap Product"}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling.style.display = "flex";
            }}
          />
        ) : null}

        <div
          className="swap-image-placeholder"
          style={{ display: hasImage ? "none" : "flex" }}
        >
          📦 No Image Available
        </div>
      </div>

      {/* PRODUCT DETAILS */}
      <div className="swap-product-details">
        <h3>{name || "Unnamed Product"}</h3>

        <p>
          <strong>Category:</strong> {category || "Other"}
        </p>

        <p>
          <strong>Condition:</strong> {condition || "Not specified"}
        </p>

        {/* REQUEST STATUS */}
        {requestStatus && (
          <p className={`swap-status ${requestStatus.toLowerCase()}`}>
            Swap Status: {requestStatus}
          </p>
        )}

        {/* ACTION BUTTONS */}
        <div className="swap-card-actions">

          {onRequestSwap && (
            <button
              type="button"
              className="request-swap-btn"
              onClick={onRequestSwap}
              disabled={Boolean(swapRequested)}
            >
              {swapRequested ? "Request Sent" : "Request Swap"}
            </button>
          )}

          {onAccept && requestStatus === "Pending" && (
            <button
              type="button"
              className="accept-swap-btn"
              onClick={onAccept}
            >
              Accept
            </button>
          )}

          {onReject && requestStatus === "Pending" && (
            <button
              type="button"
              className="reject-swap-btn"
              onClick={onReject}
            >
              Reject
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              className="edit-swap-btn"
              onClick={onEdit}
            >
              Edit
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              className="delete-swap-btn"
              onClick={onDelete}
            >
              Delete
            </button>
          )}

        </div>
      </div>
    </div>
  );
}

export default ProductCard;
