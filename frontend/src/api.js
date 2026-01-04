import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const wasteAPI = {
  // Classify and record waste
  classifyWaste: async (userId, imageUrl, location = null) => {
    const response = await axios.post(`${API_BASE_URL}/waste/classify`, {
      user_id: userId,
      image_url: imageUrl,
      location: location
    });
    return response.data;
  },

  // Get user's waste entries
  getUserEntries: async (userId, limit = 50) => {
    const response = await axios.get(`${API_BASE_URL}/waste/entries/${userId}?limit=${limit}`);
    return response.data;
  },

  // Get specific entry details
  getEntryDetail: async (entryId) => {
    const response = await axios.get(`${API_BASE_URL}/waste/entry/${entryId}`);
    return response.data;
  },

  // Mark waste as collected (driver function)
  markCollected: async (entryId, collectorId, collectionImageUrl = null) => {
    const response = await axios.post(`${API_BASE_URL}/waste/collect`, {
      entry_id: entryId,
      collector_id: collectorId,
      collection_image_url: collectionImageUrl
    });
    return response.data;
  },

  // Get analytics
  getAnalytics: async (userId = null) => {
    const url = userId 
      ? `${API_BASE_URL}/waste/analytics?user_id=${userId}`
      : `${API_BASE_URL}/waste/analytics`;
    const response = await axios.get(url);
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await axios.get(`${API_BASE_URL}/waste/health`);
    return response.data;
  }
};

// Upload image to storage (mock - in production use S3, Azure Blob, etc.)
export const uploadImage = async (file) => {
  // For demo purposes, create a local URL
  // In production, upload to cloud storage
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Simulate upload delay
      setTimeout(() => {
        resolve({
          url: reader.result, // Base64 data URL
          filename: file.name,
          size: file.size
        });
      }, 1000);
    };
    reader.readAsDataURL(file);
  });
};
