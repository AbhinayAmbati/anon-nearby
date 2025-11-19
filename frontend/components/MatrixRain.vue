<template>
  <div class="matrix-rain absolute text-green-400 opacity-70">{{ character }}</div>
</template>

<script setup lang="ts">
const props = defineProps<{
  delay: number
}>()

const character = ref('')
const matrixChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'

const generateChar = () => {
  character.value = matrixChars[Math.floor(Math.random() * matrixChars.length)]
}

onMounted(() => {
  setTimeout(() => {
    generateChar()
    setInterval(generateChar, 150)
  }, props.delay)
})
</script>

<style scoped>
.matrix-rain {
  animation: rain 3s linear infinite;
  animation-delay: v-bind(props.delay + 'ms');
  top: -100px;
}

@keyframes rain {
  0% {
    transform: translateY(-100px);
    opacity: 0;
  }
  10% {
    opacity: 0.7;
  }
  90% {
    opacity: 0.7;
  }
  100% {
    transform: translateY(100vh);
    opacity: 0;
  }
}
</style>