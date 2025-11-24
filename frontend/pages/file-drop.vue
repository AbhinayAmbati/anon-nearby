<template>
  <div class="min-h-screen bg-black text-green-400 font-mono">
    <!-- Matrix background effect -->
    <MatrixBackground />
    
    <!-- Navigation -->
    <nav class="relative z-20 border-b border-green-400/20 bg-black/80 backdrop-blur-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <NuxtLink to="/" class="text-xl font-bold tracking-widest hover:text-green-300 transition-colors">
            ANON-NEARBY
          </NuxtLink>
          <div class="flex space-x-6">
            <NuxtLink to="/about" class="hover:text-green-300 transition-colors text-sm">ABOUT</NuxtLink>
            <NuxtLink to="/file-drop" class="hover:text-green-300 transition-colors text-sm text-green-300">FILE DROP</NuxtLink>
            <NuxtLink to="/chat" class="px-4 py-2 border border-green-400 hover:bg-green-400 hover:text-black transition-all text-sm">
              ENTER CHAT
            </NuxtLink>
          </div>
        </div>
      </div>
    </nav>

    <div class="relative z-10">
      <!-- Hero Section -->
      <section class="py-12 px-4">
        <div class="max-w-4xl mx-auto text-center">
          <div class="w-20 h-20 mx-auto mb-6 border-2 border-green-400 rounded-lg flex items-center justify-center animate-pulse">
            <svg class="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h1 class="text-4xl md:text-5xl font-bold mb-4 tracking-wider">
            ENCRYPTED FILE DROP
          </h1>
          <p class="text-lg text-green-400/70 max-w-2xl mx-auto">
            Drop encrypted files at your geo-coordinate. Share with proximity or one-time codes.
          </p>
        </div>
      </section>

      <!-- Main Content -->
      <section class="py-8 px-4">
        <div class="max-w-6xl mx-auto">
          <!-- Mode Selection -->
          <div v-if="!mode" class="grid md:grid-cols-2 gap-6 mb-12">
            <!-- Create Room -->
            <button 
              @click="mode = 'create'"
              class="bg-black/40 border border-green-400/30 p-8 hover:border-green-400 transition-all group backdrop-blur-sm text-left"
            >
              <div class="w-16 h-16 mb-6 border-2 border-green-400 rounded-lg flex items-center justify-center group-hover:animate-pulse">
                <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold mb-3 text-green-400">Create Drop Room</h2>
              <p class="text-green-400/70 leading-relaxed">
                Create a secure room to drop files. Get a shareable link and password for others to access.
              </p>
            </button>

            <!-- Join Room -->
            <button 
              @click="mode = 'join'"
              class="bg-black/40 border border-green-400/30 p-8 hover:border-green-400 transition-all group backdrop-blur-sm text-left"
            >
              <div class="w-16 h-16 mb-6 border-2 border-green-400 rounded-lg flex items-center justify-center group-hover:animate-pulse">
                <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold mb-3 text-green-400">Join Drop Room</h2>
              <p class="text-green-400/70 leading-relaxed">
                Enter a room code and password to access files dropped by others nearby.
              </p>
            </button>
          </div>

          <!-- Create Room Mode -->
          <div v-if="mode === 'create' && !roomCreated" class="max-w-2xl mx-auto">
            <button 
              @click="mode = null"
              class="mb-6 text-green-400/60 hover:text-green-400 flex items-center"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div class="bg-black/40 border border-green-400/30 p-8 backdrop-blur-sm">
              <h2 class="text-2xl font-bold mb-6 text-green-400">Create Drop Room</h2>
              
              <!-- Location Permission -->
              <div v-if="!userLocation" class="mb-6">
                <p class="text-green-400/70 mb-4">First, enable location to drop files at your coordinates:</p>
                <button
                  @click="requestLocation"
                  class="w-full px-6 py-3 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all font-semibold"
                >
                  ENABLE LOCATION
                </button>
                <p v-if="locationError" class="mt-2 text-red-400 text-sm">{{ locationError }}</p>
              </div>

              <!-- Room Creation Form -->
              <div v-else>
                <div class="mb-4 p-4 bg-green-400/10 border border-green-400/30 rounded">
                  <p class="text-green-400/80 text-sm">
                    📍 Location: {{ userLocation.latitude.toFixed(6) }}, {{ userLocation.longitude.toFixed(6) }}
                  </p>
                </div>

                <div class="space-y-4 mb-6">
                  <div>
                    <label class="block text-green-400 mb-2 text-sm">Room Name (Optional)</label>
                    <input
                      v-model="roomName"
                      type="text"
                      placeholder="My Secret Drop"
                      class="w-full bg-black border border-green-400/30 text-green-400 px-4 py-3 rounded font-mono focus:outline-none focus:border-green-400"
                    />
                  </div>

                  <div>
                    <label class="block text-green-400 mb-2 text-sm">Access Password</label>
                    <input
                      v-model="roomPassword"
                      type="text"
                      placeholder="Enter a password"
                      class="w-full bg-black border border-green-400/30 text-green-400 px-4 py-3 rounded font-mono focus:outline-none focus:border-green-400"
                    />
                    <p class="mt-1 text-green-400/60 text-xs">Others will need this password to access your files</p>
                  </div>

                  <div>
                    <label class="block text-green-400 mb-2 text-sm">Proximity Radius</label>
                    <select
                      v-model="proximityRadius"
                      class="w-full bg-black border border-green-400/30 text-green-400 px-4 py-3 rounded font-mono focus:outline-none focus:border-green-400"
                    >
                      <option value="100">100m - Very Close</option>
                      <option value="500">500m - Close</option>
                      <option value="1000">1km - Nearby</option>
                      <option value="5000">5km - Wide Area</option>
                      <option value="0">Anywhere - Password Only</option>
                    </select>
                    <p class="mt-1 text-green-400/60 text-xs">
                      {{ proximityRadius === '0' ? 'Anyone with password can access' : `Only users within ${proximityRadius}m can access` }}
                    </p>
                  </div>

                  <div>
                    <label class="block text-green-400 mb-2 text-sm">Expiration Time</label>
                    <select
                      v-model="expirationTime"
                      class="w-full bg-black border border-green-400/30 text-green-400 px-4 py-3 rounded font-mono focus:outline-none focus:border-green-400"
                    >
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="360">6 hours</option>
                      <option value="1440">24 hours</option>
                      <option value="10080">7 days</option>
                    </select>
                  </div>
                </div>

                <button
                  @click="createRoom"
                  :disabled="!roomPassword"
                  class="w-full px-6 py-3 bg-green-400 text-black font-bold hover:bg-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  CREATE ROOM
                </button>
              </div>
            </div>
          </div>

          <!-- Room Created Success -->
          <div v-if="roomCreated" class="max-w-2xl mx-auto">
            <div class="bg-black/40 border border-green-400/30 p-8 backdrop-blur-sm">
              <div class="text-center mb-6">
                <div class="w-16 h-16 mx-auto mb-4 bg-green-400/20 border-2 border-green-400 rounded-full flex items-center justify-center">
                  <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-green-400 mb-2">Room Created!</h2>
                <p class="text-green-400/70">Share this information with others</p>
              </div>

              <div class="space-y-4 mb-6">
                <div class="bg-black border border-green-400/30 p-4 rounded">
                  <label class="block text-green-400/60 text-xs mb-1">Room Code</label>
                  <div class="flex items-center justify-between">
                    <code class="text-green-400 text-lg font-bold">{{ currentRoom.code }}</code>
                    <button @click="copyToClipboard(currentRoom.code)" class="text-green-400 hover:text-green-300">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="bg-black border border-green-400/30 p-4 rounded">
                  <label class="block text-green-400/60 text-xs mb-1">Password</label>
                  <div class="flex items-center justify-between">
                    <code class="text-green-400 font-mono">{{ currentRoom.password }}</code>
                    <button @click="copyToClipboard(currentRoom.password)" class="text-green-400 hover:text-green-300">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="bg-black border border-green-400/30 p-4 rounded">
                  <label class="block text-green-400/60 text-xs mb-1">Share Link</label>
                  <div class="flex items-center justify-between">
                    <code class="text-green-400 text-xs truncate mr-2">{{ shareLink }}</code>
                    <button @click="copyToClipboard(shareLink)" class="text-green-400 hover:text-green-300 flex-shrink-0">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- File Upload -->
              <div class="border-t border-green-400/30 pt-6">
                <h3 class="text-lg font-bold text-green-400 mb-4">Drop Files</h3>
                
                <div 
                  @drop.prevent="handleFileDrop"
                  @dragover.prevent="isDragging = true"
                  @dragleave.prevent="isDragging = false"
                  :class="[
                    'border-2 border-dashed rounded-lg p-8 text-center transition-all',
                    isDragging ? 'border-green-400 bg-green-400/10' : 'border-green-400/30'
                  ]"
                >
                  <svg class="w-12 h-12 mx-auto mb-4 text-green-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p class="text-green-400/70 mb-2">Drag & drop files here</p>
                  <p class="text-green-400/50 text-sm mb-4">or</p>
                  <label class="inline-block px-6 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all cursor-pointer">
                    Browse Files
                    <input type="file" multiple @change="handleFileSelect" class="hidden" />
                  </label>
                  <p class="text-green-400/50 text-xs mt-4">Max 10MB per file • Text, images, PDFs</p>
                </div>

                <!-- Uploaded Files -->
                <div v-if="uploadedFiles.length > 0" class="mt-6 space-y-2">
                  <h4 class="text-sm font-bold text-green-400 mb-2">Uploaded Files ({{ uploadedFiles.length }})</h4>
                  <div 
                    v-for="(file, index) in uploadedFiles" 
                    :key="index"
                    class="flex items-center justify-between bg-black border border-green-400/30 p-3 rounded"
                  >
                    <div class="flex items-center space-x-3">
                      <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p class="text-green-400 text-sm">{{ file.name }}</p>
                        <p class="text-green-400/60 text-xs">{{ formatFileSize(file.size) }}</p>
                      </div>
                    </div>
                    <button @click="removeFile(index)" class="text-red-400 hover:text-red-300">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <button 
                    @click="uploadFilesToRoom"
                    :disabled="isProcessing"
                    class="w-full mt-4 px-6 py-3 bg-green-400 text-black font-bold hover:bg-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ isProcessing ? 'UPLOADING...' : 'UPLOAD FILES' }}
                  </button>
                </div>
              </div>

              <!-- Files currently in room -->
              <div v-if="creatorRoomFiles.length > 0" class="mt-8 pt-6 border-t border-green-400/30">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="text-lg font-bold text-green-400">Files in Room ({{ creatorRoomFiles.length }})</h3>
                  <button 
                    @click="refreshCreatorFiles" 
                    :disabled="isProcessing"
                    class="text-green-400 hover:text-green-300 text-xs flex items-center disabled:opacity-50"
                  >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    REFRESH
                  </button>
                </div>
                <div class="space-y-3">
                  <div 
                    v-for="(file, index) in creatorRoomFiles" 
                    :key="index"
                    class="flex items-center justify-between bg-black border border-green-400/30 p-4 rounded"
                  >
                    <div class="flex items-center space-x-3">
                      <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p class="text-green-400">{{ file.name }}</p>
                        <p class="text-green-400/60 text-xs">{{ formatFileSize(file.size) }}</p>
                      </div>
                    </div>
                    <button 
                      @click="downloadFile(file)"
                      class="px-4 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all text-sm"
                    >
                      DOWNLOAD
                    </button>
                  </div>
                </div>
              </div>

              <div class="mt-6 flex space-x-4">
                <button
                  @click="resetRoom"
                  class="flex-1 px-6 py-3 border border-green-400/30 text-green-400 hover:border-green-400 transition-all"
                >
                  CREATE NEW ROOM
                </button>
                <button
                  @click="closeRoom"
                  :disabled="isProcessing"
                  class="flex-1 px-6 py-3 border border-red-400/30 text-red-400 hover:bg-red-400/10 hover:border-red-400 transition-all disabled:opacity-50"
                >
                  CLOSE ROOM
                </button>
              </div>
            </div>
          </div>

          <!-- Join Room Mode -->
          <div v-if="mode === 'join' && !roomJoined" class="max-w-2xl mx-auto">
            <button 
              @click="mode = null"
              class="mb-6 text-green-400/60 hover:text-green-400 flex items-center"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div class="bg-black/40 border border-green-400/30 p-8 backdrop-blur-sm">
              <h2 class="text-2xl font-bold mb-6 text-green-400">Join Drop Room</h2>
              
              <div class="space-y-4 mb-6">
                <div>
                  <label class="block text-green-400 mb-2 text-sm">Room Code</label>
                  <input
                    v-model="joinRoomCode"
                    type="text"
                    placeholder="Enter room code"
                    class="w-full bg-black border border-green-400/30 text-green-400 px-4 py-3 rounded font-mono focus:outline-none focus:border-green-400"
                  />
                </div>

                <div>
                  <label class="block text-green-400 mb-2 text-sm">Password</label>
                  <input
                    v-model="joinRoomPassword"
                    type="password"
                    placeholder="Enter password"
                    class="w-full bg-black border border-green-400/30 text-green-400 px-4 py-3 rounded font-mono focus:outline-none focus:border-green-400"
                  />
                </div>
              </div>

              <button
                @click="joinRoom"
                :disabled="!joinRoomCode || !joinRoomPassword"
                class="w-full px-6 py-3 bg-green-400 text-black font-bold hover:bg-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                JOIN ROOM
              </button>

              <p v-if="joinError" class="mt-4 text-red-400 text-sm">{{ joinError }}</p>
            </div>
          </div>

          <!-- Room Joined Success -->
          <div v-if="roomJoined" class="max-w-2xl mx-auto">
            <div class="bg-black/40 border border-green-400/30 p-8 backdrop-blur-sm">
              <h2 class="text-2xl font-bold mb-6 text-green-400">Room: {{ joinedRoomName || joinRoomCode }}</h2>
              
              <div v-if="joinedRoomFiles.length === 0" class="text-center py-12">
                <svg class="w-16 h-16 mx-auto mb-4 text-green-400/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p class="text-green-400/60">No files in this room yet</p>
              </div>

              <div v-else class="space-y-3">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="text-sm font-bold text-green-400">Available Files ({{ joinedRoomFiles.length }})</h3>
                  <button 
                    @click="refreshRoom" 
                    :disabled="isProcessing"
                    class="text-green-400 hover:text-green-300 text-xs flex items-center disabled:opacity-50"
                  >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    REFRESH
                  </button>
                </div>
                <div 
                  v-for="(file, index) in joinedRoomFiles" 
                  :key="index"
                  class="flex items-center justify-between bg-black border border-green-400/30 p-4 rounded hover:border-green-400 transition-all"
                >
                  <div class="flex items-center space-x-3">
                    <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p class="text-green-400">{{ file.name }}</p>
                      <p class="text-green-400/60 text-xs">{{ formatFileSize(file.size) }} • {{ file.uploadedAt }}</p>
                    </div>
                  </div>
                  <button 
                    @click="downloadFile(file)"
                    class="px-4 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all text-sm"
                  >
                    DOWNLOAD
                  </button>
                </div>
              </div>

              <button
                @click="leaveRoom"
                class="mt-6 w-full px-6 py-3 border border-red-400/30 text-red-400 hover:border-red-400 transition-all"
              >
                LEAVE ROOM
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section class="py-16 px-4 border-t border-green-400/20">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-3xl font-bold mb-12 text-center">HOW IT WORKS</h2>
          
          <div class="grid md:grid-cols-3 gap-6">
            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-4 bg-green-400 text-black rounded-full flex items-center justify-center font-bold text-2xl">
                1
              </div>
              <h3 class="text-lg font-bold mb-2 text-green-400">Create Room</h3>
              <p class="text-green-400/70 text-sm">
                Set up a drop room with location, password, and expiration time
              </p>
            </div>

            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-4 bg-green-400 text-black rounded-full flex items-center justify-center font-bold text-2xl">
                2
              </div>
              <h3 class="text-lg font-bold mb-2 text-green-400">Share Access</h3>
              <p class="text-green-400/70 text-sm">
                Share the room code and password with others nearby
              </p>
            </div>

            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-4 bg-green-400 text-black rounded-full flex items-center justify-center font-bold text-2xl">
                3
              </div>
              <h3 class="text-lg font-bold mb-2 text-green-400">Drop & Retrieve</h3>
              <p class="text-green-400/70 text-sm">
                Upload encrypted files or download shared files securely
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Footer -->
    <footer class="relative z-10 border-t border-green-400/20 bg-black/80 backdrop-blur-sm px-4 py-8">
      <div class="max-w-7xl mx-auto text-center text-green-400/60 text-sm">
        © 2025 ANON-NEARBY • Encrypted File Drop • Anonymous • Secure
      </div>
    </footer>

    <!-- Toast Notification -->
    <div 
      v-if="showToast"
      class="fixed bottom-4 right-4 bg-green-400 text-black px-6 py-3 rounded shadow-lg z-50 animate-slide-up"
    >
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { encryptFile, decryptFile } from '~/utils/encryption'

// Page metadata
useSeoMeta({
  title: 'File Drop - ANON-NEARBY',
  description: 'Drop encrypted files at your location. Share with proximity or one-time codes.'
})

// Composable
const { 
  createRoom: apiCreateRoom, 
  joinRoom: apiJoinRoom, 
  uploadFile: apiUploadFile, 
  downloadFile: apiDownloadFile,
  deleteRoom: apiDeleteRoom 
} = useFileDrop()

// State
const mode = ref<'create' | 'join' | null>(null)
const userLocation = ref<{ latitude: number; longitude: number } | null>(null)
const locationError = ref('')
const sessionId = ref('') // Unique session ID for this user

// Create room state
const roomName = ref('')
const roomPassword = ref('')
const proximityRadius = ref('1000')
const expirationTime = ref('60')
const roomCreated = ref(false)
const currentRoom = ref<any>(null)
const uploadedFiles = ref<File[]>([])
const creatorRoomFiles = ref<any[]>([])
const isDragging = ref(false)
const isProcessing = ref(false) // Loading state

// Join room state
const joinRoomCode = ref('')
const joinRoomPassword = ref('')
const joinError = ref('')
const roomJoined = ref(false)
const joinedRoomName = ref('')
const joinedRoomFiles = ref<any[]>([])

// Toast
const showToast = ref(false)
const toastMessage = ref('')

// Computed
const shareLink = computed(() => {
  if (!currentRoom.value) return ''
  return `${window.location.origin}/file-drop?room=${currentRoom.value.code}`
})

// Methods
const showToastMessage = (message: string) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

const requestLocation = async () => {
  try {
    locationError.value = ''
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      })
    })
    
    userLocation.value = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }
  } catch (err: any) {
    locationError.value = 'Failed to get location. Please enable location services.'
  }
}

const createRoom = async () => {
  if (!userLocation.value) {
    showToastMessage('Location is required to create a room')
    return
  }

  isProcessing.value = true
  try {
    const roomData = {
      name: roomName.value || 'Unnamed Room',
      password: roomPassword.value,
      latitude: userLocation.value.latitude,
      longitude: userLocation.value.longitude,
      radius: parseInt(proximityRadius.value),
      expiresIn: parseInt(expirationTime.value),
      sessionId: sessionId.value
    }

    const result = await apiCreateRoom(roomData)
    
    currentRoom.value = {
      ...roomData,
      code: result.room.code,
      createdAt: new Date().toISOString()
    }
    
    roomCreated.value = true
    showToastMessage('Room created successfully!')
  } catch (error: any) {
    showToastMessage(error.message || 'Failed to create room')
  } finally {
    isProcessing.value = false
  }
}

const resetRoom = () => {
  roomCreated.value = false
  currentRoom.value = null
  uploadedFiles.value = []
  creatorRoomFiles.value = []
  roomName.value = ''
  roomPassword.value = ''
  mode.value = null
}

const closeRoom = async () => {
  if (!confirm('Are you sure you want to close this room? This will delete all files and the room permanently.')) return

  isProcessing.value = true
  try {
    if (currentRoom.value) {
      await apiDeleteRoom(
        currentRoom.value.code,
        currentRoom.value.password,
        sessionId.value
      )
      showToastMessage('Room closed successfully')
      resetRoom()
    }
  } catch (error: any) {
    showToastMessage(error.message || 'Failed to close room')
  } finally {
    isProcessing.value = false
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    addFiles(Array.from(target.files))
  }
}

const handleFileDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files))
  }
}

const addFiles = (files: File[]) => {
  const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024) // 10MB limit
  uploadedFiles.value.push(...validFiles)
  
  if (validFiles.length < files.length) {
    showToastMessage('Some files were too large (max 10MB)')
  } else {
    showToastMessage(`${validFiles.length} file(s) added`)
  }
}

const removeFile = (index: number) => {
  uploadedFiles.value.splice(index, 1)
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const refreshCreatorFiles = async () => {
  if (!currentRoom.value) return
  
  try {
    const result = await apiJoinRoom(
      currentRoom.value.code,
      currentRoom.value.password,
      currentRoom.value.latitude,
      currentRoom.value.longitude,
      sessionId.value
    )
    creatorRoomFiles.value = result.room.files || []
  } catch (e) {
    console.error('Failed to refresh creator files', e)
  }
}

const uploadFilesToRoom = async () => {
  if (uploadedFiles.value.length === 0) return
  
  isProcessing.value = true
  let successCount = 0
  let failCount = 0
  
  try {
    for (const file of uploadedFiles.value) {
      try {
        // 1. Encrypt file
        const encryptedData = await encryptFile(file, currentRoom.value.password)
        
        // 2. Upload
        await apiUploadFile(
          currentRoom.value.code,
          currentRoom.value.password,
          sessionId.value,
          {
            name: file.name,
            size: file.size,
            type: file.type,
            encryptedData: encryptedData
          }
        )
        successCount++
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err)
        failCount++
      }
    }
    
    if (successCount > 0) {
      showToastMessage(`Successfully uploaded ${successCount} file(s)`)
      uploadedFiles.value = [] // Clear list on success
      await refreshCreatorFiles()
    }
    
    if (failCount > 0) {
      showToastMessage(`Failed to upload ${failCount} file(s)`)
    }
  } catch (error: any) {
    showToastMessage(error.message || 'Upload failed')
  } finally {
    isProcessing.value = false
  }
}

const refreshRoom = async () => {
  isProcessing.value = true
  try {
    const lat = userLocation.value?.latitude || 0
    const lng = userLocation.value?.longitude || 0
    
    const result = await apiJoinRoom(
      joinRoomCode.value, 
      joinRoomPassword.value, 
      lat, 
      lng, 
      sessionId.value
    )
    
    joinedRoomFiles.value = result.room.files || []
    showToastMessage('Refreshed file list')
  } catch (error: any) {
    showToastMessage('Failed to refresh')
  } finally {
    isProcessing.value = false
  }
}

const joinRoom = async () => {
  if (!joinRoomCode.value || !joinRoomPassword.value) {
    joinError.value = 'Please enter both room code and password'
    return
  }

  // Try to get location if not available, but don't block if it fails (backend will validate)
  if (!userLocation.value) {
    try {
      await requestLocation()
    } catch (e) {
      // Continue without location
    }
  }

  isProcessing.value = true
  joinError.value = ''
  
  try {
    const lat = userLocation.value?.latitude || 0
    const lng = userLocation.value?.longitude || 0
    
    const result = await apiJoinRoom(
      joinRoomCode.value, 
      joinRoomPassword.value, 
      lat, 
      lng, 
      sessionId.value
    )
    
    joinedRoomName.value = result.room.name
    joinedRoomFiles.value = result.room.files || []
    roomJoined.value = true
    showToastMessage('Joined room successfully!')
  } catch (error: any) {
    joinError.value = error.message || 'Failed to join room'
    showToastMessage(error.message || 'Failed to join room')
  } finally {
    isProcessing.value = false
  }
}

const leaveRoom = () => {
  roomJoined.value = false
  joinedRoomFiles.value = []
  joinRoomCode.value = ''
  joinRoomPassword.value = ''
  mode.value = null
}

const downloadFile = async (file: any) => {
  isProcessing.value = true
  showToastMessage(`Downloading ${file.name}...`)
  
  // Determine credentials based on mode
  const code = mode.value === 'create' ? currentRoom.value?.code : joinRoomCode.value
  const password = mode.value === 'create' ? currentRoom.value?.password : joinRoomPassword.value
  
  if (!code || !password) {
    showToastMessage('Missing room credentials')
    isProcessing.value = false
    return
  }

  if (!file.id) {
    console.error('File object missing ID:', file)
    showToastMessage('Invalid file ID')
    isProcessing.value = false
    return
  }
  
  try {
    const result = await apiDownloadFile(
      code,
      password,
      sessionId.value,
      file.id
    )
    
    if (!result.file || !result.file.encryptedData) {
      throw new Error('Server returned empty file data')
    }
    
    // Decrypt file
    const decryptedFile = await decryptFile(
      result.file.encryptedData, 
      password,
      file.name,
      file.type
    )
    
    // Create download link
    const url = URL.createObjectURL(decryptedFile)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    showToastMessage('File downloaded successfully')
  } catch (error: any) {
    console.error('Download error:', error)
    showToastMessage(error.message || 'Failed to download file')
  } finally {
    isProcessing.value = false
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    showToastMessage('Copied to clipboard!')
  } catch (err) {
    showToastMessage('Failed to copy')
  }
}

// Initialize
onMounted(() => {
  // Generate session ID if not exists
  if (!sessionId.value) {
    sessionId.value = Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  // Check for room code in URL
  const urlParams = new URLSearchParams(window.location.search)
  const roomCode = urlParams.get('room')
  if (roomCode) {
    mode.value = 'join'
    joinRoomCode.value = roomCode
  }
})
</script>

<style scoped>
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>
