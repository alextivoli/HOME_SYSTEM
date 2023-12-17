'use strict';

import {ThermometerHandler} from './thermometer-handler.js';
import {WebSocket} from "ws";

// Initialize a variable to store the WebSocket handler
let handler = null;

// Initialize a variable to store the Heatpump object
let thermometer = null;


export function getStateOfthermometer(){
  if(!!thermometer){
    return thermometer.state;
  }else{
    return null;
  }
  
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

    // Callback function for handling ping messages
  function pingCb() {
    console.trace('Ping-Pong', {handler:handler.name},);
    ws.pong();
  }

    // Callback function for handling WebSocket messages
  function handlerCb(msg) {
    try {
      handler.onMessage(msg);
    } catch (e) {
      console.error('Unexpected error while handling inbound message', {handler:handler.name}, e);
    }
  }

    // Callback function for handling WebSocket close event
  function closeCb() {
    console.info('WebSocket closed', {handler:handler.name},);
    handler.stop();
    removeAllListeners();
  }

    // Callback function for handling WebSocket errors
  function errorCb(err) {
    console.error('Error occurred', {handler:handler.name}, err);
    handler.stop();
    removeAllListeners();
    ws.close();
  }

  ws.on('message', handlerCb);
  ws.on('ping', pingCb);
  ws.on('close', closeCb);
  ws.on('error', errorCb);

  // Listen for errors on the handler and trigger the errorCb function
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

   // Event handler for when the WebSocket connection is open
  ws.on("open", () => {
    console.info("Connected to backend");

    try {
      ws.send(JSON.stringify({"type": "start", "source": "thermometer"}));

      if(handler === null){
        handler = new ThermometerHandler(ws, config, `thermometer`, 20);
      }
      else{
        handler.ws = ws;
      }

      registerHandler(ws, handler);
      
    } catch (e) {
      console.error('Failed to register WS handler, closing connection', e);
      ws.close();
    }
  })

     // Event handler for WebSocket close event
  ws.on("close", () => {
  });

    // Event handler for WebSocket errors
  ws.on("error", () => {
    setTimeout(function(){
      console.info("Connection to the backend failed. Reconnecting...");
      routes(app, config);
    }, 2000);
  });

}
