
const mongoose = require("mongoose");

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const Product = require("../models/Product");
const Notification = require("../models/Notification");

const getUserId = (req) =>
  req.user?._id || req.user?.id;

// ========================================
// GET MY CONVERSATIONS
// ========================================

exports.getConversations = async (req, res) => {
  try {
    const userId = getUserId(req);

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "fullName email")
      .populate("product", "name price images")
      .sort({ lastMessageAt: -1 });

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get Conversations Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load conversations.",
    });
  }
};

// ========================================
// CREATE OR OPEN CONVERSATION
// ========================================

exports.createConversation = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { sellerId, productId } = req.body;

    if (
      !mongoose.isValidObjectId(userId) ||
      !mongoose.isValidObjectId(sellerId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user or seller ID.",
      });
    }

    if (String(userId) === String(sellerId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot chat with yourself.",
      });
    }

    const seller = await User.findById(sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found.",
      });
    }

    if (productId) {
      if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID.",
        });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }

      if (
        !product.sellerId ||
        String(product.sellerId) !== String(sellerId)
      ) {
        return res.status(403).json({
          success: false,
          message: "Seller does not match this product.",
        });
      }
    }

    const query = {
      participants: {
        $all: [userId, sellerId],
        $size: 2,
      },
      product: productId || null,
    };

    let conversation = await Conversation.findOne(query);

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, sellerId],
        product: productId || null,
      });
    }

    await conversation.populate(
      "participants",
      "fullName email"
    );

    await conversation.populate(
      "product",
      "name price images"
    );

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Create Conversation Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to open conversation.",
    });
  }
};

// ========================================
// GET CONVERSATION MESSAGES
// ========================================

exports.getMessages = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { conversationId } = req.params;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID.",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    const messages = await Message.find({
      conversation: conversationId,
    })
      .populate("sender", "fullName")
      .sort({ createdAt: -1 })
      .limit(200);

    messages.reverse();

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get Messages Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load messages.",
    });
  }
};

// ========================================
// SEND MESSAGE + CREATE NOTIFICATION
// ========================================

exports.sendMessage = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { conversationId } = req.params;
    const { text } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
    }

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID.",
      });
    }

    if (
      typeof text !== "string" ||
      !text.trim() ||
      text.trim().length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Message must contain 1-2000 characters.",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    const cleanText = text.trim();

    // SAVE MESSAGE
    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      text: cleanText,
      readBy: [userId],
    });

    // UPDATE CONVERSATION
    conversation.lastMessage = cleanText;
    conversation.lastMessageAt = new Date();

    await conversation.save();

    await message.populate("sender", "fullName");

    // ====================================
    // AUTOMATIC CHAT NOTIFICATIONS
    // ====================================

    try {
      const recipients = conversation.participants.filter(
        (participantId) =>
          String(participantId) !== String(userId)
      );

      const senderName =
        message.sender?.fullName || "A student";

      for (const recipientId of recipients) {
        await Notification.create({
          recipient: recipientId,
          sender: userId,
          type: "chat",
          title: `New message from ${senderName}`,
          message:
            cleanText.length > 100
              ? `${cleanText.slice(0, 100)}...`
              : cleanText,
          link: `/chat?conversationId=${conversationId}`,
          isRead: false,
        });
      }
    } catch (notificationError) {
      console.error(
        "Chat Notification Error:",
        notificationError
      );
    }

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: message,
    });
  } catch (error) {
    console.error("Send Message Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send message.",
    });
  }
};
