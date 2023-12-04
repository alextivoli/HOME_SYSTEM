"use strict";

import { ActuatorHandler } from "./actuator-handler.js";
import { WebSocket } from "ws";
import fetch from "node-fetch";

let handler = null;

/**
 * Registers a new handler for the WS channel.
 * @param ws {WebSocket} The WebSocket client
 * @param handler {WeatherHandler} The WebSocket handler
 */
function registerHandler(ws, handler) {
  const removeAllListeners = () => {
    ws.removeListener("handler", handlerCb);
    ws.removeListener("ping", pingCb);
    ws.removeListener("close", closeCb);
    ws.removeListener("error", errorCb);
  };

  function pingCb() {
    console.trace("🏐 Ping-Pong", { handler: handler.name });
    ws.pong();
  }

  function handlerCb(msg) {
    try {
      handler.onMessage(msg);
    } catch (e) {
      console.error(
        "💢 Unexpected error while handling inbound message",
        { handler: handler.name },
        e
      );
    }
  }

  function closeCb() {
    console.info("⛔ WebSocket closed", { handler: handler.name });
    handler.stop();
    removeAllListeners();
  }

  function errorCb(err) {
    console.error("💥 Error occurred", { handler: handler.name }, err);
    handler.stop();
    removeAllListeners();
    ws.close();
  }

  ws.on("message", handlerCb);
  ws.on("ping", pingCb);
  ws.on("close", closeCb);
  ws.on("error", errorCb);

  handler.on("error", (err) => {
    errorCb(err);
  });

  // starts the handler
  handler.start();
}

/**
 * Initializes routes.
 * @param {Express} app Express application
 * @param {WebSocketServer} wss WebSocket server
 * @param {{iface: string, port: number}} config Configuration options
 */
export function routes(app, config) {
  const ws = new WebSocket("ws://backend:8000");
  ws.on("open", () => {
    console.info("Connected to backend");
    try {
      ws.send(JSON.stringify({ type: "start", source: "actuator" }));

      if (handler === null) {
        handler = new ActuatorHandler(ws, config, `actuator`);
      } else {
        handler.ws = ws;
      }

      registerHandler(ws, handler);
    } catch (e) {
      console.error("💥 Failed to register WS handler, closing connection", e);
      ws.close();
    }
  });

  ws.on("close", () => {});

  ws.on("error", () => {
    setTimeout(function () {
      console.info("Connection to the backend failed. Reconnecting...");
      routes(app, config);
    }, 2000);
  });

  app.put("/door/state", async (req, resp) => {
    const { state } = req.body;

    console.debug("Attempting to change state of door with state: ", { state });

    const url = 'http://door:8082/door/state';

    fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(responseData => {
        console.log('PUT request successful:', responseData);
      })
      .catch(error => {
        console.error('Error during PUT request:', error);
      });
  });

  app.put("/heatpump/state", async (req, resp) => {
    const { state } = req.body;

    console.debug("Attempting to change state of heatpump with state: ", {
      state,
    });

    try {
      const response = await fetch(
        `http://heatpump:8083/heatpump/state`,
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

  app.put("/heatpump/temperature", async (req, resp) => {
    const temperature = req.body.temp;

    console.debug("Attempting to change temperature of heatpump with: ", 
      temperature
    );

    try {
      const response = await fetch(
        `http://heatpump:8083/heatpump/temperature`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(temperature),
        }
      );
      const result = await response;
      return result;
    } catch (error) {
      console.error("Error:", error);
      return { error: "Something went wrong" };
    }
  });

  app.post("/newwindow", async (req, resp) => {
    const state  = req.body;
    console.log("Attempting to create a new window", { state: state });

    try {
      const response = await fetch(
        `http://window:8085/newwindow`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(state),
        }
      );
      const result = await response.json();
      resp.json({result: result.result});
      return result;
    } catch (error) {
      console.error("Error:", error);
      return { error: "Something went wrong" };
    }
  });

  app.put("/window/:id", async (req, resp) => {
    try {
      const id = req.params.id;
      const response = await fetch(
        `http://window:8085/window/${encodeURIComponent(id)}`,
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
      return result;
    } catch (error) {
      console.error("Error:", error);
      return { error: "Something went wrong" };
    }
  });

}
