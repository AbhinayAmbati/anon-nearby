import express from 'express';
import FileDropRoom from '../models/FileDropRoom.js';
import FileDropFile from '../models/FileDropFile.js';
import crypto from 'crypto';

const router = express.Router();

// Generate unique room code
function generateRoomCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// Create a new file drop room
router.post('/create', async (req, res) => {
  try {
    const { 
      name, 
      password, 
      latitude, 
      longitude, 
      proximityRadius = 1000, 
      expirationMinutes = 60,
      sessionId 
    } = req.body;

    // Validation
    if (!password || !latitude || !longitude || !sessionId) {
      return res.status(400).json({ 
        error: 'Missing required fields: password, latitude, longitude, sessionId' 
      });
    }

    // Generate unique room code
    let code;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      code = generateRoomCode();
      const existing = await FileDropRoom.findOne({ code });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Failed to generate unique room code' });
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    // Create room
    const room = new FileDropRoom({
      code,
      name: name || 'Unnamed Room',
      password,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude] // GeoJSON format: [lon, lat]
      },
      proximityRadius: parseInt(proximityRadius),
      expiresAt,
      createdBy: sessionId,
      files: [],
      accessLog: [{
        sessionId,
        action: 'created',
        accessedAt: new Date()
      }]
    });

    await room.save();

    res.status(201).json({
      success: true,
      room: {
        code: room.code,
        name: room.name,
        expiresAt: room.expiresAt,
        proximityRadius: room.proximityRadius
      }
    });

  } catch (error) {
    console.error('Error creating file drop room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Join a file drop room
router.post('/join', async (req, res) => {
  try {
    const { code, password, latitude, longitude, sessionId } = req.body;

    if (!code || !password || !sessionId) {
      return res.status(400).json({ 
        error: 'Missing required fields: code, password, sessionId' 
      });
    }

    // Find room
    const room = await FileDropRoom.findOne({ code });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if room has expired
    if (room.expiresAt < new Date()) {
      return res.status(410).json({ error: 'Room has expired' });
    }

    // Verify password
    if (room.password !== password) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Check proximity if required
    if (room.proximityRadius > 0 && latitude && longitude) {
      const isWithinProximity = room.isWithinProximity(latitude, longitude);
      
      if (!isWithinProximity) {
        return res.status(403).json({ 
          error: 'You are not within the required proximity to access this room' 
        });
      }
    }

    // Log access
    room.accessLog.push({
      sessionId,
      action: 'joined',
      accessedAt: new Date()
    });
    await room.save();

    // Return room info and files (without encrypted data initially)
    const files = room.files.map(file => ({
      id: file._id,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: file.uploadedAt
    }));

    res.json({
      success: true,
      room: {
        code: room.code,
        name: room.name,
        expiresAt: room.expiresAt,
        filesCount: files.length,
        files
      }
    });

  } catch (error) {
    console.error('Error joining file drop room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Upload file to room
router.post('/upload', async (req, res) => {
  try {
    const { code, password, sessionId, file } = req.body;

    if (!code || !password || !sessionId || !file) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    // Find and verify room
    const room = await FileDropRoom.findOne({ code });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.expiresAt < new Date()) {
      return res.status(410).json({ error: 'Room has expired' });
    }

    if (room.password !== password) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Check file size limit (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return res.status(413).json({ error: 'File too large (max 10MB)' });
    }

    // Check total room size limit (50MB)
    const totalSize = room.files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize + file.size > 50 * 1024 * 1024) {
      return res.status(413).json({ error: 'Room storage limit exceeded' });
    }

    // Create file document for heavy data
    const fileDoc = new FileDropFile({
      roomCode: room.code,
      encryptedData: file.encryptedData
    });
    await fileDoc.save();

    // Add metadata to room
    room.files.push({
      _id: fileDoc._id, // Use same ID
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      uploadedBy: sessionId
    });

    // Log upload
    room.accessLog.push({
      sessionId,
      action: 'uploaded',
      accessedAt: new Date()
    });

    await room.save();

    res.json({
      success: true,
      message: 'File uploaded successfully',
      filesCount: room.files.length
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Download file from room
router.post('/download', async (req, res) => {
  try {
    const { code, password, sessionId, fileId } = req.body;

    if (!code || !password || !sessionId || !fileId) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    // Find and verify room
    const room = await FileDropRoom.findOne({ code });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.expiresAt < new Date()) {
      return res.status(410).json({ error: 'Room has expired' });
    }

    if (room.password !== password) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Find file metadata
    const fileMeta = room.files.id(fileId);

    if (!fileMeta) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Find actual file data
    const fileData = await FileDropFile.findById(fileId);

    if (!fileData) {
      return res.status(404).json({ error: 'File data not found' });
    }

    // Log download
    room.accessLog.push({
      sessionId,
      action: 'downloaded',
      accessedAt: new Date()
    });
    await room.save();

    // Return file data
    res.json({
      success: true,
      file: {
        name: fileMeta.name,
        size: fileMeta.size,
        type: fileMeta.type,
        encryptedData: fileData.encryptedData,
        uploadedAt: fileMeta.uploadedAt
      }
    });

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Get room info (without password verification, for public info)
router.get('/info/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const room = await FileDropRoom.findOne({ code }).select('-password -files.encryptedData -accessLog');

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.expiresAt < new Date()) {
      return res.status(410).json({ error: 'Room has expired' });
    }

    res.json({
      success: true,
      room: {
        code: room.code,
        name: room.name,
        expiresAt: room.expiresAt,
        proximityRadius: room.proximityRadius,
        filesCount: room.files.length
      }
    });

  } catch (error) {
    console.error('Error getting room info:', error);
    res.status(500).json({ error: 'Failed to get room info' });
  }
});

// Delete file from room (only by uploader or room creator)
router.delete('/file', async (req, res) => {
  try {
    const { code, password, sessionId, fileId } = req.body;

    if (!code || !password || !sessionId || !fileId) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    const room = await FileDropRoom.findOne({ code });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.password !== password) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const file = room.files.id(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Only allow deletion by uploader or room creator
    if (file.uploadedBy !== sessionId && room.createdBy !== sessionId) {
      return res.status(403).json({ error: 'Not authorized to delete this file' });
    }

    // Delete from FileDropFile
    await FileDropFile.findByIdAndDelete(fileId);

    // Remove from room
    room.files.pull(fileId);
    await room.save();

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Delete room (only by creator)
router.delete('/room', async (req, res) => {
  try {
    const { code, password, sessionId } = req.body;

    if (!code || !password || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const room = await FileDropRoom.findOne({ code });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.password !== password) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    if (room.createdBy !== sessionId) {
      return res.status(403).json({ error: 'Not authorized to delete this room' });
    }

    // Delete all associated files
    await FileDropFile.deleteMany({ roomCode: code });

    // Delete room
    await FileDropRoom.deleteOne({ _id: room._id });

    res.json({ success: true, message: 'Room deleted successfully' });

  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

export default router;
