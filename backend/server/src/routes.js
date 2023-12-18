"use strict";
import { Window } from "./sensor/window.js";
import { Heatpump } from "./sensor/heatpump.js";
import { Door } from "./sensor/door.js";
import fetch from "node-fetch";


function convertDate(value) {
  let completeDate = new Date(value);

  let hours = completeDate.getHours();
  let minutes = completeDate.getMinutes();
  let seconds = completeDate.getSeconds();

  let year = completeDate.getFullYear();
  let month = completeDate.getMonth();
  let day = completeDate.getDate();

  let time = `${hours}:${minutes}:${seconds}`;
  let date = `${day}-${month}-${year}`;
  if (month.toString().length == 1) {
    month = "0" + month;
  }
  if (day.toString().length == 1) {
    day = "0" + day;
  }

  time = `${hours}:${minutes}:${seconds}`;
  date = `${year}-${month}-${day}`;

  return { time: time, date: date };
}

const windows = [];
const temperatures = [];
const temperaturesRoom = [];
const clients = new Map();
const services = new Map();
let door = null;
let heatpump = null;

/**
 * Initializes routes.
 * @param {Express} app Express application
 * @param {OIDCMiddleware} oidc OpenID Connect middleware
 * @param {WebSocketServer} wss WebSocket server
 * @param {{iface: string, port: number, auth: boolean, oidc: {redirect: string, clientId: string, secret: string}}} config Configuration options
 */
export function routes(app, wss, oidc, config) {
  const authenticate = config.auth
    ? (req, res, next) => oidc.validate(req, res, next)
    : (_req, _res, next) => next();

  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        let temp = null;
        let resultDate = null;

        switch (data.type) {
          case "start":
            switch (data.source) {

              case "client":
                console.info("FRONTEND :: connected");
                clients.set("client", ws);
                break;

              case "actuator":
                console.info("ACTUATOR ::  Actuator microservice connected");
                ws.send(
                  JSON.stringify({ type: "subscribe", target: "actuator" })
                );
                break;

              case "temperature":
                console.info("TEMPERATURE ::  Weather microservice connected");

                ws.send(
                  JSON.stringify({ type: "subscribe", target: "temperature" })
                );
                break;

              case "window":
                console.info("WINDOW :: Windows microservice connected");
                clients.set("windows", ws);
                let obj = new Window(data.value._windowId,data.value._state);
                if (windows.length == 0) {
                  windows.push(obj) 
                } 
                ws.send(
                  JSON.stringify({ type: "subscribe", target: "windows" })
                );

                for (let [sensor, ws ] of clients) {    
                  if (sensor == "thermometer") {
                    ws.send(JSON.stringify({ type: "window" + data.value.windowId, value: obj }));
                  }
                }
                break;

              case "door":
                console.info("DOOR :: Doors microservice connected");
                clients.set("door", ws);
                if (door == null) {
                  door = new Door(data.value._state);
                } else {
                  door.state = data.value._state;
                }
                
                ws.send(JSON.stringify({ type: "subscribe", target: "door" }));

                for (let [sensor, ws ] of clients) {    
                  if (sensor == "thermometer") {
                    ws.send(JSON.stringify({ type: "door", value: door }));
                  }
                }
                break;

              case "heatpump":
                console.info("HEATPUMP :: HeatPump microservice connected");
                if (heatpump == null) {
                  heatpump = new Heatpump(data.value._temperature,data.value._state);
                } else {
                  heatpump.state = data.value._state;
                  heatpump.temperature = data.value._temperature;
                }
                clients.set("heatpump", ws);

                ws.send(
                  JSON.stringify({ type: "subscribe", target: "heatpump" })
                );

                for (let [sensor, ws ] of clients) {    
                  if (sensor == "thermometer") {
                    ws.send(JSON.stringify({ type: "heatpump", value: heatpump }));
                  }
                }
    
                break;

              case "thermometer":
                console.info(
                  "THERMOMETER :: Thermometer microservice connected"
                );
                clients.set("thermometer", ws);

                break;
            }
            break;

          case "temperature":
             // Handle new temperature data from the weather microservice
            temp = data.value;
            resultDate = convertDate(data.dateTime);
            console.info(
              "TEMPERATURE :: New temperature received from the weather microservice: " +
                temp
            );

            let obj = {date: resultDate.date, time: resultDate.time, temp: temp}
            var currentMinute = (new Date().getHours()+ 1) * 60  + new Date().getMinutes();

            temperatures[currentMinute] = temp;

            for (let [sensor, ws ] of clients) {
              if (sensor == "client") {
                ws.send(JSON.stringify({ type: "temperature", value: obj }));
              }

              if (sensor == "thermometer") {
                ws.send(JSON.stringify({ type: "temperature", value: obj }));
              }
            }

            break;

          case "thermometerTemp":
            // Handle new temperature data from the thermometer microservice
              temp = data.temp;
              var currentMinute = (new Date().getHours()+1) * 60 + new Date().getMinutes();


              temperaturesRoom[currentMinute] = temp;
              for (let [sensor, ws ] of clients) {
                if (sensor == "client") {
                  ws.send(JSON.stringify({ type: "thermometer", value: temp }));
                }
              }
              break;

          case "door":
            // Handle new state data from the door microservice
            resultDate = convertDate(data.dateTime);
            const state = data.state;

            console.info(
              "DOOR :: New states received from the doors microservice: " +
                state
            );

            if (door == null) {
              door = new Door(state);
            } else {
              door.state = state;
            }

            for (let [sensor, ws ] of clients) {
              if (sensor == "client") {
                ws.send(JSON.stringify({ type: "door", value: door }));
              }

              if (sensor == "thermometer") {
                ws.send(JSON.stringify({ type: "door", value: door }));
              }
            }
            break;

          case "heatpump":
            // Handle new temperature and new state data from the heatpump microservice

            resultDate = convertDate(data.dateTime);

            console.info(
              "HEATPUMP :: New state received from the doors microservice: " +
              data.value.state
            );

            if (heatpump == null) {
              heatpump = new Heatpump(data.value.temp , data.value.state);
            } else {
              heatpump._temperature =  data.value.temp;
              heatpump._state = data.value.state;
            }

            services.set("heatpump", heatpump);

            for (let [sensor, ws ] of clients) {
              if (sensor == "client") {
                ws.send(JSON.stringify({ type: "heatpump", value: heatpump }));
              }

              if (sensor == "thermometer") {
                ws.send(JSON.stringify({ type: "heatpump", value: heatpump }));
              }
            }
            break;

          case "windows":
            // Handle new state data from the window microservice
            resultDate = convertDate(data.dateTime);
            if(windows.length == 0){
              windows.push(new Window(data.value[0].windowId, data.value[0].state));
            }else{
              if(windows[data.value[0].windowId - 1] != undefined){
                windows[data.value[0].windowId - 1]._state = data.value[0].state;
              }else{
                windows.push(new Window(data.value[0].windowId, data.value[0].state));
              }
            }

            for (let [sensor, ws ] of clients) {
              if (sensor == "client") {
                ws.send(JSON.stringify({ type: "windows", value: windows.find( element => element.id == data.value.windowId)[0] }));
              }
            }
            break;
            
        }
      } catch (error) {
        console.error("Error during processing of the message:", error);
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
      clients.delete(ws);
    });
  });

  // Login route
  app.get("/login", (req, resp) => {
    oidc.login(req, resp);
  });

  // Tokens route
  app.get("/tokens", (req, resp) => {
    oidc.tokens(req, resp);
  });


   // Routes for fetching sensor data

  app.get("/door", authenticate, (req, resp) => {
    const obj = door;
    resp.json({
      result: obj,
    });
  });

  app.get("/heatpump", authenticate, (req, resp) => {
    const obj = heatpump;
    resp.json({
      result: obj,
    });
  });

  app.get("/window/:id", authenticate, (req, resp) => {
    const id = req.params.id;
    const obj = windows.find((element) => element.id == id);
    resp.json({
      result: obj,
    });
  });

  app.get("/windows", authenticate, (req, resp) => {
    resp.json({
      result: windows,
    });
  });

  app.get("/temperature-room", authenticate, (req, resp) => {
    resp.json({
      result: temperaturesRoom,
    });
  });

  app.get("/temperature", authenticate, (req, resp) => {
    resp.json({
      result: temperatures,
    });
  });

  // Routes for updating sensor states

  app.put("/door", authenticate, async (req, resp) => {

    try {
      const response = await fetch(`http://actuator:8084/door/state/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });
      const result = await response;
      resp.json({
        result: true,
      });

      door.state = req.body.state;     

      return result;
    } catch (error) {
      console.error("Error:", error);
      return { error: "Something went wrong" };
    }
  });

  app.put("/heatpump/state", authenticate, async (req, resp) => {
    try {
      const response = await fetch(`http://actuator:8084/heatpump/state/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });
      const result = await response;
      resp.json({
        result: true,
      });

      heatpump._state = req.body.state; 

      return result;
    } catch (error) {
      console.error("Error:", error);
      return { error: "Something went wrong" };
    }
  });

  app.put("/heatpump/temperature", authenticate, async (req, resp) => {
    try {
      const response = await fetch(
        `http://actuator:8084/heatpump/temperature/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(req.body),
        }
      );
      const result = await response;
      resp.json({
        result: true,
      });

      heatpump._temperature = req.body.temperature;

      return result;
    } catch (error) {
      console.error("Error:", error);
      return { error: "Something went wrong" };
    }
  });

  app.put("/window/:id", authenticate, async (req, resp) => {
    try {
      const id = req.params.id;
      const response = await fetch(
        `http://actuator:8084/window/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(req.body),
        }
      );
      const result = await response;
      resp.json(true);

      windows[id - 1]._state = req.body.state;

      for (let [sensor, ws ] of clients) {
        if (sensor == "thermometer") {
          ws.send(JSON.stringify({ type: "windows", value: req.body, valueId: id }));
        }
      }

      return result;
    } catch (error) {
      console.error("Error:", error);
      return { error: "Something went wrong" };
    }

    
  });

  app.post("/newwindow", authenticate, async (req, resp) => {
    const { state } = req.body;
    let dto = { state: state };

    try {
      const response = await fetch(`http://actuator:8084/newwindow/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dto),
      });
      const result = await response.json();

      resp.json({result: result.result});

      windows.push(new Window(result.result.id, result.result.state));
      return result;
    } catch (error) {
      console.error("Error:", error);
      return { error: "Something went wrong" };
    }
  });
}
