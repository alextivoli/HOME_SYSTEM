'use strict';

import {DateTime} from 'luxon';
import {anIntegerWithPrecision} from './random.js';
import {EventEmitter} from 'events';
import { getStateOfthermometer } from './routes.js';
import {calculateTemp} from './utils.js'

class ValidationError extends Error {
  #message;

  constructor(msg) {
    super(msg);
    this.#message = msg;
  }

  get message() {
    return this.#message;
  }
}

/**
 * A WebSocket handler to deal with weather subscriptions.
 */
export class ThermometerHandler extends EventEmitter {
  #ws;
  #config;
  #name;
  #timeout;
  #buffer;
  #death;
  temperature;
  service = new Map();
  temperatures = [];

  /**
   * Instances a new weather handler.
   * @param ws {WebSocket} The WebSocket client
   * @param config {{iface:string,port:number,failures:boolean,delays:boolean,frequency:number,timeToLive:number}} Configuration
   * @param name {string} A name for this handler
   */
  constructor(ws, config, name, temperature) {
    super();
    this.#ws = ws;
    this.#config = config;
    this.#name = name;
    this.#buffer = [];
    this.temperature = temperature;
  }

  get name() {
    return this.#name;
  }

  set ws(ws) {
    this.#ws = ws;
  }

  get temperature() {
    return this.temperature;
  }

  set setTemperature(temp) {
    this.temperature = temp;
  }


  /**
   * Handles incoming messages.
   * @param msg {string} An incoming JSON message
   */
  onMessage(msg) {

    
    let json;
    try {
      json = this._validateMessage(msg);
    } catch (e) {
      this._send({error: e.message});
      return;
    }

    switch (json.type) {
      case 'subscribe': 
        this._onSubscribe(); 
        
      break;
      case 'unsubscribe': this._onUnsubscribe(); break;

      case 'windows' : 

        if(this.service.get('windows'+ json.valueId) == null || this.service.get('windows'+ json.valueId) == undefined){
          this.service.set('windows'+ json.valueId, 'CLOSED');
        }
        this.temperature = calculateTemp(json, this.temperature, this.service);  
        this.service.set('windows'+ json.valueId,json.value.state);
        
        break;

      case 'door' : 
        if(this.service.get('door') == null || this.service.get('door') == undefined){
          this.service.set('door', 'CLOSED');
        }
        this.temperature = calculateTemp(json, this.temperature, this.service);  
        
        this.service.set('door', json.value._state);
        
        break;

      case 'heatpump' : 
        if(this.service.get('heatpump') == null || this.service.get('heatpump') == undefined){
          this.service.set('heatpump','OFF');
        }

        this.service.set('heatpump',json.value._state);
        this.temperature = calculateTemp(json, this.temperature, this.service);  
        
        
        
        break;

      case 'temperature' : 
        this.temperature = calculateTemp(json, this.temperature, this.service);  
        break;
    }

    this.temperatures.push(this.temperature)
    this._sendTemp(this.temperature);
  }

  stop() {
    if (this.#timeout) {
      clearTimeout(this.#timeout);
    }
    if (this.#death) {
      clearTimeout(this.#death);
    }
  }

  start() {
    console.debug('New connection received', {handler: this.#name});
  }

  /**
   * Validates an incoming message.
   * @param msg {string} Any message string that can be parsed as JSON
   * @return {any} An object representing the incoming message
   * @private
   */
  _validateMessage(msg) {
    if (!msg) {
      throw new ValidationError('Invalid inbound message');
    }
    const json = JSON.parse(msg);
    if (json.type !== 'subscribe' && json.type !== 'unsubscribe' && json.type !== 'windows' && json.type !== 'thermometer' && json.type !== 'heatpump' && json.type !== 'door' && json.type !== 'temperature') {
      throw new ValidationError('Invalid message type');
    }

    return json;
  }

  /**
   * Generates a random delay in milliseconds.
   * @return {number} Milliseconds
   * @private
   */
  _someMillis() {
    return anIntegerWithPrecision(this.#config.frequency, 0.2);
  }

  _sendState(){
    const states = getStateOfthermometer();
    const msg = {type: 'thermometer', dateTime: DateTime.now().toISO(), states};

    // message is always appended to the buffer
    this.#buffer.push(msg);

    if(!this.#death){
      // messages are dispatched immediately if delays are disabled or a random number is
      // generated greater than `delayProb` messages
      if (!this.#config.delays) {
        for (const bMsg of this.#buffer) {
          this._send(bMsg);
        }
        this.#buffer = [];
      } else {
        console.info(`💤 Due to network delays, ${this.#buffer.length} messages are still queued`, {handler: this.#name});
      }
    }  
  }


  _sendTemp(){

    const msg = {type: 'thermometerTemp', dateTime: DateTime.now().toISO(), temp: this.temperature};

    // message is always appended to the buffer
    this.#buffer.push(msg);

    if(!this.#death){
      // messages are dispatched immediately if delays are disabled or a random number is
      // generated greater than `delayProb` messages
      if (!this.#config.delays) {
        for (const bMsg of this.#buffer) {
          this._send(bMsg);
        }
        this.#buffer = [];
      } else {
        console.info(`💤 Due to network delays, ${this.#buffer.length} messages are still queued`, {handler: this.#name});
      }
    }  
  }

  /**
   * Sends any message through the WebSocket channel.
   * @param msg Any message
   * @private
   */
  _send(msg) {
    if (this.#config.failures && Math.random() < this.#config.errorProb) {
      console.info('🐛 There\'s a bug preventing the message to be sent', {handler: this.#name});
      return;
    }

    console.debug('💬 Dispatching message', {handler: this.#name});
    this.#ws.send(JSON.stringify(msg));
  }

  _onSubscribe() {
    if (this.#timeout) {
      if(!this.#timeout._destroyed){
        return;
      }
    }
    
    this._sendState();

    console.debug('Subscribing to termomether state', {handler: this.#name});
    const callback = () => {
      
      this.#timeout = setTimeout(callback, this._someMillis());
    };
    this.#timeout = setTimeout(callback, 0);
  }

  _onUnsubscribe() {
    if (!this.#timeout) {
      return;
    }
    clearTimeout(this.#timeout);
    this.#timeout = 0;
    this._send({ack: true});
  }
}