"use strict";
import { Window } from "./sensor/window.js";
import { Thermometer } from "./sensor/thermometer.js";
import { Heatpump } from "./sensor/heatpump.js";
import { Door } from "./sensor/door.js";
import fetch from "node-fetch";
import {newId} from "./utils.js"

const id = newId();

function retrieveDate(dateRaw) {
  let completeDate = new Date(dateRaw);

  let hours = completeDate.getHours();
  let minutes = completeDate.getMinutes();
  let seconds = completeDate.getSeconds();

  let year = completeDate.getFullYear();
  let month = completeDate.getMonth() + 1;
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
                let obj = new Window(data.value.windowId,data.value.state);
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
            temp = data.value;
            resultDate = retrieveDate(data.dateTime);
            console.info(
              "TEMPERATURE :: New temperature received from the weather microservice: " +
                temp
            );

            let obj = {date: resultDate.date, time: resultDate.time, temp: temp}
            temperatures.push(obj);

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
              temp = data.temp;
              for (let [sensor, ws ] of clients) {
                if (sensor == "client") {
                  ws.send(JSON.stringify({ type: "thermometer", value: temp }));
                }
              }
              break;

          case "door":
            // RICEZIONE NUOVO STATO DA DOOR SERVICE
            resultDate = retrieveDate(data.dateTime);
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
            }
            break;

          case "heatpump-state":
            // RICEZIONE NUOVO STATO DA HEATPUMP SERVICE
            resultDate = retrieveDate(data.dateTime);
            const heatpump_state = data.state;

            console.info(
              "HEATPUMP :: New state received from the doors microservice: " +
                heatpump_state
            );

            if (heatpump == null) {
              heatpump = new Heatpump(heatpump_state);
            } else {
              heatpump.state = heatpump_state;
            }

            services.set("heatpump", heatpump);

            for (let [sensor, ws ] of clients) {
              if (sensor == "client") {
                ws.send(JSON.stringify({ type: "heatpump", value: heatpump }));
              }
            }
            break;

          case "heatpump-temp":
            // RICEZIONE NUOVA TEMPERATURA DA HEATPUMP SERVICE
            resultDate = retrieveDate(data.dateTime);
            const heatpump_temp = data.temp;

            console.info(
              "HEATPUMP :: New temp received from the doors microservice: " +
                heatpump_temp
            );

            if (heatpump == null) {
              heatpump = new Heatpump(heatpump_temp);
            } else {
              heatpump.temperature = heatpump_temp;
            }

            for (let [sensor, ws ] of clients) {
              if (sensor == "client") {
                ws.send(JSON.stringify({ type: "heatpump", value: heatpump }));
              }
            }
            break;

          case "windows":
            // RICEZIONE WINDOWS DA SERVICE
            resultDate = retrieveDate(data.dateTime);
            if(windows.length == 0){
              windows.push(new Window(data.value[0].windowId, data.value[0].state));
            }else{
              if(windows.find( element => element.id == data.value[0].windowId) > 0){
                windows.find( element => element.id == data.value[0].windowId).state = state;
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

  app.get("/login", (req, resp) => {
    oidc.login(req, resp);
  });

  app.get("/tokens", (req, resp) => {
    oidc.tokens(req, resp);
  });

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
      for (let [sensor, ws ] of clients) {
        if (sensor == "thermometer") {
          ws.send(JSON.stringify({ type: "door", value: req.body }));
        }
      }
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

      for (let [sensor, ws ] of clients) {
        if (sensor == "thermometer") {
          ws.send(JSON.stringify({ type: "heatpump", value: req.body }));
        }
      }
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

      for (let [sensor, ws ] of clients) {
        if (sensor == "thermometer") {
          ws.send(JSON.stringify({ type: "heatpump", value: req.body }));
        }
      }
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
      return result;
    } catch (error) {
      console.error("Error:", error);
      return { error: "Something went wrong" };
    }
  });
}
