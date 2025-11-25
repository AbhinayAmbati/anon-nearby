// Composable for File Drop API interactions
export const useFileDrop = () => {
  const apiUrl = process.env.NUXT_PUBLIC_SOCKET_URL;

  /**
   * Create a new file drop room
   */
  const createRoom = async (roomData) => {
    try {
      const response = await fetch(`${apiUrl}/api/file-drop/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roomData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create room');
      }

      return await response.json();
    } catch (error) {
      console.error('Create room error:', error);
      throw error;
    }
  };

  /**
   * Join an existing file drop room
   */
  const joinRoom = async (code, password, latitude, longitude, sessionId) => {
    try {
      const response = await fetch(`${apiUrl}/api/file-drop/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          password,
          latitude,
          longitude,
          sessionId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join room');
      }

      return await response.json();
    } catch (error) {
      console.error('Join room error:', error);
      throw error;
    }
  };

  /**
   * Upload encrypted file to room
   */
  const uploadFile = async (code, password, sessionId, fileData) => {
    try {
      const response = await fetch(`${apiUrl}/api/file-drop/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          password,
          sessionId,
          file: fileData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  };

  /**
   * Download encrypted file from room
   */
  const downloadFile = async (code, password, sessionId, fileId) => {
    try {
      const response = await fetch(`${apiUrl}/api/file-drop/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          password,
          sessionId,
          fileId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download file');
      }

      return await response.json();
    } catch (error) {
      console.error('Download file error:', error);
      throw error;
    }
  };

  /**
   * Get room information (public)
   */
  const getRoomInfo = async (code) => {
    try {
      const response = await fetch(`${apiUrl}/api/file-drop/info/${code}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get room info');
      }

      return await response.json();
    } catch (error) {
      console.error('Get room info error:', error);
      throw error;
    }
  };

  /**
   * Delete file from room
   */
  const deleteFile = async (code, password, sessionId, fileId) => {
    try {
      const response = await fetch(`${apiUrl}/api/file-drop/file`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          password,
          sessionId,
          fileId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete file');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  };

  /**
   * Delete room (close room)
   */
  const deleteRoom = async (code, password, sessionId) => {
    try {
      const response = await fetch(`${apiUrl}/api/file-drop/room`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          password,
          sessionId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete room');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete room error:', error);
      throw error;
    }
  };

  return {
    createRoom,
    joinRoom,
    uploadFile,
    downloadFile,
    getRoomInfo,
    deleteFile,
    deleteRoom
  };
};
