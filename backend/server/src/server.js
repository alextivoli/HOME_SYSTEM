'use strict';

import util from 'util';

// utilities
import {v4 as uuid} from 'uuid';

// express
import express from 'express';
import methodOverride from 'method-override';
import bodyParser from 'body-parser';
import compression from 'compression';

// own modules
import opts from './options.js';
import {routes} from './routes.js';
import {OIDCMiddleware} from './openid.js';
import { WebSocketServer } from 'ws';


/**
 * Initializes the application middlewares.
 *
 * @param {Express} app Express application
 */
function init(app) {
    app.use(compression());
    app.use(methodOverride());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));

    // sets the correlation id of any incoming requests
    app.use((req, res, next) => {
        req.correlationId = req.get('X-Request-ID') || uuid();
        res.set('X-Request-ID', req.id);
        next();
    });
}

/**
 * Installs fallback error handlers.
 *
 * @param app Express application
 * @returns {void}
 */
function fallbacks(app) {
    // generic error handler => err.status || 500 + json
    // NOTE keep the `next` parameter even if unused, this is mandatory for Express 4
    /* eslint-disable-next-line no-unused-vars */
    app.use((err, req, res, next) => {
        const errmsg = err.message || util.inspect(err);
        console.error(`💥 Unexpected error occurred while calling ${req.path}: ${errmsg}`);
        res.status(err.status || 500);
        res.json({error: err.message || 'Internal server error'});
    });

    // if we are here, then there's no valid route => 400 + json
    // NOTE keep the `next` parameter even if unused, this is mandatory for Express 4
    /* eslint-disable no-unused-vars */
    app.use((req, res, next) => {
        console.error(`💥 Route not found to ${req.path}`);
        res.status(404);
        res.json({error: 'Not found'});
    });
}

function createWebSocket(server, config){
    const perMessageDeflate = {
        zlibDeflateOptions: {
          chunkSize: 1024,
          memLevel: 7,
          level: 3
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024
        },
        clientNoContextTakeover: true, // Defaults to negotiated value
        serverNoContextTakeover: true, // Defaults to negotiated value
        serverMaxWindowBits: 10, // Defaults to negotiated value
        concurrencyLimit: 10, // Limits zlib concurrency for perf
        threshold: 1024 // Size (in bytes) below which messages should not be compressed if context takeover is disabled
      };
    
      const opts = {server, perMessageDeflate};
      return new WebSocketServer(opts);
}

async function run() {
    const options = opts();
    console.debug('🔧 Configuration', options);

    console.debug(`🔧 Initializing Express...`);
    const app = express();
    init(app);

    console.debug(`🔧 Initializing OpenID Connect...`);
    const oidc = new OIDCMiddleware(options.config.oidc);
    await oidc.init();

    const {iface, port} = options.config;
    const server = app.listen(port, iface, () => {
        console.info(`🏁 Server listening: http://${iface}:${port}`);
    });

    console.debug(`🔧 Initializing WEBSOCKET...`);
    const ws = createWebSocket(server, options.config)

    init(app);
    routes(app, ws, oidc, options.config);
    fallbacks(app);
}
    
run();
