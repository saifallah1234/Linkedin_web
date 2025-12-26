const messageService = require('../services/message.service');

exports.send = async (req, res) => {
    try {
        const { receiverId, content, attachments } = req.body;
        const msg = await messageService.sendMessage(req.user.id, receiverId, content, attachments);
        res.status(201).json(msg);
    } catch (err) {
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