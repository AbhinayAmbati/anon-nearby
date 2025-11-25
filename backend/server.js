import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { setupSocketHandlers } from './socket/socketHandlers.js';
import userRoutes from './routes/userRoutes.js';
import fileDropRoutes from './routes/fileDropRoutes.js';
import { 
  generalLimiter, 
  strictLimiter, 
  socketConnectionLimiter 
} from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "DELETE"]
  }
});

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL],
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for file uploads

// Rate limiting middleware
app.use('/api/', generalLimiter);
app.use('/api/auth/', strictLimiter);
app.use(socketConnectionLimiter);

// Connect to databases
await connectDatabase();
const redisClient = await connectRedis();

// Make redisClient available to routes
app.locals.redisClient = redisClient;

// Routes
app.use('/api/users', userRoutes);
app.use('/api/file-drop', fileDropRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO setup
setupSocketHandlers(io, redisClient);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🟩 Anon-Nearby Server running on port ${PORT}`);
  console.log(`🟩 Socket.IO enabled with CORS for ${process.env.FRONTEND_URL}`);
  console.log(`🟩 File Drop API available at /api/file-drop`);
});

export { io, redisClient };