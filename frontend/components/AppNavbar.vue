<template>
  <nav class="sticky top-0 z-50 border-b border-green-400/20 bg-black/80 backdrop-blur-sm text-green-400 w-full">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <NuxtLink to="/" class="text-xl font-bold tracking-widest hover:text-green-300 transition-colors">
          ANON-NEARBY
        </NuxtLink>
        <div class="flex items-center space-x-6">
          <NuxtLink to="/about" class="hover:text-green-300 transition-colors text-sm" active-class="text-green-300">ABOUT</NuxtLink>
          <NuxtLink to="/file-drop" class="hover:text-green-300 transition-colors text-sm" active-class="text-green-300">FILE DROP</NuxtLink>
          <NuxtLink to="/chat" class="px-4 py-2 border border-green-400 hover:bg-green-400 hover:text-black transition-all text-sm" active-class="bg-green-400 text-black">
            ENTER CHAT
          </NuxtLink>
        </div>
      </div>
    </div>
  </nav>
</template>
