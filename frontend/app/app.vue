<template>
  <div id="app" class="min-h-screen bg-gray-900 text-green-400 font-mono">
    <!-- Debug info -->
    <div class="fixed top-4 left-4 text-xs bg-black bg-opacity-50 p-2 rounded z-50">
      State: {{ appState }}<br>
      Codename: {{ userCodename }}<br>
      Socket: {{ socketConnected ? 'Connected' : 'Disconnected' }}
    </div>
    
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
      <div v-else-if="appState === 'scanning'" class="flex items-center justify-center min-h-screen p-8">
        <div class="text-center">
          <h2 class="text-xl font-mono font-bold text-green-400 mb-4">{{ userCodename }}</h2>
          <p class="text-green-400/70 mb-6">Scanning for nearby nodes...</p>
          <div class="w-32 h-32 mx-auto relative">
            <!-- Radar circles -->
            <div class="absolute inset-0 border border-green-400/30 rounded-full animate-ping"></div>
            <div class="absolute inset-4 border border-green-400/50 rounded-full animate-ping" style="animation-delay: 0.5s"></div>
            <div class="absolute inset-8 border border-green-400/70 rounded-full animate-ping" style="animation-delay: 1s"></div>
            <!-- Center dot -->
            <div class="absolute top-1/2 left-1/2 w-2 h-2 bg-green-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
          </div>
        </div>
      </div>

      <!-- Chat State -->
      <div v-else-if="appState === 'chatting'" class="min-h-screen bg-gray-800 p-4">
        <div class="max-w-4xl mx-auto">
          <div class="bg-gray-900 rounded-lg border border-green-400/30 overflow-hidden">
            <!-- Chat header -->
            <div class="bg-gray-800 px-4 py-3 border-b border-green-400/30 flex justify-between items-center">
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span class="text-green-400 font-mono">Connected to {{ partnerCodename }}</span>
              </div>
              <button 
                @click="disconnectFromChat" 
                class="text-red-400 hover:text-red-300 font-mono text-sm"
              >
                DISCONNECT
              </button>
            </div>
            
            <!-- Messages area -->
            <div class="h-96 p-4 overflow-y-auto bg-gray-900" ref="messagesContainer">
              <div v-if="messages.length === 0" class="text-center text-green-400/60 py-8">
                Start your anonymous conversation...
              </div>
              <div v-for="(message, index) in messages" :key="index" class="mb-4">
                <div class="text-xs text-green-400/60 mb-1">{{ message.from }}</div>
                <div class="text-green-400 font-mono">{{ message.message }}</div>
              </div>
            </div>
            
            <!-- Input area -->
            <div class="bg-gray-800 px-4 py-3 border-t border-green-400/30">
              <form @submit.prevent="sendChatMessage" class="flex space-x-2">
                <input
                  v-model="messageInput"
                  type="text"
                  placeholder="Type your message..."
                  class="flex-1 bg-gray-900 border border-green-400/30 text-green-400 px-3 py-2 rounded font-mono focus:outline-none focus:border-green-400"
                  :disabled="!connected"
                />
                <button 
                  type="submit" 
                  class="px-4 py-2 bg-green-400/20 text-green-400 border border-green-400/30 rounded hover:bg-green-400/30 font-mono"
                  :disabled="!messageInput.trim() || !connected"
                >
                  SEND
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>      <!-- Disconnected State -->
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
    
    <!-- Footer -->
    <footer class="fixed bottom-0 left-0 right-0 bg-black bg-opacity-80 border-t border-green-400/20 px-4 py-2 z-40">
      <div class="flex justify-center items-center space-x-4 text-xs text-green-400/60">
        <span>&copy; 2025 ANON-NEARBY</span>
        <span>•</span>
        <button @click="showTerms = true" class="hover:text-green-400 transition-colors">
          Terms of Service
        </button>
        <span>•</span>
        <button @click="showPrivacy = true" class="hover:text-green-400 transition-colors">
          Privacy Policy
        </button>
        <span>•</span>
        <span>Anonymous • Ephemeral • Secure</span>
      </div>
    </footer>

    <!-- Terms Modal -->
    <div v-if="showTerms" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div class="bg-gray-900 border border-green-400/30 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-mono font-bold text-green-400">Terms of Service</h2>
            <button @click="showTerms = false" class="text-green-400 hover:text-red-400">✕</button>
          </div>
          <div class="text-green-400/80 font-mono text-sm space-y-4">
            <p><strong>1. Anonymous Service</strong><br>
            ANON-NEARBY is a completely anonymous chat service. We do not collect, store, or track personal information.</p>
            
            <p><strong>2. Ephemeral Sessions</strong><br>
            All chat sessions are temporary. Messages are not stored permanently and disappear when sessions end.</p>
            
            <p><strong>3. Location Usage</strong><br>
            Your location is used only for proximity matching. Location data is not stored permanently.</p>
            
            <p><strong>4. User Conduct</strong><br>
            Users must not engage in harassment, illegal activities, or sharing of harmful content.</p>
            
            <p><strong>5. No Guarantees</strong><br>
            This service is provided as-is without warranties. Use at your own discretion.</p>
            
            <p><strong>6. Age Restriction</strong><br>
            Users must be 18+ to use this service.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Privacy Policy Modal -->
    <div v-if="showPrivacy" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div class="bg-gray-900 border border-green-400/30 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-mono font-bold text-green-400">Privacy Policy</h2>
            <button @click="showPrivacy = false" class="text-green-400 hover:text-red-400">✕</button>
          </div>
          <div class="text-green-400/80 font-mono text-sm space-y-4">
            <p><strong>Data We Collect:</strong><br>
            • Temporary location coordinates (for proximity matching only)<br>
            • Auto-generated session identifiers<br>
            • Real-time chat messages (not stored permanently)</p>
            
            <p><strong>Data We Don't Collect:</strong><br>
            • Personal information or identities<br>
            • Chat history or message logs<br>
            • User accounts or profiles<br>
            • Device identifiers or tracking cookies</p>
            
            <p><strong>Data Usage:</strong><br>
            Location data is used exclusively for finding nearby users. All session data is automatically deleted when you disconnect.</p>
            
            <p><strong>Data Sharing:</strong><br>
            We do not share, sell, or distribute any user data with third parties.</p>
            
            <p><strong>Data Security:</strong><br>
            All communications are encrypted. Session data exists only in memory and is not persisted to permanent storage.</p>
            
            <p><strong>Your Rights:</strong><br>
            Since we don't store personal data, there's nothing to delete or modify. Simply close the app to end all data processing.</p>
          </div>
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
const socketConnected = ref(false)

// Chat data
const messages = ref<Array<{message: string, from: string, timestamp: string}>>([])
const messageInput = ref('')
const messagesContainer = ref<HTMLElement>()
const showTerms = ref(false)
const showPrivacy = ref(false)

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
      socketConnected.value = true
    })

    socket.on('disconnect', () => {
      console.log('🔴 Disconnected from server')
      socketConnected.value = false
    })

    socket.on('session_created', (data: any) => {
      console.log('🟩 Session created event received:', data)
      userSessionId.value = data.sessionId
      userCodename.value = data.codename
      console.log('🟩 Setting app state to scanning...')
      appState.value = 'scanning'
      console.log('🟩 Current app state:', appState.value)
    })

    socket.on('connection_established', (data: any) => {
      partnerCodename.value = data.partnerCodename
      connected.value = true
      appState.value = 'chatting'
      messages.value = [] // Clear any old messages
      console.log('🔗 Connection established with:', data.partnerCodename)
    })

    socket.on('message_received', (messageData: any) => {
      console.log('💬 Message received from:', messageData.from)
      messages.value.push(messageData)
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      })
    })

    socket.on('partner_disconnected', (data: any) => {
      console.log('🔴 Partner disconnected')
      connected.value = false
      messages.value = []
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
    console.log('🟩 Requesting location permission...')
    
    const location = await getCurrentLocation()
    console.log('🟩 Location acquired:', location)
    
    if (!socket) {
      throw new Error('Grid connection not established')
    }
    
    if (!socket.connected) {
      throw new Error('Socket not connected to server')
    }
    
    console.log('🟩 Sending join_grid event...')
    // Join the grid with location
    socket.emit('join_grid', location)
    
  } catch (err: any) {
    console.error('❌ Error requesting location:', err)
    error.value = err.message || 'Failed to acquire location'
  }
}

const sendChatMessage = () => {
  if (!messageInput.value.trim() || !socket) return
  
  const message = messageInput.value.trim()
  
  // Add own message immediately
  messages.value.push({
    message,
    from: 'You',
    timestamp: new Date().toISOString()
  })
  
  // Send to server
  socket.emit('send_message', { message })
  
  messageInput.value = ''
  
  // Scroll to bottom
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
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
  messages.value = []
  appState.value = 'permission'
}

const returnToScanning = () => {
  // Reset and go back to permission request
  connected.value = false
  partnerCodename.value = ''
  userCodename.value = ''
  userSessionId.value = ''
  messages.value = []
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