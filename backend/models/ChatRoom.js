import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  participants: [{
    sessionId: String,
    codename: String,
    socketId: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Auto-delete after 1 hour
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('ChatRoom', chatRoomSchema);