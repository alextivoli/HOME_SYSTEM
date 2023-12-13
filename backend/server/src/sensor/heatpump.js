export class Heatpump {
    constructor(temperature, state) {
        this._temperature = temperature;
        this._state = state;
    }
  
    get getTemperature() { return this._temperature; }
    set setTemperature(temperature) { this._temperature = temperature; }
    get getState() { return this._state; }
    set setState(state) { this._state = state; }
  }