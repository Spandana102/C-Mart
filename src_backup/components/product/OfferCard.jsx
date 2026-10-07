import React from "react";

function OfferCard({
  productName,
  originalPrice,
  offerPrice,
  status,
  onAccept,
  onReject,
  onCounter
}) {
  return (
    <div
      style={{
        width: "400px",
        margin: "20px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}
    >
      <h2>{productName}</h2>

      <p>
        <strong>Original Price :</strong> ₹{originalPrice}
      </p>

      <p>
        <strong>Offer Price :</strong> ₹{offerPrice}
      </p>

      <p>
        <strong>Status :</strong> {status}
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "20px"
        }}
      >
        <button
          onClick={onAccept}
          style={{
            background: "green",
            color: "white",
            padding: "10px",
            border: "none",
            borderRadius: "5px"
          }}
        >
          Accept
        </button>

        <button
          onClick={onReject}
          style={{
            background: "red",
            color: "white",
            padding: "10px",
            border: "none",
            borderRadius: "5px"
          }}
        >
          Reject
        </button>

        <button
          onClick={onCounter}
          style={{
            background: "orange",
            color: "white",
            padding: "10px",
            border: "none",
            borderRadius: "5px"
          }}
        >
          Counter
        </button>
      </div>
    </div>
  );
}

export default OfferCard;