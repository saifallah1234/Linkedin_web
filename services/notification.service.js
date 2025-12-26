const Notification = require('../models/Notification.model');

/**
 * @param {Object} receiver - { id, type } ('User' or 'Company')
 * @param {Object} sender - { id, type } ('User' or 'Company')
 * @param {String} type - 'reaction', 'comment', etc.
 * @param {Object} entity - { id, type } ('Post', 'Comment', 'JobOffer')
 */
exports.createNotification = async (receiver, sender, type, entity) => {
  try {
    // Don't notify if the sender is the same as the receiver
    if (receiver.id.toString() === sender.id.toString()) return;

    return await Notification.create({
      receiver,
      sender,
      type,
      entity
    });
  } catch (error) {
    console.error("Notification Creation Error:", error);
  }
};

exports.getUserNotifications = async (userId, userRole) => {
  return await Notification.find({
    'receiver.id': userId,
    'receiver.type': userRole
  })
    .sort({ createdAt: -1 })
    .populate('sender.id', 'name logo avatar')
    .populate('entity.id');
};

exports.markAsRead = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      'receiver.id': userId
    },
    { isRead: true },
    { new: true }
  );
};