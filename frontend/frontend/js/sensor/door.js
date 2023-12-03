'use strict';

(function (win) {
  class DoorModel {
    #state;

    constructor(state) {
      this.#state = state;
    }

    get state() { return this.#state; }
    set state(state) { this.#state = state; }
  }

  /**
   * A task that can be synchronized with the REST API.
   */
  class RestDoorModel extends DoorModel {
    /** @type {RestClient} */
    #client;

    /**
     * Instances a new `RestDoorModel`.
     * @param client {RestClient} A rest client
     */
    constructor(state, client) {
      super(state);
      this.#client = client;
    }

    async create() {
      let dto = this.toDto();
      dto = await this.#client.post('door', dto);
      return this;
    }

    async delete() {
      await this.#client.del(`door`);
      return this;
    }

    async update(state) {
      console.log("Update Door");
      let dto = {state: state};
      await this.#client.put(`door`, dto);
      this.state = state;
      return this;
    }
  }

  /* Exporting models */
  win.RestDoorModel ||= RestDoorModel;
  win.DoorModel ||= DoorModel;

})(window);