"use strict";

(function (win) {
  class HeatpumpModel {
    state;
    temp;

    constructor(state, temp) {
      this.state = state;
      this.temp = temp;
    }

    get state() {
      return this.state;
    }
    set setState(state) {
      this.state = state;
    }

    get temp() {
      return this.temp;
    }
    set setTemp(temp) {
      this.temp = temp;
    }
  }

  /**
   * A task that can be synchronized with the REST API.
   */
  class RestHeatpumpModel extends HeatpumpModel {
    /** @type {RestClient} */
    client;

    /**
     * Instances a new `RestHeatpumpModel`.
     * @param client {RestClient} A rest client
     */
    constructor(state, temp, client) {
      super(state, temp);
      this.client = client;
    }

    async create() {
      let dto = this.toDto();
      dto = await this.client.post("heatpump", dto);
      return this;
    }

    async delete() {
      await this.client.del(`heatpump`);
      return this;
    }

    async update(state) {
      if (this.state !== state) {
        console.log("Update heatpump");
        let dto = { state: state };
        await this.client.put(`/heatpump/state`, dto);
        this.state = state;
        return this;
      } else {
        throw new Error("Cannot update heatpump with the same state");
      }
    }

    async updateTemp(newTemp) {
      if (
        newTemp !== this.temp &&
        parseInt(newTemp, 10) >= 10 &&
        parseInt(newTemp, 10) <= 40
      ) {
        console.log("Update heatpump");
        let dto = { temperature: newTemp };
        await this.client.put(`/heatpump/temperature`, dto);
        this.temp = newTemp;
        return this;
      } else {
        throw new Error("Cannot update heatpump's temperature");
      }
    }
  }

  /* Exporting models */
  win.RestHeatpumpModel ||= RestHeatpumpModel;
  win.HeatpumpModel ||= HeatpumpModel;
})(window);
