var zmq = require('zeromq'), responder = zmq.socket('req');
var aux = require("./auxfunctions1718.js");
var args = process.argv.slice(2);
if (args[args.length - 1] == "verbose") {
    verbose = true;
    args.pop(); // eliminate only if it appears at the end 
}
var backendURL = args[0] || 'tcp://localhost:8060';
var myID = args[1] || 'NONE';
var connText = args[2] || 'id';
var replyText = args[3] || 'Done';
var LAG = args[4] || 2000;


console.log("MODE VERBOSE -> " + verbose);
if (myID != 'NONE')
    responder.identity = myID;
responder.connect(backendURL);
if (verbose)
    console.log('Worker (%s) connected to %s', myID, backendURL);


//En la resposta del mybroker al worker:
// 1. El ROUTER backend agarra "WORKER1" y elimina el camp del misatge; m =  "", "client1", "", msg
// 2. El REQ del Worker elimina el camp buit "" seguent; m = "client1", "", msg
//Al final se rep m =  "client1", "", msg
responder.on('message', function (client, delimiter, msg) {
    if (verbose) { console.log('Worker (%s) has received request "%s" from client (%s)', myID, msg.toString(), client); }
    setTimeout(function () {
        responder.send([client, '', replyText]);//REQ añadira en el missatge el delimiter i el router backend afegeix al missatge "workerId"
        //Al final mybroker rebra m = "worker1", "", "client1", "", replyText

        if (verbose) console.log('Worker (%s) has sent its reply "%s"', myID, replyText);
    }, LAG);
});

//Primera vegada que se conecta el server
//El misatge que se li arriba al broker es connText = "worker1", "", "Id" //considerem que ("worker1", "" ) els añadira el "req" el delimiter i worker1 el "router"  
responder.send(connText);
if (verbose) console.log('Worker (%s) has sent its first connection message: "%s"', myID, connText); 

setTimeout(function () {
    process.exit();
}, 70000)



/**
 node myworker_vp tcp://192.168.1.1:8060 WORKER1 Ready DONE &
          node myworker_vp tcp://192.168.1.2:8060 WORKER2 Ready OK 
**/