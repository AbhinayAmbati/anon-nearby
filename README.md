# ANON-NEARBY

A location-based anonymous chat application that connects strangers within proximity for ephemeral conversations and secure file sharing. Because sometimes you want to talk to someone nearby without the commitment of actually meeting them.

## Overview

ANON-NEARBY provides anonymous, real-time chat functionality between users within a 1000-meter radius. Each user receives a randomly generated codename and can engage in temporary conversations that disappear when the session ends. It's designed for spontaneous, commitment-free interaction with nearby individuals.

New in v2.0: **Ephemeral File Relay** allows users to securely share files with nearby users or via one-time codes without any server-side storage.

## Core Functionality

The application assigns users creative codenames like "CipherNode_42" or "VectorStar_73" to maintain anonymity while adding personality. Using geolocation services, it identifies other active users within proximity and facilitates instant chat connections through an intelligent matchmaking system.

Conversations are completely ephemeral - once either participant disconnects, all messages are permanently deleted. No history is maintained, ensuring true anonymity and privacy. All conversations are protected by AI-powered content moderation to maintain a safe and respectful environment.

**Smart Matchmaking Engine**: Advanced algorithm uses distance-based ranking, wait-time scoring, compatibility analysis, and freshness scoring to create optimal connections between users. The system considers multiple factors including search radius compatibility, behavioral patterns, and connection history to enhance match quality.

**AI-Powered Content Moderation**: Real-time message filtering using Google's Gemini AI and pattern recognition to detect inappropriate content, harassment, spam, and abusive language. Progressive enforcement system provides warnings, temporary restrictions, and escalating penalties for policy violations.

**Ephemeral File Relay**: A secure, serverless-like file transfer system. Files are encrypted client-side using the Web Crypto API before being relayed in chunks through the server. The server never sees the original file or the encryption keys, ensuring complete privacy.

## Technical Stack

### Frontend Architecture
Built with Nuxt.js for a modern Vue-based single-page application. Features a Matrix-inspired terminal aesthetic with green-on-black theming and fully responsive design optimized for mobile, tablet, and desktop experiences. Uses the **Web Crypto API** for client-side encryption/decryption of file transfers.

### Backend Infrastructure
Node.js with Express framework provides the server foundation, while Socket.IO enables real-time bidirectional communication for instant messaging capabilities.

### Data Storage
MongoDB handles session and chat room persistence with Redis powering geospatial queries for location-based user matching. Both systems include in-memory fallbacks to ensure reliability when external services are unavailable.

### Location Services
Utilizes Redis GEO commands for efficient proximity searches within the configured radius. The system continuously monitors for nearby users and facilitates automatic matching when compatible users are detected.

## Key Features

**Anonymous Sessions**: No registration, accounts, or personal information required. Users are identified only by temporary codenames during active sessions.

**Smart Proximity Matching**: Intelligent algorithm discovers and connects users within customizable radius (500m-5km) using multi-factor scoring including distance, wait-time, compatibility, and freshness.

**AI Content Moderation**: Real-time message analysis using Google Gemini AI to detect and prevent inappropriate content, harassment, spam, and abusive language. Progressive enforcement with warnings, shadow bans, and temporary restrictions.

**Real-Time Communication**: Instant message delivery with Socket.IO for responsive chat experiences, including typing indicators and connection status.

**Ephemeral File Relay**: Securely share files with nearby users or via a 6-digit code. Files are encrypted on your device, relayed through the server in chunks, and decrypted only by the recipient. No files are ever stored on the server.

**Ephemeral Conversations**: All chat data is automatically purged when sessions end, ensuring complete privacy and no permanent records.

**Responsive Interface**: Optimized user experience across desktop, tablet, and mobile devices with touch-friendly controls and Matrix-inspired design.

**Fallback Systems**: Redundant storage mechanisms ensure functionality even when primary database services experience issues.

**Progressive Safety Measures**: Anonymous abuse detection using Redis TTL counters, behavioral analysis, and escalating penalties without compromising user privacy.

## Design Philosophy

**Privacy by Design**: No data persistence, user tracking, or personal information collection. Anonymous interaction is the core principle.

**Simplicity**: Streamlined interface focused on essential chat functionality without unnecessary features or complexity.

**Spontaneity**: Facilitates unexpected connections with nearby individuals, encouraging serendipitous conversations.

**Minimal Friction**: No registration barriers, profile creation, or setup requirements that might discourage usage.

## Installation and Setup

### Prerequisites
Node.js (version 14 or higher) is required for both frontend and backend components.

### Backend Configuration
```bash
cd backend
npm install
npm start
```

The server runs on port 3001 by default.

### Frontend Configuration
```bash
cd frontend
npm install
npm run dev
```

The frontend development server runs on port 3000 and automatically connects to the backend.

### Environment Configuration
Create a `.env` file in the backend directory with your database connection strings:

```env
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
LOCATION_RADIUS=1000
CHAT_TIMEOUT_MINUTES=10
```

**Required Services**:
- **MongoDB**: Session and chat room management (with in-memory fallback)
- **Redis**: Geospatial queries, smart matchmaking queues, and abuse detection counters
- **Google Gemini AI**: Content moderation and abuse detection (optional - falls back to pattern matching)

If database connections fail, the application automatically falls back to in-memory storage for development and testing.

## Application Workflow

1. **Session Initialization**: User accesses the application and receives a randomly generated codename for anonymous identification.

2. **Location Permission**: Application requests geolocation access to determine user's current coordinates.

3. **Proximity Scanning**: Backend continuously searches for other active users within the configured radius using Redis geospatial queries.

4. **Automatic Matching**: When compatible users are found, they are instantly connected to a private chat room.

5. **Real-Time Communication**: Users can exchange messages through Socket.IO-powered real-time messaging.

6. **Session Termination**: When either user disconnects, the chat room and all associated data are immediately destroyed.

## Technical Implementation Details

### Message Flow Architecture - Zero Persistence Design

**Real-Time WebSocket Communication**: Messages are delivered through Socket.IO rooms without any database storage. Here's the complete flow:

1. **Frontend Message Send**:
   ```javascript
   socket.emit('send_message', { message: "Hello!" })
   ```

2. **Backend Processing**:
   - Validates user is in active chat room
   - Applies rate limiting to prevent spam
   - Creates message object with metadata (codename, timestamp, sessionId)
   - **NEVER stores message in database**

3. **Real-Time Broadcast**:
   ```javascript
   io.to(chatRoomId).emit('message_received', messageData)
   ```
   - Broadcasts to ALL participants in the room instantly
   - Uses Socket.IO rooms for efficient message routing
   - No API calls or polling required

4. **Client Reception**:
   - Message appears immediately in chat interface
   - Stored only in browser memory (messages.value array)
   - Auto-scrolls to show latest message

**Key Privacy Features**:
- **Zero Database Persistence**: Messages exist only during active sessions
- **Memory-Only Storage**: No permanent records created anywhere
- **Instant Destruction**: All data deleted when chat ends
- **Browser Refresh = Data Loss**: Intentional privacy feature
- **No Message History**: Cannot retrieve past conversations

### File Drop Architecture - Ephemeral Relay

The File Drop feature uses a unique "relay-only" approach to ensure privacy and security:

1.  **Client-Side Encryption**:
    *   Files are read as `ArrayBuffer` in the browser.
    *   A symmetric key (AES-GCM) is derived from a shared secret (the 6-digit code or quantized location coordinates).
    *   The file is encrypted *before* it leaves the sender's device.

2.  **Chunked Relay**:
    *   The encrypted file is split into small chunks (e.g., 64KB).
    *   Chunks are emitted to the server via `socket.emit('file_chunk')`.
    *   The server immediately relays the chunk to the recipient in the same room (`socket.to(roomId).emit('file_chunk_received')`).
    *   **Crucially, the server does not store the file or the chunks.** It acts purely as a pipe.

3.  **Client-Side Decryption**:
    *   The recipient receives encrypted chunks.
    *   Chunks are decrypted immediately using the same derived key.
    *   The file is reassembled in the browser's memory and made available for download.

### Data Flow Summary
```
User A Types → Socket.IO → Backend Validation → Room Broadcast → User B Receives
     ↓                                                              ↑
Memory Only                                                   Memory Only
(No Database)                                               (No Database)
```

**Session Management**: Unique session identifiers and codenames are generated for each user connection, with automatic cleanup upon disconnection.

**Geolocation Processing**: HTML5 Geolocation API captures client coordinates, while Redis GEORADIUS commands handle server-side proximity calculations.

**Redundancy Systems**: Automatic fallback to in-memory storage when external databases are unavailable, ensuring consistent functionality.

**Performance Optimization**: Efficient polling mechanisms and connection management to handle multiple concurrent users without performance degradation.

**Cross-Platform Compatibility**: Modern web standards ensure functionality across current browsers and mobile devices.

## Browser Support

Compatible with all modern browsers that support current JavaScript standards and geolocation APIs. Optimized for Chrome, Firefox, Safari, and Edge.

## Contributing

Contributions are welcome through pull requests. Please ensure code quality and include appropriate documentation for new features or bug fixes.

## License

Released under the MIT License. This allows for modification, distribution, and private use while requiring attribution.

## Privacy and Security Notice

This application processes location data for proximity matching purposes only. Message content is analyzed by AI systems (Google Gemini) for safety and moderation purposes, but no personal information is stored or linked to users. All processing is anonymous using hashed identifiers.

**Data Processing**:
- Location coordinates are used only for proximity matching
- Messages are analyzed by AI for content moderation in real-time
- No personal information, message history, or user profiles are stored
- All tracking uses anonymous hashes with automatic expiration
- Abuse detection operates on behavioral patterns without identity storage

Users should exercise caution when sharing personal information during conversations. The developers assume no responsibility for user interactions or privacy decisions.

## Development Status

This project serves as a demonstration of real-time, location-based communication technologies. While functional, it should be considered experimental software. For production use, additional security hardening and scalability improvements would be recommended.

## Contact and Support

This is an open-source project provided as-is. Community support is available through the repository's issue tracking system, though response times may vary based on developer availability.