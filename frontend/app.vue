<script setup lang="ts">
import { Analytics } from '@vercel/analytics/nuxt';
</script>

<template>
  <div>
    <Analytics />
    <AppNavbar />
    <NuxtPage />
    <TermsModal />
  </div>
</template>

<style>
/* Enhanced Matrix-themed scrollbar */
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::-webkit-scrollbar-track {
  background: #0d1117;
  border-left: 1px solid #21262d;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #008f11 0%, #004d0a 100%);
  border-radius: 6px;
  border: 2px solid #0d1117;
  transition: all 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #00ff41 0%, #008f11 100%);
  box-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
  border-color: #008f11;
}

::-webkit-scrollbar-thumb:active {
  background: #00ff41;
  box-shadow: 0 0 15px rgba(0, 255, 65, 0.8);
}

/* Firefox scrollbar */
* {
  scrollbar-width: thin;
  scrollbar-color: #008f11 #0d1117;
}
</style>
