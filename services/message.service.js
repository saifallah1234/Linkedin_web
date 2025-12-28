const Message = require('../models/message.model');
const notificationService = require('./notification.service');
// Send a message
exports.sendMessage = async (senderId, receiverId, content, attachments = [], senderType = 'User', receiverType = 'User') => {
    
    // 1. Création du message dans la base de données
    const message = await Message.create({
        senderId,
        receiverId,
        content,
        attachments
    });

    // 2. Déclenchement automatique de la notification via votre service
    // On utilise await pour s'assurer que la logique de notification est traitée
    await notificationService.createNotification(
        { id: receiverId, type: receiverType }, // Destinataire
        { id: senderId, type: senderType },     // Expéditeur
        'message',                              // Type (doit être dans votre enum)
        { id: message._id, type: 'message' }    // Entité liée (le message lui-même)
    );

    return message;
};

// Get history between two users
exports.getChatHistory = async (user1, user2) => {

    // Mark messages as read
    await Message.updateMany(
        { senderId: user2, receiverId: user1, isRead: false },
        { $set: { isRead: true } }
    );

    return await Message.find({
        $or: [
            { senderId: user1, receiverId: user2 },
            { senderId: user2, receiverId: user1 }
        ]
    }).sort({ createdAt: 1 });
};

// Get the Conversation List (Inbox)
exports.getConversations = async (userId) => {
    return await Message.aggregate([
        {
            $match: {
                $or: [{ senderId: userId }, { receiverId: userId }]
            }
        },
        { $sort: { createdAt: -1 } },
        {
            $group: {
                _id: {
                    $cond: [
                        { $lt: ["$senderId", "$receiverId"] },
                        { u1: "$senderId", u2: "$receiverId" },
                        { u1: "$receiverId", u2: "$senderId" }
                    ]
                },
                lastMessage: { $first: "$$ROOT" }
            }
        },
        { $sort: { "lastMessage.createdAt": -1 } }
    ]);
};
