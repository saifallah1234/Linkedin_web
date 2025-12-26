const Connection = require('../models/Connection.model');
const User = require('../models/User.model'); // To verify user exists

// --- 1. Send a Connection Request ---
exports.sendConnectionRequest = async (req, res) => {
  try {
    const requesterId = req.user.id;      // Me
    const receiverId = req.params.userId; // The person I want to connect with

    // A. Prevent connecting to self
    if (requesterId === receiverId) {
      return res.status(400).json({ message: "You cannot connect with yourself." });
    }

    // B. Check if Receiver exists
    const receiverExists = await User.findById(receiverId);
    if (!receiverExists) {
      return res.status(404).json({ message: "User not found." });
    }

    // C. Check if connection already exists (using your DB index logic)
    // We check for BOTH directions: A->B or B->A
    const existingConnection = await Connection.findOne({
      $or: [
        { requesterId, receiverId },
        { requesterId: receiverId, receiverId: requesterId }
      ]
    });

    if (existingConnection) {
      if (existingConnection.status === 'PENDING') {
        return res.status(400).json({ message: "Connection request already pending." });
      }
      if (existingConnection.status === 'ACCEPTED') {
        return res.status(400).json({ message: "You are already connected." });
      }
      // If REJECTED, you might want to allow re-sending or block it. 
      // For now, we block to avoid spam.
      return res.status(400).json({ message: "Connection request was previously rejected." });
    }

    // D. Create the Request
    const newConnection = await Connection.create({
      requesterId,
      receiverId,
      status: 'PENDING'
    });

    res.status(201).json({ message: "Connection request sent", connection: newConnection });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// --- 2. Accept or Reject Request ---
// We use one function for both actions to keep code clean
exports.respondToRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { action } = req.body; // Expecting { "action": "ACCEPTED" } or "REJECTED"
    const currentUserId = req.user.id;

    // A. Validate Action
    if (!['ACCEPTED', 'REJECTED'].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Use ACCEPTED or REJECTED." });
    }

    // B. Find the Connection
    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: "Connection request not found." });
    }

    // C. SECURITY: Ensure ONLY the Receiver can accept/reject
    if (connection.receiverId.toString() !== currentUserId) {
      return res.status(403).json({ message: "You are not authorized to respond to this request." });
    }

    // D. Check status
    if (connection.status !== 'PENDING') {
      return res.status(400).json({ message: `Request is already ${connection.status.toLowerCase()}` });
    }

    // E. Update Status
    connection.status = action;
    connection.respondedAt = new Date();
    await connection.save();

    res.json({ message: `Connection request ${action.toLowerCase()}.`, connection });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// --- 3. Get My Pending Requests (Inbox) ---
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await Connection.find({
      receiverId: req.user.id,
      status: 'PENDING'
    }).populate('requesterId', 'firstName lastName image location role'); // Show who sent it

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 4. Get My Connected Users (Friends List) ---
exports.getMyConnections = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all connections where status is ACCEPTED and user is either Sender OR Receiver
        const connections = await Connection.find({
            $or: [{ requesterId: userId }, { receiverId: userId }],
            status: 'ACCEPTED'
        })
        .populate('requesterId', 'firstName lastName image')
        .populate('receiverId', 'firstName lastName image');

        // Transform data to return only the "Other" person
        const friendList = connections.map(conn => {
            const isRequester = conn.requesterId._id.toString() === userId;
            return isRequester ? conn.receiverId : conn.requesterId;
        });

        res.json(friendList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}