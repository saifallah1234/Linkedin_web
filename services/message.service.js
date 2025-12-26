const Message = require('../models/Message.model');
const Notification = require('../models/Notification.model');

// Send a message
exports.sendMessage = async (senderId, receiverId, content, attachments = []) => {
    const message = await Message.create({
        senderId,
        receiverId,
        content,
        attachments
    });

    // Create a notification for the receiver
    await Notification.create({
        recipient: receiverId,
        sender: senderId,
        type: 'MESSAGE',
        isRead: false
    });

    return message;
};

// Get history between two users
exports.getChatHistory = async (user1, user2) => {
    // Mark messages as read when history is opened
    await Message.updateMany(
        { senderId: user2, receiverId: user1, isRead: false },
        { $set: { isRead: true } }
    );

    return await Message.find({
        $or: [
            { senderId: user1, receiverId: user2 },
            { senderId: user2, receiverId: user1 }
        ]
    }).sort({ createdAt: 1 }); // Oldest to newest for chat flow
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
    // Note: You can add a $lookup stage here to populate user details (name, avatar)
};