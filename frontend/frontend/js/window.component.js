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
      textId.innerHTML = `Window ID: ${model.id}`;
      const textStateWindow = this.element.querySelector("#text-state-window");

      if(this.model.state == "OPEN"){
        textStateWindow.innerHTML = `Window State: ${this.model.state} ✅`;
      }else{
        textStateWindow.innerHTML = `Window State: ${this.model.state} 🔴`;
      }

      return this.element;
    }

    async open() {
      try{
        const textStateWindow = this.element.querySelector("#text-state-window");
        textStateWindow.innerHTML = `Window State: ${"OPEN ✅"}`;
        await this.model.update("OPEN");  
      }catch(e){
        console.log(e.status);
        const errorMessage = document.querySelector("#error-message");
        errorMessage.style.display = "block"
        if(e.status == 408){
          errorMessage.innerHTML = "Request timed out: window service is down.";
          this.model.update("ERROR");
        }
        else{
          errorMessage.innerHTML = "Window already open or is in error.";
          
        }
        setTimeout(function() {
          errorMessage.style.display = 'none';
      }, 5000);
      }
    }

    async close() {
      try{
        const textStateWindow = this.element.querySelector("#text-state-window");
        textStateWindow.innerHTML = `Window State: ${"CLOSED 🔴"}`;
        await this.model.update("CLOSED");
       
      } catch(e){
        console.log(e.status);
        const errorMessage = document.querySelector("#error-message");
        errorMessage.style.display = "block"
        if(e.status == 408){
          errorMessage.innerHTML = "Request timed out: window service is down.";
          this.model.update("ERROR");
        }
        else{
          errorMessage.innerHTML = "Window already closed or is in error.";
        }
        setTimeout(function() {
          errorMessage.style.display = 'none';
      }, 5000);
      }
    }


    

    
  }

  /* Exporting component */
  win.WindowComponent ||= WindowComponent;

})(window);
