import mongoose from 'mongoose';

const fileDropFileSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    index: true
  },
  encryptedData: {
    type: String,
    required: true
  }
}, { timestamps: true });

const FileDropFile = mongoose.model('FileDropFile', fileDropFileSchema);

export default FileDropFile;
