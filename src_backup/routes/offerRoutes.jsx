import React from "react";
import { Routes, Route } from "react-router-dom";

import BargainPage from "../pages/Bargain/BargainPage";
import SellerOffers from "../pages/Bargain/SellerOffers";

function OfferRoutes() {
  return (
    <Routes>
      <Route path="/bargain" element={<BargainPage />} />

      <Route
        path="/seller-offers"
        element={<SellerOffers />}
      />
    </Routes>
  );
}

export default OfferRoutes;