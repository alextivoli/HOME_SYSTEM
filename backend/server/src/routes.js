"use strict";
import { Window } from "./sensor/window.js";
import { Thermometer } from "./sensor/thermometer.js";
import { Heatpump } from "./sensor/heatpump.js";
import { Door } from "./sensor/door.js";
import fetch from "node-fetch";

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
        console.log("DATA.TYPE: ", data.type);
        switch (data.type) {
          case "start":
            switch (data.source) {

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
                if (windows == []) {
                  windows.push(new Window(data.value._state)) 
                } 
                ws.send(
                  JSON.stringify({ type: "subscribe", target: "windows" })
                );
                break;

              case "door":
                console.info("DOORS :: Doors microservice connected");
                if (door == null) {
                  door = new Door(data.value._state);
                } else {
                  door.state = data.value._state;
                }
                clients.set("door", ws);

                ws.send(JSON.stringify({ type: "subscribe", target: "door" }));
                break;

              case "heatpump":
                console.info("HEATPUMP :: HeatPump microservice connected");
                if (heatpump == null) {
                  heatpump = new Heatpump(data.value._state);
                } else {
                  heatpump.state = data.value._state;
                }
                clients.set("heatpump", ws);

                ws.send(
                  JSON.stringify({ type: "subscribe", target: "heatpump" })
                );
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

            temperatures.push({
              date: resultDate.date,
              time: resultDate.time,
              temp: temp,
            });

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

            services.set("heatpump", heatpump);

            for (let [sensor, ws ] of clients) {
              if (sensor == "client") {
                ws.send(JSON.stringify({ type: "heatpump", value: heatpump }));
              }
            }
            break;

          case "windows":
            // RICEZIONE NUOVA WINDOWS DA SERVICE
            resultDate = retrieveDate(data.dateTime);

            console.log("data  -------------------------------- : ", data.states);

            if(windows == []){
              windows.push(new Window(data.states[0].windowId, data.states[0].state));
            }else{
              if(windows.find( element => element.id == data.states[windows.length].windowId) > 0){
                console.info(
                  "WINDOWS :: windows alredy created  by microservice "
                );
              }else{
                windows.push(new Window(data.states[windows.length].windowId, data.states[windows.length].state));
              }
            }

            console.info(
              "WINDOWS :: New windows has been created by windows microservice: "
            );

            for (let [sensor, ws ] of clients) {
              if (sensor == "client") {
                ws.send(JSON.stringify({ type: "windows", value: indows.find( element => element.id == data.states.windowId)[0] }));
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
      return result;
    } catch (error) {
      console.error("Error:", error);
      return { error: "Something went wrong" };
    }
  });

  app.post("/newwindow", authenticate, async (req, resp) => {
    const { state } = req.body;
    console.log("Attempting to create a new window", { state: state });
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
