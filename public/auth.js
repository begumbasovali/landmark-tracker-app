// Token işlemleri için yardımcı fonksiyonlar
const AuthService = {
  // Token'ı localStorage'a kaydet
  setToken: function (token) {
    localStorage.setItem("landmark_token", token);
  },

  // Token'ı localStorage'dan al
  getToken: function () {
    return localStorage.getItem("landmark_token");
  },

  // Token'ı localStorage'dan sil
  removeToken: function () {
    localStorage.removeItem("landmark_token");
  },

  // Kullanıcının giriş yapıp yapmadığını kontrol et
  isAuthenticated: function () {
    return this.getToken() !== null;
  },

  // API istekleri için headers oluştur
  getAuthHeaders: function () {
    const token = this.getToken();
    return token ? { "x-auth-token": token } : {};
  },
};

// API istekleri için yardımcı fonksiyonlar
const ApiService = {
  // Kullanıcı kaydı
  register: async function (userData) {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    const data = await response.json();
    AuthService.setToken(data.token);
    return data;
  },

  // Kullanıcı girişi
  login: async function (credentials) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const data = await response.json();
    AuthService.setToken(data.token);
    return data;
  },

  // Kullanıcı bilgilerini getir
  getUserInfo: async function () {
    const headers = {
      ...AuthService.getAuthHeaders(),
      "Content-Type": "application/json",
    };

    const response = await fetch("/api/auth/user", {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        AuthService.removeToken();
        throw new Error("Authentication expired");
      }
      const error = await response.json();
      throw new Error(error.message || "Failed to get user info");
    }

    return await response.json();
  },

  // Çıkış yap
  logout: function () {
    AuthService.removeToken();
  },
};

// Global olarak erişilebilmesi için window nesnesine ekle
window.AuthService = AuthService;
window.ApiService = ApiService;
