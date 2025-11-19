<template>
  <div id="app" class="min-h-screen bg-gray-900 text-green-400 font-mono">
    <!-- Debug info -->
    <div class="fixed top-2 left-2 text-xs bg-black bg-opacity-50 p-1 sm:p-2 rounded z-50 text-green-400 font-mono">
      <div class="hidden sm:block">
        State: {{ appState }}<br>
        Codename: {{ userCodename }}<br>
        Socket: {{ socketConnected ? 'Connected' : 'Disconnected' }}
      </div>
      <div class="sm:hidden">
        {{ appState.charAt(0).toUpperCase() + appState.slice(1) }}
      </div>
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
        class="flex items-center justify-center min-h-screen p-4 sm:p-8"
      >
        <div class="text-center max-w-sm sm:max-w-md w-full">
          <div class="mb-6 sm:mb-8">
            <h1 class="text-xl sm:text-2xl lg:text-3xl font-mono font-bold text-green-400 mb-3 sm:mb-4 tracking-widest">
              ANON-NEARBY
            </h1>
            <div class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 border-2 border-green-400 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 sm:w-8 sm:h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          
          <div class="space-y-3 sm:space-y-4 text-sm sm:text-base px-4">
            <p class="text-green-400/80">
              Connect anonymously with people near you.
            </p>
            <p class="text-green-400/60 text-xs sm:text-sm">
              No accounts. No history. No traces.
            </p>
          </div>
          
          <button
            @click="requestLocationPermission"
            class="mt-6 sm:mt-8 px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto bg-transparent border border-green-400 text-green-400 hover:bg-green-400 hover:text-gray-900 transition-all duration-200 font-mono font-semibold tracking-wider text-sm sm:text-base"
          >
            ENTER THE GRID
          </button>
          
          <div v-if="error" class="mt-3 sm:mt-4 text-red-400 text-xs sm:text-sm px-2">
            {{ error }}
          </div>
        </div>
      </div>
      
      <!-- Scanning State -->
      <div v-else-if="appState === 'scanning'" class="flex items-center justify-center min-h-screen p-4 sm:p-8">
        <div class="text-center">
          <h2 class="text-lg sm:text-xl font-mono font-bold text-green-400 mb-3 sm:mb-4 px-4">{{ userCodename }}</h2>
          <p class="text-green-400/70 mb-4 sm:mb-6 text-sm sm:text-base px-4">Scanning for nearby nodes...</p>
          <div class="w-24 h-24 sm:w-32 sm:h-32 mx-auto relative">
            <!-- Radar circles -->
            <div class="absolute inset-0 border border-green-400/30 rounded-full animate-ping"></div>
            <div class="absolute inset-3 sm:inset-4 border border-green-400/50 rounded-full animate-ping" style="animation-delay: 0.5s"></div>
            <div class="absolute inset-6 sm:inset-8 border border-green-400/70 rounded-full animate-ping" style="animation-delay: 1s"></div>
            <!-- Center dot -->
            <div class="absolute top-1/2 left-1/2 w-2 h-2 bg-green-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
          </div>
        </div>
      </div>

      <!-- Chat State -->
      <div v-else-if="appState === 'chatting'" class="flex flex-col h-screen bg-gray-800">
        <div class="flex-1 flex flex-col max-w-sm sm:max-w-2xl lg:max-w-4xl mx-auto w-full p-6 sm:p-4">
          <div class="bg-gray-900 rounded-lg border border-green-400/30 overflow-hidden flex flex-col h-full">
            <!-- Chat header -->
            <div class="bg-gray-800 px-3 sm:px-4 py-2 sm:py-3 border-b border-green-400/30 flex justify-between items-center flex-shrink-0">
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span class="text-green-400 font-mono text-sm sm:text-base truncate">Connected to {{ partnerCodename }}</span>
              </div>
              <button 
                @click="disconnectFromChat" 
                class="text-red-400 hover:text-red-300 font-mono text-xs sm:text-sm flex-shrink-0 ml-2"
              >
                <span class="hidden sm:inline">DISCONNECT</span>
              </button>
            </div>
            
            <!-- Messages area -->
            <div class="flex-1 p-3 sm:p-4 overflow-y-auto bg-gray-900" ref="messagesContainer">
              <div v-if="messages.length === 0" class="text-center text-green-400/60 py-4 sm:py-8 text-sm sm:text-base">
                Start your anonymous conversation...
              </div>
              <div v-for="(message, index) in messages" :key="index" class="mb-3 sm:mb-4">
                <div class="text-xs text-green-400/60 mb-1">{{ message.from }}</div>
                <div class="text-green-400 font-mono text-sm sm:text-base break-words">{{ message.message }}</div>
              </div>
            </div>
            
            <!-- Input area -->
            <div class="bg-gray-800 p-3 sm:px-4 sm:py-3 border-t border-green-400/30 flex-shrink-0">
              <form @submit.prevent="sendChatMessage" class="flex space-x-2">
                <input
                  v-model="messageInput"
                  type="text"
                  placeholder="Type your message..."
                  class="flex-1 bg-gray-900 border border-green-400/30 text-green-400 px-2 sm:px-3 py-2 rounded font-mono focus:outline-none focus:border-green-400 text-sm sm:text-base"
                  :disabled="!connected"
                />
                <button 
                  type="submit" 
                  class="px-3 sm:px-4 py-2 bg-green-400/20 text-green-400 border border-green-400/30 rounded hover:bg-green-400/30 font-mono text-xs sm:text-sm flex-shrink-0"
                  :disabled="!messageInput.trim() || !connected"
                >
                  SEND
                </button>
              </form>
            </div>
          </div>
        </div>
        <!-- Chat footer spacer to account for global footer -->
        <div class="h-8 sm:h-10 flex-shrink-0"></div>
      </div>      <!-- Disconnected State -->
      <div
        v-else-if="appState === 'disconnected'"
        class="flex items-center justify-center min-h-screen p-4 sm:p-8"
      >
        <div class="text-center max-w-sm sm:max-w-md w-full">
          <h2 class="text-lg sm:text-xl font-mono font-bold text-green-400 mb-3 sm:mb-4">
            CONNECTION TERMINATED
          </h2>
          <p class="text-green-400/70 mb-4 sm:mb-6 text-sm sm:text-base px-4">
            Your chat partner has disconnected.
          </p>
          <button
            @click="returnToScanning"
            class="px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto bg-transparent border border-green-400 text-green-400 hover:bg-green-400 hover:text-gray-900 transition-all duration-200 font-mono font-semibold tracking-wider text-sm sm:text-base"
          >
            SCAN AGAIN
          </button>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <footer class="fixed bottom-0 left-0 right-0 bg-black bg-opacity-80 border-t border-green-400/20 px-2 sm:px-4 py-1 sm:py-2 z-40">
      <div class="flex justify-center items-center space-x-2 sm:space-x-4 text-xs text-green-400/60">
        <span class="hidden sm:inline">&copy; 2025 ANON-NEARBY</span>
        <span class="hidden sm:inline">•</span>
        <button @click="showTerms = true" class="hover:text-green-400 transition-colors">
          <span class="sm:hidden">Terms</span>
          <span class="hidden sm:inline">Terms of Service</span>
        </button>
        <span>•</span>
        <button @click="showPrivacy = true" class="hover:text-green-400 transition-colors">
          <span class="sm:hidden">Privacy</span>
          <span class="hidden sm:inline">Privacy Policy</span>
        </button>
        <span class="hidden sm:inline">•</span>
        <span class="hidden sm:inline">Anonymous • Ephemeral • Secure</span>
      </div>
    </footer>

    <!-- Terms Modal -->
    <div v-if="showTerms" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
      <div class="bg-gray-900 border border-green-400/30 rounded-lg max-w-2xl w-full max-h-[90vh] sm:max-h-96 overflow-y-auto">
        <div class="p-4 sm:p-6">
          <div class="flex justify-between items-center mb-3 sm:mb-4">
            <h2 class="text-lg sm:text-xl font-mono font-bold text-green-400">Terms of Service</h2>
            <button @click="showTerms = false" class="text-green-400 hover:text-red-400 text-xl">✕</button>
          </div>
          <div class="text-green-400/80 font-mono text-xs sm:text-sm space-y-3 sm:space-y-4">
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
    <div v-if="showPrivacy" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
      <div class="bg-gray-900 border border-green-400/30 rounded-lg max-w-2xl w-full max-h-[90vh] sm:max-h-96 overflow-y-auto">
        <div class="p-4 sm:p-6">
          <div class="flex justify-between items-center mb-3 sm:mb-4">
            <h2 class="text-lg sm:text-xl font-mono font-bold text-green-400">Privacy Policy</h2>
            <button @click="showPrivacy = false" class="text-green-400 hover:text-red-400 text-xl">✕</button>
          </div>
          <div class="text-green-400/80 font-mono text-xs sm:text-sm space-y-3 sm:space-y-4">
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
            All Session data exists only in memory and is not persisted to permanent storage.</p>
            
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
      
      // Show "You" for own messages, codename for partner messages
      const displayMessage = {
        ...messageData,
        from: messageData.senderId === userSessionId.value ? 'You' : messageData.from
      }
      
      messages.value.push(displayMessage)
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
  
  // Send to server (don't add to messages array - let server broadcast it back)
  socket.emit('send_message', { message })
  
  messageInput.value = ''
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

/* Responsive scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

@media (min-width: 640px) {
  ::-webkit-scrollbar {
    width: 8px;
  }
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

/* Ensure proper touch targets on mobile */
@media (max-width: 639px) {
  button {
    min-height: 44px;
  }
  
  input {
    min-height: 44px;
  }
}

/* Fix viewport on mobile */
@media screen and (max-width: 767px) {
  .min-h-screen {
    min-height: 100dvh; /* Use dynamic viewport height for mobile */
  }
}

/* Improve text readability on small screens */
@media (max-width: 479px) {
  .font-mono {
    font-size: 14px;
  }
  
  .tracking-widest {
    letter-spacing: 0.1em;
  }
}

/* Animation performance optimization */
@media (prefers-reduced-motion: reduce) {
  .animate-ping,
  .animate-pulse {
    animation: none;
  }
}

/* Dark mode scrollbar for Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: #166534 #111827;
}
</style>