/**
 * ReverseBuilder Global State Management
 */
class StateManager {
  constructor() {
    this.state = {
      currentView: 'landing',
      currentProject: null,
      selectedSectionId: null,
      viewportMode: 'desktop', // 'desktop' | 'tablet' | 'mobile'
      isPreviewMode: false,
      isDirty: false,
      saveStatus: 'saved', // 'saved' | 'unsaved' | 'saving'
      sidebarTab: 'components' // 'components' | 'layers' | 'reference'
    };

    this.subscribers = new Map();
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    const prev = this.state[key];
    if (prev === value) return;

    this.state[key] = value;
    this.notify(key, value, prev);
  }

  updateProject(mutatorFn) {
    if (!this.state.currentProject) return;

    // Deep copy current project for mutation
    const draft = JSON.parse(JSON.stringify(this.state.currentProject));
    mutatorFn(draft);
    draft.updatedAt = Date.now();

    // Push to undo history before setting
    if (window.HistoryManager) {
      window.HistoryManager.pushState(this.state.currentProject);
    }

    this.state.currentProject = draft;
    this.state.isDirty = true;
    this.state.saveStatus = 'unsaved';

    this.notify('currentProject', draft);
    this.notify('saveStatus', 'unsaved');
  }

  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const set = this.subscribers.get(key);
      if (set) set.delete(callback);
    };
  }

  notify(key, value, prev) {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(value, prev);
        } catch (e) {
          console.error(`Error in state subscriber for [${key}]:`, e);
        }
      });
    }
  }
}

const State = new StateManager();
window.State = State;
