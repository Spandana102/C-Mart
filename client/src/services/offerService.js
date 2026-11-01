import axios from "axios";
import { API_URL } from "./apiConfig";

// Backend API URL
const OFFERS_URL = `${API_URL}/offers`;

// Send Offer
export const sendOffer = async (offerData) => {
  try {
    const response = await axios.post(OFFERS_URL, offerData);
    return response.data;
  } catch (error) {
    console.error("Error sending offer:", error);
    throw error;
  }
};

// Get All Offers
export const getOffers = async () => {
  try {
    const response = await axios.get(OFFERS_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching offers:", error);
    throw error;
  }
};

// Accept Offer
export const acceptOffer = async (id) => {
  try {
    const response = await axios.put(`${OFFERS_URL}/${id}/accept`);
    return response.data;
  } catch (error) {
    console.error("Error accepting offer:", error);
    throw error;
  }
};

// Reject Offer
export const rejectOffer = async (id) => {
  try {
    const response = await axios.put(`${OFFERS_URL}/${id}/reject`);
    return response.data;
  } catch (error) {
    console.error("Error rejecting offer:", error);
    throw error;
  }
};

// Counter Offer
export const counterOffer = async (id, counterPrice) => {
  try {
    const response = await axios.put(`${OFFERS_URL}/${id}/counter`, {
      counterPrice,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending counter offer:", error);
    throw error;
  }
};