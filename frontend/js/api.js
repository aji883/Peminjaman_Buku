const API_URL = 'http://localhost:5000/api';

// Helper to get token (checks both admin and user token)
const getToken = () => localStorage.getItem('token') || localStorage.getItem('user_token');

// Helper for API requests
async function fetchAPI(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    
    // Set headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Add auth token if exists
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            data = await response.json();
        } else {
            const text = await response.text();
            throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
        }
        
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
