'use strict';

(function (win) {

  /**
   * Encapsulates the control and view logics behind a single task.
   */
  class WeatherComponent extends EventEmitter {
    /** @type {RestTaskModel} */
    #model;
    /** @type {HTMLElement|null} */
    #element;
    /** @type {Handler[]} */
    #handlers = [];
    /** @type {HTMLElement|null} */
    #edit = null;
    /** @type {WSClient} */
    #wsclient;

    /**
     * Instances a new `WeatherComponent` component.
     * @param model {RestDoorModel} A door model
     */
    constructor(model, wsclient) {
      super();
      this.#model = model;
      this.#wsclient = wsclient;
      this.#element = null;
      this.#handlers = [];
      this.#edit = null;
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
    init() {
        this.#element = document.createElement("div");
        // this.#element.className = "weather";
        // this.#element.innerHTML = document.querySelector('script#weather-control-template').textContent;
        // const textTempWindow = this.element.querySelector("#text-weather");
        // textTempWindow.innerHTML = `Weather Temperature: ${this.model.temp}`;
        return this.#element;

    }

  }

  /* Exporting component */
  win.WeatherComponent ||= WeatherComponent;

})(window);