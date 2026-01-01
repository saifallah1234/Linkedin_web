import api from '../api/axios';

const connectionService = {
  // --- 1. Send a Connection Request ---
  // POST /api/connections/request/:userId
  sendRequest: async (userId) => {
    return api.post(`/connections/request/${userId}`);
  },

  // --- 2. Respond to Request (Accept/Reject) ---
  
  // Generic method: PUT /api/connections/respond/:connectionId
  respondToRequest: async (connectionId, action) => {
    // action must be 'ACCEPTED' or 'REJECTED'
    return api.put(`/connections/respond/${connectionId}`, { action });
  },

  // Helper: Accept
  acceptRequest: async (connectionId) => {
    return api.put(`/connections/respond/${connectionId}`, { action: 'ACCEPTED' });
  },

  // Helper: Reject
  rejectRequest: async (connectionId) => {
    return api.put(`/connections/respond/${connectionId}`, { action: 'REJECTED' });
  },

  // --- 3. Get Pending Requests (Inbox) ---
  // GET /api/connections/pending
  getPendingRequests: async () => {
    return api.get('/connections/pending');
  },

  // --- 4. Get My Friends List ---
  // GET /api/connections/
  getMyConnections: async () => {
    return api.get('/connections');
  },

  // --- 5. Disconnect (Unfriend) ---
  // DELETE /api/connections/disconnect/:userId
  disconnect: async (userId) => {
    return api.delete(`/connections/disconnect/${userId}`);
  }
};

export default connectionService;