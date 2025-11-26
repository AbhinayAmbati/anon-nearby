<template>
  <div id="app" class="min-h-screen bg-black text-green-400 font-mono overflow-hidden flex flex-col">

    
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
          class="relative flex flex-col min-h-screen overflow-hidden"
        >
          <!-- Animated grid background -->
          <div class="absolute inset-0 opacity-20">
            <div class="absolute inset-0" style="background-image: linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px); background-size: 50px 50px;"></div>
          </div>
          
          <!-- Radial gradient overlay -->
          <div class="absolute inset-0 bg-gradient-radial from-green-400/5 via-transparent to-transparent"></div>
          
          <div class="relative flex-grow flex items-center justify-center p-4 sm:p-8">
            <div class="text-center max-w-6xl w-full">
              <!-- Hero Header -->
              <div class="mb-12 sm:mb-16">
                <div class="inline-block mb-6">
                  <div class="relative">
                    <!-- Pulsing rings -->
                    <div class="absolute inset-0 border-2 border-green-400/30 rounded-full animate-ping"></div>
                    <div class="absolute inset-0 border-2 border-green-400/20 rounded-full animate-pulse"></div>
                    
                    <!-- Icon container -->
                    <div class="relative w-20 h-20 sm:w-24 sm:h-24 border-2 border-green-400 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm">
                      <svg class="w-10 h-10 sm:w-12 sm:h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <h1 class="text-4xl sm:text-5xl font-bold text-green-400 mb-4">ANON-NEARBY</h1>

                <h2 class="text-2xl sm:text-3xl font-bold text-green-400 mb-4">Connect with people around you</h2>
                
                <p class="text-sm sm:text-base text-green-400/60 max-w-md mx-auto">
                  Connect with people around you. No accounts, no history, no traces.
                </p>
                
                <!-- Nearby nodes count -->
                <div v-if="showNearbyCount" class="mt-6 inline-flex items-center space-x-2 px-4 py-2 bg-green-400/10 border border-green-400/30 rounded-full text-green-400/80 text-sm backdrop-blur-sm">
                  <div class="w-2 h-2 bg-green-400 rounded-full connection-indicator"></div>
                  <span v-if="nearbyCountLoading" class="loading-dots">
                    Detecting nearby nodes<span>.</span><span>.</span><span>.</span>
                  </span>
                  <span v-else>
                    <strong class="text-green-400">{{ displayNearbyCount }}</strong> active nodes nearby
                  </span>
                </div>
              </div>
              
            
              
              <!-- Modern Grid Options -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 mt-8">
                <!-- Option 1: Proximity Chat -->
                <div class="group relative overflow-hidden rounded-lg border border-green-400/30 bg-black/40 backdrop-blur-sm hover:border-green-400 hover:shadow-lg hover:shadow-green-400/20 transition-all duration-300">
                  <!-- Animated background gradient -->
                  <div class="absolute inset-0 bg-gradient-to-br from-green-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div class="relative p-6">
                    <!-- Icon -->
                    <div class="w-12 h-12 mb-4 rounded-lg bg-green-400/10 border border-green-400/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-green-400/20 transition-all duration-300">
                      <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    
                    <h3 class="text-green-400 font-bold mb-2 text-base tracking-wider">PROXIMITY</h3>
                    <p class="text-green-400/60 text-xs mb-4 leading-relaxed">Auto-match with people nearby</p>
                    
                    <!-- Badge -->
                    <div class="mb-4">
                      <span class="inline-block px-2 py-1 text-xs bg-green-400/10 border border-green-400/30 text-green-400 rounded">Requires Location</span>
                    </div>
                    
                    <button
                      v-if="!userLocation"
                      @click="requestLocationPermission"
                      class="w-full px-4 py-3 bg-green-400 text-black border border-green-400 hover:bg-green-500 hover:border-green-500 hover:shadow-lg hover:shadow-green-400/50 transition-all duration-200 font-mono font-bold tracking-wider text-sm relative overflow-hidden group/btn"
                    >
                      <span class="relative z-10">ENABLE LOCATION</span>
                      <div class="absolute inset-0 bg-gradient-to-r from-green-500 to-green-400 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                    </button>
                    <button
                      v-else
                      @click="enterGrid"
                      class="w-full px-4 py-3 bg-green-400 text-black border border-green-400 hover:bg-green-500 hover:border-green-500 hover:shadow-lg hover:shadow-green-400/50 transition-all duration-200 font-mono font-bold tracking-wider text-sm animate-pulse"
                    >
                      ENTER THE GRID
                    </button>
                  </div>
                </div>
                
                <!-- Option 2: Public Room -->
                <div class="group relative overflow-hidden rounded-lg border border-green-400/30 bg-black/40 backdrop-blur-sm hover:border-green-400 hover:shadow-lg hover:shadow-green-400/20 transition-all duration-300">
                  <!-- Animated background gradient -->
                  <div class="absolute inset-0 bg-gradient-to-br from-green-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div class="relative p-6">
                    <!-- Icon -->
                    <div class="w-12 h-12 mb-4 rounded-lg bg-green-400/10 border border-green-400/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-green-400/20 transition-all duration-300">
                      <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    
                    <h3 class="text-green-400 font-bold mb-2 text-base tracking-wider">PUBLIC ROOM</h3>
                    <p class="text-green-400/60 text-xs mb-4 leading-relaxed">Create nearby group chat</p>
                    
                    <!-- Badge -->
                    <div class="mb-4">
                      <span class="inline-block px-2 py-1 text-xs bg-green-400/10 border border-green-400/30 text-green-400 rounded">Location-Based</span>
                    </div>
                    
                    <button
                      v-if="!userLocation"
                      @click="requestLocationPermission"
                      class="w-full px-4 py-3 bg-green-400 text-black border border-green-400 hover:bg-green-500 hover:border-green-500 hover:shadow-lg hover:shadow-green-400/50 transition-all duration-200 font-mono font-bold tracking-wider text-sm relative overflow-hidden group/btn"
                    >
                      <span class="relative z-10">ENABLE LOCATION</span>
                      <div class="absolute inset-0 bg-gradient-to-r from-green-500 to-green-400 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                    </button>
                    <div v-else class="flex flex-col space-y-2">
                      <button
                        @click="createPublicRoom"
                        class="w-full px-4 py-2 bg-green-400 text-black border border-green-400 hover:bg-green-500 hover:border-green-500 transition-all duration-200 font-mono font-bold tracking-wider text-sm relative overflow-hidden group/btn"
                      >
                        <span class="relative z-10">CREATE ROOM</span>
                        <div class="absolute inset-0 bg-gradient-to-r from-green-500 to-green-400 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                      </button>
                      <button
                        @click="joinPublicRoom"
                        class="w-full px-4 py-2 bg-transparent border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all duration-200 font-mono font-bold tracking-wider text-sm"
                      >
                        JOIN ROOM
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Option 3: Private Room -->
                <div class="group relative overflow-hidden rounded-lg border border-green-400/30 bg-black/40 backdrop-blur-sm hover:border-green-400 hover:shadow-lg hover:shadow-green-400/20 transition-all duration-300">
                  <!-- Animated background gradient -->
                  <div class="absolute inset-0 bg-gradient-to-br from-green-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div class="relative p-6">
                    <!-- Icon -->
                    <div class="w-12 h-12 mb-4 rounded-lg bg-green-400/10 border border-green-400/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-green-400/20 transition-all duration-300">
                      <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    
                    <h3 class="text-green-400 font-bold mb-2 text-base tracking-wider">PRIVATE ROOM</h3>
                    <p class="text-green-400/60 text-xs mb-4 leading-relaxed">Create & share custom room</p>
                    
                    <!-- Badge -->
                    <div class="mb-4">
                      <span class="inline-block px-2 py-1 text-xs bg-green-400/10 border border-green-400/30 text-green-400 rounded">Shareable Link</span>
                    </div>
                    
                    <button
                      @click="showCreateRoomDialog = true"
                      class="w-full px-4 py-3 bg-transparent border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-black hover:shadow-lg hover:shadow-green-400/50 transition-all duration-200 font-mono font-bold tracking-wider text-sm relative overflow-hidden group/btn"
                    >
                      <span class="relative z-10">CREATE ROOM</span>
                    </button>
                  </div>
                </div>
              </div>
              
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
        <div v-else-if="appState === 'chatting'" key="chatting" class="flex flex-col h-screen">
          <div class="flex-1 flex flex-col w-full max-w-4xl mx-auto p-4 sm:p-6">
            <div class="bg-black/40 backdrop-blur-sm rounded-lg border border-green-400/30 overflow-hidden flex flex-col h-full">
              <!-- Chat header -->
              <div class="bg-black/60 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 border-b border-green-400/30 flex justify-between items-center flex-shrink-0">
                <div class="flex items-center space-x-2">
                  <div class="w-2 h-2 bg-green-400 rounded-full connection-indicator"></div>
                  <span class="text-green-400 font-mono text-sm sm:text-base truncate">Connected to {{ partnerCodename }}</span>
                </div>
                
                <div class="flex items-center">
                  <!-- Copy Room ID Button -->
                  <button 
                    v-if="currentRoomId && currentRoomType !== 'public'" 
                    @click="copyRoomId"
                    class="mr-3 p-2 text-green-400 hover:text-green-300 rounded-full transition-all relative group"
                  >
                    <svg v-if="!roomIdCopied" class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path>
                      <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
                    </svg>
                    <svg v-else class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    
                    <!-- Tooltip -->
                    <span class="absolute top-full right-0 mt-2 px-2 py-1 bg-black border border-green-400/30 text-green-400 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                      {{ roomIdCopied ? 'Copied!' : 'Copy Room ID' }}
                    </span>
                  </button>

                  <button 
                    @click="disconnectFromChat" 
                    class="text-red-400 hover:text-red-300 font-mono text-xs sm:text-sm flex-shrink-0"
                  >
                    <span>DISCONNECT</span>
                  </button>
                </div>
              </div>
              
              <!-- Messages area -->
              <div class="flex-1 p-3 sm:p-4 overflow-y-auto" ref="messagesContainer">
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
              <div class="bg-black/60 backdrop-blur-sm p-3 sm:px-4 sm:py-3 border-t border-green-400/30 flex-shrink-0">
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
          <AppFooter />
        </div>
      </Transition>
    </div>
    
    <!-- Create Room Dialog -->
    <Transition name="fade">
      <div 
        v-if="showCreateRoomDialog" 
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        @click.self="showCreateRoomDialog = false"
      >
        <div class="bg-gray-900 border-2 border-green-400 rounded-lg p-6 max-w-md w-full">
          <h3 class="text-xl font-mono font-bold text-green-400 mb-4">CREATE CHAT ROOM</h3>
          <p class="text-green-400/70 text-sm mb-4">Enter a name for your room. You'll get a shareable link.</p>
          
          <input
            v-model="newRoomName"
            type="text"
            placeholder="Room name..."
            class="w-full bg-black border border-green-400/30 text-green-400 px-3 py-2 rounded font-mono focus:outline-none focus:border-green-400 mb-4"
            @keyup.enter="createRoom"
            maxlength="50"
          />
          
          <div class="flex space-x-3">
            <button
              @click="createRoom"
              :disabled="!newRoomName.trim()"
              class="flex-1 px-4 py-2 bg-green-400 text-gray-900 border border-green-400 hover:bg-green-500 hover:border-green-500 transition-all duration-200 font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              CREATE
            </button>
            <button
              @click="showCreateRoomDialog = false"
              class="flex-1 px-4 py-2 bg-transparent border border-green-400 text-green-400 hover:bg-green-400 hover:text-gray-900 transition-all duration-200 font-mono font-semibold"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </Transition>
    
    <!-- Share Room Link Dialog -->
    <Transition name="fade">
      <div 
        v-if="showShareLinkDialog" 
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        @click.self="showShareLinkDialog = false"
      >
        <div class="bg-gray-900 border-2 border-green-400 rounded-lg p-6 max-w-md w-full">
          <h3 class="text-xl font-mono font-bold text-green-400 mb-4">ROOM CREATED!</h3>
          <p class="text-green-400/70 text-sm mb-4">Share this link with others to invite them:</p>
          
          <div class="bg-black border border-green-400/30 rounded p-3 mb-4 break-all">
            <code class="text-green-400 text-xs sm:text-sm">{{ shareableLink }}</code>
          </div>
          
          <div class="flex space-x-3">
            <button
              @click="copyLinkToClipboard"
              class="flex-1 px-4 py-2 bg-green-400 text-gray-900 border border-green-400 hover:bg-green-500 hover:border-green-500 transition-all duration-200 font-mono font-bold"
            >
              {{ linkCopied ? 'COPIED!' : 'COPY LINK' }}
            </button>
            <button
              @click="showShareLinkDialog = false"
              class="flex-1 px-4 py-2 bg-transparent border border-green-400 text-green-400 hover:bg-green-400 hover:text-gray-900 transition-all duration-200 font-mono font-semibold"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </Transition>
    

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

// Room creation state
const showCreateRoomDialog = ref(false)
const newRoomName = ref('')
const showShareLinkDialog = ref(false)
const shareableLink = ref('')
const linkCopied = ref(false)
const currentRoomName = ref('')
const currentRoomId = ref('')
const currentRoomType = ref('')
const roomIdCopied = ref(false)

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

onMounted(async () => {
  // Check if there's a room parameter in the URL
  const route = useRoute()
  const roomIdFromUrl = route.query.room as string
  
  if (roomIdFromUrl) {
    console.log('🔗 Room ID found in URL:', roomIdFromUrl)
    
    // Initialize app first
    loadingMessage.value = 'Joining room...'
    await initializeApp(false)
    
    // Wait for socket to connect
    loadingMessage.value = 'Connecting to room...'
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Create a session if needed
    if (!userSessionId.value && socket && socket.connected) {
      console.log('📝 Creating session to join room...')
      loadingMessage.value = 'Creating session...'
      socket.emit('create_room_session', { roomName: 'Joining via link' })
      
      // Wait for session to be created
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Now join the room
    if (socket && socket.connected) {
      console.log('🚪 Attempting to join room:', roomIdFromUrl)
      loadingMessage.value = 'Entering room...'
      socket.emit('join_named_room', { roomId: roomIdFromUrl })
    } else {
      error.value = 'Failed to connect. Please refresh the page.'
      appState.value = 'permission'
    }
  } else {
    // Normal initialization without room
    initializeApp()
  }
})

const initializeApp = async (redirect = true) => {
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
    if (redirect) {
      setTimeout(() => {
        appState.value = 'permission'
      }, 1000)
    }
    
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
      appState.value = 'permission'
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
      appState.value = 'permission'
    })

    // Named room event listeners
    socket.on('named_room_created', (data: any) => {
      console.log('🏠 Named room created:', data)
      shareableLink.value = data.shareableLink
      currentRoomName.value = data.roomName
      currentRoomId.value = data.roomId
      currentRoomType.value = data.roomType || 'named'
      
      // Close create dialog and show share dialog
      showCreateRoomDialog.value = false
      newRoomName.value = ''
      showShareLinkDialog.value = true
      
      // Transition to chatting state
      appState.value = 'chatting'
      partnerCodename.value = `Room: ${data.roomName}`
      connected.value = true
    })

    socket.on('named_room_joined', (data: any) => {
      console.log('🚪 Joined named room:', data)
      currentRoomName.value = data.roomName
      currentRoomId.value = data.roomId
      currentRoomType.value = data.roomType
      
      // Transition to chatting state
      appState.value = 'chatting'
      partnerCodename.value = `Room: ${data.roomName} (${data.participantCount} users)`
      connected.value = true
      messages.value = []
    })

    socket.on('user_joined_room', (data: any) => {
      console.log('👤 User joined room:', data.codename)
      // Update participant count in UI
      if (currentRoomName.value) {
        partnerCodename.value = `Room: ${currentRoomName.value} (${data.participantCount} users)`
      }
      
      // Add system message
      messages.value.push({
        message: `${data.codename} joined the room`,
        from: 'System',
        timestamp: new Date().toISOString()
      })
      
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      })
    })

    socket.on('user_left_room', (data: any) => {
      console.log('👋 User left room:', data.codename)
      // Update participant count in UI
      if (currentRoomName.value) {
        partnerCodename.value = `Room: ${currentRoomName.value} (${data.participantCount} users)`
      }
      
      // Add system message
      messages.value.push({
        message: `${data.codename} left the room`,
        from: 'System',
        timestamp: new Date().toISOString()
      })
      
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      })
    })

    socket.on('room_updated', (data: any) => {
      console.log('🔄 Room updated:', data)
      // Update participant count in UI
      if (currentRoomName.value) {
        partnerCodename.value = `Room: ${data.roomName} (${data.participantCount} users)`
      }
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
      radius: selectedRadius.value,
      searchMode: 'proximity'
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
  
  console.log('🔴 Leaving room...')
  socket.emit('leave_room')
  
  // Reset local state
  connected.value = false
  messages.value = []
  currentRoomName.value = ''
  currentRoomId.value = ''
  currentRoomType.value = ''
  partnerCodename.value = ''
  
  // Go back to dashboard (options)
  appState.value = 'permission'
}
// Room creation functions
const createRoom = async () => {
  if (!newRoomName.value.trim()) return
  
  try {
    console.log('🏠 Creating room:', newRoomName.value.trim())
    
    // If socket not connected, initialize it first
    if (!socket || !socket.connected) {
      console.log('🔌 Socket not connected, initializing...')
      await initializeSocket()
      
      // Wait a bit for socket to connect
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // If no session exists, create one without location
    if (!userSessionId.value && socket && socket.connected) {
      console.log('📝 Creating session for room...')
      // Emit a special event to create a session without location
      socket.emit('create_room_session', { roomName: newRoomName.value.trim() })
      
      // Wait for session to be created
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    if (socket && socket.connected) {
      socket.emit('create_named_room', { roomName: newRoomName.value.trim() })
    } else {
      error.value = 'Connection failed. Please try again.'
    }
  } catch (err: any) {
    console.error('Error creating room:', err)
    error.value = 'Failed to create room'
  }
}

// Join public room function (location-based)
const joinPublicRoom = async () => {
  try {
    if (!userLocation.value) {
      error.value = 'Location required for public rooms'
      return
    }
    
    console.log('🌍 Joining nearby public room...')
    appState.value = 'loading'
    loadingMessage.value = 'Finding nearby public room...'
    
    // If socket not connected, initialize it first
    if (!socket || !socket.connected) {
      console.log('🔌 Socket not connected, initializing...')
      await initializeSocket()
      
      // Wait a bit for socket to connect
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // If no session exists, join the grid first
    if (!userSessionId.value && socket && socket.connected) {
      console.log('📝 Joining grid for public room...')
      loadingMessage.value = 'Joining grid...'
      socket.emit('join_grid', {
        ...userLocation.value,
        radius: selectedRadius.value,
        searchMode: 'public'
      })
      
      // Wait for session to be created
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    if (socket && socket.connected) {
      loadingMessage.value = 'Finding nearby public room...'
      socket.emit('join_public_room', {
        location: userLocation.value,
        radius: selectedRadius.value,
        action: 'join'
      })
    } else {
      error.value = 'Connection failed. Please try again.'
      appState.value = 'permission'
    }
  } catch (err: any) {
    console.error('Error joining public room:', err)
    error.value = 'Failed to join public room'
    appState.value = 'permission'
  }
}

// Create public room function (location-based)
const createPublicRoom = async () => {
  try {
    if (!userLocation.value) {
      error.value = 'Location required for public rooms'
      return
    }
    
    console.log('🌍 Creating public room...')
    appState.value = 'loading'
    loadingMessage.value = 'Creating public room...'
    
    // If socket not connected, initialize it first
    if (!socket || !socket.connected) {
      console.log('🔌 Socket not connected, initializing...')
      await initializeSocket()
      
      // Wait a bit for socket to connect
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // If no session exists, join the grid first
    if (!userSessionId.value && socket && socket.connected) {
      console.log('📝 Joining grid for public room...')
      loadingMessage.value = 'Joining grid...'
      socket.emit('join_grid', {
        ...userLocation.value,
        radius: selectedRadius.value,
        searchMode: 'public'
      })
      
      // Wait for session to be created
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    if (socket && socket.connected) {
      loadingMessage.value = 'Creating public room...'
      // Emit join_public_room which will create a new room if none exists nearby
      socket.emit('join_public_room', {
        location: userLocation.value,
        radius: selectedRadius.value,
        action: 'create'
      })
    } else {
      error.value = 'Connection failed. Please try again.'
      appState.value = 'permission'
    }
  } catch (err: any) {
    console.error('Error creating public room:', err)
    error.value = 'Failed to create public room'
    appState.value = 'permission'
  }
}

const copyLinkToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(shareableLink.value)
    linkCopied.value = true
    setTimeout(() => {
      linkCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}

const copyRoomId = async () => {
  if (!currentRoomId.value) return
  try {
    const url = `${window.location.origin}${window.location.pathname}?room=${currentRoomId.value}`
    await navigator.clipboard.writeText(url)
    roomIdCopied.value = true
    setTimeout(() => {
      roomIdCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy room URL:', err)
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

/* Modal fade transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
