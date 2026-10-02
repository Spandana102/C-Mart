import React, { useState } from "react";

const OfferForm = ({ productId, onSendOffer }) => {
  const [offerPrice, setOfferPrice] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!offerPrice) {
      alert("Please enter an offer price");
      return;
    }

    if (Number(offerPrice) <= 0) {
      alert("Offer price must be greater than 0");
      return;
    }

    const offerData = {
      productId: productId,
      offerPrice: Number(offerPrice),
    };

    console.log("Offer Sent:", offerData);

    if (onSendOffer) {
      onSendOffer(offerData);
    }

    setOfferPrice("");
  };

  return (
    <div
      style={{
        width: "350px",
        margin: "30px auto",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "10px",
        boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ textAlign: "center" }}>Make an Offer</h2>

      <form onSubmit={handleSubmit}>
        <label>Offer Price (₹)</label>

        <input
          type="number"
          placeholder="Enter your offer"
          value={offerPrice}
          onChange={(e) => setOfferPrice(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
            marginBottom: "20px",
          }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#0d6efd",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Send Offer
        </button>
      </form>
    </div>
  );
};

export default OfferForm;