"use strict";

import { ActuatorHandler } from "./actuator-handler.js";
import { WebSocket } from "ws";
import fetch from "node-fetch";

// Initialize a variable to store the WebSocket handler
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

  // Callback function for handling ping messages
  function pingCb() {
    console.trace("🏐 Ping-Pong", { handler: handler.name });
    ws.pong();
  }

  // Callback function for handling WebSocket messages
  function handlerCb(msg) {
    try {
      handler.onMessage(msg);
    } catch (e) {
      console.error(
        "Unexpected error while handling inbound message",
        { handler: handler.name },
        e
      );
    }
  }

  // Callback function for handling WebSocket close event
  function closeCb() {
    console.info("⛔ WebSocket closed", { handler: handler.name });
    handler.stop();
    removeAllListeners();
  }

  // Callback function for handling WebSocket errors
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

  // Listen for errors on the handler and trigger the errorCb function
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

   // Event handler for when the WebSocket connection is open
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
      console.error("Failed to register WS handler, closing connection", e);
      ws.close();
    }
  });

  // Event handler for WebSocket close event
  ws.on("close", () => {
  });

  // Event handler for WebSocket errors
  ws.on("error", () => {
    setTimeout(function () {
      console.info("Connection to the backend failed. Reconnecting...");
      routes(app, config);
    }, 2000);
  });

  // Route for updating the state of a door
  app.put("/door/state", async (req, resp) => {
    try {
      const response = await fetch(
        `http://door:8082/door/state`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(req.body),
        }
      );
      const result = await response;
      resp.json({result: true});
      return result;
    } catch (error) {
      console.error("Error:", error);
      return { error: "Something went wrong" };
    }
  });

  // Route for updating the state of a heat pump
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
      resp.json({result: true});
      return result;
    } catch (error) {
      console.error("Error:", error);
      return { error: "Something went wrong" };
    }
  });

   // Route for updating the temperature of a heat pump
  app.put("/heatpump/temperature", async (req, resp) => {
    const temperature = req.body;

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
      resp.json({result: true});
      return result;
    } catch (error) {
      console.error("Error:", error);
      return { error: "Something went wrong" };
    }
  });

   // Route for creating a new window
  app.post("/newwindow", async (req, resp) => {
    const state  = req.body;
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

   // Route for updating the state of a window
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
