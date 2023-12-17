'use strict';

(function (win) {

  /**
   * Encapsulates the control and view logics behind a single heatpump.
   */


  class HeatpumpComponent extends EventEmitter {
    
    model;
    element;
    handlers = [];
    client = null;
    wsclient = null;

    /**
     * Instances a new `HeatpumpComponent` component.
     * @param model {RestDoorModel} A heatpump model
     */
    constructor(client, wsclient) {
      super();
      this.client = client;
      this.wsclient = wsclient;
    }

    /**
     * Initializes the component.
     * @return {HTMLElement} The root element for this component.
     */
    async init() {
      try {
        const resp = await this.client.get(`heatpump`);
        const heatpump = resp.result;
        this.model = new RestHeatpumpModel(heatpump._state, heatpump._temperature, this.client);
      } catch (e) {
        console.error('Something went wrong getting heatpumps information', e);
      }

        this.element = document.createElement("div");
        this.element.className = "temp";
        this.element.id = "temp";
        this.element.innerHTML = document.querySelector('script#heatpump-control-template').textContent;

        const textStateWindow = this.element.querySelector("#text-state-heatpump");
        textStateWindow.innerHTML = `Heatpump State: ${this.model.state} 🔴`;

        const textTempWindow = this.element.querySelector("#text-temp-heatpump");
        textTempWindow.innerHTML = `Heatpump Temperature: ${this.model.temp}`;
      

        const onBtn = this.element.querySelector("#buttonOn");
        const offBtn = this.element.querySelector("#buttonOff");
        const setTempBtn = this.element.querySelector("#buttonSetTemperature");

        let hdlrOn = new Handler('click', onBtn, () => this.turnOn());
        this.handlers.push(hdlrOn);
        let hdlrOff = new Handler('click', offBtn, () => this.turnOff());
        this.handlers.push(hdlrOff);
        let hdlrSetTemp = new Handler('click', setTempBtn, () => this.updateTemperature());
        this.handlers.push(hdlrSetTemp);

        return this.element;
    }

    async turnOn(){
      try {
        const textStateWindow = this.element.querySelector("#text-state-heatpump");
        textStateWindow.innerHTML = `Heatpump State: ${"ON ✅"}`;
        await this.model.update("ON");
      } catch (e) {
        console.log(e.status);
        const errorMessage = document.querySelector("#error-message");
        errorMessage.style.display = "block"
        if (e.status == 408) {
          errorMessage.innerHTML = "Request timed out: heatpump service is down.";
          this.model.update("ERROR");
        }
        else {
          errorMessage.innerHTML = "Heatpump already open or is in error.";
         
        }
        setTimeout(function() {
          errorMessage.style.display = 'none';
      }, 5000);
      }
    }

    async turnOff(){
      try {
        const textStateWindow = this.element.querySelector("#text-state-heatpump");
        textStateWindow.innerHTML = `Heatpump State: ${"OFF 🔴"}`;
        await this.model.update("OFF");
      } catch (e) {
        console.log(e.status);
        const errorMessage = document.querySelector("#error-message");
        errorMessage.style.display = "block"
        if (e.status == 408) {
          errorMessage.innerHTML = "Request timed out: heatpump service is down.";
          this.model.update("ERROR");
        }
        else {
          errorMessage.innerHTML = "Heatpump already open or is in error.";
          
        }
        setTimeout(function() {
          errorMessage.style.display = 'none';
      }, 5000);
      }
    }

    async updateTemperature(){
      console.debug("Attempting to change temperature of heatpump");
      let newTemp = this.element.querySelector("#tempOp").value;
      try {
        await this.model.updateTemp(newTemp);
        const textTempWindow = this.element.querySelector("#text-temp-heatpump");
        textTempWindow.innerHTML = `Heatpump Temperature: ${this.model.temp}`;
      } catch (e) {
        console.log(e.status);
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        if (e.status == 408) {
          errorMessage.innerHTML = "Request timed out: heatpump service is down.";
        }
        else {
          errorMessage.innerHTML = "Heatpump already open or is in error.";
        }
        section.classList.add("active");
      }
    }
    
  }

  /* Exporting component */
  win.HeatpumpComponent ||= HeatpumpComponent;

})(window);
