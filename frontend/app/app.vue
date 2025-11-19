<template>
  <div id="app" class="min-h-screen bg-gray-900 text-green-400 font-mono">
    <!-- Matrix background effect -->
    <MatrixBackground />
    
    <!-- Main application states -->
    <div class="relative z-10">
      <!-- Loading State -->
      <LoadingScreen
        v-if="appState === 'loading'"
        :title="'ANON-NEARBY'"
        :message="loadingMessage"
        :progress="loadingProgress"
        :error="error"
        @retry="initializeApp"
      />
      
      <!-- Permission State -->
      <div 
        v-else-if="appState === 'permission'"
        class="flex items-center justify-center min-h-screen p-8"
      >
        <div class="text-center max-w-md">
          <div class="mb-8">
            <h1 class="text-2xl font-mono font-bold text-green-400 mb-4 tracking-widest">
              ANON-NEARBY
            </h1>
            <div class="w-16 h-16 mx-auto mb-4 border-2 border-green-400 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          
          <div class="space-y-4 text-sm">
            <p class="text-green-400/80">
              Connect anonymously with people near you.
            </p>
            <p class="text-green-400/60">
              No accounts. No history. No traces.
            </p>
          </div>
          
          <button
            @click="requestLocationPermission"
            class="mt-8 px-6 py-3 bg-transparent border border-green-400 text-green-400 hover:bg-green-400 hover:text-gray-900 transition-all duration-200 font-mono font-semibold tracking-wider"
          >
            ENTER THE GRID
          </button>
          
          <div v-if="error" class="mt-4 text-red-400 text-xs">
            {{ error }}
          </div>
        </div>
      </div>
      
      <!-- Scanning State -->
      <ScanningMode
        v-else-if="appState === 'scanning'"
        :codename="userCodename"
        :status-text="'Location acquired. Searching for nearby nodes...'"
      />
      
      <!-- Chat State -->
      <ChatInterface
        v-else-if="appState === 'chatting'"
        ref="chatComponent"
        :partner-codename="partnerCodename"
        :connected="connected"
        @disconnect="disconnectFromChat"
        @send-message="sendMessage"
      />
      
      <!-- Disconnected State -->
      <div
        v-else-if="appState === 'disconnected'"
        class="flex items-center justify-center min-h-screen p-8"
      >
        <div class="text-center max-w-md">
          <h2 class="text-xl font-mono font-bold text-green-400 mb-4">
            CONNECTION TERMINATED
          </h2>
          <p class="text-green-400/70 mb-6 text-sm">
            Your chat partner has disconnected.
          </p>
          <button
            @click="returnToScanning"
            class="px-6 py-3 bg-transparent border border-green-400 text-green-400 hover:bg-green-400 hover:text-gray-900 transition-all duration-200 font-mono font-semibold tracking-wider"
          >
            SCAN AGAIN
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// App state management
type AppState = 'loading' | 'permission' | 'scanning' | 'chatting' | 'disconnected'

const appState = ref<AppState>('loading')
const loadingMessage = ref('Initializing grid connection...')
const loadingProgress = ref(0)
const error = ref('')

// User session data
const userCodename = ref('')
const userSessionId = ref('')
const partnerCodename = ref('')
const connected = ref(false)

// Components
const chatComponent = ref()

// Runtime config
const config = useRuntimeConfig()

// Socket connection (will be initialized after dependencies install)
let socket: any = null

// Location functions
const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location access denied by user'))
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information unavailable'))
            break
          case error.TIMEOUT:
            reject(new Error('Location request timed out'))
            break
          default:
            reject(new Error('An unknown error occurred'))
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      }
    )
  })
}

onMounted(() => {
  initializeApp()
})

const initializeApp = async () => {
  appState.value = 'loading'
  error.value = ''
  loadingProgress.value = 0
  
  try {
    // Step 1: Initialize socket connection
    loadingMessage.value = 'Connecting to grid network...'
    await initializeSocket()
    loadingProgress.value = 25
    
    // Step 2: Check location support
    loadingMessage.value = 'Checking location capabilities...'
    if (!navigator.geolocation) {
      throw new Error('Location services not supported')
    }
    loadingProgress.value = 50
    
    // Step 3: Complete initialization
    loadingMessage.value = 'Grid connection established'
    loadingProgress.value = 100
    
    // Move to permission request
    setTimeout(() => {
      appState.value = 'permission'
    }, 1000)
    
  } catch (err: any) {
    error.value = err.message || 'Failed to initialize grid connection'
    loadingProgress.value = 0
  }
}

const initializeSocket = async () => {
  try {
    // Dynamic import to avoid SSR issues
    const { io } = await import('socket.io-client')
    
    // Connect to server
    socket = io(config.public.socketUrl, {
      transports: ['websocket', 'polling']
    })
    
    // Set up event listeners
    socket.on('connect', () => {
      console.log('🟩 Connected to server')
    })

    socket.on('disconnect', () => {
      console.log('🔴 Disconnected from server')
    })

    socket.on('session_created', (data: any) => {
      userSessionId.value = data.sessionId
      userCodename.value = data.codename
      appState.value = 'scanning'
      console.log('🟩 Session created:', data.codename)
    })

    socket.on('connection_established', (data: any) => {
      partnerCodename.value = data.partnerCodename
      connected.value = true
      appState.value = 'chatting'
      console.log('🔗 Connection established with:', data.partnerCodename)
    })

    socket.on('message_received', (messageData: any) => {
      console.log('💬 Message received from:', messageData.from)
      if (chatComponent.value) {
        chatComponent.value.addMessage(messageData)
      }
    })

    socket.on('partner_disconnected', (data: any) => {
      console.log('🔴 Partner disconnected')
      connected.value = false
      appState.value = 'disconnected'
    })

    socket.on('error', (errorData: any) => {
      console.error('❌ Socket error:', errorData)
      error.value = errorData.message || 'Connection error'
    })
    
  } catch (err) {
    throw new Error('Failed to establish grid connection')
  }
}

const requestLocationPermission = async () => {
  try {
    error.value = ''
    const location = await getCurrentLocation()
    
    if (!socket) {
      throw new Error('Grid connection not established')
    }
    
    // Join the grid with location
    socket.emit('join_grid', location)
    
  } catch (err: any) {
    error.value = err.message || 'Failed to acquire location'
  }
}

const sendMessage = async (message: string) => {
  if (!socket) return
  
  socket.emit('send_message', { message })
}

const disconnectFromChat = async () => {
  if (!socket) return
  
  socket.emit('leave_grid')
  
  // Reset state
  connected.value = false
  partnerCodename.value = ''
  appState.value = 'permission'
}

const returnToScanning = () => {
  // Reset and go back to permission request
  connected.value = false
  partnerCodename.value = ''
  userCodename.value = ''
  userSessionId.value = ''
  appState.value = 'permission'
}

// Cleanup on unmount
onUnmounted(() => {
  if (socket) {
    socket.disconnect()
  }
})
</script>

<style>
body {
  font-family: 'Courier New', monospace;
  background-color: #111827;
  color: #4ade80;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #111827;
}

::-webkit-scrollbar-thumb {
  background: #166534;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4ade80;
}
</style>