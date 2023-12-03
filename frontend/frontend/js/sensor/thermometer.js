'use strict';

(function (win) {
  class ThermometerModel {
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
  class RestThermometerModel extends ThermometerModel {
    /** @type {RestClient} */
    #client;

    /**
     * Instances a new `RestThermometerModel`.
     * @param client {RestClient} A rest client
     */
    constructor(client) {
      super();
      this.#client = client;
    }


  }

  /* Exporting models */
  win.RestThermometerModel ||= RestThermometerModel;
  win.ThermometerModel ||= ThermometerModel;

})(window);