import express = require("express");
import path = require('path');

import { hostname } from 'os';
import { Server as HttpServer } from 'http';
import { Server as WsServer } from 'ws';

import { Dummy } from './dummy';
import { ApiRetValue } from './data-model';

//this is fr-node-server-d
//alias fr-direct-proxy

const ahost = hostname();
const aport = 3000;

let HaveEvent = true;
let HaveRace = ! HaveEvent;

var inputNettoCounter = 0;
var outputNettoCounter = 0;

var dummy: Dummy = new Dummy;
let rvOK = new ApiRetValue();
let okNI = "ok, but not implemented"
//let ok = "ok"; // not used

var iconn = dummy; // = new Conn();
// iconn.port = 3427;
// iconn.name = "i";

var oconn = dummy; // = new Conn();
// oconn.port = 3428;
// oconn.name = "o";

const app = express();
//app.use(compression());

app.use('/', express.static(path.join(__dirname, '..', 'client')));
app.use('/fr', express.static(path.join(__dirname, '..', '..', '..', 'Angular', 'FR03A1', 'dist', 'FR03A1')));

var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}))
app.use(bodyParser.text({
  type: 'text/plain'
}))

app.set('json spaces', 2);

//---post-section---

app.post('/api/event-data', (req, res) =>  {
  dummy.EventData = req.body;
  res.json(rvOK);
})

app.post('/api/event-data-json', (req, res) =>  {
  dummy.EventDataJson = req.body;
  res.json(rvOK);
})

app.post('/api/race-data-json', (req, res) =>  {
  const race = req.query.race;
  dummy.putRaceDataJson(race, req.body);
  res.json(rvOK);
})

app.post('/api/ed.json', (req, res) =>  {
  dummy.EventDataJson = req.body;
  res.send(rvOK);
})

app.post('/api/rd.json', (req, res) =>  {
  dummy.raceDataJson = req.body;
  res.send(rvOK);
})

app.post('/ud/2', (req, res) =>  {
  dummy.slot2 = req.body;
  res.json(rvOK);
})

app.post('/ud/3', (req, res) =>  {
  dummy.slot3 = req.body;
  res.json(rvOK);
})

//---get-section---

app.get('/api/query-params', (req, res) => {
  res.json(dummy.getEventParams());
})  

app.get('/api/event-data', (req, res) =>  {
  res.send(dummy.EventData);
})

app.get('/api/event-data-json', (req, res) =>  {
  res.json(dummy.EventDataJson);
})

app.get('/api/race-data-json', (req, res) =>  {
  const race = req.query.race;
  res.json(dummy.getRaceDataJson(race));
})

app.get('/api/rd.json', (req, res) => {
  //const r = req.query.race;
  res.send(dummy.raceDataJson);
})

app.get('/api/ed.json', (req, res) =>  {
  res.send(dummy.EventDataJson);
})

app.get('/ud/2', (req, res) => {
  res.send(dummy.slot2);
})

app.get('/ud/3', (req, res) =>  {
  res.send(dummy.slot3);
})

app.get('/api/backup', (req, res) =>  {
  res.send(dummy.getBackup());
})

app.get('/api/backlog', (req, res) =>  {
  const sl: string[] = dummy.getBacklog();
  res.send(sl);
})

app.get('/api/backup-and-log', (req, res) =>  {
  const sl: string[] = dummy.getBackupAndLog();
  res.send(sl);
})

app.get('/api/backup-string', (req, res) =>  {
  res.send(dummy.getBackupString());
})

app.get('/api/backlog-string', (req, res) =>  {
  res.send(dummy.getBacklogString());
})

app.get('/api/backup-and-log-string', (req, res) =>  {
  res.send(dummy.getBackupAndLogString());
})

app.get('/api/backup-and-log-json-string', (req, res) =>  {
  res.send(dummy.getBackupAndLogJsonString());
})

app.get('/api/widget/get-wide-race-table-json', (req, res) => {
  res.send(okNI);
})

app.get('/api/manage-clear', (req, res) => {
  dummy.clear();
  dummy.broadcastToConnectedApps('Manage.Clear');
  res.send(okNI);
})

app.get('/api/widget/do-timing-event', (req, res) => {
  res.send(okNI);
})

app.get('/api/widget/get-finish-table-json', (req, res) => {
  res.send(okNI);
})

app.get('/api/input-wire-connect', (req, res) => {
  try {
    //iconn.connect();
    dummy.inputConnected = true;
    res.send('input connected');
  }
  catch (e) {
    console.log(e);
  }
})

app.get('/api/output-wire-connect', (req, res) => {
  try {
    //oconn.connect();
    dummy.outputConnected = true;
    res.send('output connected');
  }
  catch (e) {
    console.log(e);
  }
})

app.get('/api/input-wire-disconnect', (req, res) => {
    //iconn.disconnect();
    dummy.inputConnected = false;
    res.send('input disconnected');
})

app.get('/api/output-wire-disconnect', (req, res) => {
  //oconn.disconnect();
  dummy.outputConnected = false;
  res.send('output disconnected');
})

app.get('/api/get-input-connection-status', (req, res) => {
    res.send(iconn.getInputConnectionStatus());
})

app.get('/api/get-output-connection-status', (req, res) => {
  res.send(oconn.getOutputConnectionStatus());
})

app.get('/api/fr-manage-clear', (req, res) => {
  try {
    let msg = "Manage.Clear";
    iconn.writeToSocket(msg);
    res.send('called fr-manage-clear');
  }
  catch (e) {
    res.send('exception in fr-manage-clear');    
  }
})

app.get('/api/widget/time', (req, res) => {
  var race = req.query.race;
  var it = req.query.it;
  var bib = req.query.bib;
  var tme = getTime();

  var t: string;
  if (HaveRace) {
    t = "FR.*.W" + race + ".Bib" + bib + ".IT" + it + " = " + tme;
  }
  else if (HaveEvent) {
    t = "FR.*.W" + race + ".Bib" + bib + ".RV=500";  
  }
  iconn.writeToSocket(t);

  var s = "R" + race + ".IT" + it + ".Bib" + bib + ".Time = " + tme;

  res.send(s);
})

app.get('/api/widget/netto', (req, res) => {
  if (iconn.netto && iconn.netto.length > 0) {
    res.send(iconn.netto)
  }
  else {
    inputNettoCounter++;
    res.send("Netto is empty." + inputNettoCounter);
  }
})

app.get('/api/widget/get-output-netto', (req, res) => {
  if (oconn.netto && oconn.netto.length > 0) {
    res.send(oconn.netto)
  }
  else {
    outputNettoCounter++;
    res.send("Netto is empty." + outputNettoCounter);
  }
})

app.get('/api/send-msg', (req, res) => {
  var msg = req.query.value;

  if (iconn.inputConnected) {
    iconn.writeToSocket(msg);  
    res.send('ok');
  }
  else {
    res.send('nc');
  }
})

/**
 * Start the http server.
 */
const httpServer: HttpServer = app.listen(aport, ahost, () => {
  const ai = httpServer.address();
  const host: string = ai["address"];
  const port: number = ai["port"];
  console.log('Listening on %s:%s', host, port);
})

/**
 * Start the web socket server - on same port as HTTP server.
 * 
 * (Only some clients will use it.)
 */
const wsServer: WsServer = new WsServer({ server: httpServer });
wsServer.on('connection', ws => {
  ws.on('message', message => {  
    let messageObject = JSON.parse(message.toString());
    if (messageObject.id == -2)             
       iconn.writeToSocket(messageObject.msg);
    if (messageObject.id == -1)             
       oconn.registerApp(ws);
  });
})

/**
 * Return a time string with 3 digits after the decimal point.
 * 
 * (This is the helper function for /api/widget/time, see above.)
 */
function getTime() {
  var d = new Date();
  var hh = d.getHours();
  var mm = d.getMinutes();
  var ss = d.getSeconds();
  var t = d.getMilliseconds();

  var shh = "" + hh;
  var smm = mm < 10 ? "0" + mm : mm;
  var sss = ss < 10 ? "0" + ss : ss;
  var sms = "" + t;
  if (t < 10) { sms = "00" + t; }
  else if (t < 100) sms = "0" + t;

  var tm = shh + ':' + smm + ':' + sss + '.' + sms;
  return tm;
}

