'use strict';

(function (win) {

  class DoorComponent extends EventEmitter {
    model;
    element;
    client = null;
    wsclient = null;
    handlers = [];


    constructor(client, wsclient) {
      super();
      this.client = client;
      this.wsclient = wsclient;
    }

    destroy() {
      this.handlers.forEach(h => h.unregister());
      this.element.remove();
    }

    async init() {

      try {
        const resp = await this.client.get(`door`);
        const door = resp.result;
        this.model = new RestDoorModel(door._state, this.client);
      } catch (e) {
        console.error('Something went wrong getting doors information', e);
      }

      this.element = document.createElement("div");
      this.element.className = "temp";
      this.element.id = "temp";
      this.element.innerHTML = document.querySelector('script#doors-control-template').textContent;

      const textStateWindow = this.element.querySelector("#text-state-door");

      if(this.model.state == "OPEN"){
        textStateWindow.innerHTML = `Door State: ${this.model.state} ✅`;
      }else{
        textStateWindow.innerHTML = `Door State: ${this.model.state} 🔴`;
      }
      

      const openBtn = this.element.querySelector("#btnOn");
      const closeBtn = this.element.querySelector("#btnOff");
      
      let hdlrOpen = new Handler('click', openBtn, () => this.open());
      this.handlers.push(hdlrOpen);
      let hdlrClose = new Handler('click', closeBtn, () => this.close());
      this.handlers.push(hdlrClose);

      return this.element;
    }

    async open() {
      try {
        const textStateWindow = this.element.querySelector("#text-state-door");
        textStateWindow.innerHTML = `Door State: ${"OPEN ✅"}`;
        await this.model.update("OPEN");
      } catch (e) {
        console.log(e.status);
        const errorMessage = document.querySelector("#error-message");
        errorMessage.style.display = "block"
        if (e.status == 408) {
          errorMessage.innerHTML = "Request timed out: door service is down.";
          this.model.update("ERROR");
        }
        else {
          errorMessage.innerHTML = "Door already open or is in error.";
          
        }
        setTimeout(function() {
          errorMessage.style.display = 'none';
      }, 5000);
      }
    }

    async close() {
      try {
        const textStateWindow = this.element.querySelector("#text-state-door");
        textStateWindow.innerHTML = `Door State: ${"CLOSED"}`;
        await this.model.update("CLOSED");
      } catch (e) {
        const errorMessage = document.querySelector("#error-message");
        errorMessage.style.display = "block"
        if (e.status == 408) {
          errorMessage.innerHTML = "Request timed out: door service is down.";
          this.model.update("ERROR");
        }
        else {
          errorMessage.innerHTML = "Door already closed or is in error.";
          
        }
        setTimeout(function() {
          errorMessage.style.display = 'none';
      }, 5000);
      }
    }
  }

  /* Exporting component */
  win.DoorComponent ||= DoorComponent;

})(window);
