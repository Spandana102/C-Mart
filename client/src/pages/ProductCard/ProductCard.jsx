import React from "react";

function ProductCard({
  name,
  category,
  condition,
  image,
  onRequestSwap,
  onAccept,
  onReject,
  swapRequested = false,
  requestStatus = "",
  onEdit,
  onDelete,
}) {
  const hasImage = Boolean(image);
  const normalizedStatus = String(requestStatus || "").trim().toLowerCase();
  const isPending = normalizedStatus === "pending";

  return (
    <div className="product-card">
      <div className="swap-product-image">
        {hasImage && (
          <img
            src={image}
            alt={name || "Swap Product"}
            onError={(event) => {
              event.currentTarget.style.display = "none";
              const placeholder = event.currentTarget.nextElementSibling;
              if (placeholder) placeholder.style.display = "flex";
            }}
          />
        )}
        <div
          className="swap-image-placeholder"
          style={{ display: hasImage ? "none" : "flex" }}
        >
          📦 No Image Available
        </div>
      </div>

      <div className="swap-product-details">
        <h3>{name || "Unnamed Product"}</h3>
        <p><strong>Category:</strong> {category || "Other"}</p>
        <p><strong>Condition:</strong> {condition || "Not specified"}</p>

        {requestStatus && (
          <p className={`swap-status ${normalizedStatus}`}>
            Swap Status: {requestStatus}
          </p>
        )}

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

          {isPending && typeof onAccept === "function" && (
            <button
              type="button"
              className="accept-swap-btn"
              onClick={onAccept}
            >
              Accept
            </button>
          )}

          {isPending && typeof onReject === "function" && (
            <button
              type="button"
              className="reject-swap-btn"
              onClick={onReject}
            >
              Reject
            </button>
          )}

          {onEdit && (
            <button type="button" className="edit-swap-btn" onClick={onEdit}>
              Edit
            </button>
          )}

          {onDelete && (
            <button type="button" className="delete-swap-btn" onClick={onDelete}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
