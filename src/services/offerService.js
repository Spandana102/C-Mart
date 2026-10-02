import axios from "axios";

// Backend API URL
const API_URL = "http://localhost:5000/api/offers";

// Send Offer
export const sendOffer = async (offerData) => {
  try {
    const response = await axios.post(API_URL, offerData);
    return response.data;
  } catch (error) {
    console.error("Error sending offer:", error);
    throw error;
  }
};

// Get All Offers
export const getOffers = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching offers:", error);
    throw error;
  }
};

// Accept Offer
export const acceptOffer = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/${id}/accept`);
    return response.data;
  } catch (error) {
    console.error("Error accepting offer:", error);
    throw error;
  }
};

// Reject Offer
export const rejectOffer = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/${id}/reject`);
    return response.data;
  } catch (error) {
    console.error("Error rejecting offer:", error);
    throw error;
  }
};

// Counter Offer
export const counterOffer = async (id, counterPrice) => {
  try {
    const response = await axios.put(`${API_URL}/${id}/counter`, {
      counterPrice,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending counter offer:", error);
    throw error;
  }
};