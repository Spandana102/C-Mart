import React, { useState } from "react";

function CounterOfferModal({ onSendCounter, onClose }) {
  const [counterPrice, setCounterPrice] = useState("");

  const handleSubmit = () => {
    if (counterPrice === "") {
      alert("Please enter counter offer price");
      return;
    }

    onSendCounter(Number(counterPrice));

    setCounterPrice("");
  };

  return (
    <div
      style={{
        width: "400px",
        margin: "50px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "10px",
        backgroundColor: "#fff",
        boxShadow: "0 0 10px rgba(0,0,0,0.2)"
      }}
    >
      <h2>Counter Offer</h2>

      <label>Enter Counter Price (₹)</label>

      <br /><br />

      <input
        type="number"
        value={counterPrice}
        onChange={(e) => setCounterPrice(e.target.value)}
        placeholder="Enter Counter Price"
        style={{
          width: "100%",
          padding: "10px"
        }}
      />

      <br /><br />

      <button
        onClick={handleSubmit}
        style={{
          backgroundColor: "green",
          color: "white",
          padding: "10px",
          border: "none",
          marginRight: "10px",
          cursor: "pointer"
        }}
      >
        Send Counter Offer
      </button>

      <button
        onClick={onClose}
        style={{
          backgroundColor: "red",
          color: "white",
          padding: "10px",
          border: "none",
          cursor: "pointer"
        }}
      >
        Cancel
      </button>
    </div>
  );
}

export default CounterOfferModal;