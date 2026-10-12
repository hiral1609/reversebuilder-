/**
 * ReverseBuilder Undo / Redo History Engine
 */
class HistoryEngine {
  constructor(maxDepth = 30) {
    this.maxDepth = maxDepth;
    this.undoStack = [];
    this.redoStack = [];
  }

  pushState(projectSnapshot) {
    if (!projectSnapshot) return;
    // Clone snapshot
    const copy = JSON.parse(JSON.stringify(projectSnapshot));
    this.undoStack.push(copy);

    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }

    // Clear redo stack on new action
    this.redoStack = [];
    this.updateControls();
  }

  undo() {
    if (!this.canUndo()) return;

    const current = State.get('currentProject');
    if (current) {
      this.redoStack.push(JSON.parse(JSON.stringify(current)));
    }

    const previous = this.undoStack.pop();
    State.state.currentProject = previous;
    State.state.isDirty = true;
    State.notify('currentProject', previous);
    this.updateControls();
    showToast('Undo performed', 'info', 1500);
  }

  redo() {
    if (!this.canRedo()) return;

    const current = State.get('currentProject');
    if (current) {
      this.undoStack.push(JSON.parse(JSON.stringify(current)));
    }

    const next = this.redoStack.pop();
    State.state.currentProject = next;
    State.state.isDirty = true;
    State.notify('currentProject', next);
    this.updateControls();
    showToast('Redo performed', 'info', 1500);
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.updateControls();
  }

  updateControls() {
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');

    if (undoBtn) undoBtn.disabled = !this.canUndo();
    if (redoBtn) redoBtn.disabled = !this.canRedo();
  }
}

const HistoryManager = new HistoryEngine();
window.HistoryManager = HistoryManager;
