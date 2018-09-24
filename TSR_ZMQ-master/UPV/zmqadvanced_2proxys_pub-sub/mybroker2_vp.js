var zmq = require('zeromq'), backend = zmq.socket('router'); fs = require('fs');
var publisher_work_worker = zmq.socket('sub');
var sub_workdone_client = zmq.socket('pub');

var aux = require("./auxfunctions1718.js");
var args = process.argv.slice(2);
var verbose = (args[args.length - 1] != 'undefined' && args[args.length - 1] == 'verbose');
if (verbose) if (args[args.length - 1] != 'undefined') args.splice(args.length - 1, 1); else args.splice(0, 1);
console.log("Parametros: " + args+" Verbose> "+verbose);
var fePortNbr = 8688;
var bePortNbr = 8060;
var workers = [], clients = [];
// Array with counters of how many requests have been processed by each worker.
var requestsPerWorker = []; 
var map = {};
console.log('MODE VERBOSE => ' + verbose);


/** CONEXIONS **/
sub_workdone_client.bind('tcp://*:8061', function (err) {
    if (err)
        console.log(err)
})

publisher_work_worker.connect('tcp://localhost:' + fePortNbr);
publisher_work_worker.subscribe("")
backend.bindSync('tcp://*:' + bePortNbr);

publisher_work_worker.on('message', function () {//rep missatge del broker1 amb "" davant y el 
    var args = Array.apply(null, arguments);//args = "client1", "", msg
    if (verbose) {
        console.log('Receiving Information client (%s) by BROKER1(pub)  through  publisher_work_worker.', args[0], "2"); aux.showMessage(args);
    }
    if (workers.length > 0) { //Hi han SR disponibles
        var myWorker = workers.shift(); //Agarrem el primer disponible
        if (newClient(args[0].toString(), myWorker))map[myWorker]["clients"].push(args[0].toString());
      
        var m = [myWorker, ''].concat(args); // m = "worker1", "", "client1", "", msg
      
        sendToWorker(m);
    } else clients.push({ id: args[0], msg: args.slice(2) }); //id = client1, args.slice(2) => msg
});


function processPendingClient(workerID) {
    if (clients.length > 0) {
        var nextClient = clients.shift();
        var m = [workerID, '', nextClient.id, ''].concat(nextClient.msg);
        backend.send(m);
        return true;
    } else return false;
}


backend.on('message', function () {
    var args = Array.apply(null, arguments);
    if (args.length == 3) { //si es la primera connexio ("worker1", "", "Id") afegeix el worker a la llista de workers desocupats
        if (!processPendingClient(args[0]))
            workers.push(args[0]);
        requestsPerWorker[args[0]] = 0;
        neWorker(args[0]);
    } else { //args= "worker1", "", "client1", "", replyText //Rebut la feana feta del worker ---> Pasem al client corresponen
        var workerID = args[0];
        requestsPerWorker[workerID]++

        args = args.slice(2);// args = "client1", "", replyText
    
        map[workerID]["peticiones"].push(args[0] + ":" + args[2]);
        showMap(map);
        sub_workdone_client.send([args[0], args[1], args[2]]); // amb el router perd el "Client1" y amb el REQ perd el "" al client li arriba el replyText  
        if (!processPendingClient(workerID))
            workers.push(workerID);
    }
});
function neWorker(myWorker) {
  
    map[myWorker] = { "clients": [], "peticiones": [] }
    showMap(map)
}
function newClient(c, myWorker) {for (index in map[myWorker]["clients"]) if (map[myWorker]["clients"][index] == c) return false; return true; }
function showMap(map) { console.log(map) }
function showMessage(msg) { msg.forEach((value, index) => { console.log(' Segment %d: %s', index, value); }) }
function sendToWorker(msg) { if (verbose) { console.log('Sending client (%s) request to worker (%s) through backend.', msg[2], msg[0]); aux.showMessage(msg); } backend.send(msg); } 
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

setInterval(function () {

    fs.writeFile('peticiones.txt', JSON.stringify(map, null, 2), 'utf-8' , function (err) {
        if (err)
            return console.log(err);
    
    })
}, 5000);
