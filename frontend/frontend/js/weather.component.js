'use strict';

(function (win) {

  /**
   * Encapsulates the control and view logics behind a single task.
   */
  class WeatherComponent extends EventEmitter {
    /** @type {RestTaskModel} */
    model;
    /** @type {HTMLElement|null} */
    element;
    /** @type {Handler[]} */
    handlers = [];
    /** @type {WSClient} */
    wsclient;
    temperatures;
    chart;
    spinner;


    /**
     * Instances a new `WeatherComponent` component.
     * @param model {RestDoorModel} A door model
     */
    constructor(model, wsclient) {
      super();
      this.model = model;
      this.wsclient = wsclient;
      this.element = null;
      this.handlers = [];
      this.temperatures = [];
      this.chart = null;
      this.spinner = null;
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
    init() {
        this.element = document.createElement("div");
        this.element.className = "temp";
        this.element.id = "temp";
        this.element.innerHTML = document.querySelector('script#weather-control-template').textContent;

        const textTempWeather= this.element.querySelector("#weather-temperature");
        textTempWeather.innerHTML = "";

        const root = document.querySelector('#info-bar');

        this.spinner = this.element.querySelector("#weather-spinner");
    

        this.chart = this.createChart(this.temperatures);
        
        const tempWeather = this.wsclient.getTempWeather();

        tempWeather.subscribe((data) => {
          this.spinner.remove();
          var currentMinute = new Date().getHours() * 60 + new Date().getMinutes();
          this.temperatures[currentMinute] = data.value.temp;
          textTempWeather.innerHTML = `Weather Temperature: ${data.value.temp} °C`;
          this.chart.update();
        });

        let btnRefreshChart = document.getElementById("btnRefreshChart");

        btnRefreshChart.addEventListener('click', ($event) => {
          $event.preventDefault();
          this.chart.update();
        });

        

        root.appendChild(this.element);
        return this.element;
    }

    createChart(temperatures) {

      console.log("temperatures chart", temperatures);
      var pal = palette('cb-BuGn', 8);
    
      var ctx = document.getElementById("chartWeather").getContext("2d");
    
      Chart.defaults.global.elements.line.fill = false;
      Chart.defaults.global.elements.line.tension = 0;
      Chart.defaults.global.animation = 0;
  
      var minutesOfDay = Array.from({ length: 24 * 60 }, (_, i) => i); 
          
      var myChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: minutesOfDay, 
          datasets: [
            {
              label: "1st Line Chart",
              data: temperatures,
              borderColor: '#' + pal[3],
              backgroundColor: '#' + pal[3],
              pointRadius: 8,
              pointStyle: 'star',
            }
          ],
        },
        options: {
          responsive: true,
          legend: {
            position: 'bottom',
            labels: {
              fontSize: 12,
              boxWidth: 12,
              usePointStyle: true,
            },
          },
          title: {
            display: true,
            text: 'Weather Temperature of this day',
          },
          scales: {
            yAxes: [
              {
                ticks: {
                  min: 0,
                },
                scaleLabel: {
                  display: true,
                  labelString: "Values",
                },
              },
            ],
            xAxes: [
              {
                scaleLabel: {
                  display: true,
                  labelString: "Time of Day",
                },
                ticks: {
                  callback: function (value, index, values) {
                    return value % 60 === 0 ? Math.floor(value / 60) + ":00" : "";
                  },
                },
              },
            ],
          },
        },
      });

      return myChart;
    }

  }

  /* Exporting component */
  win.WeatherComponent ||= WeatherComponent;

})(window);