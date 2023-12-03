"use strict";

(function (win) {
  /**
   * Encapsulates the control and view logics behind a single thermometer.
   */
  class ThermometerComponent extends EventEmitter {
    /** @type {RestThermometerModel} */
    #model;
    /** @type {HTMLElement|null} */
    #element;
    /** @type {Handler[]} */
    #handlers = [];
    /** @type {HTMLElement|null} */
    #edit = null;
    /** @type {WSClient[]} */
    #websocket;

    /**
     * Instances a new `ThermometerComponent` component.
     * @param model {RestThermometerModel} A thermometer model
     */
    constructor(model) {
      super();
      this.#model = model;
      this.#element = null;
      this.#handlers = [];
      this.#edit = null;
      this.websocket = null;
    }

    /**
     * Destroys this component, removing it from it's parent node.
     */
    destroy() {
      this.#handlers.forEach((h) => h.unregister());
      this.#element.remove();
    }

    /**
     * Initializes the component.
     * @return {HTMLElement} The root element for this component.
     */
    init() {
      this.#element = document.createElement("div");
      // this.#element.className = "thermometer";
      // this.#element.innerHTML = document.querySelector(
      //   "script#thermometer-template"
      // ).textContent;

      // const inp = this.#element.querySelector("input");
      // inp.id = `thermometer-${this.#model.id}`;
      // inp.name = inp.id;
      // const lbl = this.#element.querySelector("label");
      // lbl.htmlFor = inp.id;
      // lbl.textContent = this.#model.description;

      return this.#element;
    }


  }

  /* Exporting component */
  win.ThermometerComponent ||= ThermometerComponent;
})(window);
