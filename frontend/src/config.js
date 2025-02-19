// Backend API URL configuration
export const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://buildtrack.onrender.com'
  : 'http://localhost:3000';

// Function to get the full API URL
export const getApiUrl = (endpoint, isSandbox = false) => {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const baseUrl = `${API_URL}/${cleanEndpoint}`;
    
    // Add sandbox mode parameter if needed
    return isSandbox ? `${baseUrl}?mode=sandbox` : baseUrl;
}; 

