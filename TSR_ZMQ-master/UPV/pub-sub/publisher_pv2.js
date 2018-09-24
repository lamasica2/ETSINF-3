var zmq = require('zeromq')
var args = process.argv.slice(2);
var publisher = zmq.socket('pub');
var aux = require("./auxfunctions1718.js");
var num = args[1];
var secondsDelay = args[0];
var verbose = false;
var TypeMsg = args.slice(2, args.length); //l'ultim element no lagarra  'args.length'
console.log(TypeMsg);
console.log(TypeMsg[0]);
//TERMINAL$: node .\publisher_pv2.js 5 100 NOTICIES HALO GEARS SKYRIM
if (args[args.length - 1] == "verbose") {
    verbose = true;
    args.pop(); // eliminate only if it appears at the end 
}

publisher.bind('tcp://*:8688', function (err) {
    if (err)
        console.log(err)
    else {
        if (verbose)console.log("Listening on 8688...");
    }
        
})



function showInfMSG(log,msg) {
    if (!log) return;
    console.log("Enviando msg a subs:"+msg);

}


    for (var i = 1; i < num; i++){
        setTimeout(function () {
            //Enviem de manera random msgde un tipus o altre, als nostres subs
            var m = JSON.stringify({ "type": TypeMsg[aux.randomIntInc(0, TypeMsg.length-1)], "text": "Nom random :) :" + aux.randomIntInc(0, 123999) });
            showInfMSG(verbose,m)
            publisher.send(m);
        }, (secondsDelay*1000)*i);
    }

process.on('SIGINT', function () {
    publisher.close()
    if (verbose)console.log('\nClosed')
})
