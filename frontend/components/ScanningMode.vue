<template>
  <div class="scanning-interface">
    <div class="scanner-container">
      <div class="scanner-grid">
        <!-- Radar circles -->
        <div v-for="i in 3" :key="i" class="radar-circle" :style="{ '--delay': i * 0.5 + 's' }"></div>
        
        <!-- Center dot -->
        <div class="center-dot pulse-green"></div>
        
        <!-- Scanning line -->
        <div class="scanner-line"></div>
      </div>
      
      <div class="status-text">
        <h3 class="text-lg font-mono text-green-400 mb-2">{{ codename }}</h3>
        <p class="text-sm text-green-400/70 mb-4">{{ statusText }}</p>
        
        <div class="scanning-dots">
          <span>Scanning for nearby nodes</span>
          <span class="dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  codename: string
  statusText: string
}>()
</script>

<style scoped>
.scanning-interface {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
}

.scanner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.scanner-grid {
  position: relative;
  width: 16rem;
  height: 16rem;
}

.radar-circle {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(0, 255, 65, 0.3);
  border-radius: 50%;
  animation: radar-pulse 3s ease-in-out infinite;
  animation-delay: var(--delay);
}

.center-dot {
  position: absolute;
  width: 0.75rem;
  height: 0.75rem;
  background: #4ade80;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: pulse-green 2s infinite;
}

.scanner-line {
  position: absolute;
  width: 100%;
  height: 0.125rem;
  background: linear-gradient(to right, transparent, #4ade80, transparent);
  top: 50%;
  transform: translateY(-50%);
  animation: scanner 2s ease-in-out infinite;
}

.status-text {
  text-align: center;
}

.scanning-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  color: rgba(74, 222, 128, 0.6);
}

@keyframes pulse-green {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes scanner {
  0% {
    transform: translateY(-50%) translateX(-100%);
  }
  100% {
    transform: translateY(-50%) translateX(100%);
  }
}

.dots span {
  animation: dot-pulse 1.5s ease-in-out infinite;
}

.dots span:nth-child(1) {
  animation-delay: 0s;
}

.dots span:nth-child(2) {
  animation-delay: 0.3s;
}

.dots span:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes radar-pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

@keyframes dot-pulse {
  0%, 60%, 100% {
    opacity: 0.3;
  }
  30% {
    opacity: 1;
  }
}
</style>