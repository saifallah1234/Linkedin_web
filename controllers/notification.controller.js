const notificationService = require('../services/notification.service');

exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const notifications = await notificationService.getUserNotifications(req.user.id, page, limit);
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.readNotification = async (req, res) => {
  try {
    const updated = await notificationService.markAsRead(req.params.id, req.user.id);
    if (!updated) return res.status(404).json({ message: "Notification not found" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ unread: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const updated = await notificationService.markAllAsRead(req.user.id);
    res.json({ updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};