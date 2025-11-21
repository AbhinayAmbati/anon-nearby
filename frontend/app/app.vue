<template>
  <div id="app" class="min-h-screen bg-black text-green-400 font-mono">
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
        <div class="flex-1 flex flex-col max-w-sm sm:max-w-2xl lg:max-w-4xl mx-auto w-full p-6 sm:p-4">
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
                <span class="hidden sm:inline">DISCONNECT</span>
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
      </Transition>
    </div>
    
    <!-- Footer -->
    <footer class="fixed bottom-0 left-0 right-0 bg-black bg-opacity-80 border-t border-green-400/20 px-2 sm:px-4 py-1 sm:py-2 z-40">
      <div class="flex justify-center items-center space-x-2 sm:space-x-4 text-xs text-green-400/60">
        <span class="hidden sm:inline">&copy; 2025 ANON-NEARBY</span>
        <span class="hidden sm:inline">•</span>
        <button @click="showTerms = true" class="hover:text-green-400">
          <span class="sm:hidden">Terms</span>
          <span class="hidden sm:inline">Terms of Service</span>
        </button>
        <span>•</span>
        <button @click="showPrivacy = true" class="hover:text-green-400">
          <span class="sm:hidden">Privacy</span>
          <span class="hidden sm:inline">Privacy Policy</span>
        </button>
        <span class="hidden sm:inline">•</span>
        <span class="hidden sm:inline">Anonymous • Ephemeral • Secure</span>
      </div>
    </footer>

    <!-- Terms Modal -->
    <div v-if="showTerms" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
      <div class="bg-black border border-green-400/30 rounded-lg max-w-2xl w-full max-h-[90vh] sm:max-h-96 overflow-y-auto">
        <div class="p-4 sm:p-6">
          <div class="flex justify-between items-center mb-3 sm:mb-4">
            <h2 class="text-lg sm:text-xl font-mono font-bold text-green-400">Terms of Service</h2>
            <button @click="showTerms = false" class="text-green-400 hover:text-red-400 text-xl">✕</button>
          </div>
          <div class="text-green-400/80 font-mono text-xs sm:text-sm space-y-3 sm:space-y-4">
            <p><strong>1. DISCLAIMER OF LIABILITY</strong><br>
            ANON-NEARBY AND ITS OPERATORS ARE NOT RESPONSIBLE FOR ANY DAMAGES, LOSSES, HARM, OR CONSEQUENCES ARISING FROM USE OF THIS SERVICE. THIS INCLUDES BUT IS NOT LIMITED TO: PERSONAL INJURY, PROPERTY DAMAGE, FINANCIAL LOSS, EMOTIONAL DISTRESS, PRIVACY VIOLATIONS, ILLEGAL ACTIVITIES, OR ANY OTHER ISSUES.</p>
            
            <p><strong>2. Anonymous Service</strong><br>
            ANON-NEARBY is a completely anonymous chat service. We do not collect, store, or track personal information. We cannot verify user identities or intentions.</p>
            
            <p><strong>3. USE AT YOUR OWN RISK</strong><br>
            Users assume ALL RESPONSIBILITY for their safety, security, and any consequences of using this service. We strongly advise against meeting strangers or sharing personal information.</p>
            
            <p><strong>4. Ephemeral Sessions</strong><br>
            All chat sessions are temporary. Messages are not stored permanently and disappear when sessions end. We cannot recover lost data or conversations.</p>
            
            <p><strong>5. Location Usage</strong><br>
            Your location is used only for proximity matching. Location data is not stored permanently. Users are responsible for their own location privacy and safety.</p>
            
            <p><strong>6. User Conduct & AI Content Moderation</strong><br>
            Users must not engage in harassment, threats, hate speech, illegal activities, or sharing of harmful content. Your messages are automatically analyzed by AI systems (Google Gemini) to detect violations. Progressive enforcement includes warnings, temporary muting, and blocking. We are not responsible for monitoring all content or preventing all harmful behavior, but automated systems help maintain platform safety.</p>
            
            <p><strong>7. AI Processing Acknowledgment</strong><br>
            By using this service, you acknowledge that your messages will be processed by artificial intelligence for content moderation. AI systems may occasionally produce false positives or miss violations. You accept the risks of automated content analysis and potential moderation errors.</p>
            
            <p><strong>8. NO WARRANTIES OR GUARANTEES</strong><br>
            This service is provided "AS-IS" without any warranties, guarantees, or promises of reliability, safety, functionality, or accuracy of AI content moderation. AI systems may make errors in content analysis and enforcement decisions.</p>
            
            <p><strong>9. Age Restriction & Parental Responsibility</strong><br>
            Users must be 18+ to use this service. Parents are responsible for monitoring their children's internet usage and understanding that AI content moderation cannot guarantee complete protection from harmful content.</p>
            
            <p><strong>10. INDEMNIFICATION</strong><br>
            By using this service, you agree to hold harmless and indemnify ANON-NEARBY from any claims, damages, or legal issues arising from your use of the service, including any consequences of AI content moderation decisions or failures.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Privacy Policy Modal -->
    <div v-if="showPrivacy" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
      <div class="bg-black border border-green-400/30 rounded-lg max-w-2xl w-full max-h-[90vh] sm:max-h-96 overflow-y-auto">
        <div class="p-4 sm:p-6">
          <div class="flex justify-between items-center mb-3 sm:mb-4">
            <h2 class="text-lg sm:text-xl font-mono font-bold text-green-400">Privacy Policy</h2>
            <button @click="showPrivacy = false" class="text-green-400 hover:text-red-400 text-xl">✕</button>
          </div>
          <div class="text-green-400/80 font-mono text-xs sm:text-sm space-y-3 sm:space-y-4">
            <p><strong>IMPORTANT DISCLAIMER:</strong><br>
            ANON-NEARBY IS NOT RESPONSIBLE FOR ANY PRIVACY BREACHES, DATA MISUSE, OR SECURITY INCIDENTS. USERS ASSUME ALL RISKS RELATED TO THEIR PRIVACY AND DATA SECURITY.</p>
            
            <p><strong>Message Flow & Zero Persistence Architecture:</strong><br>
            Messages are delivered through real-time WebSocket connections (Socket.IO) and are NEVER stored in any database. The complete flow: User types → Socket.IO broadcast → Recipient receives. Messages exist only in browser memory during active sessions and are instantly destroyed when chats end.</p>
            
            
            <p><strong>AI Content Processing & Moderation:</strong><br>
            Your messages are analyzed by Google Gemini AI to detect harmful content including harassment, threats, and inappropriate material. This AI analysis happens in real-time and no message content is permanently stored. Only abuse patterns are tracked temporarily using anonymous session identifiers that expire within 24 hours.</p>

            <p><strong>Data We Collect:</strong><br>
            • Temporary location coordinates (for proximity matching only)<br>
            • Auto-generated session identifiers and codenames<br>
            • Real-time chat messages (analyzed by AI but never stored)<br>
            • Anonymous abuse detection metrics (expire within 24 hours)<br>
            • Connection metadata (IP addresses, socket IDs) for technical functionality</p>
            
            <p><strong>Data We Don't Collect:</strong><br>
            • Personal information or identities<br>
            • Chat history or message logs<br>
            • User accounts or profiles<br>
            • Device identifiers or tracking cookies<br>
            • Persistent user preferences or settings<br>
            • Permanent records of AI content analysis</p>
            
            <p><strong>Network Security & Data in Transit:</strong><br>
            While we use WebSocket connections, data transmitted over the internet may be vulnerable to interception. WE CANNOT GUARANTEE secure transmission or prevent man-in-the-middle attacks. Users should assume all communications may be monitored by third parties.</p>
            
            <p><strong>Data Usage & Automatic Deletion:</strong><br>
            Location data is used exclusively for finding nearby users within your selected radius (500m-5km). All session data, messages, and user information is automatically and immediately deleted when you disconnect. Browser refresh also destroys all local message history.</p>
            
            <p><strong>No Responsibility for Data Security:</strong><br>
            We are NOT responsible for data breaches, unauthorized access, network vulnerabilities, WebSocket interception, or any privacy violations that may occur during use of this service. This includes but is not limited to: network eavesdropping, ISP monitoring, government surveillance, or malicious actors.</p>
            
            <p><strong>Data Sharing & Third Parties:</strong><br>
            We use Google Gemini AI API for content moderation which requires temporary processing of your messages by Google's systems. However, your messages are not permanently stored by us or Google for AI training. We do not intentionally share, sell, or distribute user data with other third parties. However, we cannot control or prevent unauthorized access by malicious actors, government agencies, ISPs, or other network intermediaries who may monitor WebSocket traffic.</p>

            <p><strong>AI Processing & Automated Moderation:</strong><br>
            Your messages are automatically analyzed by AI systems to maintain platform safety. This includes: detection of harmful content, progressive enforcement (warnings to temporary blocks), anonymous tracking of violation patterns, and real-time content filtering. AI analysis decisions may occasionally produce false positives or miss violations.</p>
            
            <p><strong>User Responsibility & Safety:</strong><br>
            Users are solely responsible for: protecting their own privacy, not sharing sensitive information, understanding the risks of anonymous communication platforms, not meeting strangers from the app, and ensuring their own physical and digital safety.</p>
            
            <p><strong>Your Rights & Technical Limitations:</strong><br>
            Since we don't store personal data permanently, there's nothing to delete or modify. Simply close the app to end all data processing. However, WE PROVIDE NO GUARANTEES ABOUT DATA PRIVACY, SECURITY, OR COMPLETE DATA DELETION from network logs, ISP records, or other intermediate systems.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Moderation Dialog -->
    <div v-if="showContentDialog" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div class="bg-black border rounded-lg max-w-md w-full" :class="{
        'border-yellow-400/50': dialogData.type === 'warning',
        'border-red-400/50': dialogData.type === 'error',
        'border-green-400/50': dialogData.type === 'info'
      }">
        <div class="p-6">
          <div class="flex items-center mb-4">
            <div class="mr-3">
              <svg v-if="dialogData.type === 'warning'" class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <svg v-else-if="dialogData.type === 'error'" class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <svg v-else class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-mono font-bold" :class="{
              'text-yellow-400': dialogData.type === 'warning',
              'text-red-400': dialogData.type === 'error',
              'text-green-400': dialogData.type === 'info'
            }">{{ dialogData.title }}</h3>
          </div>
          
          <p class="text-green-400/80 font-mono text-sm mb-6 leading-relaxed">
            {{ dialogData.message }}
          </p>
          
          <div class="flex justify-end">
            <button 
              @click="closeContentDialog"
              class="px-4 py-2 bg-transparent border font-mono text-sm font-semibold transition-all duration-200" :class="{
                'border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black': dialogData.type === 'warning',
                'border-red-400 text-red-400 hover:bg-red-400 hover:text-black': dialogData.type === 'error',
                'border-green-400 text-green-400 hover:bg-green-400 hover:text-black': dialogData.type === 'info'
              }"
            >
              GOT IT
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// App state management
type AppState = 'loading' | 'permission' | 'scanning' | 'chatting' | 'disconnected'

// Import composables
const { $socket } = useNuxtApp()

// Nearby count functionality (inline implementation)
const nearbyCount = ref<number>(0)
const nearbyCountLoading = ref(false)

const fetchNearbyCount = async (latitude: number, longitude: number, radius: number = 1000) => {
  if (nearbyCountLoading.value) return

  nearbyCountLoading.value = true

  try {
    const response = await fetch('http://localhost:3001/api/users/nearby-count', {
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

// Content moderation dialog
const showContentDialog = ref(false)
const dialogData = ref({
  title: '',
  message: '',
  type: 'warning' // 'warning' | 'error' | 'info'
})

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
const showTerms = ref(false)
const showPrivacy = ref(false)

// Close content moderation dialog
const closeContentDialog = () => {
  showContentDialog.value = false
  dialogData.value = { title: '', message: '', type: 'warning' }
}

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

    socket.on('message_blocked', (data: any) => {
      console.warn('🚫 Message blocked:', data)
      showContentDialog.value = true
      dialogData.value = {
        title: data.title || 'Message Not Allowed',
        message: data.message || 'Your message cannot be sent because it contains inappropriate content.',
        type: 'warning'
      }
    })

    socket.on('temporarily_muted', (data: any) => {
      console.warn('🔇 Temporarily muted:', data)
      showContentDialog.value = true
      dialogData.value = {
        title: data.title || 'Temporarily Muted',
        message: data.message || 'You have been temporarily muted for inappropriate content.',
        type: 'error'
      }
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


.typing-dots {
  animation: typingAnimation 1.5s infinite;
}

@keyframes typingAnimation {
  0%, 16.66% {
    opacity: 0;
  }
  33.33%, 50% {
    opacity: 1;
  }
  66.66%, 100% {
    opacity: 0;
  }
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

/* Enhanced micro animations */

/* Smooth state transitions */
.transition-state {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Message bubble animations */
.message-bubble {
  animation: slideInMessage 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);
}

@keyframes slideInMessage {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Enhanced scanning animation with slower ripple effect */
@keyframes ripple {
  0% {
    transform: scale(0.1);
    opacity: 0.8;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    transform: scale(3);
    opacity: 0;
  }
}

.ripple-animation {
  animation: ripple 4s ease-out infinite;
}

@keyframes simpleGlow {
  0%, 100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

.simple-glow {
  animation: simpleGlow 2s ease-in-out infinite;
}

/* Connection status indicator animation */
@keyframes connectionPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.connection-indicator {
  animation: connectionPulse 2s ease-in-out infinite;
}

/* Glitch effect for connection states */
@keyframes glitch {
  0%, 100% { transform: translate(0); }
  2% { transform: translate(-2px, -2px); }
  4% { transform: translate(-2px, -2px); }
  6% { transform: translate(2px, 2px); }
  8% { transform: translate(2px, -2px); }
  10% { transform: translate(-2px, 2px); }
  12% { transform: translate(-2px, -2px); }
  14% { transform: translate(2px, 2px); }
  16% { transform: translate(-2px, 2px); }
  18% { transform: translate(2px, -2px); }
  20% { transform: translate(0); }
}

.matrix-glitch {
  animation: glitch 0.3s ease-in-out;
}

/* Loading dot animation */
@keyframes loadingDots {
  0%, 20% {
    color: rgba(74, 222, 128, 0.3);
    transform: scale(1);
  }
  50% {
    color: #4ade80;
    transform: scale(1.2);
  }
  80%, 100% {
    color: rgba(74, 222, 128, 0.3);
    transform: scale(1);
  }
}

.loading-dots span:nth-child(1) { animation: loadingDots 1.5s infinite 0s; }
.loading-dots span:nth-child(2) { animation: loadingDots 1.5s infinite 0.3s; }
.loading-dots span:nth-child(3) { animation: loadingDots 1.5s infinite 0.6s; }

/* Nearby count fade in */
@keyframes countFadeIn {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.nearby-count-appear {
  animation: countFadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Radius button animations */
.radius-btn {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  z-index: 30 !important;
  pointer-events: auto !important;
}

.radius-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(74, 222, 128, 0.2), transparent);
  transition: left 0.5s;
  z-index: -1;
}

.radius-btn:hover::before {
  left: 100%;
}

/* Matrix background optimizations */
.matrix-background {
  will-change: transform;
  backface-visibility: hidden;
}

/* Hardware acceleration for smooth performance */
.hw-accelerated {
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
}

/* Vue transition effects for state changes */
.state-fade-enter-active,
.state-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.state-fade-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

.state-fade-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(1.05);
}

.state-fade-enter-to,
.state-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>