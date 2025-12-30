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
  try {
    return await Notification.find({
      'receiver.id': userId,
      'receiver.type': userRole
    })
    .sort({ createdAt: -1 })
    .populate({
      path: 'sender.id',
      select: 'firstName lastName name logo avatar'
    })
    .populate({
      path: 'entity.id',
      // On force Mongoose à regarder dans JobOffer si le type est lié à un job
      model: 'JobOffer', 
      strictPopulate: false 
    });
  } catch (error) {
    console.error("Erreur Notifications:", error.message);
    return []; // Retourne un tableau vide au lieu de faire planter le serveur
  }
};
exports.getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ 'receiver.id': userId, isRead: false });
};

exports.markAllAsRead = async (userId) => {
  const res = await Notification.updateMany({ 'receiver.id': userId, isRead: false }, { isRead: true });
  return res.nModified || res.modifiedCount || 0;
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