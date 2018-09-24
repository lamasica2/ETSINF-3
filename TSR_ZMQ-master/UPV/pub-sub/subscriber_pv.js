var zmq = require('zeromq')
var args = process.argv.slice(2);
var subscriber = zmq.socket('sub')
var port = 8688;
var verbose = false;
if (args[args.length - 1] == "verbose") {
    verbose = true;
    args.pop(); // eliminate only if it appears at the end 
}

if (args.length > 0) {
    var type = args[args.length - 1];
    args.pop();
}



subscriber.on("message", function (reply) {
    var msg = JSON.parse(reply);
    if (msg.type == type) {
        if (verbose) console.log(type + '-> Received message: ', reply.toString());
        else {
            console.log("Nueva :" + msg.type + "\n")
            console.log("       " + msg.text + "\n")
        }

    } //else console.log('No ADMISIBLE ', reply.toString());

})

subscriber.connect("tcp://localhost:" + port)
subscriber.subscribe("")


process.on('SIGINT', function () {
    subscriber.close()
    if (verbose)console.log('\nClosed')
})
