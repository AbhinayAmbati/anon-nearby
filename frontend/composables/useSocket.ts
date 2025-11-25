import { io, Socket } from 'socket.io-client'

interface LocationData {
  latitude: number
  longitude: number
}

interface SessionData {
  sessionId: string
  codename: string
  status: string
}

interface ConnectionData {
  roomId: string
  status: string
  partnerCodename: string
}

interface MessageData {
  message: string
  from: string
  timestamp: string
}

class SocketService {
  private socket: Socket | null = null
  private callbacks: { [event: string]: Function[] } = {}

  connect(socketUrl: string): Socket {
    if (this.socket?.connected) {
      return this.socket
    }

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    })

    // Set up event listeners
    this.socket.on('connect', () => {
      console.log('🟩 Connected to server')
      this.emit('connected')
    })

    this.socket.on('disconnect', () => {
      console.log('🔴 Disconnected from server')
      this.emit('disconnected')
    })

    this.socket.on('session_created', (data: SessionData) => {
      console.log('🟩 Session created:', data.codename)
      this.emit('session_created', data)
    })

    this.socket.on('connection_established', (data: ConnectionData) => {
      console.log('🔗 Connection established with:', data.partnerCodename)
      this.emit('connection_established', data)
    })

    this.socket.on('message_received', (data: MessageData) => {
      console.log('💬 Message received from:', data.from)
      this.emit('message_received', data)
    })

    this.socket.on('message_blocked', (data: any) => {
      console.warn('🚫 Message blocked:', data.message)
      this.emit('message_blocked', data)
    })

    this.socket.on('temporarily_muted', (data: any) => {
      console.warn('🔇 Temporarily muted:', data.message)
      this.emit('temporarily_muted', data)
    })

    this.socket.on('partner_disconnected', (data: any) => {
      console.log('🔴 Partner disconnected')
      this.emit('partner_disconnected', data)
    })


    // File Drop Events
    this.socket.on('user_joined_drop_room', (data: any) => {
      console.log('👤 User joined drop room:', data.socketId)
      this.emit('user_joined_drop_room', data)
    })

    this.socket.on('file_chunk_received', (data: any) => {
      // Don't log every chunk to avoid console spam
      if (data.chunkIndex === 0 || data.chunkIndex === data.totalChunks - 1) {
        console.log(`📂 File chunk received: ${data.fileName} (${data.chunkIndex + 1}/${data.totalChunks})`)
      }
      this.emit('file_chunk_received', data)
    })

    this.socket.on('file_drop_room_closed', (data: any) => {
      console.log('🛑 File drop room closed:', data.reason)
      this.emit('file_drop_room_closed', data)
    })

    this.socket.on('user_left_drop_room', (data: any) => {
      console.log('👤 User left drop room:', data.socketId)
      this.emit('user_left_drop_room', data)
    })

    this.socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error)
      this.emit('error', error)
    })

    return this.socket
  }

  joinGrid(location: LocationData) {
    if (this.socket) {
      this.socket.emit('join_grid', location)
    }
  }

  sendMessage(message: string) {
    if (this.socket) {
      this.socket.emit('send_message', { message })
    }
  }

  leaveGrid() {
    if (this.socket) {
      this.socket.emit('leave_grid')
    }
  }

  // --- File Drop Methods ---

  joinFileDropRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('join_file_drop_room', { roomId })
    }
  }

  leaveFileDropRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('leave_file_drop_room', { roomId })
    }
  }

  sendFileChunk(data: any) {
    if (this.socket) {
      this.socket.emit('file_chunk', data)
    }
  }

  on(event: string, callback: Function) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = []
    }
    this.callbacks[event].push(callback)
  }

  off(event: string, callback?: Function) {
    if (callback && this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback)
    } else {
      this.callbacks[event] = []
    }
  }

  private emit(event: string, ...args: any[]) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(...args))
    }
  }
}

export const socketService = new SocketService()
export type { LocationData, SessionData, ConnectionData, MessageData }