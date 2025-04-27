/**
 * API Yapılandırması
 * Bu dosya, uygulama genelinde kullanılan API URL'lerini yönetir.
 * Production ve development ortamlarına göre doğru API URL'ini kullanır.
 */

// API URL'ini dinamik olarak belirleme
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000/api' // Development ortamı
  : `${window.location.origin}/api`; // Production ortamı

// Config nesnesi
const config = {
  apiUrl: API_BASE_URL,
  
  // API endpoint'leri
  endpoints: {
    landmarks: `${API_BASE_URL}/landmarks`,
    visited: `${API_BASE_URL}/visited`,
    plans: `${API_BASE_URL}/plans`,
    auth: {
      login: `${API_BASE_URL}/auth/login`,
      register: `${API_BASE_URL}/auth/register`,
      user: `${API_BASE_URL}/auth/user`,
    }
  }
};

// Config nesnesini global olarak erişilebilir yapma
window.appConfig = config;