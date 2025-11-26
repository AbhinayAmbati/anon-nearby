import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  roomType: {
    type: String,
    enum: ['proximity', 'named'], // proximity = auto-matched, named = user-created
    default: 'proximity'
  },
  roomName: {
    type: String, // Human-readable name for named rooms
    default: null
  },
  creatorSessionId: {
    type: String, // Session ID of the user who created the room
    default: null
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