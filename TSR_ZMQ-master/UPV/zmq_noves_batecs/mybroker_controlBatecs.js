/** EJEMPLO DE FRONTED -(router)BROKER(router) - BACKEND 
 *Aqui esta implementado:
  1.Control de clients y worker disponibles, haciendo que uno u otro queda a la espera
  2.Uso de parametros en la lanzadera (var args = process.argv.slice(2))
  3.Mapeado de informacion sobre los worker(clientes ayudados,listan de solicitudes realizadas ) + guardar en fichero json
  4. Implementado clases de Workers y clientes ( Client A ---> Worker A :: Client A <--- WokerA)
  5. Broker puga detectar caigudes dels treballadors --> TIMEOUT*/
var zmq = require('zeromq'), frontend = zmq.socket('router'), backend = zmq.socket('router'); fs = require('fs');
var aux = require("./auxfunctions1718.js");
var args = process.argv.slice(2);
var verbose = (args[args.length - 1] != 'undefined' && args[args.length - 1] == 'verbose');
if (verbose) if (args[args.length - 1] != 'undefined') args.splice(args.length - 1, 1); else args.splice(0, 1);
console.log("Parametros: " + args+" Verbose> "+verbose+" Modo ClassID[OK] Modo  Batecs[OK] "+);
var fePortNbr =  8059;
var bePortNbr = 8060;
var workers = [];
var clients = [];
// Array with counters of how many requests have been processed by each worker.
var requestsPerWorker = []; 
//var v = {"workers1":{"clients":["c1","c2"],"peticiones":[1,2,3]}}
//var map = { "": { "clients": [], "peticiones": [] } };
var map = {};
//1.Primer els treballadors o clients diran de que tipos es-> A O B
//2.El broker s'anotara que ixe worrker es de eixe tipus'
//3.Depenen de la solicitud del client se li enviara a Worker A o B corresponent
const classIDs = args.slice(0, args.length);
for (var i in classIDs) { workers[classIDs[i]] = []; clients[classIDs[i]] = []; }
/** Broker puga detectar caigudes dels treballadors **/
//1.Tindre un perdiode, de consulta al worker per vore que esta viu
const answerInterval = 2000; 
//2.Tambe en un array almecenarem el "Treballadors ocupats", que cada slot contendra un array per worker
    //En cada slot([]) contendra "msg" que el servidor envia, i el important el "timeout";
    var busyWorkers = []; 

if (verbose) console.log('Classes de Workers per defecte: => ' + classIDs);

frontend.bindSync('tcp://*:' + fePortNbr);
backend.bindSync('tcp://*:' + bePortNbr);

frontend.on('message', function (/**arguments**/) {//rep missatge del client amb "" davant y el 
    //router sap qui li ha enviat
    var args = Array.apply(null, arguments);//args = "client1", "", msg
    /** ClassID Client [sempre a l'ultim pos del msg]**/
    var classID = args.pop();
    if (verbose) console.log("Solicitud client " + args[0].toString() + " de ClassId: " + classID);
    if (!clients[classID]) { clients[classID] = []; workers[classID] = [];}//No existix tipus clients, se anota nou tipus
    sendRequest(args, classID)
});
backend.on('message', function () {
    var args = Array.apply(null, arguments);//mag ("worker1", "", "Id",ClassID)
    var classID = args.pop();//Llevem l'ultim elem del array y el posem a ClassID

    /**Primera Vegada del Worker **/
    if (args.length == 3) { //si es la primera connexio ("worker1", "", "Id") afegeix el worker a la llista de workers desocupats
        if (!workers[classID]) { clients[classID] = []; workers[classID] = []; }//No existix tipus clients, se anota nou tipus
        if (!processPendingClient(args[0],classID))//Algun client pendent?
            workers[classID].push(args[0]);
        requestsPerWorker[args[0]] = 0;
        newWorker(args[0]);

    /**Woker amb faena feta per a un Client**/
    } else { //args= "worker1", "", "client1", "", replyText //Rebut la feana feta del worker ---> Pasem al client corresponen
        var workerID = args[0];
        // Cancel the reply timeout.  
        if (busyWorkers[workerID]) {
            clearTimeout(busyWorkers[workerID].timeout);
            console.log("\n Worker: " + workerID + " Contestat a temps [OK]");
        }else {
            if (verbose) console.log(workerID + " arribat tart, contestacio rechazada [TIMEOUT]\n");
            return; /**Has contestat masa tart" **/
        }

        requestsPerWorker[workerID]++
        args = args.slice(2);// args = "client1", "", replyText
        map[workerID]["peticiones"].push(args[0] + ":" + args[2]);
        if (verbose)showMap(map);
        frontend.send(args); // amb el router perd el "Client1" y amb el REQ perd el "" al client li arriba el replyText  
        if (!processPendingClient(workerID, classID))
            workers[classID].push(workerID);
    }
});
function processPendingClient(workerID, classID) {
    if (clients[classID].length > 0) {
        var nextClient = clients[classID].shift();
        var m = [workerID, '', nextClient.id, ''].concat(nextClient.msg);
        sendToWorker(m, classID);
        return true;
    } else return false;
}
function newWorker(myWorker) {
    map[myWorker] = { "clients": [], "peticiones": [] }
    showMap(map)
}
function newClient(c, myWorker) {for (index in map[myWorker]["clients"]) if (map[myWorker]["clients"][index] == c) return false; return true; }

function sendRequest(args, classID) {
    //Mirem si hi han servidor de eixe servidor disponible
    if (workers[classID].length > 0) { //Hi han SR disponibles
        var myWorker = workers[classID].shift(); //Agarrem el primer disponible
        if (newClient(args[0].toString(), myWorker)) map[myWorker]["clients"].push(args[0].toString());
        var m = [myWorker, ''].concat(args); // m = "worker1", "", "client1", "", msg
        //ENVIEM A WORKER -->
        sendToWorker(m, classID);
    } else clients[classID].push({ id: args[0], msg: args.slice(2) }); //id = client1, args.slice(2) => msg

}
function sendToWorker(msg, classID) {
    var myWorker = msg[0];
    if (verbose) {
        console.log('Sending client (%s),Class (%s),request to worker (%s) through backend.', msg[2], classID, msg[0]);
        aux.showMessage(msg);
    }

    // Initialise busyWorkers slot object.     
    busyWorkers[myWorker] = {}
    //Aguardem el msg enviat al worker corresponen
    busyWorkers[myWorker].msg = msg.slice(2);
    //ademes en la variable "timeout" del array 
    //Pasar un temps(answerInterval)  se efectuara generateTimeoutHandler(myWorker, classID) que retornara una funcio
    busyWorkers[myWorker].timeout = setTimeout(generateTimeoutHandler(myWorker, classID), answerInterval);

    //Send message to Worker
    backend.send(msg);

    if (verbose) console.log("Add Worket=" + myWorker + " to busyWorkers msg:" + busyWorkers[myWorker].msg + " and wait to timeout: " + answerInterval+" Client Waiting");

    /** La idea es que  "timeout" del array[workerID] sols tindra valor si arriba al temps de answerInterval
            sino no. Per tant si hi ha valor, es que ha sopresat un temps EN EL QUAL, no ha contestat el worker
            i per tant sa produit un TIMEOUT.
    **/
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