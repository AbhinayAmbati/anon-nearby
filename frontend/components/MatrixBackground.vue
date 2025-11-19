<template>
  <div class="matrix-bg fixed top-0 left-0 w-full h-full pointer-events-none z-0">
    <MatrixRain
      v-for="i in 50"
      :key="i"
      :delay="Math.random() * 3000"
      :style="{
        left: Math.random() * 100 + '%',
        fontSize: (Math.random() * 8 + 8) + 'px',
        animationDuration: (Math.random() * 2 + 2) + 's'
      }"
    />
  </div>
</template>

<script setup lang="ts">
// Background matrix effect
</script>

<style scoped>
.matrix-bg {
  background: radial-gradient(ellipse at center, rgba(74, 222, 128, 0.1) 0%, rgba(17, 24, 39, 0.9) 70%);
}
</style>