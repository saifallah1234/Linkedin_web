import api from '../api/axios';

const messageService = {
  // --- 1. Send Message (Text + Optional Files) ---
  // POST /api/messages
  sendMessage: async (receiverId, content, files = []) => {
    // Because we support file uploads, we MUST use FormData
    const formData = new FormData();
    
    // Append simple fields
    formData.append('receiverId', receiverId);
    formData.append('content', content);
    
    // Append files (if any)
    // Note: The key 'files' matches your router's upload.array('files', 5)
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });
    }

    return api.post('/messages', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // --- 2. Get Inbox (List of Conversations) ---
  // GET /api/messages/conversations
  getInbox: async () => {
    return api.get('/messages/conversations');
  },

  // --- 3. Get Chat History with specific User ---
  // GET /api/messages/:userId
  getChatHistory: async (userId) => {
    return api.get(`/messages/${userId}`);
  },

  // --- 4. Delete Conversation ---
  // DELETE /api/messages/:userId
  deleteConversation: async (userId) => {
    return api.delete(`/messages/${userId}`);
  }
};

export default messageService;