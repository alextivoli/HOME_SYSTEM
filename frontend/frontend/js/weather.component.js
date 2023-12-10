'use strict';

(function (win) {

  /**
   * Encapsulates the control and view logics behind a single task.
   */
  class WeatherComponent extends EventEmitter {
    /** @type {RestTaskModel} */
    model;
    /** @type {HTMLElement|null} */
    element;
    /** @type {Handler[]} */
    handlers = [];
    /** @type {WSClient} */
    wsclient;

    /**
     * Instances a new `WeatherComponent` component.
     * @param model {RestDoorModel} A door model
     */
    constructor(model, wsclient) {
      super();
      this.model = model;
      this.wsclient = wsclient;
      this.element = null;
      this.handlers = [];
    }

    /**
     * Destroys this component, removing it from it's parent node.
     */
    destroy() {
      this.handlers.forEach(h => h.unregister());
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
        this.element.innerHTML = document.querySelector('script#weather-control-template').textContent;

        const textTempWeather= this.element.querySelector("#weather-temperature");

        const root = document.querySelector('#info-bar');
        
        const tempWeather = this.wsclient.getTempWeather();
        tempWeather.subscribe((data) => {
          textTempWeather.innerHTML = `Weather Temperature: ${data.value.temp}`;
        });

        root.appendChild(this.element);
        return this.element;
    }

  }

  /* Exporting component */
  win.WeatherComponent ||= WeatherComponent;

})(window);