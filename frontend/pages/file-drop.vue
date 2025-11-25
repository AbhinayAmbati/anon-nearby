<template>
  <div class="min-h-screen bg-black text-green-400 font-mono">
    <MatrixBackground />
    
    <!-- Navigation -->


    <div class="relative z-10 container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold mb-4 tracking-wider">EPHEMERAL FILE RELAY</h1>
        <p class="text-green-400/70 max-w-2xl mx-auto">
          Secure, serverless file transfer. No database. No logs.
          <br>
          End-to-end encrypted via one-time code or location.
        </p>
      </div>

      <!-- Mode Selection -->
      <div v-if="!mode" class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <!-- Send Mode -->
        <button 
          @click="mode = 'send'"
          class="group bg-black/40 border border-green-400/30 p-8 hover:border-green-400 transition-all backdrop-blur-sm text-left relative overflow-hidden"
        >
          <div class="absolute inset-0 bg-green-400/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
          <div class="relative z-10">
            <div class="w-16 h-16 mb-6 border-2 border-green-400 rounded-lg flex items-center justify-center group-hover:animate-pulse">
              <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold mb-3 text-green-400">Start a Room</h2>
            <p class="text-green-400/70">Create a secure room to share files with others.</p>
          </div>
        </button>

        <!-- Receive Mode -->
        <button 
          @click="mode = 'receive'"
          class="group bg-black/40 border border-green-400/30 p-8 hover:border-green-400 transition-all backdrop-blur-sm text-left relative overflow-hidden"
        >
          <div class="absolute inset-0 bg-green-400/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
          <div class="relative z-10">
            <div class="w-16 h-16 mb-6 border-2 border-green-400 rounded-lg flex items-center justify-center group-hover:animate-pulse">
              <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold mb-3 text-green-400">Join a Room</h2>
            <p class="text-green-400/70">Enter a code or scan nearby to join an existing room.</p>
          </div>
        </button>
      </div>

      <!-- Setup Interface (Send/Create) -->
      <div v-if="mode === 'send' && !connected" class="max-w-2xl mx-auto">
        <button @click="reset" class="mb-6 text-green-400/60 hover:text-green-400 flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>

        <div class="bg-black/40 border border-green-400/30 p-8 backdrop-blur-sm">
          <h2 class="text-2xl font-bold mb-6 text-green-400">Create Room</h2>

          <div class="space-y-4">
            <p class="text-green-400/80 mb-4">How do you want to connect?</p>
            <button @click="selectMethod('code')" class="w-full p-4 border border-green-400/30 hover:border-green-400 hover:bg-green-400/10 text-left transition-all">
              <span class="font-bold block mb-1">🔑 Generate Code</span>
              <span class="text-sm text-green-400/60">Create a room with a unique code.</span>
            </button>
            <button @click="selectMethod('location')" class="w-full p-4 border border-green-400/30 hover:border-green-400 hover:bg-green-400/10 text-left transition-all">
              <span class="font-bold block mb-1">📍 Use Location</span>
              <span class="text-sm text-green-400/60">Create a room based on your location.</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Setup Interface (Receive/Join) -->
      <div v-if="mode === 'receive' && !connected" class="max-w-2xl mx-auto">
        <button @click="reset" class="mb-6 text-green-400/60 hover:text-green-400 flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>

        <div class="bg-black/40 border border-green-400/30 p-8 backdrop-blur-sm">
          <h2 class="text-2xl font-bold mb-6 text-green-400">Join Room</h2>

          <!-- Step 1: Choose Method -->
          <div v-if="!transferMethod" class="space-y-4">
            <button @click="selectMethod('code')" class="w-full p-4 border border-green-400/30 hover:border-green-400 hover:bg-green-400/10 text-left transition-all">
              <span class="font-bold block mb-1">🔑 Enter Code</span>
              <span class="text-sm text-green-400/60">Enter the code shared by the creator.</span>
            </button>
            <button @click="selectMethod('location')" class="w-full p-4 border border-green-400/30 hover:border-green-400 hover:bg-green-400/10 text-left transition-all">
              <span class="font-bold block mb-1">📍 Scan Nearby</span>
              <span class="text-sm text-green-400/60">Find rooms at your location.</span>
            </button>
          </div>

          <!-- Step 2: Enter Code or Scan -->
          <div v-else class="space-y-6">
            <div v-if="transferMethod === 'code'">
              <label class="block text-sm text-green-400/70 mb-2">Enter Code</label>
              <input 
                v-model="inputCode" 
                type="text" 
                placeholder="XXX-XXX" 
                class="w-full bg-black border border-green-400/30 text-green-400 px-4 py-3 rounded font-mono text-center text-xl uppercase tracking-widest focus:outline-none focus:border-green-400"
              />
              <button 
                @click="connectToRoom" 
                :disabled="inputCode.length < 3"
                class="w-full mt-4 py-3 bg-green-400 text-black font-bold hover:bg-green-500 transition-all disabled:opacity-50"
              >
                CONNECT
              </button>
            </div>

            <div v-if="transferMethod === 'location'" class="text-center">
              <div v-if="location" class="mb-4">
                <p class="text-lg font-mono">{{ location.latitude.toFixed(4) }}, {{ location.longitude.toFixed(4) }}</p>
                <p class="text-sm text-green-400/60">Scanning for drops...</p>
              </div>
              <div v-else class="animate-pulse text-green-400 mb-4">Acquiring GPS...</div>
              <button 
                v-if="location"
                @click="connectToRoom" 
                class="w-full py-3 bg-green-400 text-black font-bold hover:bg-green-500 transition-all"
              >
                START SCANNING
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Unified Room Interface -->
      <div v-if="connected" class="max-w-6xl mx-auto">
        <button @click="reset" class="mb-6 text-green-400/60 hover:text-green-400 flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          Back / Leave Room
        </button>

        <div class="grid md:grid-cols-2 gap-8">
          <!-- Send Panel -->
          <div class="bg-black/40 border border-green-400/30 p-8 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-6 text-green-400">Send File</h2>
            
            <!-- Room Info -->
            <div class="mb-8 p-4 bg-green-400/5 border border-green-400/20 rounded text-center">
              <p class="text-sm text-green-400/70 mb-1">Room Code / ID</p>
              <p class="text-3xl font-bold tracking-widest text-green-400">{{ roomId }}</p>
            </div>

            <!-- Drop Zone -->
            <div v-if="!fileSelected" 
              @drop.prevent="handleDrop" 
              @dragover.prevent 
              class="border-2 border-dashed border-green-400/30 hover:border-green-400 hover:bg-green-400/5 rounded-lg p-12 text-center transition-all cursor-pointer"
              @click="fileInput?.click()"
            >
              <input ref="fileInput" type="file" class="hidden" @change="handleFileSelect" />
              <svg class="w-12 h-12 mx-auto mb-4 text-green-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p class="text-green-400 font-bold">Click to Select File</p>
              <p class="text-green-400/50 text-sm mt-2">or drag and drop here</p>
            </div>

            <!-- Upload Progress -->
            <div v-else class="space-y-6">
              <div class="flex items-center justify-between">
                <span class="font-bold truncate max-w-[200px]">{{ selectedFile?.name }}</span>
                <span class="text-sm text-green-400/70">{{ formatSize(selectedFile?.size) }}</span>
              </div>
              
              <div class="w-full bg-green-400/10 h-4 rounded overflow-hidden">
                <div class="bg-green-400 h-full transition-all duration-200" :style="{ width: `${uploadProgress}%` }"></div>
              </div>
              
              <div class="text-center text-sm text-green-400/70">
                {{ uploadStatus }}
              </div>

              <button v-if="uploadProgress === 100" @click="resetUpload" class="w-full py-3 border border-green-400 hover:bg-green-400 hover:text-black transition-all font-bold">
                SEND ANOTHER
              </button>
            </div>
          </div>

          <!-- Receive Panel -->
          <div class="bg-black/40 border border-green-400/30 p-8 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-6 text-green-400">Incoming Files</h2>

            <div v-if="incomingFiles.length === 0" class="text-center py-12 border border-green-400/10 rounded">
              <p class="text-green-400/40 animate-pulse">Waiting for files...</p>
            </div>

            <div v-else class="space-y-4">
              <div v-for="file in incomingFiles" :key="file.id" class="bg-black border border-green-400/30 p-4 rounded">
                <div class="flex justify-between items-center mb-2">
                  <span class="font-bold truncate">{{ file.fileName }}</span>
                  <span class="text-xs text-green-400/60">{{ Math.round((file.receivedChunks / file.totalChunks) * 100) }}%</span>
                </div>
                <div class="w-full bg-green-400/10 h-2 rounded overflow-hidden mb-3">
                  <div class="bg-green-400 h-full transition-all duration-200" :style="{ width: `${(file.receivedChunks / file.totalChunks) * 100}%` }"></div>
                </div>
                
                <button 
                  v-if="file.receivedChunks === file.totalChunks" 
                  @click="downloadFile(file.id)"
                  class="w-full py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all text-sm font-bold"
                >
                  DOWNLOAD
                </button>
                <div v-else class="text-center text-xs text-green-400/50">Decrypting & Reassembling...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { socketService } from '~/composables/useSocket'
import { generateOneTimeCode, deriveKeyFromSecret, deriveKeyFromLocation, processFileAndSend, decryptChunk } from '~/utils/fileTransfer'

const mode = ref<'send' | 'receive' | null>(null)
const transferMethod = ref<'code' | 'location' | null>(null)
const generatedCode = ref('')
const inputCode = ref('')
const location = ref<{ latitude: number, longitude: number } | null>(null)
const roomId = ref('')
const encryptionKey = ref<CryptoKey | null>(null)

// Sender State
const selectedFile = ref<File | null>(null)
const fileSelected = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

// Receiver State
const connected = ref(false)
const incomingFiles = ref<any[]>([])
const fileChunksMap = new Map<string, { chunks: Map<number, Uint8Array>, totalChunks: number, fileName: string, fileType: string }>()

// Setup Socket
onMounted(() => {
  const config = useRuntimeConfig()
  const socketUrl = config.public.socketUrl || 'http://localhost:3001'
  socketService.connect(socketUrl)
  
  socketService.on('file_chunk_received', handleChunkReceived)
  socketService.on('user_joined_drop_room', () => {
    // Optional: Notify user
  })
  socketService.on('file_drop_room_closed', handleRoomClosed)
  socketService.on('user_left_drop_room', handleUserLeft)
})

onUnmounted(() => {
  socketService.off('file_chunk_received')
  socketService.off('user_joined_drop_room')
  socketService.off('file_drop_room_closed')
  socketService.off('user_left_drop_room')
  if (roomId.value) {
    socketService.leaveFileDropRoom(roomId.value)
  }
})

const handleRoomClosed = (data: any) => {
  alert(`Room closed: ${data.reason}`)
  reset()
}

const handleUserLeft = (data: any) => {
  console.log('User left:', data.socketId)
}

const reset = () => {
  if (roomId.value) {
    socketService.leaveFileDropRoom(roomId.value)
  }
  mode.value = null
  transferMethod.value = null
  generatedCode.value = ''
  inputCode.value = ''
  selectedFile.value = null
  fileSelected.value = false
  uploadProgress.value = 0
  uploadStatus.value = ''
  connected.value = false
  incomingFiles.value = []
  fileChunksMap.clear()
  roomId.value = ''
  encryptionKey.value = null
}

const selectMethod = async (method: 'code' | 'location') => {
  transferMethod.value = method
  
  if (method === 'location') {
    await requestLocation()
  }
  
  if (mode.value === 'send') {
    if (method === 'code') {
      generatedCode.value = generateOneTimeCode()
      roomId.value = generatedCode.value
      encryptionKey.value = await deriveKeyFromSecret(generatedCode.value)
      socketService.joinFileDropRoom(roomId.value)
      connected.value = true
    } else if (method === 'location' && location.value) {
      // Room ID is quantized location
      const lat = location.value.latitude.toFixed(3)
      const lon = location.value.longitude.toFixed(3)
      roomId.value = `${lat},${lon}`
      encryptionKey.value = await deriveKeyFromLocation(location.value.latitude, location.value.longitude)
      socketService.joinFileDropRoom(roomId.value)
      connected.value = true
    }
  }
}

const requestLocation = async () => {
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject)
    })
    location.value = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude
    }
  } catch (e) {
    alert('Location access required for nearby sharing.')
    reset()
  }
}

const connectToRoom = async () => {
  if (transferMethod.value === 'code') {
    roomId.value = inputCode.value.toUpperCase()
    encryptionKey.value = await deriveKeyFromSecret(roomId.value)
  } else if (transferMethod.value === 'location' && location.value) {
    const lat = location.value.latitude.toFixed(3)
    const lon = location.value.longitude.toFixed(3)
    roomId.value = `${lat},${lon}`
    encryptionKey.value = await deriveKeyFromLocation(location.value.latitude, location.value.longitude)
  }
  
  socketService.joinFileDropRoom(roomId.value)
  connected.value = true
}

// Sender Logic
const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
    fileSelected.value = true
    startUpload()
  }
}

const handleDrop = (e: DragEvent) => {
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    selectedFile.value = e.dataTransfer.files[0]
    fileSelected.value = true
    startUpload()
  }
}

const startUpload = async () => {
  if (!selectedFile.value || !encryptionKey.value) return
  
  uploadStatus.value = 'Encrypting & Sending...'
  uploadProgress.value = 0
  
  try {
    await processFileAndSend(selectedFile.value, encryptionKey.value, async (chunkData: any) => {
      // Add room ID to chunk data
      const dataToSend = { ...chunkData, roomId: roomId.value }
      socketService.sendFileChunk(dataToSend)
      
      // Update progress
      uploadProgress.value = Math.round(((chunkData.chunkIndex + 1) / chunkData.totalChunks) * 100)
    })
    
    uploadStatus.value = 'Sent Successfully!'
  } catch (e) {
    console.error(e)
    uploadStatus.value = 'Error sending file.'
  }
}

const resetUpload = () => {
  selectedFile.value = null
  fileSelected.value = false
  uploadProgress.value = 0
  uploadStatus.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

// Receiver Logic
const handleChunkReceived = async (data: any) => {
  if (!encryptionKey.value) return
  
  const { fileId, chunkIndex, totalChunks, encryptedBytes, fileName, fileType } = data
  
  // Initialize file entry if new
  if (!fileChunksMap.has(fileId)) {
    fileChunksMap.set(fileId, {
      chunks: new Map(),
      totalChunks,
      fileName,
      fileType
    })
    incomingFiles.value.push({
      id: fileId,
      fileName,
      totalChunks,
      receivedChunks: 0
    })
  }
  
  const fileEntry = fileChunksMap.get(fileId)!
  
  // Decrypt chunk immediately
  try {
    // Convert back to Uint8Array if it came as an object/array from socket
    const encryptedArray = new Uint8Array(encryptedBytes)
    const decryptedChunk = await decryptChunk(encryptedArray, encryptionKey.value)
    
    fileEntry.chunks.set(chunkIndex, new Uint8Array(decryptedChunk))
    
    // Update UI
    const uiFile = incomingFiles.value.find(f => f.id === fileId)
    if (uiFile) {
      uiFile.receivedChunks = fileEntry.chunks.size
    }
  } catch (e) {
    console.error('Decryption failed for chunk', chunkIndex, e)
  }
}

const downloadFile = (fileId: string) => {
  const fileEntry = fileChunksMap.get(fileId)
  if (!fileEntry) return
  
  // Reassemble
  const sortedChunks = []
  for (let i = 0; i < fileEntry.totalChunks; i++) {
    const chunk = fileEntry.chunks.get(i)
    if (chunk) sortedChunks.push(chunk)
  }
  
  const blob = new Blob(sortedChunks as BlobPart[], { type: fileEntry.fileType })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = fileEntry.fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const formatSize = (bytes: number | undefined) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<style scoped>
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
