"use strict";

(function (win) {
  /**
   * Encapsulates the control and view logics behind a single thermometer.
   */
  class ThermometerComponent extends EventEmitter {
    /** @type {RestThermometerModel} */
    model;
    /** @type {HTMLElement|null} */
    element;
    /** @type {Handler[]} */
    handlers = [];
    /** @type {WSClient[]} */
    wsclient;

    /**
     * Instances a new `ThermometerComponent` component.
     * @param model {RestThermometerModel} A thermometer model
     */
    constructor(model, wsclient) {
      super();
      this.model = model;
      this.element = null;
      this.handlers = [];
      this.wsclient = wsclient;
    }

    /**
     * Destroys this component, removing it from it's parent node.
     */
    destroy() {
      this.handlers.forEach((h) => h.unregister());
      this.element.remove();
    }

    /**
     * Initializes the component.
     * @return {HTMLElement} The root element for this component.
     */
    init() {
      this.element = document.createElement("div");
        this.element.className = "temp";
        this.element.id = "temp";
        this.element.innerHTML = document.querySelector('script#termomether-control-template').textContent;

        const textTempWeather= this.element.querySelector("#termomether-temperature");

        const root = document.querySelector('#info-bar');
        
        const tempWeather = this.wsclient.getTempTermomether();
        tempWeather.subscribe((data) => {
          console.log(data);
          textTempWeather.innerHTML = `Termomether Temperature: ${data.value}`;
        });

        root.appendChild(this.element);
        return this.element;
    }


  }

  /* Exporting component */
  win.ThermometerComponent ||= ThermometerComponent;
})(window);
