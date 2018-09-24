//Los argumentos que le pasas son los tipos de trabajos que realizarán los workersEnEspera y verbose(opcional).
var zmq = require('zmq');
var frontend = zmq.socket('router');
var backend = zmq.socket('router');
var clientsEnEspera = [];
var requestsPerWorker = [];
var aux = require("./auxfunctions1718.js");
var arguments = process.argv.slice(2);
var clases = Array.apply(null,arguments);
var workersCarga =  aux.orderedList();


for(var i in clases){
    clientsEnEspera[clases[i]]=[];
}

frontend.bindSync('tcp://*:8059');
backend.bindSync('tcp://*:8060');

frontend.on('message', function() {

    var args = Array.apply(null, arguments);
    var classID = args.pop();
    var esta = true;
    sendRequest(args,classID);
    for(var i in clases) {
        if (clases[i].toString() != classID.toString()){
            esta = false;
        }else{
            esta = true;
        }
        if(esta){break;}
    }
    if(!esta){
        clientsEnEspera[classID] = [];
        clases.push(classID);
    }
    function sendToWorker(msg){

       // var myWorker = msg[0];
        backend.send(msg);
        console.log("enviem a worker " + msg[0])
        var cont = 0;

        for(var indice in workersCarga.data){
            if(workersCarga.data[indice].id == msg[0]) {
                workersCarga.data[indice].timeout =  setTimeout(generateTimeoutHandler(msg),5000)
            }
            cont++;
        }
    };

    function generateTimeoutHandler(msg) {

        return function() {
            var cont = 0;
            var clasID ;
            for(var indice in workersCarga.data){

                if(workersCarga.data[indice].id == msg[0]) {
                    console.log("worker: eliminado " +msg[0] )
                    clasID = workersCarga.data[indice].clase;
                    workersCarga.data.splice(cont,1);}
                cont++;
            }
            msg1 = msg.slice(2)
            sendRequest(msg1,clasID);
        }
    };



    function lowest(clasCliente) {  // ordered reads

        if (!workersCarga.ordered) {


            workersCarga.data.sort(function(a, b) {

                return parseFloat(a.load) - parseFloat(b.load);
            })
        }
        var cont = 0; var aux;

        for(var indice in workersCarga.data){
            if(workersCarga.data[indice].clase.toString() == clasCliente.toString() &&  workersCarga.data[indice].disponible ==1 ){
                aux = workersCarga.data[indice];
                //workersCarga.data.splice(cont,1);
                workersCarga.data[indice].disponible = 0; // disponible a 0 significa que no esta disponible ( esta atenen una peticio)

                return aux;
            }
            cont++;
        }
        workersCarga.ordered = true;
        return "No hay workers";
        // return this.data.shift();
    }






    function sendRequest(msg,clasID) {
        console.log("Entra en el sendRequest");
        var j =    lowest(clasID)
        console.log("valor de j " + j.toString() );
          if(j != "No hay workers"){
              console.log("Entra en el sendRequest en el if de si hay workers");
             var m = [j.id, ''].concat(msg);
            console.log(m.toString())
            sendToWorker(m);
        } else {
              console.log( + "Entra en el sendRequest en el else" + msg.toString());
              clientsEnEspera[classID].push({id: msg[0], msg: msg.slice(2)});
        }
    }
});

function processPendingClient(workerID,clase) {
    console.log("Entra en processPendingClient"+workerID.toString());
    if ( clientsEnEspera[clase ] != null && clientsEnEspera[clase].length>0) {
        console.log("Entra en processPendingClient en el if");
        var nextClient = clientsEnEspera[clase].shift();
        var m = [workerID,'',nextClient.id,''].concat(nextClient.msg);
        backend.send(m);
        return true;
    } else {
        console.log("Entra en processPendingClient en el else");
        return false;
    }
}

backend.on('message', function() {
    console.log("Entra en el backend");
    var args = Array.apply(null, arguments);
    console.log("Entra en el backend"  +  args.toString());
    if (args.length == 4) {
        console.log("entra al if != 4");
        requestsPerWorker[args[0]]=0;
        workersCarga.ordered= false;
        workersCarga.data.push({id:args[0] ,load:args[2] ,clase:args[3] ,msg:null ,timeout:null,disponible: 1});// disponible 1 = a q si esta disponible
        if (!processPendingClient(args[0],args[3])){
        }
    } else {

        var workerID = args[0];
        requestsPerWorker[args[0]]++;
        args = args.slice(2);
        frontend.send(args);

        for(var indice in workersCarga.data){
            if(workersCarga.data[indice].id.toString() == workerID.toString()  ){
                workersCarga.data[indice].disponible = 1; // disponible a 0 significa que no esta disponible ( esta atenen una peticio)
                clearTimeout( workersCarga.data[indice].timeout)
                return "encontrado";
            }
        }

       // workersCarga.data.push({id:args[0].toString() ,load:args[3].toString() ,clase:args[4].toString() ,msg:null ,timeout:null,disponible: 1}); // disponible 1 = a q si esta disponible
        if (!processPendingClient(args[0] ,args[4])){
        }
    }

});

function showStatistics(){
    var totalAmount = 0; //variable contador inicializada a 0
    for(var i in requestsPerWorker){
        totalAmount += requestsPerWorker[i]; //Las va acumulando todas en el contador
    }
}

process.on('SIGINT',function(){
    showStatistics
    frontend.close();
    backend.close();
});//Saca las estadísticas cuando pulsas [Ctrl]+[C]