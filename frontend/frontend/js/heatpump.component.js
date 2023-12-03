'use strict';

(function (win) {

  /**
   * Encapsulates the control and view logics behind a single heatpump.
   */


  class HeatpumpComponent extends EventEmitter {
    
    #model;
    #element;
    #handlers = [];
    #edit = null;
    #client = null;
    #wsclient = null;

    /**
     * Instances a new `HeatpumpComponent` component.
     * @param model {RestDoorModel} A heatpump model
     */
    constructor(client, wsclient) {
      super();
      this.#client = client;
      this.#wsclient = wsclient;
    }

    /**
     * Destroys this component, removing it from it's parent node.
     */
    destroy() {
      this.#handlers.forEach(h => h.unregister());
      this.#element.remove();
    }

    /**
     * Initializes the component.
     * @return {HTMLElement} The root element for this component.
     */
    async init() {
      try {
        const resp = await this.#client.get(`heatpump`);
        const heatpump = resp.result;
        this.model = new RestHeatpumpModel(heatpump._state, heatpump._temperature, this.#client);
      } catch (e) {
        console.error('Something went wrong getting doors information', e);
      }

        this.#element = document.createElement("div");
        this.#element.className = "temp";
        this.#element.id = "temp";
        this.#element.innerHTML = document.querySelector('script#heatpump-control-template').textContent;
      

        const onBtn = this.#element.querySelector("#buttonOn");
        const offBtn = this.#element.querySelector("#buttonOff");
        const setTempBtn = this.#element.querySelector("#buttonSetTemperature");

        let hdlrOn = new Handler('click', onBtn, () => this.turnOn());
        this.#handlers.push(hdlrOn);
        let hdlrOff = new Handler('click', offBtn, () => this.turnOff());
        this.#handlers.push(hdlrOff);
        let hdlrSetTemp = new Handler('click', setTempBtn, () => this.updateTemperature());
        this.#handlers.push(hdlrSetTemp);

        return this.#element;
    }

    async save() {
      if (this.#edit) {
        const newDesc = (this.#edit.querySelector('input').value || '').trim();
        if (newDesc) {
          try {
            console.debug(`Attempting to update heatpump ${this.#model.id} with '${newDesc}'...`);
            await this.#model.update(newDesc);
          } catch (e) {
            console.log(`Cannot update heatpump ${this.#model.id}`);
          }
        }
        this._update();
        this._hideEditField();
      }
    }

    async turnOn(){
      console.debug("Attempting to ON the heatpump");
      try {
        await this.model.update("ON");
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

    async turnOff(){
      console.debug("Attempting to ON the heatpump");
      try {
        await this.model.update("OFF");
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

    async updateTemperature(){
      console.debug("Attempting to change ttemperature of heatpump");
      let newTemp = this.#element.querySelector("#tempOp").value;
      try {
        await this.model.updateTemp(newTemp);
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
