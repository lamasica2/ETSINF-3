/** EJEMPLO DE FRONTED -(router)BROKER(router) - BACKEND 
 *Aqui esta implementado:
  1.Control de clients y worker disponibles, haciendo que uno u otro queda a la espera
  2.Uso de parametros en la lanzadera (var args = process.argv.slice(2))
  3.Mapeado de informacion sobre los worker(clientes ayudados,listan de solicitudes realizadas ) + guardar en fichero json
 4. Broker puga detectar caigudes dels treballadors --> TIMEOUT*/
var zmq = require('zeromq'), frontend = zmq.socket('router'), backend = zmq.socket('router'); fs = require('fs');
var latido = zmq.socket('router');
var aux = require("./auxfunctions1718.js");
var args = process.argv.slice(2);
var verbose = (args[args.length - 1] != 'undefined' && args[args.length - 1] == 'verbose');
if (verbose) if (args[args.length - 1] != 'undefined') args.splice(args.length - 1, 1); else args.splice(0, 1);
console.log("Parametros: " + args+" Verbose> "+verbose+" Modo ClassID[NO] Modo  Batecs[OK] "+);
var fePortNbr =  8059;
var bePortNbr = 8060;
var workers = [];
var clients = [];
// Array with counters of how many requests have been processed by each worker.
var requestsPerWorker = []; 
//var v = {"workers1":{"clients":["c1","c2"],"peticiones":[1,2,3]}}
//var map = { "": { "clients": [], "peticiones": [] } };
var map = {};

/** Broker puga detectar caigudes dels treballadors **/
//1.Tindre un perdiode, de consulta al worker per vore que esta viu
const answerInterval = 2000; 
//2.Tambe en un array almecenarem el "Treballadors ocupats", que cada slot contendra un array per worker
    //En cada slot([]) contendra "msg" que el servidor envia, i el important el "timeout";
    var busyWorkers = []; 



frontend.bindSync('tcp://*:' + fePortNbr);
backend.bindSync('tcp://*:' + bePortNbr);

//1.Client ens envia PETICIO
frontend.on('message', function (/**arguments**/) {//rep missatge del client amb "" davant y el 
    //router sap qui li ha enviat
    var args = Array.apply(null, arguments);//args = "client1", "", msg
    if (verbose) console.log("Solicitud client " + args[0].toString() + " sin classID"); 
    sendRequest(args, null)
});

backend.on('message', function () {
    var args = Array.apply(null, arguments);//msg ("worker1", "", "Id")
    /**Primera Vegada del Worker **/
    if (args.length == 3) { //si es la primera connexio ("worker1", "", "Id") afegeix el worker a la llista de workers desocupats
        if (!processPendingClient(args[0],null))//Algun client pendent?
                workers.push(args[0]);
         requestsPerWorker[args[0]] = 0;
         newWorker(args[0]);

    /**Woker amb faena feta per a un Client**/
    } else { //args= ["worker1", "", "client1", "", replyText ]//Rebut la feana feta del worker ---> Pasem al client corresponen
        var workerID = args[0];
        args = args.slice(2);// args = "client1", "", replyText

        map[workerID]["peticiones"].push(args[0] + ":" + args[2]);
        requestsPerWorker[workerID]++

        // Cancel the reply timeout.  
        if (busyWorkers[workerID]) {
            clearTimeout(busyWorkers[workerID].timeout);
            console.log("\n Worker: " + workerID + " Contestat a temps [OK]");
        }else {
            if (verbose) console.log(workerID + " arribat tart, contestacio rechazada [TIMEOUT]\n");
            return; /**Has contestat masa tart" **/
        }
        if (verbose) showMap(map);

        frontend.send(args); // amb el router perd el "Client1" y amb el REQ perd el "" al client li arriba el replyText  
        if (!processPendingClient(workerID, null))
            workers.push(workerID);
    }
});

function sendRequest(args, classID) {
    //Mirem si hi han servidor de eixe servidor disponible
    if (workers.length > 0) { //Hi han SR disponibles
        var myWorker = workers.shift(); //Agarrem el primer disponible

        if (newClient(args[0].toString(), myWorker)) map[myWorker]["clients"].push(args[0].toString());

        var m = [myWorker, ''].concat(args); // m = "worker1", "", "client1", "", msg
        //ENVIEM A WORKER -->
        sendToWorker(m, null);
    } else clients.push({ id: args[0], msg: args.slice(2) }); //id = client1, args.slice(2) => msg

}
function sendToWorker(msg, classID) {
    var myWorker = msg[0];
    if (verbose) {
        console.log('Sending client (%s),Class (%s),request to worker (%s) through backend.', msg[2], "Sin Clase", msg[0]);
        aux.showMessage(msg);
    }

    // Initialise busyWorkers slot object.     
    busyWorkers[myWorker] = {}
    //Aguardem el msg enviat al worker corresponen
    busyWorkers[myWorker].msg = msg.slice(2);
    //ademes en la variable "timeout" del array 
    //Pasar un temps(answerInterval)  se efectuara generateTimeoutHandler(myWorker, classID) que retornara una funcio
    busyWorkers[myWorker].timeout = setTimeout(generateTimeoutHandler(myWorker, null), answerInterval);

    //Send message to Worker
    backend.send(msg);

    if (verbose) console.log("Add Worket=" + myWorker + " to busyWorkers msg:" + busyWorkers[myWorker].msg + " and wait to timeout: " + answerInterval+" Client Waiting");

    /** La idea es que  "timeout" del array[workerID] sols tindra valor si arriba al temps de answerInterval
            sino no. Per tant si hi ha valor, es que ha sopresat un temps EN EL QUAL, no ha contestat el worker
            i per tant sa produit un TIMEOUT.
    **/
} 
function processPendingClient(workerID, classID) {
    if (clients.length > 0) {
        var nextClient = clients.shift();
        //msg
        var m = [workerID, '', nextClient.id, ''].concat(nextClient.msg); 
        sendToWorker(m, null);
        return true;
    } else return false;
}


function generateTimeoutHandler(workerID, classID) {
    return function () {
        if(verbose) console.log('\n worker (%s), ClassID (%s),TIMEOUT, DELETE WORKER', workerID, classID);
        //Agarrem el msg  del worker caigut
        var msg = busyWorkers[workerID].msg;
        //Eliminem el treballador mort de la llista
        delete busyWorkers[workerID]; 
        // Reviendo  de nuevo el msg
        sendRequest(msg, classID); 
    }
}
function newWorker(myWorker) {
    map[myWorker] = { "clients": [], "peticiones": [] }
    showMap(map)
}
function newClient(c, myWorker) { for (index in map[myWorker]["clients"]) if (map[myWorker]["clients"][index] == c) return false; return true; }
function showMap(map) { console.log(map) }
function showMessage(msg) { msg.forEach((value, index) => { console.log(' Segment %d: %s', index, value); }) }
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
    })
}, 5000);

//push{posar en utlim} pop {llevar l'ultim} 
//unshift{posar el primer} shift {llevar el primer} 
/**EJECUCION **/
// node .\mybroker_vp.js A B verbose
// node myworkerB_vp tcp://localhost:8060 /**WorkerID**/ /**MSG TO BORKER**/ /**MSG TO CLIENT**/ /**ClassID**/ /**LAG**/ /**MODE VERBOSE**/
// node myworkerB_vp tcp://localhost:8060 WORKER4 Ready vBEEEE A 2000 verbose
// node myclientB_vp tcp://localhost:8059 HALOA pDAAAD A