// Backend API URL configuration
export const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://buildtrack.onrender.com'
  : 'http://localhost:3000';

// Function to get the full API URL
export const getApiUrl = (endpoint, isSandbox = false, userId = null) => {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const baseUrl = `${API_URL}/${cleanEndpoint}`;
    
    // Add query parameters
    if (isSandbox) {
        return `${baseUrl}?mode=sandbox`;
    } else if (userId) {
        return `${baseUrl}?userId=${userId}`;
    }
    
    return baseUrl;
}; 

