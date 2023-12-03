'use strict';

import {DateTime} from 'luxon';
import {anIntegerWithPrecision} from './random.js';
import {EventEmitter} from 'events';

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

export class ActuatorHandler extends EventEmitter {
  #ws;
  #config;
  #name;
  #timeout;
  #buffer;
  #death;

  constructor(ws, config, name) {
    super();
    this.#ws = ws;
    this.#config = config;
    this.#name = name;
    this.#buffer = [];
  }

  get name() {
    return this.#name;
  }

  set ws(ws) {
    this.#ws = ws;
  }

  onMessage(msg) {
    let json;
    try {
      json = this._validateMessage(msg);
    } catch (e) {
      this._send({error: e.message});
      return;
    }

    switch (json.type) {
      case 'subscribe': this._onSubscribe(); break;
      case 'unsubscribe': this._onUnsubscribe(); break;
    }
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

  _validateMessage(msg) {
    if (!msg) {
      throw new ValidationError('Invalid inbound message');
    }
    const json = JSON.parse(msg);
    if (json.type !== 'subscribe' && json.type !== 'unsubscribe') {
      throw new ValidationError('Invalid message type');
    }
    if (json.target !== 'actuator') {
      throw new ValidationError('Invalid subscription target');
    }

    return json;
  }

  _someMillis() {
    return anIntegerWithPrecision(this.#config.frequency, 0.2);
  }


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
    
    console.debug('Subscribing to actuator state', {handler: this.#name});
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