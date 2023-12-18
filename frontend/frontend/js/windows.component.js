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
        if(!!resp.result){

          resp.result.forEach(async dto => {
            
              const model = new RestWindowModel('1','CLOSED' , this.client);
              model.id = dto._windowId;
              model.state = dto._state;
              const root = this.element;
              const component = new WindowComponent(model, this.wsclient);
              const el = component.init(model);
              root.appendChild(el);
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
        const model = new RestWindowModel('0', "CLOSED", this.client);
        try{
          await model.create();
          this.createWindowComponent(model);
        }catch(e){
          const errorMessage = document.querySelector("#error-message");
          errorMessage.style.display = "block"
          if(e.status == 408){
            errorMessage.innerHTML = "Request timed out: window service is down.";
          }
          else{
            errorMessage.innerHTML = "Unable to add new window sensor.";
          }
        }
    }
  }

  /* Exporting component */
  win.WindowsComponent ||= WindowsComponent;

})(window);
