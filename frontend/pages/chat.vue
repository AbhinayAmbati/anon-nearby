<template>
  <div id="app" class="min-h-screen bg-black text-green-400 font-mono">

    
    <!-- Matrix background effect -->
    <MatrixBackground />
    
    <!-- Main application states -->
    <div class="relative z-10 hw-accelerated transition-state">
      <!-- Loading State -->
      <Transition name="state-fade" mode="out-in">
        <LoadingScreen
          v-if="appState === 'loading'"
          key="loading"
          :title="'ANON-NEARBY'"
          :message="loadingMessage"
          :progress="loadingProgress"
          :error="error"
          @retry="initializeApp"
        />
        
        <!-- Permission State -->
        <div 
          v-else-if="appState === 'permission'"
          key="permission"
          class="flex flex-col min-h-screen"
        >
          <div class="flex-grow flex items-center justify-center p-4 sm:p-8">
            <div class="text-center max-w-sm sm:max-w-md w-full">
              <div class="mb-6 sm:mb-8">
                <h1 class="text-xl sm:text-2xl lg:text-3xl font-mono font-bold text-green-400 mb-3 sm:mb-4 tracking-widest">
                  ANON-NEARBY CHAT
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
                
                <!-- Nearby nodes count -->
                <div v-if="showNearbyCount" class="flex items-center justify-center space-x-2 text-green-400/60 text-xs sm:text-sm nearby-count-appear">
                  <div class="w-2 h-2 bg-green-400 rounded-full connection-indicator"></div>
                  <span v-if="nearbyCountLoading" class="loading-dots">
                    Detecting nearby nodes<span>.</span><span>.</span><span>.</span>
                  </span>
                  <span v-else class="transition-state">
                    Active nodes nearby: <strong class="text-green-400">{{ displayNearbyCount }}</strong>
                  </span>
                </div>
              </div>
              
              <!-- Location permission button -->
              <button
                v-if="!userLocation"
                @click="requestLocationPermission"
                class="mt-6 sm:mt-8 px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto bg-transparent border border-green-400 text-green-400 hover:bg-green-400 hover:text-gray-900 transition-all duration-200 font-mono font-semibold tracking-wider text-sm sm:text-base"
              >
                ENABLE LOCATION
              </button>
              
              <!-- Enter grid button -->
              <button
                v-else
                @click="enterGrid"
                class="mt-6 sm:mt-8 px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto bg-green-400 text-gray-900 border border-green-400 hover:bg-green-500 hover:border-green-500 transition-all duration-200 font-mono font-bold tracking-wider text-sm sm:text-base animate-pulse"
              >
                ENTER THE GRID
              </button>
              
              <div v-if="error" class="mt-3 sm:mt-4 text-red-400 text-xs sm:text-sm px-2">
                {{ error }}
              </div>
            </div>
          </div>
          <AppFooter />
        </div>
        
        <!-- Scanning State -->
        <div v-else-if="appState === 'scanning'" key="scanning" class="flex items-center justify-center min-h-screen p-4 sm:p-8">
          <div class="text-center">
            <h2 class="text-lg sm:text-xl font-mono font-bold text-green-400 mb-3 sm:mb-4 px-4">{{ userCodename }}</h2>
            <p class="text-green-400/70 mb-4 sm:mb-6 text-sm sm:text-base px-4">Scanning for nearby nodes...</p>
            
            <!-- Search Radius Selector -->
            <div class="mb-6 sm:mb-8 relative z-20">
              <p class="text-green-400/60 text-xs sm:text-sm mb-3">Search Radius</p>
              <div class="flex justify-center space-x-2 sm:space-x-4 px-4 relative z-20">
                <button
                  v-for="radius in radiusOptions"
                  :key="radius.value"
                  @click="updateSearchRadius(radius.value)"
                  :class="[
                    'px-3 py-2 text-xs sm:text-sm font-mono rounded border radius-btn relative z-20',
                    selectedRadius === radius.value
                      ? 'bg-green-400 text-black border-green-400 font-bold'
                      : 'bg-transparent text-green-400 border-green-400/30 hover:border-green-400/60'
                  ]"
                >
                  {{ radius.label }}
                </button>
              </div>
            </div>
            
            <div class="w-24 h-24 sm:w-32 sm:h-32 mx-auto relative z-10">
              <!-- Moving circles animation -->
              <div class="absolute inset-0 border-2 border-green-400/60 rounded-full ripple-animation z-10"></div>
              <div class="absolute inset-0 border-2 border-green-400/40 rounded-full ripple-animation z-10" style="animation-delay: 1s;"></div>
              <div class="absolute inset-0 border-2 border-green-400/20 rounded-full ripple-animation z-10" style="animation-delay: 2s;"></div>
              <!-- Center dot -->
              <div class="absolute top-1/2 left-1/2 w-3 h-3 bg-green-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse z-10"></div>
            </div>
          </div>
        </div>

        <!-- Chat State -->
        <div v-else-if="appState === 'chatting'" key="chatting" class="flex flex-col h-screen bg-black">
          <div class="flex-1 flex flex-col w-full max-w-4xl mx-auto p-4 sm:p-6">
            <div class="bg-black rounded-lg border border-green-400/30 overflow-hidden flex flex-col h-full">
              <!-- Chat header -->
              <div class="bg-black px-3 sm:px-4 py-2 sm:py-3 border-b border-green-400/30 flex justify-between items-center flex-shrink-0">
                <div class="flex items-center space-x-2">
                  <div class="w-2 h-2 bg-green-400 rounded-full connection-indicator"></div>
                  <span class="text-green-400 font-mono text-sm sm:text-base truncate">Connected to {{ partnerCodename }}</span>
                </div>
                <button 
                  @click="disconnectFromChat" 
                  class="text-red-400 hover:text-red-300 font-mono text-xs sm:text-sm flex-shrink-0 ml-2"
                >
                  <span>DISCONNECT</span>
                </button>
              </div>
              
              <!-- Messages area -->
              <div class="flex-1 p-3 sm:p-4 overflow-y-auto bg-black" ref="messagesContainer">
                <div v-if="messages.length === 0" class="text-center text-green-400/60 py-4 sm:py-8 text-sm sm:text-base">
                  Start your anonymous conversation...
                </div>
                <div v-for="(message, index) in messages" :key="index" class="mb-3 sm:mb-4 message-bubble">
                  <div class="text-xs text-green-400/60 mb-1">{{ message.from }}</div>
                  <div class="text-green-400 font-mono text-sm sm:text-base break-words">{{ message.message }}</div>
                </div>
                
                <!-- Typing indicator -->
                <div v-if="partnerTyping" class="mb-3 sm:mb-4 flex flex-col">
                  <label>{{ partnerCodename }}</label>
                  <div class="flex space-x-2 flex-col">  
                    <span class="text-green-400/80 text-sm">typing<span class="typing-dots">...</span></span>
                  </div>
                </div>
              </div>
              
              <!-- Input area -->
              <div class="bg-black p-3 sm:px-4 sm:py-3 border-t border-green-400/30 flex-shrink-0">
                <form @submit.prevent="sendChatMessage" class="flex space-x-2">
                  <input
                    v-model="messageInput"
                    type="text"
                    placeholder="Type your message..."
                    class="flex-1 bg-black border border-green-400/30 text-green-400 px-2 sm:px-3 py-2 rounded font-mono focus:outline-none focus:border-green-400 text-sm sm:text-base"
                    :disabled="!connected"
                    @input="handleTyping"
                    @focus="handleTypingStart"
                    @blur="handleTypingStop"
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
          class="flex flex-col min-h-screen"
        >
          <div class="flex-grow flex items-center justify-center p-4 sm:p-8">
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
          <AppFooter />
        </div>
      </Transition>
    </div>
    

  </div>
</template>

<script setup lang="ts">
// Import the same logic from app.vue
// App state management
type AppState = 'loading' | 'permission' | 'scanning' | 'chatting' | 'disconnected'

// Import composables
const { $socket } = useNuxtApp()

// Nearby count functionality (inline implementation)
const nearbyCount = ref<number>(0)
const nearbyCountLoading = ref(false)

const socketUrl = process.env.NUXT_PUBLIC_SOCKET_URL

const fetchNearbyCount = async (latitude: number, longitude: number, radius: number = 1000) => {
  if (nearbyCountLoading.value) return

  nearbyCountLoading.value = true

  try {
    const response = await fetch(socketUrl + '/api/users/nearby-count', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude,
        longitude,
        radius
      })
    })

    if (!response.ok) {
      throw new Error('Failed to fetch nearby count')
    }

    const data = await response.json()
    nearbyCount.value = data.nearbyCount
    console.log('📊 Nearby user count:', data.nearbyCount)
    
  } catch (err: any) {
    console.error('❌ Error fetching nearby count:', err)
    nearbyCount.value = 0
  } finally {
    nearbyCountLoading.value = false
  }
}

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

// Typing indicators
const partnerTyping = ref(false)
const isTyping = ref(false)
const typingTimeout = ref<NodeJS.Timeout | null>(null)



// Search radius
const selectedRadius = ref(1000)
const radiusOptions = [
  { label: '500m', value: 500 },
  { label: '1km', value: 1000 },
  { label: '3km', value: 3000 },
  { label: '5km', value: 5000 }
]

// Nearby count display
const showNearbyCount = computed(() => appState.value === 'permission' && userLocation.value !== null)
const displayNearbyCount = computed(() => nearbyCount.value)

// Chat data
const messages = ref<Array<{message: string, from: string, timestamp: string}>>([])
const messageInput = ref('')
const messagesContainer = ref<HTMLElement>()



// User location storage
const userLocation = ref<{latitude: number, longitude: number} | null>(null)

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

    socket.on('user_typing', (data: any) => {
      console.log('⌨️ Typing indicator:', data)
      partnerTyping.value = data.isTyping
    })

    socket.on('chat_timeout', (data: any) => {
      console.log('⏰ Chat timeout:', data.message)
      // Show timeout message and return to scanning
      error.value = data.message
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
    
    // Store location for later use
    userLocation.value = location
    
    // Fetch nearby count to show on welcome screen
    await fetchNearbyCount(location.latitude, location.longitude, selectedRadius.value)
    
    console.log('📍 Location enabled, ready to enter grid')
    
  } catch (err: any) {
    console.error('❌ Error requesting location:', err)
    error.value = err.message || 'Failed to acquire location'
  }
}

const enterGrid = async () => {
  try {
    if (!userLocation.value) {
      error.value = 'Location not available'
      return
    }
    
    if (!socket) {
      throw new Error('Grid connection not established')
    }
    
    if (!socket.connected) {
      throw new Error('Socket not connected to server')
    }
    
    console.log('🟩 Entering the grid...')
    // Join the grid with location and search radius
    socket.emit('join_grid', { 
      ...userLocation.value, 
      radius: selectedRadius.value 
    })
    
  } catch (err: any) {
    console.error('❌ Error entering grid:', err)
    error.value = err.message || 'Failed to enter grid'
  }
}

const sendChatMessage = () => {
  if (!messageInput.value.trim() || !socket) return
  
  const message = messageInput.value.trim()
  
  // Stop typing when sending message
  handleTypingStop()
  
  // Send to server (don't add to messages array - let server broadcast it back)
  socket.emit('send_message', { message })
  
  messageInput.value = ''
}

// Typing indicator methods
const handleTyping = () => {
  if (!isTyping.value && connected.value) {
    handleTypingStart()
  }
  
  // Reset the typing timeout
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
  
  typingTimeout.value = setTimeout(() => {
    handleTypingStop()
  }, 2000) // Stop typing after 2 seconds of inactivity
}

const handleTypingStart = () => {
  if (!isTyping.value && connected.value && socket) {
    isTyping.value = true
    socket.emit('typing_start')
    console.log('⌨️ Started typing')
  }
}

const handleTypingStop = () => {
  if (isTyping.value && socket) {
    isTyping.value = false
    socket.emit('typing_stop')
    console.log('⌨️ Stopped typing')
    
    if (typingTimeout.value) {
      clearTimeout(typingTimeout.value)
      typingTimeout.value = null
    }
  }
}

const sendMessage = async (message: string) => {
  if (!socket) return
  
  socket.emit('send_message', { message })
}

const updateSearchRadius = (radius: number) => {
  console.log('🎯 Radius button clicked:', radius + 'm')
  selectedRadius.value = radius
  console.log('🎯 Search radius updated to:', radius + 'm')
  console.log('📊 Current selectedRadius:', selectedRadius.value)
  
  // If connected and have socket, send radius update
  if (socket && socket.connected) {
    console.log('🔄 Sending radius update to server...')
    socket.emit('update_radius', { radius })
  }
}

const disconnectFromChat = async () => {
  if (!socket) return
  
  socket.emit('disconnect_chat')
  connected.value = false
  messages.value = []
  appState.value = 'disconnected'
}

const returnToScanning = () => {
  appState.value = 'scanning'
  error.value = ''
  
  if (socket && userLocation.value) {
    socket.emit('join_grid', { 
      ...userLocation.value, 
      radius: selectedRadius.value 
    })
  }
}
</script>

<style scoped>
/* Add the same styles from app.vue */
.ripple-animation {
  animation: ripple 3s cubic-bezier(0, 0.2, 0.8, 1) infinite;
}

@keyframes ripple {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.connection-indicator {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.message-bubble {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.typing-dots span {
  animation: blink 1.4s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%, 60%, 100% {
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
}
</style>
