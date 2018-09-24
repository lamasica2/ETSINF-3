/**
 * Es desitja realitzar una modificació que substitueix el broker per dos components (broker1 i broker2) encadenats.
 Els clients envien peticions a broker1, aquest li les passa a broker2 i, finalment, broker2 li les fa arribar als treballadors.
 El camí de tornada és exactament l'invers.
Comunicaio entre els dos broker s-ha realitzat mab PUB/SUB

[cliente]=> frontend{ROUTER}=>    publisher_work_worker{PUB} ----> publisher_work_worker{SUB}=> backend{ROUTER}==> [worker]
[cliente]<= frontend{ROUTER}<=    sub_workdone_client{SUB}   <---- sub_workdone_client{PUB}<=   backend{ROUTER}<== [worker]
 */


var zmq = require('zeromq'), frontend = zmq.socket('router'), fs = require('fs');
var aux = require("./auxfunctions1718.js");
var args = process.argv.slice(2);
var requester_work_worker = zmq.socket('req');
var broker2URL = 'tcp://localhost:8688';

var verbose = (args[args.length - 1] != 'undefined' && args[args.length - 1] == 'verbose');
if (verbose) if (args[args.length - 1] != 'undefined') args.splice(args.length - 1, 1); else args.splice(0, 1);
console.log("Parametros: " + args+" Verbose> "+verbose);
var fePortNbr =8059;
var bePortNbr = 8061;
var workers = [], clients = [];
// Array with counters of how many requests have been processed by each worker.
var requestsPerWorker = []; 
console.log('MODE VERBOSE => ' + verbose);

requester_work_worker.identity = "Broker1";
requester_work_worker.connect(broker2URL)
//requester_work_worker.send(broker2URL);
frontend.bindSync('tcp://*:' + fePortNbr);

frontend.on('message', function () {
   
    var args = Array.apply(null, arguments);//args = "client1", "", msg
    sendToBroker2(args);
   
});

requester_work_worker.on('message', function () {
    var args = Array.apply(null, arguments);
    if (verbose) console.log('\nReceiving work done to client (%s) by BROKER2(pub)  through  sub_workdone_client.', args[0], "2"); aux.showMessage(args);
    frontend.send(args);
});



function showMessage(msg) { msg.forEach((value, index) => { console.log(' Segment %d: %s', index, value); }) }
function sendToBroker2(msg) {
    if (verbose) { console.log('Sending client (%s) request to Broker (%s) through "requester_work_worker"[REQ].\n', msg[0],"2"); aux.showMessage(msg); }
    requester_work_worker.send([msg[0], msg[1], msg[2]]);
} 
// Function that shows the service statistics. 
function showStatistics() {
    var totalAmount = 0;
    console.log('Current amount of requests served by each worker:');
    for (var i in requestsPerWorker) {
        console.log('   %s : %d requests', i, requestsPerWorker[i]);
        totalAmount += requestsPerWorker[i];
    }
    console.log('Requests already served (total): %d', totalAmount);
    process.exit();
}
// Show the statistics each time [Ctrl]+[C] is pressed. 
process.on('SIGINT', showStatistics); 
