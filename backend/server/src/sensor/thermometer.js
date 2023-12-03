export class Thermometer {
    constructor(temperature, state) {
        this._temperature = temperature;
        this._state = state;
    }
  
    get temperature() { return this._temperature; }
    set temperature(temperature) { this._temperature = temperature; }
    get state() { return this._state; }
    set state(state) { this._state = state; }
  }