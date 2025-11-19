# ANON-NEARBY

A location-based anonymous chat application that connects strangers within proximity for ephemeral conversations. Because sometimes you want to talk to someone nearby without the commitment of actually meeting them.

## Overview

ANON-NEARBY provides anonymous, real-time chat functionality between users within a 1000-meter radius. Each user receives a randomly generated codename and can engage in temporary conversations that disappear when the session ends. It's designed for spontaneous, commitment-free interaction with nearby individuals.

## Core Functionality

The application assigns users creative codenames like "CipherNode_42" or "VectorStar_73" to maintain anonymity while adding personality. Using geolocation services, it identifies other active users within proximity and facilitates instant chat connections.

Conversations are completely ephemeral - once either participant disconnects, all messages are permanently deleted. No history is maintained, ensuring true anonymity and privacy.

## Technical Stack

### Frontend Architecture
Built with Nuxt.js for a modern Vue-based single-page application. Features a Matrix-inspired terminal aesthetic with green-on-black theming and fully responsive design optimized for mobile, tablet, and desktop experiences.

### Backend Infrastructure
Node.js with Express framework provides the server foundation, while Socket.IO enables real-time bidirectional communication for instant messaging capabilities.

### Data Storage
MongoDB handles session and chat room persistence with Redis powering geospatial queries for location-based user matching. Both systems include in-memory fallbacks to ensure reliability when external services are unavailable.

### Location Services
Utilizes Redis GEO commands for efficient proximity searches within the configured radius. The system continuously monitors for nearby users and facilitates automatic matching when compatible users are detected.

## Key Features

**Anonymous Sessions**: No registration, accounts, or personal information required. Users are identified only by temporary codenames during active sessions.

**Proximity-Based Matching**: Automatically discovers and connects users within a 1000-meter radius using precise geolocation services.

**Real-Time Communication**: Instant message delivery with Socket.IO for responsive chat experiences.

**Ephemeral Conversations**: All chat data is automatically purged when sessions end, ensuring complete privacy and no permanent records.

**Responsive Interface**: Optimized user experience across desktop, tablet, and mobile devices with touch-friendly controls.

**Fallback Systems**: Redundant storage mechanisms ensure functionality even when primary database services experience issues.

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
LOCATION_RADIUS=1000
```

If database connections fail, the application automatically falls back to in-memory storage for development and testing.

## Application Workflow

1. **Session Initialization**: User accesses the application and receives a randomly generated codename for anonymous identification.

2. **Location Permission**: Application requests geolocation access to determine user's current coordinates.

3. **Proximity Scanning**: Backend continuously searches for other active users within the configured radius using Redis geospatial queries.

4. **Automatic Matching**: When compatible users are found, they are instantly connected to a private chat room.

5. **Real-Time Communication**: Users can exchange messages through Socket.IO-powered real-time messaging.

6. **Session Termination**: When either user disconnects, the chat room and all associated data are immediately destroyed.

## Technical Implementation Details

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

This application processes location data for proximity matching purposes only. Users should exercise caution when sharing personal information during conversations. The developers assume no responsibility for user interactions or privacy decisions.

## Development Status

This project serves as a demonstration of real-time, location-based communication technologies. While functional, it should be considered experimental software. For production use, additional security hardening and scalability improvements would be recommended.

## Contact and Support

This is an open-source project provided as-is. Community support is available through the repository's issue tracking system, though response times may vary based on developer availability.