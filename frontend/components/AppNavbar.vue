<template>
  <nav class="sticky top-0 z-50 border-b border-green-400/20 bg-black/80 backdrop-blur-sm text-green-400 w-full">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <NuxtLink to="/" class="text-xl font-bold tracking-widest hover:text-green-300 transition-colors">
          ANON-NEARBY
        </NuxtLink>
        
        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center space-x-6">
          <NuxtLink to="/about" class="hover:text-green-300 transition-colors text-sm" active-class="text-green-300">ABOUT</NuxtLink>
          <NuxtLink to="/file-drop" class="hover:text-green-300 transition-colors text-sm" active-class="text-green-300">FILE DROP</NuxtLink>
          <NuxtLink to="/chat" class="px-4 py-2 border border-green-400 hover:bg-green-400 hover:text-black transition-all text-sm" active-class="bg-green-400 text-black">
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
          class="block px-3 py-2 text-base font-medium hover:text-green-300 hover:bg-green-400/10 rounded-md transition-colors" 
          active-class="text-green-300 bg-green-400/10"
          @click="isOpen = false"
        >
          ABOUT
        </NuxtLink>
        <NuxtLink 
          to="/file-drop" 
          class="block px-3 py-2 text-base font-medium hover:text-green-300 hover:bg-green-400/10 rounded-md transition-colors" 
          active-class="text-green-300 bg-green-400/10"
          @click="isOpen = false"
        >
          FILE DROP
        </NuxtLink>
        <NuxtLink 
          to="/chat" 
          class="block px-3 py-2 text-base font-medium border border-green-400 text-center mt-4 hover:bg-green-400 hover:text-black transition-all" 
          active-class="bg-green-400 text-black"
          @click="isOpen = false"
        >
          ENTER CHAT
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const isOpen = ref(false)
</script>
