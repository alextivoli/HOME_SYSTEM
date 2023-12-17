'use strict';

import {WindowHandler} from './window-handler.js';
import {v4 as uuid} from 'uuid';
import {WebSocket} from "ws";
import {newId} from './utils.js'
import {Window} from './window.js'

// Initialize a variable to store the WebSocket handler
let handler = null;
const windows = [];
const id = newId();

// Initialize a variable to store the first Windows object
windows.push(new Window(id(), `CLOSED`));


export function getStateOfwindows(){
  const statesList = [];

  for (const window of windows) {
    const windowState = {windowId: window.windowId, state: window.state};
    statesList.push(windowState);
  }
  return statesList;
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
      ws.send(JSON.stringify({"type": "start", "source": "window", "value": windows[0]}));

      if(handler === null){
        handler = new WindowHandler(ws, config, `window:${uuid()}`);
      }
      else{
        handler.ws = ws;
      }

      registerHandler(ws, handler);
      
    } catch (e) {
      console.error(' Failed to register WS handler, closing connection', e);
      ws.close();
    }
  });

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

  // Route for updating the state of a window
  app.put('/window/:id', (req, resp) => {
    if(!handler.death){
      const state = req.body;
      const id = req.params.id;
      windows.find(element => element.windowId == id)._state = state;
      handler._sendState();
      resp.status(201);
      resp.json(true);
    }
    else{
      console.info(" Microservice is down");
    }
  });

  app.post('/newwindow', (req, resp) => {
    if(!handler.death){
      const newId = id();
      const window = new Window(newId, 'CLOSED');
      windows.push(window);
      handler._sendState();
      resp.status(201);
      resp.json({result: {id: newId, state: window.state}});
    }
    else{
      console.info("Microservice is down");
    }
  });

}
