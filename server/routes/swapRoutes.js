
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const SwapProduct = require("../models/SwapProduct");
const SwapRequest = require("../models/SwapRequest");
const Notification = require("../models/Notification");

const router = express.Router();

// =====================================
// AUTHENTICATION
// =====================================

const authenticateUser = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please login to continue",
      });
    }

    const token = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId =
      decoded.id || decoded._id || decoded.userId;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid login token",
      });
    }

    req.user = { id: String(userId) };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired login token",
    });
  }
};

// =====================================
// HELPERS
// =====================================

const validId = (id) => mongoose.isValidObjectId(id);

const getId = (value) =>
  String(value?._id || value || "");

const sameId = (a, b) => getId(a) === getId(b);

const isParticipant = (request, userId) =>
  sameId(request.buyerId, userId) ||
  sameId(request.sellerId, userId);

const activeStatuses = ["Pending", "Accepted"];

const fail = (res, code, message) =>
  res.status(code).json({
    success: false,
    message,
  });

const safeRoute = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error("Swap API Error:", error);

    return fail(
      res,
      error.name === "ValidationError" ? 400 : 500,
      error.name === "ValidationError"
        ? error.message
        : "Unable to process swap request"
    );
  }
};

// =====================================
// NOTIFICATION HELPER
// =====================================

const sendSwapNotification = async ({
  recipient,
  sender,
  title,
  message,
}) => {
  try {
    if (!recipient || !sender) return;

    if (sameId(recipient, sender)) return;

    await Notification.create({
      recipient: getId(recipient),
      sender: getId(sender),
      type: "swap",
      title,
      message,
      link: "/swap",
      isRead: false,
    });

    console.log("Swap notification created:", title);
  } catch (error) {
    // Swap should succeed even if notification fails.
    console.error(
      "Swap notification error:",
      error.message
    );
  }
};

const notifyOtherParticipant = async (
  request,
  sender,
  title,
  message
) => {
  const recipient = sameId(request.buyerId, sender)
    ? request.sellerId
    : request.buyerId;

  await sendSwapNotification({
    recipient,
    sender,
    title,
    message,
  });
};

const getRequest = async (req, res) => {
  if (!validId(req.params.id)) {
    fail(res, 400, "Invalid swap request ID");
    return null;
  }

  const request = await SwapRequest.findById(
    req.params.id
  );

  if (!request) {
    fail(res, 404, "Swap request not found");
    return null;
  }

  if (!isParticipant(request, req.user.id)) {
    fail(
      res,
      403,
      "Only swap participants can access this request"
    );
    return null;
  }

  return request;
};

const getAcceptedRequest = async (req, res) => {
  const request = await getRequest(req, res);

  if (!request) return null;

  if (request.status !== "Accepted") {
    fail(
      res,
      409,
      "Swap request must be accepted first"
    );
    return null;
  }

  return request;
};

const populateRequests = (query) =>
  query
    .populate("productId")
    .populate("offeredProductId")
    .populate("buyerId", "fullName email")
    .populate("sellerId", "fullName email")
    .sort({ createdAt: -1 });

const bothAgreed = (request) =>
  Boolean(
    request.paymentAgreedBySeller &&
    request.paymentAgreedByBuyer
  );

const exchangeStarted = (request) =>
  Boolean(
    request.buyerExchangeConfirmed ||
    request.sellerExchangeConfirmed
  );

const paymentReceiver = (request) =>
  request.paymentPayer === "Seller"
    ? request.buyerId
    : request.sellerId;

const paymentPayer = (request) =>
  request.paymentPayer === "Seller"
    ? request.sellerId
    : request.buyerId;

const resetPaymentEvidence = (request) => {
  request.paymentScreenshot = "";
  request.paymentSubmittedAt = null;
  request.paymentVerifiedBy = null;
  request.paymentVerifiedAt = null;
  request.paymentRejectionReason = "";
};

// =====================================
// PRODUCT VALIDATION
// =====================================

const validateProduct = (body) => {
  const name = String(body.name || "").trim();
  const category = String(body.category || "").trim();
  const description = String(
    body.description || ""
  ).trim();
  const condition = String(
    body.condition || "Used"
  ).trim();
  const image = String(body.image || "").trim();

  if (!name || !category) {
    return {
      error: "Product name and category are required",
    };
  }

  if (name.length > 100) {
    return {
      error: "Product name cannot exceed 100 characters",
    };
  }

  if (
    !["New", "Used", "Good", "Excellent", "Fair"]
      .includes(condition)
  ) {
    return { error: "Invalid product condition" };
  }

  if (image && !/^https:\/\//i.test(image)) {
    return {
      error: "Please upload a valid HTTPS image",
    };
  }

  return {
    data: {
      name,
      category,
      description,
      condition,
      image,
    },
  };
};

// =====================================
// GET ALL SWAP PRODUCTS
// =====================================

router.get(
  "/products",
  safeRoute(async (req, res) => {
    const products = await SwapProduct.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      products,
    });
  })
);

// =====================================
// ADD SWAP PRODUCT
// =====================================

router.post(
  "/products",
  authenticateUser,
  safeRoute(async (req, res) => {
    const result = validateProduct(req.body);

    if (result.error) {
      return fail(res, 400, result.error);
    }

    const product = await SwapProduct.create({
      ...result.data,
      sellerId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Swap product added successfully",
      product,
    });
  })
);

// =====================================
// EDIT SWAP PRODUCT
// =====================================

router.put(
  "/products/:id",
  authenticateUser,
  safeRoute(async (req, res) => {
    if (!validId(req.params.id)) {
      return fail(res, 400, "Invalid product ID");
    }

    const product = await SwapProduct.findById(
      req.params.id
    );

    if (!product) {
      return fail(res, 404, "Swap product not found");
    }

    if (!sameId(product.sellerId, req.user.id)) {
      return fail(
        res,
        403,
        "Only the owner can edit this product"
      );
    }

    const activeRequest = await SwapRequest.findOne({
      $or: [
        { productId: product._id },
        { offeredProductId: product._id },
      ],
      status: { $in: activeStatuses },
    });

    if (activeRequest) {
      return fail(
        res,
        409,
        "This product is involved in an active swap"
      );
    }

    const result = validateProduct(req.body);

    if (result.error) {
      return fail(res, 400, result.error);
    }

    Object.assign(product, result.data);
    await product.save();

    return res.json({
      success: true,
      message: "Swap product updated successfully",
      product,
    });
  })
);

// =====================================
// DELETE SWAP PRODUCT
// =====================================

router.delete(
  "/products/:id",
  authenticateUser,
  safeRoute(async (req, res) => {
    if (!validId(req.params.id)) {
      return fail(res, 400, "Invalid product ID");
    }

    const product = await SwapProduct.findById(
      req.params.id
    );

    if (!product) {
      return fail(res, 404, "Swap product not found");
    }

    if (!sameId(product.sellerId, req.user.id)) {
      return fail(
        res,
        403,
        "Only the owner can delete this product"
      );
    }

    const activeRequest = await SwapRequest.findOne({
      $or: [
        { productId: product._id },
        { offeredProductId: product._id },
      ],
      status: { $in: activeStatuses },
    });

    if (activeRequest) {
      return fail(
        res,
        409,
        "Resolve the active swap before deleting this product"
      );
    }

    await product.deleteOne();

    await SwapRequest.deleteMany({
      productId: product._id,
      status: {
        $in: ["Rejected", "Cancelled"],
      },
    });

    return res.json({
      success: true,
      message: "Swap product deleted successfully",
    });
  })
);

// =====================================
// CREATE SWAP REQUEST
// =====================================

const createSwapRequest = safeRoute(
  async (req, res) => {
    const {
      productId,
      offeredProductId,
      offeredProductName,
      offeredProductDescription,
    } = req.body;

    if (!validId(productId)) {
      return fail(
        res,
        400,
        "Valid product ID is required"
      );
    }

    const product = await SwapProduct.findById(
      productId
    );

    if (!product) {
      return fail(
        res,
        404,
        "Swap product not found"
      );
    }

    if (sameId(product.sellerId, req.user.id)) {
      return fail(
        res,
        403,
        "You cannot swap your own product"
      );
    }

    let offeredProduct = null;

    if (offeredProductId) {
      if (!validId(offeredProductId)) {
        return fail(
          res,
          400,
          "Invalid offered product ID"
        );
      }

      offeredProduct = await SwapProduct.findById(
        offeredProductId
      );

      if (!offeredProduct) {
        return fail(
          res,
          404,
          "Offered product not found"
        );
      }

      if (
        !sameId(
          offeredProduct.sellerId,
          req.user.id
        )
      ) {
        return fail(
          res,
          403,
          "You can only offer your own listed product"
        );
      }

      if (
        sameId(
          product._id,
          offeredProduct._id
        )
      ) {
        return fail(
          res,
          400,
          "You cannot swap a product with itself"
        );
      }
    }

    const finalOfferedName = offeredProduct
      ? offeredProduct.name
      : String(offeredProductName || "").trim();

    if (
      !finalOfferedName ||
      finalOfferedName.length > 100
    ) {
      return fail(
        res,
        400,
        "Enter a valid offered product name"
      );
    }

    const existing = await SwapRequest.findOne({
      productId,
      buyerId: req.user.id,
      status: { $in: activeStatuses },
    });

    if (existing) {
      return fail(
        res,
        409,
        "You already have an active swap request for this product"
      );
    }

    const request = await SwapRequest.create({
      productId: product._id,
      sellerId: product.sellerId,
      buyerId: req.user.id,
      offeredProductId:
        offeredProduct?._id || null,
      offeredProductName: finalOfferedName,
      offeredProductDescription: String(
        offeredProductDescription || ""
      ).trim(),
      status: "Pending",
    });

    // NEW: Notify product owner
    await sendSwapNotification({
      recipient: request.sellerId,
      sender: req.user.id,
      title: "New Swap Request",
      message:
        `You received a swap request for ${product.name}.`,
    });

    return res.status(201).json({
      success: true,
      message: "Swap request sent successfully",
      request,
    });
  }
);

router.post(
  "/requests",
  authenticateUser,
  createSwapRequest
);

// Legacy compatibility
router.post(
  "/",
  authenticateUser,
  createSwapRequest
);

// =====================================
// GET ALL MY REQUESTS
// =====================================

router.get(
  "/requests",
  authenticateUser,
  safeRoute(async (req, res) => {
    const requests = await populateRequests(
      SwapRequest.find({
        $or: [
          { buyerId: req.user.id },
          { sellerId: req.user.id },
        ],
      })
    );

    return res.json({
      success: true,
      requests,
    });
  })
);

// =====================================
// GET SENT REQUESTS
// =====================================

router.get(
  "/mine",
  authenticateUser,
  safeRoute(async (req, res) => {
    const requests = await populateRequests(
      SwapRequest.find({
        buyerId: req.user.id,
      })
    );

    return res.json({
      success: true,
      requests,
    });
  })
);

// =====================================
// GET RECEIVED REQUESTS
// =====================================

router.get(
  "/received",
  authenticateUser,
  safeRoute(async (req, res) => {
    const requests = await populateRequests(
      SwapRequest.find({
        sellerId: req.user.id,
      })
    );

    return res.json({
      success: true,
      requests,
    });
  })
);

// =====================================
// ACCEPT / REJECT SWAP REQUEST
// =====================================

const updateRequestStatus = safeRoute(
  async (req, res) => {
    const request = await getRequest(req, res);

    if (!request) return;

    if (!sameId(request.sellerId, req.user.id)) {
      return fail(
        res,
        403,
        "Only the product owner can update the request"
      );
    }

    const { status } = req.body;

    if (
      !["Accepted", "Rejected"].includes(status)
    ) {
      return fail(
        res,
        400,
        "Status must be Accepted or Rejected"
      );
    }

    if (request.status !== "Pending") {
      return fail(
        res,
        409,
        "Request already processed"
      );
    }

    request.status = status;

    if (status === "Accepted") {
      request.acceptedAt = new Date();
    }

    await request.save();

    // NEW: Notify swap requester
    await sendSwapNotification({
      recipient: request.buyerId,
      sender: req.user.id,
      title:
        status === "Accepted"
          ? "Swap Request Accepted"
          : "Swap Request Rejected",
      message:
        status === "Accepted"
          ? "Your swap request has been accepted by the product owner."
          : "Your swap request has been rejected by the product owner.",
    });

    return res.json({
      success: true,
      message:
        `Swap request ${status.toLowerCase()} successfully`,
      request,
    });
  }
);

router.patch(
  "/requests/:id/status",
  authenticateUser,
  updateRequestStatus
);

router.patch(
  "/:id/status",
  authenticateUser,
  updateRequestStatus
);

// =====================================
// SCHEDULE MEET POINT
// =====================================

router.patch(
  "/requests/:id/meetpoint",
  authenticateUser,
  safeRoute(async (req, res) => {
    const request = await getAcceptedRequest(
      req,
      res
    );

    if (!request) return;

    if (exchangeStarted(request)) {
      return fail(
        res,
        409,
        "Cannot reschedule after exchange confirmation starts"
      );
    }

    const meetPoint = String(
      req.body.meetPoint || ""
    ).trim();

    const meetingDate = String(
      req.body.meetingDate || ""
    ).trim();

    const meetingTime = String(
      req.body.meetingTime || ""
    ).trim();

    if (
      !meetPoint ||
      !meetingDate ||
      !meetingTime
    ) {
      return fail(
        res,
        400,
        "Meet point, date and time are required"
      );
    }

    if (meetPoint.length > 150) {
      return fail(
        res,
        400,
        "Meet point is too long"
      );
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(meetingDate) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(
        meetingTime
      )
    ) {
      return fail(
        res,
        400,
        "Use YYYY-MM-DD date and HH:MM time"
      );
    }

    const [year, month, day] = meetingDate
      .split("-")
      .map(Number);

    const [hours, minutes] = meetingTime
      .split(":")
      .map(Number);

    const parsedDate = new Date(
      `${meetingDate}T00:00:00.000Z`
    );

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() + 1 !== month ||
      parsedDate.getUTCDate() !== day
    ) {
      return fail(
        res,
        400,
        "Invalid meeting date"
      );
    }

    // India Standard Time
    const scheduledAt = new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        hours,
        minutes
      ) -
      330 * 60 * 1000
    );

    if (scheduledAt.getTime() <= Date.now()) {
      return fail(
        res,
        400,
        "Please select a future meeting date and time"
      );
    }

    request.meetPoint = meetPoint;
    request.meetingDate = parsedDate;
    request.meetingTime = meetingTime;
    request.meetStatus = "Scheduled";
    request.meetScheduledBy = req.user.id;
    request.meetConfirmedByBuyer = false;
    request.meetConfirmedBySeller = false;

    await request.save();

    // NEW: Notify other participant
    await notifyOtherParticipant(
      request,
      req.user.id,
      "Swap Meet Point Scheduled",
      `Meet point: ${meetPoint}. Date: ${meetingDate}, Time: ${meetingTime}.`
    );

    return res.json({
      success: true,
      message:
        "Swap meet point scheduled successfully",
      request,
    });
  })
);

// =====================================
// CONFIRM MEETING
// =====================================

router.patch(
  "/requests/:id/confirm-meet",
  authenticateUser,
  safeRoute(async (req, res) => {
    const request = await getAcceptedRequest(
      req,
      res
    );

    if (!request) return;

    if (
      !request.meetPoint ||
      !request.meetingDate ||
      !request.meetingTime
    ) {
      return fail(
        res,
        400,
        "Schedule the meeting first"
      );
    }

    if (
      !["Scheduled", "Confirmed"].includes(
        request.meetStatus
      )
    ) {
      return fail(
        res,
        409,
        "Meeting cannot be confirmed in its current state"
      );
    }

    const isBuyer = sameId(
      request.buyerId,
      req.user.id
    );

    const alreadyConfirmed = isBuyer
      ? request.meetConfirmedByBuyer
      : request.meetConfirmedBySeller;

    if (isBuyer) {
      request.meetConfirmedByBuyer = true;
    } else {
      request.meetConfirmedBySeller = true;
    }

    if (
      request.meetConfirmedByBuyer &&
      request.meetConfirmedBySeller
    ) {
      request.meetStatus = "Confirmed";
    }

    await request.save();

    if (!alreadyConfirmed) {
      // NEW: Notify other participant
      await notifyOtherParticipant(
        request,
        req.user.id,
        request.meetStatus === "Confirmed"
          ? "Swap Meeting Confirmed"
          : "Meeting Confirmation Received",
        request.meetStatus === "Confirmed"
          ? "Both students confirmed the swap meeting."
          : "The other student confirmed the swap meeting."
      );
    }

    return res.json({
      success: true,
      message:
        request.meetStatus === "Confirmed"
          ? "Both students confirmed the meeting"
          : "Meeting confirmation saved",
      request,
    });
  })
);

// =====================================
// SET PAYMENT TERMS
// =====================================

router.patch(
  "/requests/:id/payment-settings",
  authenticateUser,
  safeRoute(async (req, res) => {
    const request = await getAcceptedRequest(
      req,
      res
    );

    if (!request) return;

    if (!sameId(request.sellerId, req.user.id)) {
      return fail(
        res,
        403,
        "Only the product owner can propose payment terms"
      );
    }

    if (exchangeStarted(request)) {
      return fail(
        res,
        409,
        "Cannot change payment after exchange confirmation starts"
      );
    }

    if (request.paymentStatus === "Verified") {
      return fail(
        res,
        409,
        "Verified payment cannot be changed"
      );
    }

    if (
      typeof req.body.paymentRequired !==
      "boolean"
    ) {
      return fail(
        res,
        400,
        "paymentRequired must be true or false"
      );
    }

    const required = req.body.paymentRequired;

    let amount = 0;
    let payer = "None";
    let method = "None";

    if (required) {
      amount = Number(
        req.body.additionalAmount
      );

      payer = req.body.paymentPayer;
      method = req.body.paymentMethod;

      if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 1000000
      ) {
        return fail(
          res,
          400,
          "Enter a valid additional payment amount"
        );
      }

      if (
        !["Seller", "Buyer"].includes(payer)
      ) {
        return fail(
          res,
          400,
          "Select Seller or Buyer as payment payer"
        );
      }

      if (
        !["Cash", "UPI"].includes(method)
      ) {
        return fail(
          res,
          400,
          "Select Cash or UPI as payment method"
        );
      }
    }

    request.paymentRequired = required;
    request.additionalAmount = amount;
    request.paymentPayer = payer;
    request.paymentMethod = method;

    request.paymentReceiverId = required
      ? paymentReceiver(request)
      : null;

    request.paymentAgreedBySeller = true;
    request.paymentAgreedByBuyer = false;
    request.paymentTermsConfirmedAt = null;

    request.paymentStatus = required
      ? "Pending"
      : "Not Required";

    request.receiverUpiId = "";
    request.receiverUpiNumber = "";

    resetPaymentEvidence(request);

    await request.save();

    // NEW: Notify requester
    await sendSwapNotification({
      recipient: request.buyerId,
      sender: req.user.id,
      title: "Swap Payment Terms Proposed",
      message: required
        ? `The product owner proposed ${method} payment of ₹${amount}. Please review the terms.`
        : "The product owner proposed a free swap. Please confirm the terms.",
    });

    return res.json({
      success: true,
      message:
        "Swap terms proposed. Waiting for requester agreement.",
      request,
    });
  })
);

// =====================================
// REQUESTER AGREES TO PAYMENT TERMS
// =====================================

router.patch(
  "/requests/:id/confirm-payment-terms",
  authenticateUser,
  safeRoute(async (req, res) => {
    const request = await getAcceptedRequest(
      req,
      res
    );

    if (!request) return;

    if (!sameId(request.buyerId, req.user.id)) {
      return fail(
        res,
        403,
        "Only the swap requester can confirm terms"
      );
    }

    if (!request.paymentAgreedBySeller) {
      return fail(
        res,
        409,
        "Owner must propose swap terms first"
      );
    }

    if (request.paymentAgreedByBuyer) {
      return fail(
        res,
        409,
        "Swap terms already confirmed"
      );
    }

    request.paymentAgreedByBuyer = true;
    request.paymentTermsConfirmedAt = new Date();

    await request.save();

    // NEW: Notify owner
    await sendSwapNotification({
      recipient: request.sellerId,
      sender: req.user.id,
      title: "Swap Terms Accepted",
      message:
        "The requester agreed to the swap payment terms.",
    });

    return res.json({
      success: true,
      message:
        "Both students agreed to the swap terms",
      request,
    });
  })
);

// =====================================
// PAYMENT RECEIVER SETS UPI ID
// =====================================

router.patch(
  "/requests/:id/receiver-upi",
  authenticateUser,
  safeRoute(async (req, res) => {
    const request = await getAcceptedRequest(
      req,
      res
    );

    if (!request) return;

    if (
      !request.paymentRequired ||
      request.paymentMethod !== "UPI"
    ) {
      return fail(
        res,
        409,
        "UPI is not selected"
      );
    }

    if (
      !sameId(
        paymentReceiver(request),
        req.user.id
      )
    ) {
      return fail(
        res,
        403,
        "Only the payment receiver can set UPI details"
      );
    }

    if (!bothAgreed(request)) {
      return fail(
        res,
        409,
        "Both students must agree first"
      );
    }

    if (
      ["Submitted", "Verified"].includes(
        request.paymentStatus
      )
    ) {
      return fail(
        res,
        409,
        "Cannot change UPI details after payment submission"
      );
    }

    const upiId = String(
      req.body.receiverUpiId || ""
    ).trim();

    if (
      !/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z0-9.-]{2,64}$/.test(
        upiId
      )
    ) {
      return fail(
        res,
        400,
        "Enter a valid UPI ID"
      );
    }

    request.receiverUpiId = upiId;

    await request.save();

    // NEW: Notify payer
    await sendSwapNotification({
      recipient: paymentPayer(request),
      sender: req.user.id,
      title: "Swap UPI Details Available",
      message:
        "The payment receiver added UPI details. Check the Swap page.",
    });

    return res.json({
      success: true,
      message:
        "Receiver UPI ID saved successfully",
      request,
    });
  })
);

// =====================================
// PAYER SUBMITS UPI PROOF
// =====================================

router.patch(
  "/requests/:id/payment-proof",
  authenticateUser,
  safeRoute(async (req, res) => {
    const request = await getAcceptedRequest(
      req,
      res
    );

    if (!request) return;

    if (
      !request.paymentRequired ||
      request.paymentMethod !== "UPI"
    ) {
      return fail(
        res,
        409,
        "UPI payment is not required"
      );
    }

    if (
      !sameId(
        paymentPayer(request),
        req.user.id
      )
    ) {
      return fail(
        res,
        403,
        "Only the payer can submit payment proof"
      );
    }

    if (!bothAgreed(request)) {
      return fail(
        res,
        409,
        "Both students must agree first"
      );
    }

    if (!request.receiverUpiId) {
      return fail(
        res,
        409,
        "Receiver must provide UPI ID first"
      );
    }

    if (request.paymentStatus === "Verified") {
      return fail(
        res,
        409,
        "Payment already verified"
      );
    }

    const screenshot = String(
      req.body.paymentScreenshot || ""
    ).trim();

    if (
      !/^https:\/\//i.test(screenshot) ||
      screenshot.length > 2048
    ) {
      return fail(
        res,
        400,
        "Provide the HTTPS URL of the uploaded payment screenshot"
      );
    }

    request.paymentScreenshot = screenshot;
    request.paymentSubmittedAt = new Date();
    request.paymentStatus = "Submitted";
    request.paymentRejectionReason = "";

    await request.save();

    // NEW: Notify receiver
    await sendSwapNotification({
      recipient: paymentReceiver(request),
      sender: req.user.id,
      title: "Swap Payment Proof Submitted",
      message:
        "The payer submitted payment proof. Please verify it.",
    });

    return res.json({
      success: true,
      message:
        "Payment proof submitted. Waiting for receiver verification.",
      request,
    });
  })
);

// =====================================
// RECEIVER VERIFIES PAYMENT
// =====================================

router.patch(
  "/requests/:id/verify-payment",
  authenticateUser,
  safeRoute(async (req, res) => {
    const request = await getAcceptedRequest(
      req,
      res
    );

    if (!request) return;

    if (!request.paymentRequired) {
      return fail(
        res,
        409,
        "This is a free swap"
      );
    }

    if (
      !sameId(
        paymentReceiver(request),
        req.user.id
      )
    ) {
      return fail(
        res,
        403,
        "Only the payment receiver can verify payment"
      );
    }

    if (!bothAgreed(request)) {
      return fail(
        res,
        409,
        "Both students must agree first"
      );
    }

    if (request.paymentStatus === "Verified") {
      return fail(
        res,
        409,
        "Payment already verified"
      );
    }

    if (
      request.paymentMethod === "UPI" &&
      request.paymentStatus !== "Submitted"
    ) {
      return fail(
        res,
        409,
        "UPI payer must submit payment proof first"
      );
    }

    if (req.body.received !== true) {
      return fail(
        res,
        400,
        "Confirm actual receipt with received: true"
      );
    }

    request.paymentStatus = "Verified";
    request.paymentVerifiedBy = req.user.id;
    request.paymentVerifiedAt = new Date();
    request.paymentRejectionReason = "";

    await request.save();

    // NEW: Notify payer
    await sendSwapNotification({
      recipient: paymentPayer(request),
      sender: req.user.id,
      title: "Swap Payment Verified",
      message:
        "Your swap payment has been verified.",
    });

    return res.json({
      success: true,
      message:
        "Payment received and verified successfully",
      request,
    });
  })
);

// =====================================
// REJECT INCORRECT UPI PAYMENT PROOF
// =====================================

router.patch(
  "/requests/:id/reject-payment",
  authenticateUser,
  safeRoute(async (req, res) => {
    const request = await getAcceptedRequest(
      req,
      res
    );

    if (!request) return;

    if (
      !request.paymentRequired ||
      request.paymentMethod !== "UPI" ||
      request.paymentStatus !== "Submitted"
    ) {
      return fail(
        res,
        409,
        "No submitted UPI proof to reject"
      );
    }

    if (
      !sameId(
        paymentReceiver(request),
        req.user.id
      )
    ) {
      return fail(
        res,
        403,
        "Only the receiver can reject payment proof"
      );
    }

    const reason = String(
      req.body.reason || ""
    ).trim();

    if (!reason || reason.length > 500) {
      return fail(
        res,
        400,
        "Provide a rejection reason up to 500 characters"
      );
    }

    request.paymentStatus = "Rejected";
    request.paymentRejectionReason = reason;
    request.paymentScreenshot = "";
    request.paymentSubmittedAt = null;

    await request.save();

    // NEW: Notify payer
    await sendSwapNotification({
      recipient: paymentPayer(request),
      sender: req.user.id,
      title: "Swap Payment Proof Rejected",
      message:
        "Your payment proof was rejected. Check the Swap page and resubmit if needed.",
    });

    return res.json({
      success: true,
      message:
        "Payment proof rejected. Payer may resubmit.",
      request,
    });
  })
);

// =====================================
// CONFIRM PRODUCT EXCHANGE
// =====================================

router.patch(
  "/requests/:id/confirm-exchange",
  authenticateUser,
  safeRoute(async (req, res) => {
    const request = await getAcceptedRequest(
      req,
      res
    );

    if (!request) return;

    if (request.meetStatus !== "Confirmed") {
      return fail(
        res,
        409,
        "Both students must confirm the meeting first"
      );
    }

    // Both students must agree to swap terms.
    if (!bothAgreed(request)) {
      return fail(
        res,
        409,
        "Both students must agree to swap terms first"
      );
    }

    // Paid swap requires verified payment.
    if (
      request.paymentRequired &&
      request.paymentStatus !== "Verified"
    ) {
      return fail(
        res,
        409,
        "Payment must be verified before exchange confirmation"
      );
    }

    const buyer = sameId(
      request.buyerId,
      req.user.id
    );

    if (buyer) {
      if (request.buyerExchangeConfirmed) {
        return fail(
          res,
          409,
          "You already confirmed the exchange"
        );
      }

      request.buyerExchangeConfirmed = true;
      request.buyerConfirmedAt = new Date();
    } else {
      if (request.sellerExchangeConfirmed) {
        return fail(
          res,
          409,
          "You already confirmed the exchange"
        );
      }

      request.sellerExchangeConfirmed = true;
      request.sellerConfirmedAt = new Date();
    }

    if (
      request.buyerExchangeConfirmed &&
      request.sellerExchangeConfirmed
    ) {
      request.status = "Completed";
      request.meetStatus = "Completed";
      request.completedAt = new Date();
    }

    await request.save();

    // NEW: Notify other participant
    await notifyOtherParticipant(
      request,
      req.user.id,
      request.status === "Completed"
        ? "Swap Exchange Completed"
        : "Swap Exchange Confirmation",
      request.status === "Completed"
        ? "Both students confirmed the exchange. Swap completed successfully!"
        : "The other student confirmed the product exchange."
    );

    return res.json({
      success: true,
      message:
        request.status === "Completed"
          ? "Swap exchange completed successfully!"
          : "Exchange confirmed. Waiting for the other student.",
      request,
    });
  })
);

// =====================================
// EXPORT ROUTER
// =====================================

module.exports = router;
