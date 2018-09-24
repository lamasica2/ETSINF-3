var zmq = require('zeromq'), frontend = zmq.socket('router'), backend = zmq.socket('router'); fs = require('fs');
var aux = require("./auxfunctions1718.js");
var args = process.argv.slice(2);
var verbose = (args[args.length - 1] != 'undefined' && args[args.length - 1] == 'verbose');
if (verbose) if (args[args.length - 1] != 'undefined') args.splice(args.length - 1, 1); else args.splice(0, 1);
console.log("Parametros: " + args+" Verbose> "+verbose);
var fePortNbr =  8059;
var bePortNbr = 8060;
var workers = [];
var clients = [];
// Array with counters of how many requests have been processed
// by each worker.
var requestsPerWorker = []; 

////var v = {"workers1":{"clients":["c1","c2"],"peticiones":[1,2,3]}}
//var map = { "": { "clients": [], "peticiones": [] } };
var map = {};
//1.Primer els treballadors o clients diran de que tipos es-> A O B
//2.El broker s'anotara que ixe worrker es de eixe tipus'
//3.Depenen de la solicitud del client se li enviara a Worker A o B corresponent
const classIDs = args.slice(0, args.length);
for (var i in classIDs) { workers[classIDs[i]] = []; clients[classIDs[i]] = []; }

if (verbose) console.log('Classes de Workers per defecte: => ' + classIDs);


frontend.bindSync('tcp://*:' + fePortNbr);
backend.bindSync('tcp://*:' + bePortNbr);

/**
Router frontend rep msg [" ",msg,classID] y ell en aquesta event ens ho dona com msg =["client1", "", msg, classID]
**/
frontend.on('message', function (/**arguments**/) { 
    var args = Array.apply(null, arguments);//args = "client1", "", msg, classID
    /** ClassID Client [sempre a l'ultim pos del msg]**/
    var classID = args.pop();

    if (verbose) console.log("Solicitud client " + args[0].toString() + " de ClassId: " + classID);
    if (!clients[classID]) { clients[classID] = []; workers[classID] = []; }//No existix tipus clients, se anota nou tipus

    //workers amb classID(Tipus) del client?
    if (workers[classID].length > 0) {
        var myWorker = workers[classID].shift(); //Agarrem el primer disponible
        if (newClient(args[0].toString(), myWorker))map[myWorker]["clients"].push(args[0].toString());
      
        var m = [myWorker, ''].concat(args); // m = "worker1", "", "client1", "", msg
     
        sendToWorker(m,classID);
    } else clients[classID].push({ id: args[0], msg: args.slice(2) }); //id = client1, args.slice(2) => msg
});


function processPendingClient(workerID, classID) {
    if (clients[classID].length > 0) {
        var nextClient = clients[classID].shift();
        var m = [workerID, '', nextClient.id, ''].concat(nextClient.msg);
        backend.send(m);
        return true;
    } else return false;
}


backend.on('message', function () {
    var args = Array.apply(null, arguments);//args= ("worker1", "", "Id",ClassID)
    var classID = args.pop();//Llevem l'ultim elem del array(Tipus de worker)
    /**Primera Vegada del Worker **/
    if (args.length == 3) { //si es la primera connexio ("worker1", "", "Id") afegeix el worker a la llista de workers desocupats
        if (!workers[classID]) { clients[classID] = []; workers[classID] = []; }//No existix tipus clients, se anota nou tipus

        if (!processPendingClient(args[0], classID))//Algun client del tipus classID pendent?
            workers[classID].push(args[0]);
        requestsPerWorker[args[0]] = 0;
        neWorker(args[0]);
    /**Woker amb faena feta per a un Client**/
    } else { //args= ["worker1", "", "client1", "", replyText ] //Rebut la feana feta del worker ---> Pasem al client corresponen
        var workerID = args[0];
        requestsPerWorker[workerID]++
        args = args.slice(2);// args = [ "client1", "", replyText ]
        map[workerID]["peticiones"].push(args[0] + ":" + args[2]);
        showMap(map);
        frontend.send(args); // amb el router perd el "Client1" y amb el REQ perd el "" al client li arriba el replyText  
        if (!processPendingClient(workerID, classID))
            workers[classID].push(workerID);
    }
});
function neWorker(myWorker) {
    map[myWorker] = { "clients": [], "peticiones": [] }
    showMap(map)
}
function newClient(c, myWorker) {for (index in map[myWorker]["clients"]) if (map[myWorker]["clients"][index] == c) return false; return true; }
function showMap(map) { console.log(map) }
function showMessage(msg) { msg.forEach((value, index) => { console.log(' Segment %d: %s', index, value); }) }
function sendToWorker(msg,c){ if (verbose) { console.log('Sending client (%s),Cass (%s)  ,request to worker (%s) through backend.', msg[2], c, msg[0]); aux.showMessage(msg); } backend.send(msg); } 
 
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
    fs.writeFile('peticiones.json', JSON.stringify(map, null, 2), 'utf-8' , function (err) {
        if (err)
            return console.log(err);
        console.log('Wrote in file peticiones.txt, just check it');
    })
}, 5000);

//push{posar en utlim} pop {llevar l'ultim} 
//unshift{posar el primer} shift {llevar el primer} 