export function sequencer() {
    let i = 1;
    return function () {
        const n = i;
        i++;
        return n;
    }
  }

export function calculateTemp(msg, temperature, services ){

  console.log("SENSOR -> ", msg);
    switch(msg.type) {
        case 'windows':
          if(!!services){
            if(services.get('windows'+msg.valueId) == 'OPEN' && msg.value.state != 'OPEN'){
              temperature = temperature + 1.0;
            }
            if(services.get('windows'+msg.valueId) == 'CLOSED' && msg.value.state != 'CLOSED'){
              temperature = temperature - 1.0;
            }
          }
          break;
        case 'door':
          if(!!services){
            if(services.get('door') == 'OPEN' && msg.value.state != 'OPEN'){
              temperature = temperature + 1.0;
            }
            if(services.get('door') == 'CLOSED' && msg.value.state != 'CLOSED'){
              temperature = temperature - 1.0;
            }
          }
          break;
        case 'heatpump':
          if(services.get('heatpump') == 'ON'){
            temperature = (temperature + msg.value.temperature) / 2;
          }
          break;
        case 'temperature':
          temperature = (temperature + msg.value.temp) / 2;
          break;
      } 

      return temperature;
}