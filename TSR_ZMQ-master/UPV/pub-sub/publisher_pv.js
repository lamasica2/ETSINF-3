var zmq = require('zeromq')
var args = process.argv.slice(2);
var publisher = zmq.socket('pub');
var type = { "NOTICIES": 0, "OFERTES": 0 };
var aux = require("./auxfunctions1718.js");
var num = args[0];
var arg1 = args[1];
var arg2 = args[2];
var verbose = false;
if (args[args.length - 1] == "verbose") {
    verbose = true;
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

var msg = JSON.stringify({ "type": '', "text": '', });

for (var i = 1; i < num; i++)
    if (i < num / 2) {
        setTimeout(function () {
            var m = JSON.stringify({ "type": arg1, "text": aux.randomIntInc(0, 99) });
            showInfMSG(verbose,m)
            publisher.send(m);
        }, 2000 * i);
    } else {
        setTimeout(function () {
            var m = JSON.stringify({ "type": arg2, "text": aux.randomIntInc(0, 999) });
            showInfMSG(verbose, m)
            publisher.send(m);
        }, 2000 * i);
    }

process.on('SIGINT', function () {
    publisher.close()
    if (verbose)console.log('\nClosed')
})
