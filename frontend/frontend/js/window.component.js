'use strict';

(function (win) {

  /**
   * Encapsulates the control and view logics behind a single task.
   */
  class WindowComponent extends EventEmitter {
    
    model;
    element;
    handlers = [];

    /**
     * Instances a new `TaskComponent` component.
     * @param model {RestTaskModel} A task model
     */
    constructor(model) {
      super();
      this.model = model;
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
    init(model) {
      
      this.element = document.createElement("div");
      this.element.className = "temp";
      this.element.id = "temp";
      this.element.innerHTML = document.querySelector('script#windows-control-template').textContent;
      
      const openBtn = this.element.querySelector("#btnOn");
      const closeBtn = this.element.querySelector("#btnOff");
      
      let hdlrOpen = new Handler('click', openBtn, () => this.open());
      this.handlers.push(hdlrOpen);
      let hdlrClose = new Handler('click', closeBtn, () => this.close());
      this.handlers.push(hdlrClose);

      const textId = this.element.querySelector("#window-info-id");
      const textStateWindow = this.element.querySelector("#text-state-window");
      textId.innerHTML = `Window ID: ${model.id}`;
      textStateWindow.innerHTML = `Window State: ${model.state}`;

      return this.element;
    }

    async open() {
      try{
        await this.model.update("OPEN");
      }catch(e){
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        if(e.status == 408){
          errorMessage.innerHTML = "Request timed out: window service is down.";
        }
        else{
          errorMessage.innerHTML = "Window already open or is in error.";
        }
        section.classList.add("active");
      }
    }

    async close() {
      try{
        await this.model.update("CLOSED");
      } catch(e){
        console.log(e.status);
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        if(e.status == 408){
          errorMessage.innerHTML = "Request timed out: window service is down.";
        }
        else{
          errorMessage.innerHTML = "Window already closed or is in error.";
        }
        section.classList.add("active");
      }
    }


    

    
  }

  /* Exporting component */
  win.WindowComponent ||= WindowComponent;

})(window);
