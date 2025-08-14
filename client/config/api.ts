// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3001',
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  DEMO_LOGIN: '/api/auth/demo-login',
  VERIFY_SESSION: '/api/auth/verify',
  LOGOUT: '/api/auth/logout',
  
  // Health Records
  HEALTH_RECORDS: '/api/health-records',
  
  // Medical Scan Analysis
  MEDICAL_SCAN_ANALYZE: '/api/medical-scan/analyze',
  MEDICAL_SCAN_RESULTS: '/api/medical-scan/results',
  MEDICAL_SCAN_STATS: '/api/medical-scan/stats',
  
  // Blockchain
  BLOCKCHAIN_STATS: '/api/blockchain/stats',
  BLOCKCHAIN_BLOCKS: '/api/blockchain/blocks',
  
  // Medical Context
  MEDICAL_CONTEXT_PERSONALIZED: '/api/medical-context/personalized',
  MEDICAL_CONTEXT_ENHANCE_QUERY: '/api/medical-context/enhance-query',
  MEDICAL_CONTEXT_INSIGHTS: '/api/medical-context/insights',
  MEDICAL_CONTEXT_AI_SCAN: '/api/medical-context/ai-scan',
  
  // Performance
  PERFORMANCE_STATUS: '/api/performance/status',
  
  // Health Check
  HEALTH: '/api/health',
};

// Enhanced fetch function with retry logic and better error handling
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  retryCount: number = 0
): Promise<Response> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    credentials: 'include', // Include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log(`Making API request to: ${url}`);
    const response = await fetch(url, defaultOptions);
    
    console.log(`API response status: ${response.status} for ${url}`);
    
    // If the response is ok, return it
    if (response.ok) {
      return response;
    }
    
    // If we have retries left and it's a network error, retry
    if (retryCount < API_CONFIG.RETRY_ATTEMPTS && !response.ok) {
      console.warn(`API request failed, retrying... (${retryCount + 1}/${API_CONFIG.RETRY_ATTEMPTS})`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      return apiRequest(endpoint, options, retryCount + 1);
    }
    
    return response;
  } catch (error) {
    console.error(`Network error for ${url}:`, error);
    // Network error - retry if we have attempts left
    if (retryCount < API_CONFIG.RETRY_ATTEMPTS) {
      console.warn(`Network error, retrying... (${retryCount + 1}/${API_CONFIG.RETRY_ATTEMPTS})`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      return apiRequest(endpoint, options, retryCount + 1);
    }
    
    throw error;
  }
}

// Helper function for JSON requests
export async function apiJsonRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await apiRequest(endpoint, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
}

// Helper function for POST requests
export async function apiPost<T = any>(
  endpoint: string,
  data: any,
  options: RequestInit = {}
): Promise<T> {
  return apiJsonRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
}

// Helper function for GET requests
export async function apiGet<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  return apiJsonRequest<T>(endpoint, {
    method: 'GET',
    ...options,
  });
}

// Test API connection
export async function testApiConnection(): Promise<boolean> {
  try {
    console.log('Testing API connection to:', `${API_CONFIG.BASE_URL}${API_ENDPOINTS.HEALTH}`);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.HEALTH}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('API connection test response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('API connection test response data:', data);
      return data.status === 'ok';
    }
    
    console.log('API connection test failed - response not ok');
    return false;
  } catch (error) {
    console.error('API connection test failed with error:', error);
    return false;
  }
}

// Get full API URL
export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}