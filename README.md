# FR Node Server

Also known as
- *fr-node-server-d* (my local name)
- *fr-direct-proxy* (description in package.json)

The FR node server can be a proxy to the real result server application at the backend.

But this app is not a proxy.
It will store posted data in fields of the **dummy** variable,
a global instance of the Dummy typescript class in memory.

There is no tcp connection from *proxy* to *backend*.
Dummy implements **iconn** and **oconn** mocks,
so that from the client perspective,
the thin server application looks similar to the fat server application.

### Api
- It does not use the `request` lib to pass the call on.
- It implements the api itself through the dummy instance.
- It uses dashed-urls.

### Connections
- It uses mock connections in dummy class.
- It does not have real tcp input or output connections.
- It does not define request lines.
- It does not have the WantRequest variable.

### Web Sockets
It can use web-sockets.
```typescript
wsServer.on('connection', ws => {
  ws.on('message', message => {  
    let messageObject = JSON.parse(message.toString());
    if (messageObject.id == -2)             
       iconn.writeToSocket(messageObject.msg);
    if (messageObject.id == -1)             
       oconn.registerApp(ws);
  });
})
```
- Do not get confused, the real proxy server (indirect or outer message loop) has separate instances of the real connection class.
- But here we only have one dummy instance.
- Variables for **iconn**, **oconn** and **dummy** reference the same instance of the Dummy class.

Inside of Dummy we have:
```typescript
    //client is of type WebSocket
    registerApp(client: any): void {
        this.connectedApps.add(client);
    }

    writeToSocket(t: string) {
        this.backlog.Add(t);
        if (this.isDirectProxy)
            this.broadcastToConnectedApps(t);
    }

    broadcastToConnectedApps(msg: string) {
        this.connectedApps.forEach((ws: WebSocket) => {
            if (ws.readyState === 1) {
                let requestParams = {
                    race: 1,
                    it: 0,
                    netto: msg
                };
                if (this.verbose)
                    this.log('broadcasting netto...');
                ws.send(JSON.stringify(requestParams));
            } else {
                this.connectedApps.delete(ws);
            }
        });
    }
```
So, if this app is a direct proxy (it is) then input messages (timing messages) will be broadcast to all connected apps (Angular clients).

Using the indirect way, it would send timing messages via tcp to the input socket of the backend.
The backend would itself broadcast messages via the tcp output socket.
You would receive these and then broadcast the netto content to all connected Angular apps.
In other words, the timing message would travel via the outer loop.
You would also receive what traditional timing clients may be sending to the desktop result server, and what is beeing manually entered into the UI of the desktop application.

This application can connect spa clients directly, without a backend application.

Note that the hardcoded **race** and **it** params in the *json* above will not be used here.

### Angular Clients
- FR03A1 or similar.
- FR03A1 can be configured via url query param, see links in `client/index.html`.
- The Angular client will be input or output, or both.

You should check that the Angular client:
- Evaluates the query param. (Calls initParams() in ngOnInit().)
- Uses the dashed style for api calls.
- Is connected.
- Does open the web-socket channel (**watch** button).
- Does **Accept** and not **Drop** the web-socket traffic.
- Has already downloaded current event data from the server.

The good question is of course, whether this should be in configuration, hardcoded or manual.

By default, the server starts out in **Connected** state.
But a client can control the connection status and set it to false.

When a client queries the server capabilities and detects web-socket support, it could automatically initialize the channel, instead of doing that later manually, via the **watch** button.

When the client downloads current event data it will retrieve the params as part of it. When the client is a thin client, you may need to init the params via special api call.

### Data
Since this is a thin server, someone will need to upload the initial event data into the dummy instance.
This is probably a task for admin, but we do not do authentication/authorization, not yet.

We do not have a database either.