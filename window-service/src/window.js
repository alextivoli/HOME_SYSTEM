export class Window {
    constructor(windowId, state) {
        this._windowId = windowId;
        this._state = state;
    }
  
    get windowId() { return this._windowId; }
    get state() { return this._state; }
    set setState(state) { this._state = state; }
  }