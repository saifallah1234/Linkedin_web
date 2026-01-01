import api from '../api/axios';

const notificationService = {
  // --- 1. Get List of Notifications ---
  // GET /api/notifications?page=1&limit=20
  getNotifications: async (page = 1, limit = 20) => {
    return api.get('/notifications', {
      params: { page, limit }
    });
  },

  // --- 2. Get Unread Count ---
  // GET /api/notifications/unread/count
  // Useful for showing the red badge on the navbar bell icon
  getUnreadCount: async () => {
    return api.get('/notifications/unread/count');
  },

  // --- 3. Mark Single Notification as Read ---
  // PUT /api/notifications/:id/read
  markAsRead: async (notificationId) => {
    return api.put(`/notifications/${notificationId}/read`);
  },

  // --- 4. Mark ALL as Read ---
  // PUT /api/notifications/read-all
  markAllAsRead: async () => {
    return api.put('/notifications/read-all');
  }
};

export default notificationService;