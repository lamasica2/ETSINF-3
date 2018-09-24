var zmq = require('zmq');
var worker = zmq.socket('req');
var backendURL = 'tcp://localhost:8060';
var myID = process.argv[4];
//var connText =  'id';
var replyText =  'World';
var verbose = false;
var clase = process.argv[2];
var aux = require('./auxfunctions1718.js');
var carga =process.argv[3];//aux.getLoad();

if(process.argv[process.argv.length-1] == "verbose"){verbose = true;}
if (myID != 'NONE') {worker.identity = myID;}
console.log('Worker (%s) connected to %s', myID, backendURL);

worker.connect(backendURL);
worker.on('message', function(client, delimiter, msg) {
    console.log('Worker (%s) has received request "%s" from client (%s)', myID, msg.toString(), client);
    setTimeout(function() {
        carga = aux.getLoad();
        worker.send([client,'',replyText, carga,myID,clase]);
        console.log('Worker (%s) has sent its reply "%s"',myID, replyText);
    }, 1000);
    console.log('Worker (%s) has sent its first connection message: "%s", clase (%s)',myID, myID,clase);
});
worker.send([carga, clase]);