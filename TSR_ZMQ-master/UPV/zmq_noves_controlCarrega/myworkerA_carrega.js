var zmq = require('zeromq'), responder = zmq.socket('req');
var aux = require("./auxfunctions1718.js");
var args = process.argv.slice(2);
var verbose = (args[args.length - 1] != 'undefined' && args[args.length - 1] == 'verbose');
var backendURL = args[0] || 'tcp://localhost:8060';
var myID = args[1] || 'NONE';
var connText = args[2] || 'id';
var replyText = args[3] ||'Done';
var classID = args[4] ||'A';
if (args[5] != "verbose")var LAG = args[5] || 4000;
else var LAG = 4000;
//--------------------------------------------
console.log("MODE VERBOSE -> " + verbose + " " + args[4] + " LAG:" + LAG);
if (myID != 'NONE') responder.identity = myID;
if (verbose) console.log('Worker (%s) connected to %s', myID, backendURL);

responder.connect(backendURL);
//En la resposta del mybroker al worker:
// 1. El ROUTER backend agarra "WORKER1" y elimina el camp del misatge; m =  "", "client1", "", msg
// 2. El REQ del Worker elimina el camp buit "" seguent; m = "client1", "", msg
//Al final se rep m =  "client1", "", msg (msg=palabra)
responder.on('message', function (client, delimiter, msg) {
    if (verbose) { console.log('Worker (%s) has received request "%s" from client (%s) type (%s)', myID, msg.toString(), client, ); }
    setTimeout(function () {
        var msg_to_client = replyText + " type:" + classID;
        responder.send([client, '', msg_to_client, classID, LAG])
        //Al final mybroker rebra m = "worker1", "", "client1", "", replyText,ClassID,LAG
        if (verbose) console.log('Worker (%s) has sent its reply "%s"', myID, msg_to_client);
    }, LAG);
});
//1.Primera vegada que se conecta el server
//El misatge que se li arriba al broker es connText = "worker1", "", "Id" //considerem que ("worker1", "" ) els añadira el "req" el delimiter i worker1 el "router"  
responder.send([connText, classID, LAG]);
if (verbose) console.log('Worker (%s) type %d has sent its first connection message: "%s"', myID, classID, connText); 

setTimeout(function () {
    process.exit();
}, 70000)



/**
 node myworker_vp tcp://192.168.1.1:8060 WORKER1 Ready DONE &
          node myworker_vp tcp://192.168.1.2:8060 WORKER2 Ready OK 
**/