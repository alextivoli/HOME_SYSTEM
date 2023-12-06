export function sequencer() {
    let i = 1;
    return function () {
        const n = i;
        i++;
        return n;
    }
  }

export function calculateTemp(msg, temperature, services ){

    switch(msg.type) {
        case 'windows':
          if(!!services){
            if(services.get('windows') == 'OPEN' && msg.value.state != 'OPEN'){
              temperature++;
            }
            if(services.get('windows') == 'CLOSED' && msg.value.state != 'CLOSED'){
              temperature--;
            }
          }
          break;
        case 'door':
          if(!!services){
            if(services.get('door') == 'OPEN' && msg.value.state != 'OPEN'){
              temperature++;
            }
            if(services.get('door') == 'CLOSED' && msg.value.state != 'CLOSED'){
              temperature--;
            }
          }
          break;
        case 'heatpump/state':
          if(!!services){
            if(services.get('heatpump') == 'OFF' && msg.value.state != 'OFF'){
              temperature++;
            }
            if(services.get('heatpump') == 'ON' && msg.value.state != 'ON'){
              temperature--;
            }
          }
          break;
        case 'heatpump/temperature':
          if(services.get('heatpump') == 'ON'){
            temperature = (temperature + msg.value.temp) / 2;
          }
          break;
        case 'temperature':
          temperature = (temperature + msg.value.temp) / 2;
          break;
      } 

      return temperature;
}