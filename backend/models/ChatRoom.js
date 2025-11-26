import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  roomType: {
    type: String,
    enum: ['proximity', 'named', 'public'],
    default: 'proximity'
  },
  roomName: {
    type: String,
    default: null
  },
  creatorSessionId: {
    type: String,
    default: null
  },
  location: {
    type: {
      latitude: Number,
      longitude: Number
    },
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
    expires: 3600
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('ChatRoom', chatRoomSchema);