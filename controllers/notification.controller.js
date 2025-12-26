const notificationService = require('../services/notification.service');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await notificationService.getUserNotifications(
      req.user.id,
      req.user.role
    );
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