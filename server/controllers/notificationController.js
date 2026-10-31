
const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const notifications = await Notification.find({
      recipient: userId,
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to fetch notifications",
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: userId,
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({
      message: "Unable to update notification",
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to update notifications",
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: userId,
    });

    if (!deleted) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      message: "Unable to delete notification",
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
