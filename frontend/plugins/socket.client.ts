export default defineNuxtPlugin(() => {
  // Client-side only socket initialization
  if (process.client) {
    // Socket.IO will be loaded on demand
  }
})