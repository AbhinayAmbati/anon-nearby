<template>
  <div class="loading-screen">
    <div class="loading-content">
      <div class="grid-logo">
        <div class="grid-lines">
          <div v-for="i in 12" :key="i" class="grid-line" :style="{ '--delay': i * 0.1 + 's' }"></div>
        </div>
        <div class="logo-text">{{ title }}</div>
      </div>
      
      <div class="loading-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <p class="loading-text">{{ message }}</p>
      </div>

      <div v-if="error" class="error-message">
        <p>{{ error }}</p>
        <button @click="$emit('retry')" class="retry-btn">
          RETRY CONNECTION
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  message: string
  progress: number
  error?: string
}>()

defineEmits<{
  retry: []
}>()
</script>

<style scoped>
.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
}

.loading-content {
  text-align: center;
  max-width: 400px;
}

.grid-logo {
  position: relative;
  margin-bottom: 3rem;
}

.grid-lines {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 1rem;
}

.grid-line {
  position: absolute;
  background: #4ade80;
  opacity: 0;
  animation: grid-pulse 2s ease-in-out infinite;
  animation-delay: var(--delay);
}

.grid-line:nth-child(odd) {
  width: 2px;
  height: 100%;
  left: calc(var(--delay) * 10px);
}

.grid-line:nth-child(even) {
  height: 2px;
  width: 100%;
  top: calc(var(--delay) * 10px);
}

.logo-text {
  font-family: 'Courier New', monospace;
  font-size: 1.5rem;
  font-weight: 600;
  color: #4ade80;
  letter-spacing: 2px;
}

.loading-progress {
  margin-bottom: 2rem;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #374151;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #166534, #4ade80);
  transition: width 0.3s ease;
  border-radius: 2px;
}

.loading-text {
  color: #4ade80;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  opacity: 0.8;
  margin: 0;
}

.error-message {
  color: #f87171;
  font-family: 'Courier New', monospace;
}

.error-message p {
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.retry-btn {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid #4ade80;
  color: #4ade80;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #4ade80;
  color: #111827;
}

@keyframes grid-pulse {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}
</style>