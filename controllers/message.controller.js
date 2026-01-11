const messageService = require('../services/message.service');

exports.send = async (req, res) => {
    try {
        console.log('=== CONTROLLER ===');
        console.log('req.user.id:', req.user.id);
        console.log('req.body.receiverId:', req.body.receiverId);
        console.log('req.body.receiverType:', req.body.receiverType); // Add this log
        console.log('req.body.content:', req.body.content);
        console.log('req.body.attachments:', req.body.attachments);
        
        const { receiverId, receiverType, content, attachments } = req.body; // Add receiverType
        
        // receiverId should already be converted to ObjectId by middleware
        const msg = await messageService.sendMessage(
            { id: req.user.id, type: req.user.type },
            { id: receiverId, type: receiverType }, // Now receiverType is defined
            content || "", 
            attachments || []
        );
        
        console.log('Message created:', msg._id);
        res.status(201).json(msg);
    } catch (err) {
        console.log('Controller error:', err.message);
        res.status(400).json({ message: err.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const history = await messageService.getChatHistory(req.user.id, req.params.userId);
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getInbox = async (req, res) => {
    try {
        const conversations = await messageService.getConversations(req.user.id);
        res.json(conversations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const otherUserId = req.params.userId;
        
        await messageService.deleteConversation(userId, otherUserId);
        res.status(200).json({ message: 'Conversation deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};