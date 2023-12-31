'use strict';

(async function () {
  const client = new RestClient('/api');
  const ws = new WSClient('/ws');
  const rootDoor = document.querySelector('#info-door');
  const rootHeatpump = document.querySelector('#info-pump');
  const rootWindows = document.querySelector('#info-windows');
  const login = document.querySelector('#login-container');
  const components = [];
  let subscription = null;

  async function init() {
    const token = localStorage.getItem('id_token');
    let element, component, comp_door, comp_heatpump, comp_weather, comp_windows, comp_termomether;

    if (token) {
      await ws.init();

      var controlPanel = document.getElementById("control-panel-template");
      controlPanel.style.display = "block";

      var containerChart = document.getElementById("container-chart");
      containerChart.style.display = "block";

      var loginContainer = document.getElementById("login-container");
      loginContainer.style.display = "none";

      const titlePage = document.getElementById("title-page");
      titlePage.innerHTML = "CONTROL PAGE"
      const subTitlePage = document.getElementById("sub-title-page");
      subTitlePage.style.display="none"

      const errorMessage = document.querySelector("#error-message");
      errorMessage.style.display = "none"



      comp_door = new DoorComponent(client, ws);
      comp_heatpump = new HeatpumpComponent(client, ws);
      const modelWeather = new RestWeatherModel(client);
      comp_weather = new WeatherComponent(modelWeather, client, ws);
      comp_windows = new WindowsComponent(client, ws);
      comp_termomether = new ThermometerComponent(client, ws);

      if (subscription) {
        subscription.unsubscribe();
      }
      subscription = null;

      let elem_door = await comp_door.init();
      await rootDoor.appendChild(elem_door);
      components.push(comp_door);

      let elem_weather = await comp_weather.init();
      components.push(elem_weather);

      let elem_heatpump = await comp_heatpump.init();
      await rootHeatpump.appendChild(elem_heatpump);
      components.push(comp_heatpump);

      let elem_windows = await comp_windows.init();
      await rootWindows.appendChild(elem_windows);
      components.push(elem_windows);

      let elem_termomether = await comp_termomether.init();
      components.push(elem_termomether);


    } else {
      var controlPanel = document.getElementById("control-panel-template");
      var containerChart = document.getElementById("container-chart");
      controlPanel.style.display = "none";
      containerChart.style.display = "none";

      const titlePage = document.getElementById("title-page");
      titlePage.innerHTML = "WELCOME"
      
      component = new LoginComponent(client);
      subscription = component.on('authenticated', init);
      element = await component.init();
      components.forEach(c => c.destroy());
      await login.appendChild(element);
      components.push(component);
    }
        

  }

  // initializes the components
  await init();
  console.info('🏁 Application initialized');

})();
