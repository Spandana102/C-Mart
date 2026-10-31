
const express = require("express");

const authMiddleware = require(
  "../middleware/authMiddleware"
);

const {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
} = require("../controllers/chatController");

const router = express.Router();

// Only logged-in users can use chat
router.use(authMiddleware);

// Get user's conversations
router.get(
  "/conversations",
  getConversations
);

// Start or open conversation
router.post(
  "/conversations",
  createConversation
);

// Get messages
router.get(
  "/conversations/:conversationId/messages",
  getMessages
);

// Send message
router.post(
  "/conversations/:conversationId/messages",
  sendMessage
);

module.exports = router;
