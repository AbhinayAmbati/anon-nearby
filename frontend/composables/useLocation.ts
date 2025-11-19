export const useLocation = () => {
  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Location access denied by user'))
              break
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Location information unavailable'))
              break
            case error.TIMEOUT:
              reject(new Error('Location request timed out'))
              break
            default:
              reject(new Error('An unknown error occurred'))
              break
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // 1 minute
        }
      )
    })
  }

  const watchLocation = (callback: (location: { latitude: number; longitude: number }) => void) => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser')
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      (error) => {
        console.error('Location watch error:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  return {
    getCurrentLocation,
    watchLocation
  }
}