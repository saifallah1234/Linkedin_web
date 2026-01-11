const Message = require('../models/message.model');
const Notification = require('../models/notification.model');
const User = require('../models/User.model');
const Company = require('../models/Company.model');
const mongoose = require("mongoose");


// Send a message
// exports.sendMessage = async (senderId, receiverId, content, attachments = []) => {
//     const message = await Message.create({
//         senderId,
//         receiverId,
//         content,
//         attachments
//     });

//     // Create a notification for the receiver - FIXED PARAMETERS
//     try {
//         await Notification.create({
//             receiver: {
//                 id: receiverId,
//                 type: receiver.type // Assuming both sender and receiver are Users for messages
//             },
//             sender: {
//                 id: senderId,
//                 type: sender.type
//             },
//             type: 'MESSAGE', // This should be in your Notification model enum
//             entity: {
//                 id: message._id, // The message itself
//                 type: 'Message' // This should match your Message model name
//             }
//         });
//     } catch (error) {
//         console.error("Failed to create notification:", error);
//         // Don't fail the message if notification fails
//     }

//     return message;
// };
exports.sendMessage = async (sender, receiver, content, attachments = []) => {
    const message = await Message.create({
        senderId: sender.id,
        senderType: sender.type,
        receiverId: receiver.id,
        receiverType: receiver.type,
        content,
        attachments
    });

        // Create a notification for the receiver - FIXED PARAMETERS
    try {
        await Notification.create({
            receiver: {
                id: receiver.id,
                type: receiver.type
            },
            sender: {
                id: sender.id,
                type: sender.type
            },
            type: 'MESSAGE',
            entity: {
                id: message._id,
                type: 'Message'
            }
            });

    } catch (error) {
        console.error("Failed to create notification:", error);
        // Don't fail the message if notification fails
    }

    return message;
};
// Get history between two users
// exports.getChatHistory = async (user1, user2) => {
//     // Mark messages as read when history is opened
//     await Message.updateMany(
//         { senderId: user2, receiverId: user1, isRead: false },
//         { $set: { isRead: true } }
//     );

//     return await Message.find({
//         $or: [
//             { senderId: user1, receiverId: user2 },
//             { senderId: user2, receiverId: user1 }
//         ]
//     }).sort({ createdAt: 1 }); // Oldest to newest for chat flow
// };

// Get the Conversation List (Inbox)
// exports.getConversations = async (userId) => {
//     return await Message.aggregate([
//         {
//             $match: {
//                 $or: [{ senderId: userId }, { receiverId: userId }]
//             }
//         },
//         { $sort: { createdAt: -1 } },
//         {
//             $group: {
//                 _id: {
//                     $cond: [
//                         { $lt: ["$senderId", "$receiverId"] },
//                         { u1: "$senderId", u2: "$receiverId" },
//                         { u1: "$receiverId", u2: "$senderId" }
//                     ]
//                 },
//                 lastMessage: { $first: "$$ROOT" }
//             }
//         },
//         { $sort: { "lastMessage.createdAt": -1 } }
//     ]);
//     // Note: You can add a $lookup stage here to populate user details (name, avatar)
// };
async function enrichMessage(message) {
  let senderDetails = null;

  if (message.senderType === 'User') {
    senderDetails = await User.findById(message.senderId)
      .select('firstName lastName image');
  } else if (message.senderType === 'Company') {
    senderDetails = await Company.findById(message.senderId)
      .select('name logo');
  }

  //  SAFE: works for both aggregate + find()
  const msgObj = message.toObject ? message.toObject() : { ...message };

  msgObj.sender = {
    id: message.senderId,
    type: message.senderType,
    details: senderDetails
  };

  return msgObj;
}

exports.getChatHistory = async (user1, user2) => {
  await Message.updateMany(
    { senderId: user2, receiverId: user1, isRead: false },
    { $set: { isRead: true } }
  );

  const messages = await Message.find({
    $or: [
      { senderId: user1, receiverId: user2 },
      { senderId: user2, receiverId: user1 }
    ]
  }).sort({ createdAt: 1 });

  return Promise.all(messages.map(enrichMessage));
};



async function getParticipant(id) {
  let user = await User.findById(id).select("firstName lastName image");
  if (user) {
    return {
      id: user._id,
      type: "User",
      details: user
    };
  }

  let company = await Company.findById(id).select("name logo");
  if (company) {
    return {
      id: company._id,
      type: "Company",
      details: company
    };
  }

  return null; // explicit
}


exports.getConversations = async (userId) => {
  const me = new mongoose.Types.ObjectId(userId);

  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ senderId: me }, { receiverId: me }]
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
    }
  ]);

  for (const conv of conversations) {
    conv.lastMessage = await enrichMessage(conv.lastMessage);

    const otherId = conv._id.u1.equals(me)
      ? conv._id.u2
      : conv._id.u1;

    conv.participant = await getParticipant(otherId);
  }

  return conversations;
};




// Delete a whole conversation between two users
exports.deleteConversation = async (userId, otherUserId) => {
    return await Message.deleteMany({
        $or: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId }
        ]
    });
};