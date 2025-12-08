// API Configuration
const API_BASE_URL = 'http://localhost:5000/api/v1';

// API Client
class APIClient {
  constructor() {
    this.token = localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  // Set authentication token
  setToken(token, rememberMe = false) {
    this.token = token;
    if (rememberMe) {
      localStorage.setItem('token', token);
    } else {
      sessionStorage.setItem('token', token);
      localStorage.removeItem('token');
    }
  }

  // Clear token
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add authorization header if token exists
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      
      // Handle 204 No Content
      if (response.status === 204) {
        return { success: true };
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET'
    });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }

  // File upload
  async upload(endpoint, file, fieldName = 'file') {
    const formData = new FormData();
    formData.append(fieldName, file);

    return this.request(endpoint, {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData
    });
  }
}

// Auth API
class AuthAPI {
  constructor(apiClient) {
    this.client = apiClient;
  }

  async register(userData) {
    return this.client.post('/auth/register', userData);
  }

  async login(credentials) {
    return this.client.post('/auth/login', credentials);
  }

  async logout() {
    const result = await this.client.get('/auth/logout');
    this.client.clearToken();
    return result;
  }

  async getCurrentUser() {
    return this.client.get('/auth/me');
  }

  async updateProfile(userData) {
    return this.client.put('/auth/updatedetails', userData);
  }

  async updatePassword(currentPassword, newPassword) {
    return this.client.put('/auth/updatepassword', {
      currentPassword,
      newPassword
    });
  }

  async forgotPassword(email) {
    return this.client.post('/auth/forgotpassword', { email });
  }

  async resetPassword(token, password) {
    return this.client.put(`/auth/resetpassword/${token}`, { password });
  }

  async verifyEmail(token) {
    return this.client.get(`/auth/verify-email/${token}`);
  }

  async resendVerification() {
    return this.client.post('/auth/resend-verification');
  }
}

// Mood API
class MoodAPI {
  constructor(apiClient) {
    this.client = apiClient;
  }

  async createMoodEntry(moodData) {
    return this.client.post('/mood', moodData);
  }

  async getMoodEntries(params = {}) {
    return this.client.get('/mood', params);
  }

  async getMoodEntry(id) {
    return this.client.get(`/mood/${id}`);
  }

  async updateMoodEntry(id, moodData) {
    return this.client.put(`/mood/${id}`, moodData);
  }

  async deleteMoodEntry(id) {
    return this.client.delete(`/mood/${id}`);
  }

  async getMoodStatistics(params = {}) {
    return this.client.get('/mood/stats', params);
  }

  async exportMoodData(params = {}) {
    return this.client.get('/mood/export', params);
  }
}

// Forum API
class ForumAPI {
  constructor(apiClient) {
    this.client = apiClient;
  }

  async createPost(postData) {
    return this.client.post('/forum/posts', postData);
  }

  async getPosts(params = {}) {
    return this.client.get('/forum/posts', params);
  }

  async getPost(id) {
    return this.client.get(`/forum/posts/${id}`);
  }

  async updatePost(id, postData) {
    return this.client.put(`/forum/posts/${id}`, postData);
  }

  async deletePost(id) {
    return this.client.delete(`/forum/posts/${id}`);
  }

  async upvotePost(id) {
    return this.client.post(`/forum/posts/${id}/upvote`);
  }

  async downvotePost(id) {
    return this.client.post(`/forum/posts/${id}/downvote`);
  }

  async createComment(postId, commentData) {
    return this.client.post(`/forum/posts/${postId}/comments`, commentData);
  }

  async getComments(postId, params = {}) {
    return this.client.get(`/forum/posts/${postId}/comments`, params);
  }

  async deleteComment(postId, commentId) {
    return this.client.delete(`/forum/posts/${postId}/comments/${commentId}`);
  }

  async reportPost(postId, reportData) {
    return this.client.post(`/forum/posts/${postId}/report`, reportData);
  }
}

// Therapist API
class TherapistAPI {
  constructor(apiClient) {
    this.client = apiClient;
  }

  async searchTherapists(params = {}) {
    return this.client.get('/therapists/search', params);
  }

  async getTherapist(id) {
    return this.client.get(`/therapists/${id}`);
  }

  async getTherapistReviews(id, params = {}) {
    return this.client.get(`/therapists/${id}/reviews`, params);
  }

  async getTherapistAvailability(id, params = {}) {
    return this.client.get(`/therapists/${id}/availability`, params);
  }

  async bookAppointment(appointmentData) {
    return this.client.post('/appointments', appointmentData);
  }

  async getAppointments(params = {}) {
    return this.client.get('/appointments', params);
  }

  async updateAppointment(id, appointmentData) {
    return this.client.put(`/appointments/${id}`, appointmentData);
  }

  async cancelAppointment(id, cancellationData) {
    return this.client.post(`/appointments/${id}/cancel`, cancellationData);
  }

  async rateAppointment(id, ratingData) {
    return this.client.post(`/appointments/${id}/rate`, ratingData);
  }
}

// Initialize API
const apiClient = new APIClient();
const authAPI = new AuthAPI(apiClient);
const moodAPI = new MoodAPI(apiClient);
const forumAPI = new ForumAPI(apiClient);
const therapistAPI = new TherapistAPI(apiClient);

// Export API instances
window.API = {
  auth: authAPI,
  mood: moodAPI,
  forum: forumAPI,
  therapist: therapistAPI,
  client: apiClient
};

// Auth state management
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  async init() {
    // Check for existing token
    const token = apiClient.token;
    
    if (token) {
      try {
        const response = await authAPI.getCurrentUser();
        this.currentUser = response.user;
        this.updateUIForLoggedInUser();
      } catch (error) {
        console.error('Session validation failed:', error);
        apiClient.clearToken();
      }
    }
  }

  async login(email, password, rememberMe = false) {
    try {
      const response = await authAPI.login({ email, password, rememberMe });
      
      if (response.success) {
        apiClient.setToken(response.token, rememberMe);
        this.currentUser = response.user;
        this.updateUIForLoggedInUser();
        
        // Show success notification
        window.mindCareApp.showNotification(`Welcome back, ${response.user.firstName}!`, 'success');
        
        return { success: true, user: response.user };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async register(userData) {
    try {
      const response = await authAPI.register(userData);
      
      if (response.success) {
        apiClient.setToken(response.token, true);
        this.currentUser = response.user;
        this.updateUIForLoggedInUser();
        
        // Show success notification
        window.mindCareApp.showNotification(`Welcome to MindCare, ${response.user.firstName}!`, 'success');
        
        return { success: true, user: response.user };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async logout() {
    try {
      await authAPI.logout();
      this.currentUser = null;
      this.updateUIForLoggedOutUser();
      
      // Show notification
      window.mindCareApp.showNotification('Logged out successfully', 'info');
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  updateUIForLoggedInUser() {
    // Update navigation
    const loginBtn = document.querySelector('.btn-login');
    if (loginBtn) {
      loginBtn.textContent = 'Dashboard';
      loginBtn.href = '../index.html'; // Update with actual dashboard URL
      
      // Add user menu if needed
      const userMenu = document.querySelector('.user-menu') || this.createUserMenu();
      if (!document.querySelector('.user-menu')) {
        loginBtn.parentNode.insertBefore(userMenu, loginBtn.nextSibling);
      }
    }
  }

  updateUIForLoggedOutUser() {
    // Update navigation
    const loginBtn = document.querySelector('.btn-login');
    if (loginBtn) {
      loginBtn.textContent = 'Login';
      loginBtn.href = 'pages/login.html';
      
      // Remove user menu
      const userMenu = document.querySelector('.user-menu');
      if (userMenu) {
        userMenu.remove();
      }
    }
  }

  createUserMenu() {
    const menu = document.createElement('div');
    menu.className = 'user-menu';
    menu.innerHTML = `
      <div class="user-dropdown">
        <button class="user-dropdown-btn">
          <img src="${this.currentUser.avatar || 'default-avatar.png'}" alt="Profile" class="user-avatar">
          <span>${this.currentUser.firstName}</span>
          <i class="fas fa-chevron-down"></i>
        </button>
        <div class="user-dropdown-content">
          <a href="dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
          <a href="profile.html"><i class="fas fa-user"></i> Profile</a>
          <a href="settings.html"><i class="fas fa-cog"></i> Settings</a>
          <div class="dropdown-divider"></div>
          <a href="#" class="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
        </div>
      </div>
    `;

    // Add logout event listener
    menu.querySelector('.logout-btn').addEventListener('click', async (e) => {
      e.preventDefault();
      await this.logout();
      window.location.href = '../index.html';
    });

    return menu;
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  getUser() {
    return this.currentUser;
  }
}

// Initialize Auth Manager
window.authManager = new AuthManager();