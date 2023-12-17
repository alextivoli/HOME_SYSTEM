export function sequencer() {
    let i = 1;
    return function () {
        const n = i;
        i++;
        return n;
    }
  }

export function calculateTemp(msg, temperature, services , lastTemp){

    switch(msg.type) {
        // case 'windows':
        //   if(!!services){
        //     if(services.get('windows'+msg.valueId) == 'OPEN' && msg.value.state != 'OPEN'){
        //       temperature = temperature + 1.0;
        //     }
        //     if(services.get('windows'+msg.valueId) == 'CLOSED' && msg.value.state != 'CLOSED'){
        //       if((temperature -1) >= lastTemp){
        //         temperature = temperature - 1.0;
        //       }
        //     }
        //   }
        //   break;
        // case 'door':
        //   if(!!services){
        //     if(services.get('door') == 'OPEN' && msg.value._state != 'OPEN'){
        //       temperature = temperature + 1.0;
        //     }
        //     if(services.get('door') == 'CLOSED' && msg.value._state != 'CLOSED'){
        //       if((temperature -1) >= lastTemp){
        //         temperature = temperature - 1.0;
        //       }
        //     }
        //   }
        //   break;
        case 'heatpump':
          if(services.get('heatpump') == 'ON'){
            temperature = (parseInt(temperature, 10) + parseInt(msg.value._temperature, 10)) / 2;
          }
          break;
        case 'temperature':
          console.log(serviceState(services));
          if(serviceState(services)){
              temperature = (parseInt(temperature, 10) + parseInt(msg.value.temp, 10)) / 2;
          }
          break;
      } 
      
      return temperature;
}

function serviceState(services) {
  const serviceArray = Array.from(services.values());
  for (const element of serviceArray) {
    if (element === "OPEN") {
      return true;
    }
  }

  return false;
}



