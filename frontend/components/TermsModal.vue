<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
    <div class="bg-black border-2 border-green-400 max-w-lg w-full p-6 sm:p-8 relative shadow-[0_0_20px_rgba(74,222,128,0.2)]">
      <!-- Header -->
      <div class="text-center mb-6">
        <div class="w-16 h-16 mx-auto mb-4 border-2 border-green-400 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-green-400 tracking-wider">TERMS & PRIVACY</h2>
      </div>

      <!-- Content -->
      <div class="space-y-4 text-green-400/80 font-mono text-sm leading-relaxed mb-8">
        <p>
          <strong class="text-green-400">This app is anonymous.</strong> No data is stored. Your usage is ephemeral.
        </p>
        <p>
          But you agree not to use this app for <strong class="text-red-400">illegal or harmful activities</strong>.
        </p>
        <p>
          We do not store messages or files. You are responsible for your own behavior. Misuse is not allowed.
        </p>
        <div class="p-3 border border-green-400/30 bg-green-400/5 text-xs">
          <p class="font-bold text-green-400 mb-1">DISCLAIMER:</p>
          <p>
            We are not responsible for any data loss, user interactions, or issues you may encounter while using this application. The service is provided "as is" without warranties.
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-4">
        <button 
          @click="accept" 
          class="flex-1 px-6 py-3 bg-green-400 text-black font-bold hover:bg-green-500 transition-all tracking-wider"
        >
          AGREE & ENTER
        </button>
        <button 
          @click="exit" 
          class="flex-1 px-6 py-3 border border-red-400 text-red-400 font-bold hover:bg-red-400 hover:text-black transition-all tracking-wider"
        >
          EXIT
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const isOpen = ref(true)
let checkInterval: NodeJS.Timeout | null = null

const checkTerms = () => {
  const accepted = localStorage.getItem('terms_accepted')
  if (accepted) {
    isOpen.value = false
  } else {
    isOpen.value = true
  }
}

// Check if user has already accepted and start polling
onMounted(() => {
  checkTerms()
  // Check every second to handle manual storage clearing
  checkInterval = setInterval(checkTerms, 1000)
  
  // Also listen for storage events from other tabs
  window.addEventListener('storage', checkTerms)
})

onUnmounted(() => {
  if (checkInterval) clearInterval(checkInterval)
  window.removeEventListener('storage', checkTerms)
})

const accept = () => {
  localStorage.setItem('terms_accepted', 'true')
  isOpen.value = false
}

const exit = () => {
  // Redirect to Google or close tab
  window.history.back();
}
</script>
