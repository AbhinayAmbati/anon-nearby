// Composable for fetching nearby user count
export const useNearbyCount = () => {
  const nearbyCount = ref<number>(0)
  const isLoading = ref(false)
  const error = ref<string>('')
  
  // Get runtime config for API URL
  const config = useRuntimeConfig()

  const fetchNearbyCount = async (latitude: number, longitude: number, radius: number = 1000) => {
    if (isLoading.value) return

    isLoading.value = true
    error.value = ''

    try {
      // Use API URL from environment configuration
      const apiUrl = config.public.socketUrl
      
      const response = await fetch(`${apiUrl}/api/users/nearby-count`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          radius
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch nearby count')
      }

      const data = await response.json()
      nearbyCount.value = data.nearbyCount

      console.log('📊 Nearby user count:', data.nearbyCount)
      
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch nearby count'
      console.error('❌ Error fetching nearby count:', err)
      
      // Fallback to 0 on error
      nearbyCount.value = 0
    } finally {
      isLoading.value = false
    }
  }

  const resetCount = () => {
    nearbyCount.value = 0
    error.value = ''
  }

  return {
    nearbyCount: readonly(nearbyCount),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchNearbyCount,
    resetCount
  }
}