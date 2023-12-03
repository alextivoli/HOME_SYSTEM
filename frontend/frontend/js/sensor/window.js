'use strict';

(function (win) {
  class WindowModel {
    #state;
    #id;

    constructor() {
      this.#state = null;
      this.#id = null;
    }

    get state() { return this.#state; }
    set state(state) { this.#state = state; }

    get id() { return this.#id; }
    set id(id) { this.#id = id; }
  }

  /**
   * A task that can be synchronized with the REST API.
   */
  class RestWindowModel extends WindowModel {
    /** @type {RestClient} */
    #client;

    /**
     * Instances a new `RestWindowModel`.
     * @param client {RestClient} A rest client
     */
    constructor(id, state, client) {
      super(id, state);
      this.#client = client;
    }

    toDto() {
      return {id: this.id, state: this.state};
    }

    async create() {
      let dto = this.toDto();
      dto = await this.#client.post('newwindow', dto);
      this.id = dto.result.id;
      this.state = dto.result.state;
      return this;
    }

    async delete() {
      await this.#client.del(`window/${encodeURIComponent(this.id)}`);
      return this;
    }

    async update(state) {
      console.log("Update Window: ", this.id);
      let dto = {state: state};
      await this.#client.put(`window/${encodeURIComponent(this.id)}`, dto);
      this.state = state;
      return this;
    }

  }

  /* Exporting models */
  win.RestWindowModel ||= RestWindowModel;
  win.WindowModel ||= WindowModel;

})(window);