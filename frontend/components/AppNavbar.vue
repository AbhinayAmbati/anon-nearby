<template>
  <nav class="sticky top-0 z-50 border-b border-green-400/20 bg-black/80 backdrop-blur-sm text-green-400 w-full">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <NuxtLink to="/" class="text-xl font-bold tracking-widest hover:text-green-300 transition-colors">
          ANON-NEARBY
        </NuxtLink>
        
        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center space-x-6">
          <NuxtLink to="/about" class="flex items-center hover:text-green-300 transition-colors text-sm" active-class="text-green-300">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            ABOUT
          </NuxtLink>
          <NuxtLink to="/file-drop" class="flex items-center hover:text-green-300 transition-colors text-sm" active-class="text-green-300">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            FILE DROP
          </NuxtLink>
          <NuxtLink to="/chat" class="flex items-center px-4 py-2 border border-green-400 hover:bg-green-400 hover:text-black transition-all text-sm" active-class="bg-green-400 text-black">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            ENTER CHAT
          </NuxtLink>
        </div>

        <!-- Mobile Menu Button -->
        <div class="md:hidden flex items-center">
          <button @click="isOpen = !isOpen" class="text-green-400 hover:text-green-300 focus:outline-none">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path v-if="!isOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div v-if="isOpen" class="md:hidden border-t border-green-400/20 bg-black/95 backdrop-blur-sm">
      <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        <NuxtLink 
          to="/about" 
          class="flex items-center px-3 py-2 text-base font-medium hover:text-green-300 hover:bg-green-400/10 rounded-md transition-colors" 
          active-class="text-green-300 bg-green-400/10"
          @click="isOpen = false"
        >
          <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          ABOUT
        </NuxtLink>
        <NuxtLink 
          to="/file-drop" 
          class="flex items-center px-3 py-2 text-base font-medium hover:text-green-300 hover:bg-green-400/10 rounded-md transition-colors" 
          active-class="text-green-300 bg-green-400/10"
          @click="isOpen = false"
        >
          <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
          FILE DROP
        </NuxtLink>
        <NuxtLink 
          to="/chat" 
          class="flex items-center justify-center px-3 py-2 text-base font-medium border border-green-400 mt-4 hover:bg-green-400 hover:text-black transition-all" 
          active-class="bg-green-400 text-black"
          @click="isOpen = false"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          ENTER CHAT
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const isOpen = ref(false)
</script>
