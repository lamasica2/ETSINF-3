﻿
var zmq = require('zeromq'), requester = zmq.socket('req');

var args = process.argv.slice(2);
var brokerURL = args[0] || 'tcp://localhost:8059';
var myID = args[1] || 'NONE';
var myMsg = args[2] || 'Hello';
var classID = args[3] || 'B';

var verbose = (args[args.length - 1] != 'undefined' && args[0] == 'verbose');
console.log("MODE VERBOSE -> " + verbose);
if (myID != 'NONE')
    requester.identity = myID;

requester.connect(brokerURL);
console.log('Client (%s), class (%s) connected to %s', myID, classID, brokerURL)
requester.on('message', function (msg) {//Respon el broker per part del worker
    console.log('Client (%s) has received reply "%s"', myID, msg.toString()); //replyText
    process.exit(0);
});
//Primera vegada que el client se conecta al servidor
//Enviament al broker , se li add "" a msg  
requester.send([myMsg, classID]);


//node myclient_vp tcp://localhost:8059 HALO1 patata  &
//node myclient_vp tcp://localhost:8059 HALO2 mero 