var zmq = require('zeromq'), frontend = zmq.socket('router'), backend = zmq.socket('router');
var fePortNbr = 8059;
var bePortNbr = 8060; 
var workers = [];
var clients = [];
frontend.bindSync('tcp://*:'+fePortNbr);
backend.bindSync('tcp://*:'+bePortNbr);

frontend.on('message', function() {//rep missatge del client amb "" davant y el 
//router sap qui li ha enviat
	var args = Array.apply(null, arguments);//args = "client1", "", msg
	if (workers.length > 0) { //Hi han SR disponibles
		var myWorker = workers.shift(); //Agarrem el primer disponible
        var m = [myWorker, ''].concat(args); // m = "worker1", "", "client1", "", msg
        sendToWorker(m);
 	} else clients.push( {id : args[0],msg: args.slice(2)}); //id = client1, args.slice(2) => msg
});

 
function processPendingClient(workerID) { 
	if (clients.length>0) { 
		var nextClient = clients.shift();
		var m = [workerID,'',nextClient.id,''].concat(nextClient.msg);
		backend.send(m);
		return true;
	} else return false;
}


backend.on('message', function() { 
	var args = Array.apply(null, arguments);
	if (args.length == 3) { //si es la primera connexio ("worker1", "", "Id") afegeix el worker a la llista de workers desocupats
		if (!processPendingClient(args[0]))
			workers.push(args[0]);
	} else { //"worker1", "", "client1", "", replyText
		var workerID = args[0];
		args = args.slice(2);// args = "client1", "", replyText
		frontend.send(args); // amb el router perd el "Client1" y amb el REQ perd el "" al client li arriba el replyText  
		if (!processPendingClient(workerID))
			workers.push(workerID);
	}
});

function showMessage(msg) { msg.forEach((value, index) => { console.log(' Segment %d: %s', index, value); }) } 
function sendToWorker(msg) { if (verbose) { console.log('Sending client (%s) request to worker (%s) through backend.', msg[2], msg[0]); aux.showMessage(msg); } backend.send(msg); 