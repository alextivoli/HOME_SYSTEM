export class Door {
    constructor(state) {
        this._state = state;
    }
    get state() { return this._state; }
    set state(state) { this._state = state; }
  }