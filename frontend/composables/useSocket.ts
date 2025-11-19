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

    this.socket.on('partner_disconnected', (data) => {
      console.log('🔴 Partner disconnected')
      this.emit('partner_disconnected', data)
    })

    this.socket.on('error', (error) => {
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

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
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