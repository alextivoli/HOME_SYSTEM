'use strict';

import {HeatpumpHandler} from './heatpump-handler.js';
import {v4 as uuid} from 'uuid';
import {WebSocket} from "ws";
import {sequencer} from './utils.js'
import {Heatpump} from './heatpump.js'

let handler = null;
let heatpump = new Heatpump("OFF", 20);

export function getStateOfHeatpump(){
  return heatpump.state;
}

export function getTempofHeatpump(){
  return heatpump.temperature;
}

/**
 * Registers a new handler for the WS channel.
 * @param ws {WebSocket} The WebSocket client
 * @param handler {WeatherHandler} The WebSocket handler
 */
function registerHandler(ws, handler) {

  const removeAllListeners = () => {
    ws.removeListener('handler', handlerCb);
    ws.removeListener('ping', pingCb);
    ws.removeListener('close', closeCb);
    ws.removeListener('error', errorCb);
  };

  function pingCb() {
    console.trace('🏐 Ping-Pong', {handler:handler.name},);
    ws.pong();
  }

  function handlerCb(msg) {
    try {
      handler.onMessage(msg);
    } catch (e) {
      console.error('💢 Unexpected error while handling inbound message', {handler:handler.name}, e);
    }
  }

  function closeCb() {
    console.info('⛔ WebSocket closed', {handler:handler.name},);
    handler.stop();
    removeAllListeners();
  }

  function errorCb(err) {
    console.error('💥 Error occurred', {handler:handler.name}, err);
    handler.stop();
    removeAllListeners();
    ws.close();
  }

  ws.on('message', handlerCb);
  ws.on('ping', pingCb);
  ws.on('close', closeCb);
  ws.on('error', errorCb);

  handler.on('error', (err) => {
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
      ws.send(JSON.stringify({"type": "start", "source": "heatpump", "value": heatpump}));

      if(handler === null){
        handler = new HeatpumpHandler(ws, config, `heatpump`);
      }
      else{
        handler.ws = ws;
      }

      registerHandler(ws, handler);
      
    } catch (e) {
      console.error('💥 Failed to register WS handler, closing connection', e);
      ws.close();
    }
  });

  ws.on("close", () => {
  });

  ws.on("error", () => {
    setTimeout(function(){
      console.info("Connection to the backend failed. Reconnecting...");
      routes(app, config);
    }, 2000);
  });

  app.put("/heatpump/state", async (req, resp) => {
    const { state } = req.body;
    console.log("HEATPUMP SERVICE CHANGE STATE:  ", state);
    heatpump._state = state;
    handler._sendState();
    resp.json({
      result: true,
    });
  });

  app.put("/heatpump/temperature", async (req, resp) => {
    console.log("REQ: ", req.body);
    const { temp } = req.body;
    console.log("HEATPUMP SERVICE CHANGE STATE:  ", temp);
    heatpump._temperature = temp;
    handler._sendTemp();
    resp.json({
      result: true,
    });
  });
}
