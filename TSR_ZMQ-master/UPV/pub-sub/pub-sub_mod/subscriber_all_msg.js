var zmq = require('zeromq')
var args = process.argv.slice(2);
var subscriber = zmq.socket('sub')

var type = args[0];
var port = 8688;
var verbose = false;
if (args[args.length - 1] == "verbose") {
    verbose = true;
}
subscriber.on("message", function (reply) {
    var msg = JSON.parse(reply);
    if (!msg.type) return;
    switch (msg.type) {
        case type:
            if (verbose) console.log(type + '-> Received message: ', reply.toString());
            else { console.log("Nueva :" + msg.type + "\n");console.log("       " + msg.text + "\n")}
            break;
        case "close" | "c": //cerrar canal especifico
            console.log("Ya no puc utilizar" + type + " per a sentir");
            break;
        case "exit":
            setTimeout(subscriber.close(), 1000); if (verbose) console.log('\nClosed')
            break;
        case "all":
            console.log("ALL SUBS:" + msg.type + " " + msg.text+ "\n");
            break;
       
        default:
           if(verbose) console.log("default: " + msg.type + " no reconocido");
    }
     //else console.log('No ADMISIBLE ', reply.toString());

})

subscriber.connect("tcp://localhost:" + port)
subscriber.subscribe("")


process.on('SIGINT', function () {
    subscriber.close()
    if (verbose)console.log('\nClosed')
})
