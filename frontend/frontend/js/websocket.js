'use strict';

(function (win) {

    const { Subject, filter } = rxjs;
    const dataSubject = new Subject();

    function routes(ws) {
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log(data);
            dataSubject.next(data);
        };
    }

    class WSClient {
        constructor(baseUrl) {
            this._baseUrl = baseUrl;
            this._ws = null;
            this._isConnected = false;
        }

        createWebSocket() {
            const url = document.baseURI.replace(/^http/, 'ws');
            const wsUrl = new URL(this._baseUrl + "/", url);
            this._ws = new WSClient(wsUrl);
            this._isConnected = true;

            this._ws.onopen = () => {
                console.info("Connected to backend");
                setTimeout(() => {
                    this.subscribe();
                }, 2000);       
            };

            this._ws.onclose = () => {
                if (this._isConnected) {
                    console.info(" Connection to the backend closed. Reconnecting...");
                    this._isConnected = false;

                    setTimeout(() => {
                        this.createWebSocket();
                    }, 5000);
                }
            };

            routes(this._ws);
        }

        async init() {
            this.createWebSocket();
        }

        subscribe(){
            this._ws.send(JSON.stringify({"type": "start", "source": "client"}));
        }

    }

    win.WSClient ||= WSClient;

})(window);