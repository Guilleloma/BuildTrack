// Backend API URL configuration
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Function to get the full API URL
export const getApiUrl = (endpoint) => {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${API_URL}/${cleanEndpoint}`;
}; 