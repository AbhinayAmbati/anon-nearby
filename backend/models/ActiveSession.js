import mongoose from 'mongoose';

const activeSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  codename: {
    type: String,
    required: true
  },
  socketId: {
    type: String,
    required: true
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  chatRoomId: {
    type: String,
    default: null
  },
  connectedWith: {
    type: String,
    default: null
  },
  searchMode: {
    type: String,
    enum: ['proximity', 'public', 'private'],
    default: 'proximity'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Auto-delete after 1 hour
  }
});

// Index for location-based queries
activeSessionSchema.index({ location: '2dsphere' });
activeSessionSchema.index({ socketId: 1 });

export default mongoose.model('ActiveSession', activeSessionSchema);