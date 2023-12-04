'use strict';

import {WindowHandler} from './window-handler.js';
import {v4 as uuid} from 'uuid';
import {WebSocket} from "ws";
import {newId} from './utils.js'
import {Window} from './window.js'

let handler = null;
const windows = [];
const id = newId();
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
      ws.send(JSON.stringify({"type": "start", "source": "window"}));

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

  ws.on("close", () => {
  });

  ws.on("error", () => {
    setTimeout(function(){
      console.info("Connection to the backend failed. Reconnecting...");
      routes(app, config);
    }, 2000);
  });


  app.put('/window/:id', (req, resp) => {
    if(!handler.death){
      const state = req.body;
      const id = req.params.id;
      windows.find(element => element.windowId == id)._state = state;
      handler._sendState();
      console.log("MANDATO ------ MANDATO ");
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
