'use strict';

(function (win) {
  class WeatherModel {
    #temp;

    constructor() {
      this.#temp = null;
    }

    get temp() { return this.#temp; }
    set temp(temp) { this.#temp = temp; }
  }

  /**
   * A task that can be synchronized with the REST API.
   */
  class RestWeatherModel extends WeatherModel {
    /** @type {RestClient} */
    #client;

    /**
     * Instances a new `RestWeatherModel`.
     * @param client {RestClient} A rest client
     */
    constructor(client) {
      super();
      this.#client = client;
    }


  }

  /* Exporting models */
  win.RestWeatherModel ||= RestWeatherModel;
  win.WeatherModel ||= WeatherModel;

})(window);