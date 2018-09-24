
var zmq = require('zeromq'), requester = zmq.socket('req'); 
var brokerURL = 'tcp://localhost:8059';
var myID = 'NONE';
var myMsg = 'Hello';
var args = process.argv.slice(2);
var verbose = (args[args.length - 1]!= 'undefined' && args[0] == 'verbose');
console.log("MODE VERBOSE -> " + verbose);
if (myID != 'NONE')
    requester.identity = myID;

requester.connect(brokerURL);
console.log('Client (%s) connected to %s', myID, brokerURL) 
requester.on('message', function(msg) {//Respon el broker per part del worker
	console.log('Client (%s) has received reply "%s"', myID, msg.toString()); //replyText
	process.exit(0);
});
//Enviament al broker , se li add "" a msg  
requester.send(myMsg);
