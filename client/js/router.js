/**
 * ReverseBuilder Hash Router
 */
const Router = {
  routes: {
    'landing': () => Router.showLanding(),
    'dashboard': () => Router.showDashboard(),
    'editor': (params) => Router.showEditor(params.get('id'))
  },

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    // Initial route handling
    this.handleRoute();
  },

  navigate(path) {
    window.location.hash = path;
  },

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/landing';
    const [pathPart, queryPart] = hash.split('?');
    const cleanPath = pathPart.replace(/^\//, '') || 'landing';
    const params = new URLSearchParams(queryPart || '');

    // Check unsaved changes if navigating away from editor
    if (State.get('currentView') === 'editor' && cleanPath !== 'editor' && State.get('isDirty')) {
      const confirmLeave = confirm('You have unsaved changes in your project. Leave anyway?');
      if (!confirmLeave) {
        // Revert hash without re-triggering listener
        history.pushState(null, '', `#/editor?id=${State.get('currentProject')?.id || ''}`);
        return;
      }
    }

    if (this.routes[cleanPath]) {
      this.routes[cleanPath](params);
    } else {
      this.showLanding();
    }
  },

  switchView(viewName) {
    document.querySelectorAll('.app-view').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.classList.add('active');
    }
    State.set('currentView', viewName);
    window.scrollTo(0, 0);
  },

  showLanding() {
    document.title = 'ReverseBuilder - Turn Website References Into Editable Designs';
    this.switchView('landing');
    if (window.App) {
      window.App.loadLandingTemplates();
    }
  },

  async showDashboard() {
    document.title = 'Dashboard - ReverseBuilder';
    this.switchView('dashboard');
    if (window.App) {
      await window.App.loadDashboardProjects();
    }
  },

  async showEditor(projectId) {
    if (!projectId) {
      this.navigate('/dashboard');
      return;
    }

    this.switchView('editor');
    if (window.App) {
      await window.App.loadProjectIntoEditor(projectId);
    }
  }
};

window.Router = Router;
