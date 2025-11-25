<template>
  <div class="min-h-screen bg-black text-green-400 font-mono flex flex-col">
    <!-- Matrix background effect -->
    <MatrixBackground />
    
    <!-- Navigation -->


    <div class="relative z-10 flex-grow">
      <!-- Hero Section -->
      <section class="py-20 px-4">
        <div class="max-w-4xl mx-auto text-center">
          <h1 class="text-5xl md:text-6xl font-bold mb-6 tracking-wider">
            ABOUT ANON-NEARBY
          </h1>
          <p class="text-xl text-green-400/70 leading-relaxed">
            A location-based anonymous chat application that connects strangers within proximity for ephemeral conversations.
          </p>
        </div>
      </section>

      <!-- Mission Section -->
      <section class="py-16 px-4 border-t border-green-400/20">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-3xl font-bold mb-8 text-center">OUR MISSION</h2>
          <div class="space-y-6 text-green-400/80 leading-relaxed">
            <p class="text-lg">
              In an age of permanent digital footprints and constant surveillance, ANON-NEARBY offers something different: 
              <span class="text-green-400 font-semibold">truly ephemeral, anonymous connections</span> with people near you.
            </p>
            <p class="text-lg">
              We believe in the power of spontaneous human connection without the burden of identity, history, or permanence. 
              Sometimes you just want to talk to someone nearby without the commitment of actually meeting them or leaving a trace.
            </p>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section class="py-16 px-4 border-t border-green-400/20">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-3xl font-bold mb-12 text-center">HOW IT WORKS</h2>
          <div class="space-y-8">
            <!-- Step 1 -->
            <div class="flex items-start space-x-6 bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
              <div class="flex-shrink-0 w-12 h-12 bg-green-400 text-black rounded-full flex items-center justify-center font-bold text-xl">
                1
              </div>
              <div>
                <h3 class="text-xl font-bold mb-2">Get a Random Codename</h3>
                <p class="text-green-400/70">
                  No registration needed. The system assigns you a creative codename like "CipherNode_42" or "VectorStar_73" 
                  to maintain anonymity while adding personality.
                </p>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="flex items-start space-x-6 bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
              <div class="flex-shrink-0 w-12 h-12 bg-green-400 text-black rounded-full flex items-center justify-center font-bold text-xl">
                2
              </div>
              <div>
                <h3 class="text-xl font-bold mb-2">Enable Location</h3>
                <p class="text-green-400/70">
                  Grant temporary location access. Your coordinates are used only for proximity matching and are never stored permanently. 
                  Choose your search radius: 500m, 1km, 3km, or 5km.
                </p>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="flex items-start space-x-6 bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
              <div class="flex-shrink-0 w-12 h-12 bg-green-400 text-black rounded-full flex items-center justify-center font-bold text-xl">
                3
              </div>
              <div>
                <h3 class="text-xl font-bold mb-2">Smart Matchmaking</h3>
                <p class="text-green-400/70">
                  Our intelligent algorithm scans for nearby users and creates optimal matches based on distance, wait time, 
                  and compatibility. When a match is found, you're instantly connected.
                </p>
              </div>
            </div>

            <!-- Step 4 -->
            <div class="flex items-start space-x-6 bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
              <div class="flex-shrink-0 w-12 h-12 bg-green-400 text-black rounded-full flex items-center justify-center font-bold text-xl">
                4
              </div>
              <div>
                <h3 class="text-xl font-bold mb-2">Chat Anonymously</h3>
                <p class="text-green-400/70">
                  Engage in real-time conversation through WebSocket connections. Messages are never stored in any database—they 
                  exist only in memory during your active session.
                </p>
              </div>
            </div>

            <!-- Step 5 -->
            <div class="flex items-start space-x-6 bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
              <div class="flex-shrink-0 w-12 h-12 bg-green-400 text-black rounded-full flex items-center justify-center font-bold text-xl">
                5
              </div>
              <div>
                <h3 class="text-xl font-bold mb-2">Disconnect & Vanish</h3>
                <p class="text-green-400/70">
                  When either participant disconnects, all messages are instantly destroyed. No history, no traces, no records. 
                  It's like the conversation never happened.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- New Feature: File Drop -->
      <section class="py-16 px-4 border-t border-green-400/20">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-3xl font-bold mb-12 text-center">NEW: EPHEMERAL FILE RELAY</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div class="space-y-6 text-green-400/80 leading-relaxed">
              <p class="text-lg">
                We've expanded beyond chat with <span class="text-green-400 font-semibold">File Drop</span>, a secure way to share files without leaving a trace.
              </p>
              <ul class="space-y-4">
                <li class="flex items-start">
                  <span class="mr-3 text-xl">🔒</span>
                  <span><strong>End-to-End Encryption:</strong> Files are encrypted in your browser using AES-256-GCM before they ever touch the network.</span>
                </li>
                <li class="flex items-start">
                  <span class="mr-3 text-xl">⚡</span>
                  <span><strong>Serverless Relay:</strong> We stream your encrypted data directly to the recipient. We never store your files, not even for a second.</span>
                </li>
                <li class="flex items-start">
                  <span class="mr-3 text-xl">📍</span>
                  <span><strong>Location or Code:</strong> Share with people nearby using geolocation or create a private room with a unique code.</span>
                </li>
              </ul>
            </div>
            <div class="bg-black/40 border border-green-400/30 p-8 backdrop-blur-sm text-center">
              <div class="w-24 h-24 mx-auto mb-6 border-2 border-green-400 rounded-lg flex items-center justify-center">
                <svg class="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-4 text-green-400">Ready to Share?</h3>
              <p class="text-green-400/60 mb-6">
                Experience secure, anonymous file transfer today.
              </p>
              <NuxtLink 
                to="/file-drop" 
                class="inline-block px-8 py-3 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all font-bold"
              >
                TRY FILE DROP
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <!-- Technical Architecture -->
      <section class="py-16 px-4 border-t border-green-400/20">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-3xl font-bold mb-12 text-center">TECHNICAL ARCHITECTURE</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Frontend -->
            <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
              <h3 class="text-xl font-bold mb-4 flex items-center">
                <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Frontend
              </h3>
              <ul class="space-y-2 text-green-400/70">
                <li class="flex items-start">
                  <span class="mr-2">▸</span>
                  <span><strong class="text-green-400">Nuxt.js 4</strong> - Modern Vue framework</span>
                </li>
                <li class="flex items-start">
                  <span class="mr-2">▸</span>
                  <span><strong class="text-green-400">Tailwind CSS</strong> - Utility-first styling</span>
                </li>
                <li class="flex items-start">
                  <span class="mr-2">▸</span>
                  <span><strong class="text-green-400">Socket.IO Client</strong> - Real-time communication</span>
                </li>
                <li class="flex items-start">
                  <span class="mr-2">▸</span>
                  <span><strong class="text-green-400">HTML5 Geolocation</strong> - Location services</span>
                </li>
                <li class="flex items-start">
                  <span class="mr-2">▸</span>
                  <span><strong class="text-green-400">Web Crypto API</strong> - Client-side encryption</span>
                </li>
              </ul>
            </div>

            <!-- Backend -->
            <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
              <h3 class="text-xl font-bold mb-4 flex items-center">
                <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                Backend
              </h3>
              <ul class="space-y-2 text-green-400/70">
                <li class="flex items-start">
                  <span class="mr-2">▸</span>
                  <span><strong class="text-green-400">Node.js + Express</strong> - Server foundation</span>
                </li>
                <li class="flex items-start">
                  <span class="mr-2">▸</span>
                  <span><strong class="text-green-400">Socket.IO</strong> - WebSocket server</span>
                </li>
                <li class="flex items-start">
                  <span class="mr-2">▸</span>
                  <span><strong class="text-green-400">MongoDB</strong> - Session management</span>
                </li>
                <li class="flex items-start">
                  <span class="mr-2">▸</span>
                  <span><strong class="text-green-400">Redis</strong> - Geospatial queries</span>
                </li>
              </ul>
            </div>

            <!-- Security -->
            <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
              <h3 class="text-xl font-bold mb-4 flex items-center">
                <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Security & Privacy
              </h3>
              <ul class="space-y-2 text-green-400/70">
                <li class="flex items-start">
                  <span class="mr-2">▸</span>
                  <span><strong class="text-green-400">Zero Persistence</strong> - No message storage</span>
                </li>
                <li class="flex items-start">
                  <span class="mr-2">▸</span>
                  <span><strong class="text-green-400">Anonymous Sessions</strong> - No personal data</span>
                </li>
                <li class="flex items-start">
                  <span class="mr-2">▸</span>
                  <span><strong class="text-green-400">Auto-Cleanup</strong> - Data deleted on disconnect</span>
                </li>
                <li class="flex items-start">
                  <span class="mr-2">▸</span>
                  <span><strong class="text-green-400">Rate Limiting</strong> - Spam prevention</span>
                </li>
              </ul>
            </div>


          </div>
        </div>
      </section>

      <!-- Privacy Principles -->
      <section class="py-16 px-4 border-t border-green-400/20">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-3xl font-bold mb-12 text-center">PRIVACY PRINCIPLES</h2>
          
          <div class="space-y-6">
            <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
              <h3 class="text-xl font-bold mb-3 text-green-400">🔒 Zero Persistence Architecture</h3>
              <p class="text-green-400/70 leading-relaxed">
                Messages flow through WebSocket connections and exist only in browser memory. When you disconnect, 
                everything vanishes instantly. No databases, no logs, no traces.
              </p>
            </div>

            <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
              <h3 class="text-xl font-bold mb-3 text-green-400">👤 Complete Anonymity</h3>
              <p class="text-green-400/70 leading-relaxed">
                No accounts, no profiles, no personal information. You're identified only by a temporary codename 
                that changes with each session. We can't link you to your conversations.
              </p>
            </div>

            <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
              <h3 class="text-xl font-bold mb-3 text-green-400">📍 Location Privacy</h3>
              <p class="text-green-400/70 leading-relaxed">
                Your coordinates are used only for proximity matching and are never stored permanently. 
                Location data is automatically deleted when you disconnect.
              </p>
            </div>


          </div>
        </div>
      </section>

      <!-- Open Source -->
      <section class="py-16 px-4 border-t border-green-400/20">
        <div class="max-w-4xl mx-auto text-center">
          <h2 class="text-3xl font-bold mb-6">OPEN SOURCE</h2>
          <p class="text-green-400/70 text-lg mb-8 leading-relaxed">
            ANON-NEARBY is fully open source under the MIT License. You can review the code, 
            contribute improvements, or deploy your own instance.
          </p>
          <a 
            href="https://github.com/AbhinayAmbati/anon-nearby" 
            target="_blank"
            class="inline-flex items-center px-8 py-4 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all font-semibold"
          >
            <svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            VIEW ON GITHUB
          </a>
        </div>
      </section>

      <!-- CTA -->
      <section class="py-20 px-4">
        <div class="max-w-4xl mx-auto text-center">
          <h2 class="text-4xl font-bold mb-6">Ready to Connect?</h2>
          <p class="text-green-400/70 text-lg mb-8">
            Start chatting with nearby strangers. No registration required.
          </p>
          <NuxtLink 
            to="/chat" 
            class="inline-block px-12 py-5 bg-green-400 text-black font-bold tracking-widest hover:bg-green-500 transition-all text-xl"
          >
            ENTER THE GRID
          </NuxtLink>
        </div>
      </section>
    </div>

    <!-- Footer -->
    <!-- Footer -->
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
// Page metadata
useSeoMeta({
  title: 'About - ANON-NEARBY',
  description: 'Learn about ANON-NEARBY, a location-based anonymous chat application with zero persistence and complete privacy.'
})
</script>
