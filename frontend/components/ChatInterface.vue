<template>
  <div class="chat-interface">
    <!-- Chat header -->
    <div class="chat-header">
      <div class="connection-status">
        <div class="status-indicator connected"></div>
        <span class="text-sm">Connected to {{ partnerCodename }}</span>
      </div>
      <button 
        @click="$emit('disconnect')" 
        class="disconnect-btn"
        title="Disconnect"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <!-- Messages area -->
    <div ref="messagesContainer" class="messages-container">
      <div v-if="messages.length === 0" class="empty-state">
        <p class="text-matrix-green/60 text-center text-sm">
          Connection established. Start your anonymous conversation...
        </p>
      </div>
      
      <div
        v-for="(message, index) in messages"
        :key="index"
        class="message-bubble"
        :class="{ 'own-message': message.isOwn }"
      >
        <div class="message-header">
          <span class="sender-name">{{ message.from }}</span>
          <span class="message-time">{{ formatTime(message.timestamp) }}</span>
        </div>
        <div class="message-content">{{ message.message }}</div>
      </div>
    </div>

    <!-- Input area -->
    <div class="input-area">
      <form @submit.prevent="sendMessage" class="message-form">
        <input
          v-model="messageInput"
          type="text"
          placeholder="Type your message..."
          class="message-input"
          maxlength="500"
          :disabled="!connected"
        />
        <button 
          type="submit" 
          class="send-btn"
          :disabled="!messageInput.trim() || !connected"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
          </svg>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Message {
  message: string
  from: string
  timestamp: string
  isOwn: boolean
}

defineProps<{
  partnerCodename: string
  connected: boolean
}>()

defineEmits<{
  disconnect: []
  sendMessage: [message: string]
}>()

const messages = ref<Message[]>([])
const messageInput = ref('')
const messagesContainer = ref<HTMLElement>()

const addMessage = (messageData: any, isOwn = false) => {
  messages.value.push({
    ...messageData,
    isOwn
  })
  
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const sendMessage = () => {
  if (!messageInput.value.trim()) return
  
  const message = messageInput.value.trim()
  
  // Add own message immediately
  addMessage({
    message,
    from: 'You',
    timestamp: new Date().toISOString()
  }, true)
  
  // Emit to parent
  $emit('sendMessage', message)
  
  messageInput.value = ''
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Expose method to parent
defineExpose({
  addMessage: (messageData: any) => addMessage(messageData, false)
})
</script>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  background: rgba(17, 24, 39, 0.95);
  border: 1px solid #374151;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #374151;
  background: #1f2937;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4ade80;
  font-family: 'Courier New', monospace;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ade80;
  animation: pulse-green 2s infinite;
}

.disconnect-btn {
  padding: 0.5rem;
  background: transparent;
  border: 1px solid #374151;
  color: #4ade80;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.disconnect-btn:hover {
  background: rgba(255, 0, 0, 0.1);
  border-color: #ff0000;
  color: #ff0000;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-family: 'Courier New', monospace;
}

.message-bubble {
  max-width: 70%;
  padding: 0.75rem 1rem;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
}

.message-bubble.own-message {
  align-self: flex-end;
  background: rgba(74, 222, 128, 0.1);
  border-color: #166534;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  opacity: 0.7;
}

.sender-name {
  color: #4ade80;
  font-weight: 600;
}

.message-time {
  color: #4ade80;
  opacity: 0.6;
}

.message-content {
  color: #4ade80;
  line-height: 1.4;
  word-break: break-word;
}

.input-area {
  padding: 1rem;
  border-top: 1px solid #374151;
  background: #1f2937;
}

.message-form {
  display: flex;
  gap: 0.75rem;
}

.message-input {
  flex: 1;
  padding: 0.75rem 1rem;
  background: #111827;
  border: 1px solid #374151;
  border-radius: 6px;
  color: #4ade80;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.message-input::placeholder {
  color: rgba(74, 222, 128, 0.4);
}

.message-input:focus {
  outline: none;
  border-color: #4ade80;
  box-shadow: 0 0 0 1px #4ade80;
}

.send-btn {
  padding: 0.75rem 1rem;
  background: #166534;
  border: 1px solid #4ade80;
  color: #4ade80;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #4ade80;
  color: #111827;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes pulse-green {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>