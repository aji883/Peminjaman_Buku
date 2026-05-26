export const API_URL = 'http://localhost:5000/api';

export const getToken = () => {
    if (window.location.pathname.startsWith('/admin')) {
        return localStorage.getItem('token');
    }
    return sessionStorage.getItem('user_token');
};

export async function fetchAPI(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

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

export async function fetchFormData(endpoint, formData, method = 'POST') {
    const url = `${API_URL}${endpoint}`;
    const token = getToken();
    
    const response = await fetch(url, {
        method,
        headers: { 
            'Authorization': `Bearer ${token}` 
        },
        body: formData
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }
    return data;
}
