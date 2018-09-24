var zmq = require('zeromq'), responder = zmq.socket('req');
var backendURL = 'tcp://localhost:8060';
var myID = 'NONE';
var connText = 'id';
var replyText = 'Done';
var args = process.argv.slice(2);
var verbose = (args[args.length-1] != 'undefined' && args[0] == 'verbose');
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
	setTimeout(function() {
		responder.send([client,'',replyText]);//REQ añadira en el missatge el delimiter i el router backend afegeix al missatge "workerId"
//Al final mybroker rebra m = "worker1", "", "client1", "", replyText

        if (verbose) console.log('Worker (%s) has sent its reply "%s"', myID, replyText); 
	}, 1000);
});

//Primera vegada que se conecta el server
//El misatge que se li arriba al broker es connText = "worker1", "", "Id" //considerem que ("worker1", "" ) els añadira el "req" el delimiter i worker1 el "router"  
responder.send(connText);
if (verbose) console.log('Worker (%s) has sent its first connection message: "%s"', myID, connText); 
