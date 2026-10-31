
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const RentProduct = require("../models/RentProduct");
const RentRequest = require("../models/RentRequest");
const Notification = require("../models/Notification");

const router = express.Router();

// =====================================================
// COMMON HELPERS
// =====================================================

const validId = (id) => mongoose.isValidObjectId(id);

const sameId = (a, b) => String(a) === String(b);

const fail = (res, status, message) =>
  res.status(status).json({
    success: false,
    message,
  });

const serverError = (res, error) => {
  console.error("Rent API Error:", error);

  if (
    error.name === "ValidationError" ||
    error.name === "CastError"
  ) {
    return fail(res, 400, error.message);
  }

  return fail(
    res,
    500,
    "Rental operation failed. Please try again."
  );
};

// =====================================================
// RENT NOTIFICATIONS
// =====================================================

const sendRentNotification = async ({
  recipient,
  sender,
  title,
  message,
}) => {
  try {
    if (!recipient || !sender) return;

    if (sameId(recipient, sender)) return;

    await Notification.create({
      recipient,
      sender,
      type: "rent",
      title,
      message,
      link: "/rent",
      isRead: false,
    });

    console.log("Rent notification created:", title);
  } catch (error) {
    console.error(
      "Rent notification error:",
      error.message
    );
  }
};

const notifyOther = async (
  request,
  sender,
  title,
  message
) => {
  const recipient = sameId(sender, request.ownerId)
    ? request.renterId
    : request.ownerId;

  await sendRentNotification({
    recipient,
    sender,
    title,
    message,
  });
};

// =====================================================
// AUTHENTICATION
// =====================================================

const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";

    const token = header.startsWith("Bearer ")
      ? header.slice(7)
      : "";

    if (!token) {
      return fail(res, 401, "Please login first.");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const id =
      decoded.id ||
      decoded.userId ||
      decoded._id;

    if (!validId(id)) {
      return fail(
        res,
        401,
        "Invalid authentication token."
      );
    }

    const user = await User.findById(id).select("_id");

    if (!user) {
      return fail(
        res,
        401,
        "User account not found."
      );
    }

    req.rentUserId = user._id;

    next();
  } catch (error) {
    return fail(
      res,
      401,
      "Session expired or invalid. Please login again."
    );
  }
};

const loadRequest = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return fail(
        res,
        400,
        "Invalid rental request ID."
      );
    }

    const request = await RentRequest.findById(
      req.params.id
    );

    if (!request) {
      return fail(
        res,
        404,
        "Rental request not found."
      );
    }

    req.isRentOwner = sameId(
      request.ownerId,
      req.rentUserId
    );

    req.isRenter = sameId(
      request.renterId,
      req.rentUserId
    );

    if (!req.isRentOwner && !req.isRenter) {
      return fail(
        res,
        403,
        "You cannot access this rental request."
      );
    }

    req.rentRequest = request;

    next();
  } catch (error) {
    return serverError(res, error);
  }
};

// =====================================================
// DATE HELPERS
// =====================================================

const parseDate = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const date = new Date(
    `${value}T00:00:00.000Z`
  );

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  )
    ? date
    : null;
};

const dateString = (date) =>
  new Date(date).toISOString().slice(0, 10);

const todayIndia = () => {
  const parts = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date());

  const part = (type) =>
    parts.find((p) => p.type === type).value;

  return parseDate(
    `${part("year")}-${part("month")}-${part("day")}`
  );
};

const daysBetween = (a, b) =>
  Math.round(
    (b.getTime() - a.getTime()) / 86400000
  ) + 1;

const endFromDays = (start, days) =>
  new Date(
    start.getTime() + (days - 1) * 86400000
  );

const indiaTimestamp = (date, time) => {
  if (
    !date ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || "")
  ) {
    return null;
  }

  const timestamp = new Date(
    `${dateString(date)}T${time}:00+05:30`
  );

  return Number.isNaN(timestamp.getTime())
    ? null
    : timestamp;
};

const meetingTimestamp = (request) =>
  indiaTimestamp(
    request.meetingDate,
    request.meetingTime
  );

const returnTimestamp = (request) =>
  indiaTimestamp(
    request.returnDate,
    request.returnTime
);

const validateImageUrl = (value) => {
  if (
    typeof value !== "string" ||
    value.length > 2000
  ) {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
};

// =====================================================
// STATUS HELPERS
// =====================================================

const activeStatuses = [
  "Accepted",
  "Active",
  "Return Pending",
];

const openStatuses = [
  "Pending",
  ...activeStatuses,
];

const hasPaymentClearance = (request) =>
  !request.paymentRequired ||
  request.paymentStatus === "Verified";

const meetingConfirmed = (request) =>
  request.meetStatus === "Confirmed" &&
  request.meetConfirmedByOwner &&
  request.meetConfirmedByRenter;

const returnScheduleConfirmed = (request) =>
  request.returnStatus === "Confirmed" &&
  request.returnScheduleConfirmedByOwner &&
  request.returnScheduleConfirmedByRenter;

const populated = (query) =>
  query
    .populate(
      "productId",
      "name image rentPrice category"
    )
    .populate("ownerId", "fullName")
    .populate("renterId", "fullName");

// =====================================================
// RENT PRODUCTS
// =====================================================

// GET ALL RENT PRODUCTS
router.get("/products", async (req, res) => {
  try {
    const products = await RentProduct.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      products,
    });
  } catch (error) {
    return serverError(res, error);
  }
});

// ADD RENT PRODUCT
router.post(
  "/products",
  requireAuth,
  async (req, res) => {
    try {
      const {
        name,
        category,
        condition,
        description,
        rentPrice,
        image,
      } = req.body;

      const price = Number(rentPrice);

      if (
        typeof name !== "string" ||
        !name.trim() ||
        !Number.isFinite(price) ||
        price <= 0
      ) {
        return fail(
          res,
          400,
          "Valid product name and daily rent price are required."
        );
      }

      if (
        image &&
        !validateImageUrl(image)
      ) {
        return fail(
          res,
          400,
          "Provide a valid HTTPS image URL."
        );
      }

      const product = await RentProduct.create({
        name: name.trim(),
        category,
        condition,
        description: description || "",
        rentPrice: price,
        image: image || "",
        ownerId: req.rentUserId,
      });

      return res.status(201).json({
        success: true,
        message: "Rental product added.",
        product,
      });
    } catch (error) {
      return serverError(res, error);
    }
  }
);

// UPDATE RENT PRODUCT
router.put(
  "/products/:id",
  requireAuth,
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return fail(
          res,
          400,
          "Invalid product ID."
        );
      }

      const product = await RentProduct.findById(
        req.params.id
      );

      if (!product) {
        return fail(
          res,
          404,
          "Rental product not found."
        );
      }

      if (
        !sameId(
          product.ownerId,
          req.rentUserId
        )
      ) {
        return fail(
          res,
          403,
          "Only the owner can edit this product."
        );
      }

      const active = await RentRequest.exists({
        productId: product._id,
        status: {
          $in: activeStatuses,
        },
      });

      if (active) {
        return fail(
          res,
          409,
          "Cannot edit a product during an active rental."
        );
      }

      if (
        req.body.image !== undefined &&
        req.body.image !== "" &&
        !validateImageUrl(req.body.image)
      ) {
        return fail(
          res,
          400,
          "Provide a valid HTTPS image URL."
        );
      }

      const fields = [
        "name",
        "category",
        "condition",
        "description",
        "rentPrice",
        "image",
      ];

      for (const field of fields) {
        if (
          req.body[field] !== undefined
        ) {
          product[field] = req.body[field];
        }
      }

      if (
        typeof product.name === "string"
      ) {
        product.name = product.name.trim();
      }

      await product.save();

      return res.json({
        success: true,
        message: "Rental product updated.",
        product,
      });
    } catch (error) {
      return serverError(res, error);
    }
  }
);

// DELETE RENT PRODUCT
router.delete(
  "/products/:id",
  requireAuth,
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return fail(
          res,
          400,
          "Invalid product ID."
        );
      }

      const product = await RentProduct.findById(
        req.params.id
      );

      if (!product) {
        return fail(
          res,
          404,
          "Rental product not found."
        );
      }

      if (
        !sameId(
          product.ownerId,
          req.rentUserId
        )
      ) {
        return fail(
          res,
          403,
          "Only the owner can delete this product."
        );
      }

      const pending = await RentRequest.exists({
        productId: product._id,
        status: {
          $in: openStatuses,
        },
      });

      if (pending) {
        return fail(
          res,
          409,
          "Resolve outstanding rental requests before deleting."
        );
      }

      await product.deleteOne();

      return res.json({
        success: true,
        message: "Rental product deleted.",
      });
    } catch (error) {
      return serverError(res, error);
    }
  }
);

// =====================================================
// RENT REQUESTS
// =====================================================

// GET RENT REQUESTS
router.get(
  "/requests",
  requireAuth,
  async (req, res) => {
    try {
      const requests = await populated(
        RentRequest.find({
          $or: [
            {
              renterId: req.rentUserId,
            },
            {
              ownerId: req.rentUserId,
            },
          ],
        }).sort({
          createdAt: -1,
        })
      );

      return res.json({
        success: true,
        requests,
      });
    } catch (error) {
      return serverError(res, error);
    }
  }
);

// CREATE RENT REQUEST
router.post(
  "/requests",
  requireAuth,
  async (req, res) => {
    try {
      const {
        productId,
        startDate,
        endDate,
        days: enteredDays,
      } = req.body;

      if (!validId(productId)) {
        return fail(
          res,
          400,
          "Invalid rental product."
        );
      }

      const start = parseDate(startDate);

      if (
        !start ||
        start < todayIndia()
      ) {
        return fail(
          res,
          400,
          "Select a valid start date."
        );
      }

      let end;

      if (
        enteredDays !== undefined &&
        enteredDays !== null &&
        enteredDays !== ""
      ) {
        const count = Number(enteredDays);

        if (
          !Number.isInteger(count) ||
          count < 1 ||
          count > 90
        ) {
          return fail(
            res,
            400,
            "Rental duration must be 1 to 90 days."
          );
        }

        end = endFromDays(start, count);

        if (
          endDate &&
          (
            !parseDate(endDate) ||
            dateString(end) !== endDate
          )
        ) {
          return fail(
            res,
            400,
            "Return date does not match the rental duration."
          );
        }
      } else {
        end = parseDate(endDate);
      }

      if (
        !end ||
        end < start
      ) {
        return fail(
          res,
          400,
          "Select valid rental dates."
        );
      }

      const days = daysBetween(
        start,
        end
      );

      if (
        days < 1 ||
        days > 90
      ) {
        return fail(
          res,
          400,
          "Maximum rental duration is 90 days."
        );
      }

      const product = await RentProduct.findById(
        productId
      );

      if (
        !product ||
        !product.isAvailable
      ) {
        return fail(
          res,
          404,
          "Rental product is unavailable."
        );
      }

      if (
        sameId(
          product.ownerId,
          req.rentUserId
        )
      ) {
        return fail(
          res,
          400,
          "You cannot rent your own product."
        );
      }

      const existing = await RentRequest.exists({
        productId,
        renterId: req.rentUserId,
        status: {
          $in: openStatuses,
        },
      });

      if (existing) {
        return fail(
          res,
          409,
          "You already have an open request for this product."
        );
      }

      const overlap = await RentRequest.exists({
        productId,
        status: {
          $in: activeStatuses,
        },
        startDate: {
          $lte: end,
        },
        endDate: {
          $gte: start,
        },
      });

      if (overlap) {
        return fail(
          res,
          409,
          "Product is booked for the selected dates."
        );
      }

      const dailyPrice = Number(
        product.rentPrice
      );

      const totalPrice =
        Math.round(
          dailyPrice * days * 100
        ) / 100;

      const request = await RentRequest.create({
        productId: product._id,
        ownerId: product.ownerId,
        renterId: req.rentUserId,
        startDate: start,
        endDate: end,
        days,
        dailyPrice,
        totalPrice,
      });

      await sendRentNotification({
        recipient: product.ownerId,
        sender: req.rentUserId,
        title: "New Rent Request",
        message:
          `A student requested to rent ${product.name}.`,
      });

      return res.status(201).json({
        success: true,
        message: "Rental request sent.",
        request,
      });
    } catch (error) {
      return serverError(res, error);
    }
  }
);

// ACCEPT OR REJECT RENT REQUEST
router.patch(
  "/requests/:id/status",
  requireAuth,
  loadRequest,
  async (req, res) => {
    try {
      const request = req.rentRequest;
      const { status } = req.body;

      if (!req.isRentOwner) {
        return fail(
          res,
          403,
          "Only the owner can accept or reject requests."
        );
      }

      if (
        !["Accepted", "Rejected"].includes(status)
      ) {
        return fail(
          res,
          400,
          "Status must be Accepted or Rejected."
        );
      }

      if (
        request.status !== "Pending"
      ) {
        return fail(
          res,
          409,
          "This request has already been processed."
        );
      }

      if (status === "Accepted") {
        if (
          request.endDate < todayIndia()
        ) {
          return fail(
            res,
            400,
            "Cannot accept an expired rental period."
          );
        }

        const overlap = await RentRequest.exists({
          _id: {
            $ne: request._id,
          },
          productId: request.productId,
          status: {
            $in: activeStatuses,
          },
          startDate: {
            $lte: request.endDate,
          },
          endDate: {
            $gte: request.startDate,
          },
        });

        if (overlap) {
          return fail(
            res,
            409,
            "Another rental overlaps these dates."
          );
        }

        request.acceptedAt = new Date();
      } else {
        request.rejectedAt = new Date();
      }

      request.status = status;

      await request.save();

      await sendRentNotification({
        recipient: request.renterId,
        sender: req.rentUserId,
        title: `Rent Request ${status}`,
        message:
          status === "Accepted"
            ? "Your rental request has been accepted by the owner."
            : "Your rental request has been rejected by the owner.",
      });

      return res.json({
        success: true,
        message:
          `Rental request ${status.toLowerCase()}.`,
        request,
      });
    } catch (error) {
      return serverError(res, error);
    }
  }
);

// =====================================================
// MEET POINT
// =====================================================

// SCHEDULE MEET POINT
router.patch(
  "/requests/:id/meetpoint",
  requireAuth,
  loadRequest,
  async (req, res) => {
    try {
      const request = req.rentRequest;

      if (
        request.status !== "Accepted"
      ) {
        return fail(
          res,
          409,
          "Meeting can be scheduled only for accepted rentals."
        );
      }

      if (
        request.orderStatus !== "Not Confirmed" ||
        request.handoverConfirmedByOwner ||
        request.handoverConfirmedByRenter
      ) {
        return fail(
          res,
          409,
          "Cannot reschedule after order or handover confirmation."
        );
      }

      const {
        meetPoint,
        meetingDate,
        meetingTime,
      } = req.body;

      const date = parseDate(
        meetingDate
      );

      if (
        typeof meetPoint !== "string" ||
        !meetPoint.trim() ||
        meetPoint.trim().length > 150 ||
        !date ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(
          meetingTime || ""
        )
      ) {
        return fail(
          res,
          400,
          "Enter a valid campus meet point, date and time."
        );
      }

      const timestamp = indiaTimestamp(
        date,
        meetingTime
      );

      if (
        !timestamp ||
        timestamp <= new Date()
      ) {
        return fail(
          res,
          400,
          "Meeting must be scheduled in the future."
        );
      }

      request.meetPoint = meetPoint.trim();
      request.meetingDate = date;
      request.meetingTime = meetingTime;
      request.meetStatus = "Scheduled";

      request.meetConfirmedByOwner = false;
      request.meetConfirmedByRenter = false;

      await request.save();

      await notifyOther(
        request,
        req.rentUserId,
        "Rental Meet Point Scheduled",
        `Meeting scheduled at ${request.meetPoint} on ${meetingDate} at ${meetingTime}.`
      );

      return res.json({
        success: true,
        message: "Rental meeting scheduled.",
        request,
      });
    } catch (error) {
      return serverError(res, error);
    }
  }
);

// CONFIRM MEETING
router.patch(
  "/requests/:id/confirm-meet",
  requireAuth,
  loadRequest,
  async (req, res) => {
    try {
      const request = req.rentRequest;

      if (
        request.status !== "Accepted" ||
        !request.meetPoint ||
        !meetingTimestamp(request)
      ) {
        return fail(
          res,
          409,
          "Schedule an accepted rental meeting first."
        );
      }

      const alreadyConfirmed = req.isRentOwner
        ? request.meetConfirmedByOwner
        : request.meetConfirmedByRenter;

      if (req.isRentOwner) {
        request.meetConfirmedByOwner = true;
      } else {
        request.meetConfirmedByRenter = true;
      }

      if (
        request.meetConfirmedByOwner &&
        request.meetConfirmedByRenter
      ) {
        request.meetStatus = "Confirmed";
      }

      await request.save();

      if (!alreadyConfirmed) {
        await notifyOther(
          request,
          req.rentUserId,
          "Rental Meeting Confirmation",
          request.meetStatus === "Confirmed"
            ? "Both students have confirmed the rental meeting."
            : "The other student has confirmed the rental meeting."
        );
      }

      return res.json({
        success: true,
        message: "Meeting confirmation saved.",
        request,
      });
    } catch (error) {
      return serverError(res, error);
    }
  }
);

// =====================================================
// PAYMENT
// =====================================================

// PAYMENT SETTINGS
router.patch(
  "/requests/:id/payment-settings",
  requireAuth,
  loadRequest,
  async (req, res) => {
    try {
      const request = req.rentRequest;

      if (!req.isRentOwner) {
        return fail(
          res,
          403,
          "Only the owner can configure payment."
        );
      }

      if (
        request.status !== "Accepted" ||
        request.orderStatus !== "Not Confirmed"
      ) {
        return fail(
          res,
          409,
          "Payment settings can be changed only before order confirmation."
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
          "Cannot change settings after payment proof is submitted."
        );
      }

      if (
        typeof req.body.paymentRequired !== "boolean"
      ) {
        return fail(
          res,
          400,
          "paymentRequired must be true or false."
        );
      }

      const method = req.body.paymentRequired
        ? req.body.paymentMethod
        : "None";

      if (
        req.body.paymentRequired &&
        !["UPI", "Cash"].includes(method)
      ) {
        return fail(
          res,
          400,
          "Choose UPI or Cash."
        );
      }

      request.paymentRequired =
        req.body.paymentRequired;

      request.paymentMethod = method;

      request.paymentMethodSelected = true;

      request.paymentStatus =
        req.body.paymentRequired
          ? "Pending"
          : "Not Required";

      // Preserve model-required seller UPI details
      if (
        req.body.paymentRequired &&
        method === "UPI"
      ) {
        const upiId = String(
          req.body.sellerUpiId || ""
        ).trim();

        if (
          !/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z0-9.-]{2,64}$/.test(
            upiId
          )
        ) {
          return fail(
            res,
            400,
            "Enter a valid seller UPI ID."
          );
        }

        request.sellerUpiId = upiId;
        request.sellerUpiNumber =
          req.body.sellerUpiNumber || "";
      } else {
        request.sellerUpiId = "";
        request.sellerUpiNumber = "";
      }

      request.paymentScreenshot = "";
      request.paymentSubmittedAt = null;
      request.paymentVerifiedAt = null;
      request.paymentVerifiedBy = null;
      request.paymentRejectionReason = "";

      await request.save();

      await sendRentNotification({
        recipient: request.renterId,
        sender: req.rentUserId,
        title: "Rental Payment Settings Updated",
        message: request.paymentRequired
          ? `The owner selected ${method} as the rental payment method.`
          : "The owner marked payment as not required for this rental.",
      });

      return res.json({
        success: true,
        message: "Payment settings updated.",
        request,
      });
    } catch (error) {
      return serverError(res, error);
    }
  }
);

// SUBMIT PAYMENT PROOF
router.patch(
  "/requests/:id/payment-proof",
  requireAuth,
  loadRequest,
  async (req, res) => {
    try {
      const request = req.rentRequest;

      if (!req.isRenter) {
        return fail(
          res,
          403,
          "Only the renter can submit payment proof."
        );
      }

      if (
        request.status !== "Accepted" ||
        request.orderStatus !== "Not Confirmed"
      ) {
        return fail(
          res,
          409,
          "Payment proof can be submitted only before order confirmation."
        );
      }

      if (
        !request.paymentRequired ||
        request.paymentMethod !== "UPI"
      ) {
        return fail(
          res,
          409,
          "UPI payment proof is not required for this rental."
        );
      }

      if (
        !["Pending", "Rejected"].includes(
          request.paymentStatus
        )
      ) {
        return fail(
          res,
          409,
          "Payment proof has already been submitted or verified."
        );
      }

      const screenshot =
        req.body.paymentScreenshot;

      if (
        !validateImageUrl(screenshot)
      ) {
        return fail(
          res,
          400,
          "Upload a valid HTTPS payment proof image first."
        );
      }

      request.paymentScreenshot = screenshot;
      request.paymentStatus = "Submitted";
      request.paymentSubmittedAt = new Date();
      request.paymentVerifiedAt = null;
      request.paymentVerifiedBy = null;
      request.paymentRejectionReason = "";

      await request.save();

      await sendRentNotification({
        recipient: request.ownerId,
        sender: req.rentUserId,
        title: "Rental Payment Proof Submitted",
        message:
          "The renter submitted payment proof. Please review the payment.",
      });

      return res.json({
        success: true,
        message:
          "Payment proof submitted for seller review.",
        request,
      });
    } catch (error) {
      return serverError(res, error);
    }
  }
);

// VERIFY PAYMENT
router.patch(
  "/requests/:id/verify-payment",
  requireAuth,
  loadRequest,
  async (req, res) => {
    try {
      const request = req.rentRequest;

      if (!req.isRentOwner) {
        return fail(
          res,
          403,
          "Only the owner can verify payment."
        );
      }

      if (
        request.status !== "Accepted" ||
        request.orderStatus !== "Not Confirmed"
      ) {
        return fail(
          res,
          409,
          "Payment verification is unavailable at this stage."
        );
      }

      if (!request.paymentRequired) {
        return fail(
          res,
          409,
          "Payment verification is not required."
        );
      }

      const {
        decision,
        rejectionReason,
      } = req.body;

      if (
        !["Verified", "Rejected"].includes(
          decision
        )
      ) {
        return fail(
          res,
          400,
          "Decision must be Verified or Rejected."
        );
      }

      if (
        request.paymentMethod === "UPI" &&
        request.paymentStatus !== "Submitted"
      ) {
        return fail(
          res,
          409,
          "Wait for the renter to submit UPI payment proof."
        );
      }

      if (
        request.paymentMethod === "Cash" &&
        !["Pending", "Rejected"].includes(
          request.paymentStatus
        )
      ) {
        return fail(
          res,
          409,
          "Cash payment has already been reviewed."
        );
      }

      if (
        decision === "Rejected" &&
        (
          typeof rejectionReason !== "string" ||
          !rejectionReason.trim()
        )
      ) {
        return fail(
          res,
          400,
          "Provide a reason for rejecting payment."
        );
      }

      request.paymentStatus = decision;

      request.paymentVerifiedAt =
        decision === "Verified"
          ? new Date()
          : null;

      request.paymentVerifiedBy =
        decision === "Verified"
          ? req.rentUserId
          : null;

      request.paymentRejectionReason =
        decision === "Rejected"
          ? rejectionReason.trim().slice(0, 500)
          : "";

      await request.save();

      await sendRentNotification({
        recipient: request.renterId,
        sender: req.rentUserId,
        title: `Rental Payment ${decision}`,
        message:
          decision === "Verified"
            ? "The owner has verified your rental payment."
            : `Your rental payment was rejected. Reason: ${request.paymentRejectionReason}`,
      });

      return res.json({
        success: true,
        message:
          `Payment ${decision.toLowerCase()}.`,
        request,
      });
    } catch (error) {
      return serverError(res, error);
    }
  }
);

// =====================================================
// RENT ORDER CONFIRMATION
// =====================================================

router.patch(
  "/requests/:id/confirm-order",
  requireAuth,
  loadRequest,
  async (req, res) => {
    try {
      const request = req.rentRequest;

      if (
        request.status !== "Accepted"
      ) {
        return fail(
          res,
          409,
          "Seller must accept the request first."
        );
      }

      if (
        !meetingConfirmed(request)
      ) {
        return fail(
          res,
          409,
          "Both students must confirm the meet point first."
        );
      }

      if (
        !hasPaymentClearance(request)
      ) {
        return fail(
          res,
          409,
          "Payment verification is still pending."
        );
      }

      if (
        request.orderStatus === "Confirmed"
      ) {
        return res.json({
          success: true,
          message:
            "Rental order is already confirmed.",
          request,
        });
      }

      if (
        request.orderStatus !== "Not Confirmed"
      ) {
        return fail(
          res,
          409,
          "Cannot confirm this rental order."
        );
      }

      request.orderStatus = "Confirmed";
      request.orderConfirmedAt = new Date();

      await request.save();

      await notifyOther(
        request,
        req.rentUserId,
        "Rental Order Confirmed",
        "The rental order has been confirmed successfully."
      );

      return res.json({
        success: true,
        message:
          "Rental order confirmed successfully.",
        request,
      });
    } catch (error) {
      return serverError(res, error);
    }
  }
);

// =====================================================
// PRODUCT HANDOVER
// =====================================================

router.patch(
  "/requests/:id/confirm-handover",
  requireAuth,
  loadRequest,
  async (req, res) => {
    try {
      const request = req.rentRequest;

      if (
        request.status !== "Accepted" ||
        !meetingConfirmed(request)
      ) {
        return fail(
          res,
          409,
          "Both students must confirm the meeting first."
        );
      }

      if (
        request.orderStatus !== "Confirmed" ||
        !hasPaymentClearance(request)
      ) {
        return fail(
          res,
          409,
          "Confirm the rental order and any required payment first."
        );
      }

      const scheduled =
        meetingTimestamp(request);

      if (
        !scheduled ||
        new Date() < scheduled
      ) {
        return fail(
          res,
          400,
          "Handover can be confirmed only after meeting time."
        );
      }

      const alreadyConfirmed = req.isRentOwner
        ? request.handoverConfirmedByOwner
        : request.handoverConfirmedByRenter;

      if (req.isRentOwner) {
        request.handoverConfirmedByOwner = true;
      } else {
        request.handoverConfirmedByRenter = true;
      }

      if (
        request.handoverConfirmedByOwner &&
        request.handoverConfirmedByRenter
      ) {
        request.status = "Active";
        request.orderStatus = "In Progress";
        request.handoverAt = new Date();
      }

      await request.save();

      if (!alreadyConfirmed) {
        await notifyOther(
          request,
          req.rentUserId,
          "Rental Product Handover",
          request.status === "Active"
            ? "Both students confirmed the product handover. The rental is now active."
            : "The other student confirmed the product handover."
        );
      }

      return res.json({
        success: true,
        message:
          "Product handover confirmation saved.",
        request,
      });
    } catch (error) {
      return serverError(res, error);
    }
  }
);

// =====================================================
// RETURN SCHEDULING
// =====================================================

// OWNER SCHEDULES PRODUCT RETURN
router.patch(
  "/requests/:id/return-schedule",
  requireAuth,
  loadRequest,
  async (req, res) => {
    try {
      const request = req.rentRequest;

      if (!req.isRentOwner) {
        return fail(
          res,
          403,
          "Only the owner can schedule the return."
        );
      }

      if (
        request.status !== "Active"
      ) {
        return fail(
          res,
          409,
          "Rental must be active before scheduling return."
        );
      }

      const {
        returnDate,
        returnTime,
        returnMeetPoint,
      } = req.body;

      const date = parseDate(returnDate);

      if (
        !date ||
        typeof returnTime !== "string" ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(
          returnTime
        ) ||
        typeof returnMeetPoint !== "string" ||
        !returnMeetPoint.trim() ||
        returnMeetPoint.trim().length > 150
      ) {
        return fail(
          res,
          400,
          "Enter a valid return date, time and meet point."
        );
      }

      const timestamp = indiaTimestamp(
        date,
        returnTime
      );

      if (
        !timestamp ||
        timestamp <= new Date()
      ) {
        return fail(
          res,
          400,
          "Return meeting must be in the future."
        );
      }

      if (
        dateString(date) <
        dateString(request.startDate)
      ) {
        return fail(
          res,
          400,
          "Return date cannot be before rental start."
        );
      }

      if (
        request.returnConfirmedByOwner ||
        request.returnConfirmedByRenter
      ) {
        return fail(
          res,
          409,
          "Cannot reschedule after actual return confirmation."
        );
      }

      request.returnDate = date;
      request.returnTime = returnTime;

      request.returnMeetPoint =
        returnMeetPoint.trim();

      request.returnStatus = "Scheduled";

      request.returnScheduleConfirmedByOwner = true;
      request.returnScheduleConfirmedByRenter = false;

      request.returnScheduledAt = new Date();

      await request.save();

      await sendRentNotification({
        recipient: request.renterId,
        sender: req.rentUserId,
        title: "Rental Return Scheduled",
        message:
          `Return scheduled at ${request.returnMeetPoint} on ${returnDate} at ${returnTime}. Please confirm the schedule.`,
      });

      return res.json({
        success: true,
        message:
          "Return scheduled successfully.",
        request,
      });
    } catch (error) {
      return serverError(res, error);
    }
  }
);

// RENTER CONFIRMS RETURN SCHEDULE
router.patch(
  "/requests/:id/confirm-return-schedule",
  requireAuth,
  loadRequest,
  async (req, res) => {
    try {
      const request = req.rentRequest;

      if (!req.isRenter) {
        return fail(
          res,
          403,
          "Only the renter can confirm the return schedule."
        );
      }

      if (
        request.status !== "Active" ||
        request.returnStatus !== "Scheduled"
      ) {
        return fail(
          res,
          409,
          "Return schedule is not awaiting confirmation."
        );
      }

      if (
        !request.returnDate ||
        !request.returnTime ||
        !request.returnMeetPoint ||
        !request.returnScheduleConfirmedByOwner
      ) {
        return fail(
          res,
          409,
          "Owner must schedule the return first."
        );
      }

      request.returnScheduleConfirmedByRenter = true;
      request.returnStatus = "Confirmed";

      await request.save();

      await sendRentNotification({
        recipient: request.ownerId,
        sender: req.rentUserId,
        title: "Return Schedule Confirmed",
        message:
          "The renter has confirmed the scheduled product return.",
      });

      return res.json({
        success: true,
        message:
          "Return schedule confirmed successfully.",
        request,
      });
    } catch (error) {
      return serverError(res, error);
    }
  }
);

// =====================================================
// ACTUAL PRODUCT RETURN
// =====================================================

router.patch(
  "/requests/:id/confirm-return",
  requireAuth,
  loadRequest,
  async (req, res) => {
    try {
      const request = req.rentRequest;

      if (
        !["Active", "Return Pending"].includes(
          request.status
        )
      ) {
        return fail(
          res,
          409,
          "Product handover must be completed first."
        );
      }

      if (
        !returnScheduleConfirmed(request)
      ) {
        return fail(
          res,
          409,
          "Both students must confirm the return schedule first."
        );
      }

      const scheduled =
        returnTimestamp(request);

      if (
        !scheduled ||
        new Date() < scheduled
      ) {
        return fail(
          res,
          400,
          "Return can be confirmed only after the scheduled return time."
        );
      }

      const alreadyConfirmed = req.isRentOwner
        ? request.returnConfirmedByOwner
        : request.returnConfirmedByRenter;

      if (req.isRentOwner) {
        request.returnConfirmedByOwner = true;
      } else {
        request.returnConfirmedByRenter = true;
      }

      if (
        request.returnConfirmedByOwner &&
        request.returnConfirmedByRenter
      ) {
        request.returnStatus = "Returned";
        request.status = "Completed";
        request.orderStatus = "Completed";

        request.returnedAt = new Date();
        request.completedAt = new Date();
      } else {
        request.status = "Return Pending";
      }

      await request.save();

      if (!alreadyConfirmed) {
        await notifyOther(
          request,
          req.rentUserId,
          "Rental Product Return",
          request.status === "Completed"
            ? "Both students confirmed the product return. Rental completed successfully."
            : "The other student confirmed the product return. Please confirm from your side."
        );
      }

      return res.json({
        success: true,
        message:
          request.status === "Completed"
            ? "Rental completed successfully."
            : "Waiting for the other student's return confirmation.",
        request,
      });
    } catch (error) {
      return serverError(res, error);
    }
  }
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
