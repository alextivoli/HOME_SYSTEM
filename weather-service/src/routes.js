'use strict';

import {WeatherHandler} from './weather-handler.js';
import {v4 as uuid} from 'uuid';
import {WebSocket} from "ws";

let handler = null;

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
      ws.send(JSON.stringify({"type": "start", "source": "temperature"}));

      if(handler === null){
        handler = new WeatherHandler(ws, config, `weather:${uuid()}`);
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
}
