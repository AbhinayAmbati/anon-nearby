import mongoose from 'mongoose';

const fileDropRoomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    default: 'Unnamed Room'
  },
  password: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  proximityRadius: {
    type: Number,
    default: 1000, // meters
    min: 0
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  createdBy: {
    type: String, // Anonymous session ID
    required: true
  },
  files: [{
    name: String,
    size: Number,
    type: { type: String }, // Explicitly define field named 'type'
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: String // Anonymous session ID
  }],
  accessLog: [{
    sessionId: String,
    accessedAt: {
      type: Date,
      default: Date.now
    },
    action: String // 'joined', 'uploaded', 'downloaded'
  }]
}, {
  timestamps: true
});

// Geospatial index for location-based queries
fileDropRoomSchema.index({ location: '2dsphere' });

// TTL index to auto-delete expired rooms
fileDropRoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if user is within proximity
fileDropRoomSchema.methods.isWithinProximity = function(userLat, userLon) {
  if (this.proximityRadius === 0) {
    return true; // Password-only access
  }
  
  const [roomLon, roomLat] = this.location.coordinates;
  const distance = calculateDistance(userLat, userLon, roomLat, roomLon);
  return distance <= this.proximityRadius;
};

// Helper function to calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

const FileDropRoom = mongoose.model('FileDropRoom', fileDropRoomSchema);

export default FileDropRoom;
