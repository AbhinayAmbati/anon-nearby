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
