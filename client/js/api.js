/**
 * ReverseBuilder Client API & Utilities
 */
const API = {
  baseUrl: '/api',

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = options.headers || {};

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, { ...options, headers });

      if (options.responseType === 'blob') {
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Request failed with HTTP ${response.status}`);
        }
        return await response.blob();
      }

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }
      return data;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
      throw err;
    }
  },

  // Projects
  async getProjects(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/projects${query ? `?${query}` : ''}`;
    const res = await this.request(endpoint);
    return res.data || [];
  },

  async getProject(id) {
    const res = await this.request(`/projects/${id}`);
    return res.data;
  },

  async createProject(projectData) {
    const res = await this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
    return res.data;
  },

  async updateProject(id, updates) {
    const res = await this.request(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    return res.data;
  },

  async duplicateProject(id) {
    const res = await this.request(`/projects/${id}/duplicate`, {
      method: 'POST'
    });
    return res.data;
  },

  async deleteProject(id) {
    return await this.request(`/projects/${id}`, {
      method: 'DELETE'
    });
  },

  async exportProject(id, draftData = null) {
    const options = {
      method: 'POST',
      responseType: 'blob'
    };

    if (draftData) {
      options.body = JSON.stringify(draftData);
    }

    const blob = await this.request(`/projects/${id}/export`, options);

    // Trigger browser download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(draftData?.name || 'reversebuilder-export').toLowerCase().replace(/[^a-z0-9_-]/g, '-')}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  },

  // Imports
  async importUrl(url) {
    const res = await this.request('/import/url', {
      method: 'POST',
      body: JSON.stringify({ url })
    });
    return res;
  },

  async importScreenshot(file) {
    const formData = new FormData();
    formData.append('screenshot', file);

    const res = await this.request('/import/screenshot', {
      method: 'POST',
      body: formData
    });
    return res;
  },

  async uploadAsset(file) {
    const formData = new FormData();
    formData.append('image', file);

    const res = await this.request('/import/asset', {
      method: 'POST',
      body: formData
    });
    return res;
  },

  // Templates
  async getTemplates() {
    const res = await this.request('/templates');
    return res.data || [];
  },

  async getTemplate(id) {
    const res = await this.request(`/templates/${id}`);
    return res.data;
  }
};

/**
 * Toast Notification System
 */
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${escapeHtmlText(message)}</span>
    <span class="toast-dismiss" role="button" aria-label="Close">&times;</span>
  `;

  toast.querySelector('.toast-dismiss').addEventListener('click', () => {
    toast.remove();
  });

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

function escapeHtmlText(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
