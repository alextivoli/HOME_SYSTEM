(function (win) {


  /**
   * A component that shows, adds and removes tasks.
   */
  class WindowsComponent {
    element = null;
    client = null;
    windows = [];
    wsclient = null;

    /**
     * Instances this component.
     * @param client {RestClient} A REST client
     */
    constructor(client, wsclient) {
      this.client = client;
      this.wsclient = wsclient;
    }

    /**
     * Destroys this component, removing it from it's parent node.
     */
    destroy() {
      this.element.remove();
    }

    async init() {
      this.element = document.createElement('div');
      
      let btnNewWindow = document.getElementById("btnNewWindow");
      btnNewWindow.addEventListener('click', ($event) => {
        $event.preventDefault();
        this.addWindow();
      });

      try {
        const resp = await this.client.get(`windows`);
        console.log("RESP RESULT WINDOWS: ", resp.result);
        if(!!resp.result){
          resp.result.forEach(async dto => {
            if(dto._windowId == 1 && dto._state == "CLOSED"){
              const model = new RestWindowModel('1','CLOSED' , this.client);
              model.id = dto._windowId;
              model.state = dto._state;
              console.log("Window successfully saved", {model: model});
              const root = this.element;
              const component = new WindowComponent(model, this.wsclient);
              const el = component.init(model);
              root.appendChild(el);
            }
          });
        }
        
      } catch (e) {
        console.error('Something went wrong getting windows', e);
      }

      return this.element;
    }

    createWindowComponent(model) {
      const root = this.element;
      const component = new WindowComponent(model, this.wsclient);
      this.windows.push({model, component});
      const el = component.init(model);
      root.appendChild(el);
    }

    async addWindow() {
      console.log("NEW WINDOWS");
        const model = new RestWindowModel('0', "CLOSED", this.client);
        try{
          await model.create();
          console.log("Window successfully saved", {model: model.toDto()});
          this.createWindowComponent(model);
        }catch(e){
          const section = document.querySelector("section");
          const errorMessage = document.querySelector("#error-message");
          if(e.status == 408){
            errorMessage.innerHTML = "Request timed out: window service is down.";
          }
          else{
            errorMessage.innerHTML = "Unable to add new window sensor.";
          }
          section.classList.add("active");
        }
    }
  }

  /* Exporting component */
  win.WindowsComponent ||= WindowsComponent;

})(window);
