<template>
  <div class="min-h-screen bg-black text-green-400 font-mono overflow-hidden flex flex-col">
    <!-- Matrix background effect -->
    <MatrixBackground />
    
    <!-- Navigation -->


    <!-- Hero Section -->
    <section class="relative z-10 pt-20 pb-32 px-4">
      <div class="max-w-7xl mx-auto text-center">
        <div class="mb-8 inline-block">
          <div class="w-20 h-20 mx-auto mb-6 border-2 border-green-400 rounded-full flex items-center justify-center animate-pulse">
            <svg class="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        
        <h1 class="text-5xl md:text-7xl font-bold mb-6 tracking-wider">
          <span class="text-green-400">ANON</span>
          <span class="text-green-300">-</span>
          <span class="text-green-400">NEARBY</span>
        </h1>
        
        <p class="text-xl md:text-2xl text-green-400/80 mb-4 max-w-3xl mx-auto">
          Anonymous • Ephemeral • Secure
        </p>
        
        <p class="text-lg text-green-400/60 mb-12 max-w-2xl mx-auto">
          Connect with strangers nearby. No accounts. No history. No traces.
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <NuxtLink 
            to="/chat" 
            class="px-8 py-4 bg-green-400 text-black font-bold tracking-wider hover:bg-green-500 transition-all text-lg animate-pulse"
          >
            START CHATTING
          </NuxtLink>
          <NuxtLink 
            to="/file-drop" 
            class="px-8 py-4 border border-green-400 text-green-400 font-bold tracking-wider hover:bg-green-400 hover:text-black transition-all text-lg"
          >
            DROP FILES
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Bento Grid Features -->
    <section class="relative z-10 py-20 px-4">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-3xl md:text-4xl font-bold text-center mb-16 tracking-wider">
          FEATURES
        </h2>
        
        <!-- Bento Grid Layout -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr">
          <!-- Large Feature 1 - Anonymous Chat -->
          <div class="md:col-span-2 md:row-span-2 bg-black/40 border border-green-400/30 p-8 hover:border-green-400 transition-all group backdrop-blur-sm">
            <div class="h-full flex flex-col justify-between">
              <div>
                <div class="w-16 h-16 mb-6 border-2 border-green-400 rounded-lg flex items-center justify-center group-hover:animate-pulse">
                  <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 class="text-2xl font-bold mb-4 text-green-400">Anonymous Proximity Chat</h3>
                <p class="text-green-400/70 mb-4 leading-relaxed">
                  Connect instantly with people within 500m to 5km radius. No registration, no profiles, just pure anonymous conversation.
                </p>
                <ul class="space-y-2 text-green-400/60 text-sm">
                  <li class="flex items-start">
                    <span class="mr-2">▸</span>
                    <span>Smart matchmaking with distance-based ranking</span>
                  </li>
                  <li class="flex items-start">
                    <span class="mr-2">▸</span>
                    <span>Create rooms & share links with friends</span>
                  </li>
                  <li class="flex items-start">
                    <span class="mr-2">▸</span>
                    <span>Real-time typing indicators</span>
                  </li>
                  <li class="flex items-start">
                    <span class="mr-2">▸</span>
                    <span>Messages vanish when chat ends</span>
                  </li>
                </ul>
              </div>
              <div class="mt-6">
                <NuxtLink to="/chat" class="inline-block px-6 py-3 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all font-semibold">
                  ENTER CHAT →
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Feature 2 - Encrypted File Drop -->
          <div class="bg-black/40 border border-green-400/30 p-6 hover:border-green-400 transition-all group backdrop-blur-sm">
            <div class="w-12 h-12 mb-4 border-2 border-green-400 rounded-lg flex items-center justify-center group-hover:animate-pulse">
              <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-3 text-green-400">Encrypted File Drop</h3>
            <p class="text-green-400/70 text-sm leading-relaxed">
              Drop encrypted files at your location. Share with proximity or one-time codes.
            </p>
          </div>

          <!-- Feature 3 - Zero Persistence -->
          <div class="bg-black/40 border border-green-400/30 p-6 hover:border-green-400 transition-all group backdrop-blur-sm">
            <div class="w-12 h-12 mb-4 border-2 border-green-400 rounded-lg flex items-center justify-center group-hover:animate-pulse">
              <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-3 text-green-400">Zero Persistence</h3>
            <p class="text-green-400/70 text-sm leading-relaxed">
              Messages never touch a database. Everything lives in memory and vanishes on disconnect.
            </p>
          </div>

          <!-- NEW: Feature - Public & Private Rooms -->
          <div class="md:col-span-2 bg-black/40 border border-green-400/30 p-6 hover:border-green-400 transition-all group backdrop-blur-sm">
            <div class="flex items-start space-x-4">
              <div class="w-12 h-12 flex-shrink-0 border-2 border-green-400 rounded-lg flex items-center justify-center group-hover:animate-pulse">
                <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold mb-3 text-green-400">Public & Private Rooms</h3>
                <p class="text-green-400/70 text-sm leading-relaxed mb-3">
                  Join location-based <strong>Public Groups</strong> to chat with everyone nearby, or create named <strong>Private Rooms</strong> with shareable links for friends.
                </p>
                <div class="flex flex-wrap gap-2">
                  <span class="px-3 py-1 bg-green-400/10 border border-green-400/30 text-green-400 text-xs">Public Groups</span>
                  <span class="px-3 py-1 bg-green-400/10 border border-green-400/30 text-green-400 text-xs">Private Links</span>
                  <span class="px-3 py-1 bg-green-400/10 border border-green-400/30 text-green-400 text-xs">Multi-User</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Feature 4 - Location Privacy -->
          <div class="md:col-span-2 bg-black/40 border border-green-400/30 p-6 hover:border-green-400 transition-all group backdrop-blur-sm">
            <div class="flex items-start space-x-4">
              <div class="w-12 h-12 flex-shrink-0 border-2 border-green-400 rounded-lg flex items-center justify-center group-hover:animate-pulse">
                <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold mb-3 text-green-400">Location Privacy First</h3>
                <p class="text-green-400/70 text-sm leading-relaxed mb-3">
                  Your coordinates are used only for proximity matching. No permanent storage, no tracking, no history.
                </p>
                <div class="flex flex-wrap gap-2">
                  <span class="px-3 py-1 bg-green-400/10 border border-green-400/30 text-green-400 text-xs">No GPS Tracking</span>
                  <span class="px-3 py-1 bg-green-400/10 border border-green-400/30 text-green-400 text-xs">Temporary Only</span>
                  <span class="px-3 py-1 bg-green-400/10 border border-green-400/30 text-green-400 text-xs">Auto-Delete</span>
                </div>
              </div>
            </div>
          </div>



          <!-- Feature 6 - Open Source -->
          <div class="bg-black/40 border border-green-400/30 p-6 hover:border-green-400 transition-all group backdrop-blur-sm">
            <div class="flex items-start space-x-4">
              <div class="w-12 h-12 flex-shrink-0 border-2 border-green-400 rounded-lg flex items-center justify-center group-hover:animate-pulse">
                <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold mb-3 text-green-400">Open Source & Transparent</h3>
                <p class="text-green-400/70 text-sm leading-relaxed">
                  Built with modern web technologies: Nuxt.js, Socket.IO, Redis, MongoDB. Fully open source under MIT license.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="relative z-10 py-20 px-4 border-t border-green-400/20">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="text-5xl font-bold text-green-400 mb-2">0</div>
            <div class="text-green-400/60 text-sm uppercase tracking-wider">Data Stored</div>
          </div>
          <div class="text-center">
            <div class="text-5xl font-bold text-green-400 mb-2">100%</div>
            <div class="text-green-400/60 text-sm uppercase tracking-wider">Anonymous</div>
          </div>
          <div class="text-center">
            <div class="text-5xl font-bold text-green-400 mb-2">∞</div>
            <div class="text-green-400/60 text-sm uppercase tracking-wider">Privacy</div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="relative z-10 py-32 px-4">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-4xl md:text-5xl font-bold mb-6 tracking-wider text-green-400">
          Ready to Connect?
        </h2>
        <p class="text-xl text-green-400/70 mb-12">
          No sign-up required. Just enable location and start chatting.
        </p>
        <NuxtLink 
          to="/chat" 
          class="inline-block px-8 py-4 bg-green-400 text-white font-bold rounded-full hover:bg-green-500 transition-colors"
        >
          Get Started
        </NuxtLink>
      </div>
    </section>

    <!-- Footer -->
    <AppFooter />


  </div>
</template>

<script setup lang="ts">
// No extra script needed for modal as it handles its own state
</script>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
