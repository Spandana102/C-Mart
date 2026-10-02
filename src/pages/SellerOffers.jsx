import React, { useState } from "react";
import OfferCard from "../../components/product/OfferCard";
import CounterOfferModal from "../../components/product/CounterOfferModal";

function SellerOffers() {

  const [offers, setOffers] = useState([
    {
      id: 1,
      productName: "Java Programming Book",
      originalPrice: 1000,
      offerPrice: 850,
      status: "Pending",
    },
    {
      id: 2,
      productName: "Laptop",
      originalPrice: 45000,
      offerPrice: 42000,
      status: "Pending",
    },
  ]);

  const [selectedOffer, setSelectedOffer] = useState(null);

  const [showModal, setShowModal] = useState(false);

  const acceptOffer = (id) => {
    setOffers(
      offers.map((offer) =>
        offer.id === id
          ? { ...offer, status: "Accepted" }
          : offer
      )
    );

    alert("Offer Accepted");
  };

  const rejectOffer = (id) => {
    setOffers(
      offers.map((offer) =>
        offer.id === id
          ? { ...offer, status: "Rejected" }
          : offer
      )
    );

    alert("Offer Rejected");
  };

  const openCounter = (offer) => {
    setSelectedOffer(offer);
    setShowModal(true);
  };

  const sendCounter = (price) => {

    setOffers(
      offers.map((offer) =>
        offer.id === selectedOffer.id
          ? {
              ...offer,
              status: "Countered",
              counterPrice: price,
            }
          : offer
      )
    );

    alert("Counter Offer Sent : ₹" + price);

    setShowModal(false);
  };

  return (
    <div>

      <h1 style={{ textAlign: "center" }}>
        Seller Offers
      </h1>

      {offers.map((offer) => (

        <OfferCard
          key={offer.id}
          productName={offer.productName}
          originalPrice={offer.originalPrice}
          offerPrice={offer.offerPrice}
          status={offer.status}
          onAccept={() => acceptOffer(offer.id)}
          onReject={() => rejectOffer(offer.id)}
          onCounter={() => openCounter(offer)}
        />

      ))}

      {showModal && (

        <CounterOfferModal
          onSendCounter={sendCounter}
          onClose={() => setShowModal(false)}
        />

      )}

    </div>
  );

}

export default SellerOffers;