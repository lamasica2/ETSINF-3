var zmq = require('zeromq')
var args = process.argv.slice(2);
var publisher = zmq.socket('pub');
if (args[args.length - 1] == "verbose") {
    verbose = true;
    args.pop(); // eliminate only if it appears at the end 
}
var aux = require("./auxfunctions1718.js");
var num = args[1];
var secondsDelay = args[0];
var verbose = false;
var TypeMsg = args.slice(2, args.length);//args.length no l'agarra
console.log(TypeMsg);
//TERMINAL$: node .\publisher_pv2.js 5 100 NOTICIES HALO GEARS SKYRIM vernose


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
            var m = JSON.stringify({ "type": TypeMsg[aux.randomIntInc(0, TypeMsg.length-1)], "text": "Nome random :) :" + aux.randomIntInc(0, 123999) });
            showInfMSG(verbose,m)
            publisher.send(m);
        }, (secondsDelay*1000)*i);
    }

process.on('SIGINT', function () {
    publisher.close()
    num=-1
    if (verbose)console.log('\nClosed')
    })

publisher.on('close', function (fd, ep) { console.log('close, endpoint:', ep); });

process.stdin.on("data", function (str) {
    var textChunk = str.toString('utf8');
    //[** .trim() **  ] it is possible that there is a whitespace to the left and or right of one string
    var text = textChunk.slice(0, str.length - 1).trim();

   // The "regular" == operator can have very unexpected results due to the type- coercion internally, so using === is always the recommended approach.
    console.log(text.toString() === "all");

    switch (text.toString()) {
        case "all":
            setTimeout(function () { important_msg(text, "Hola a TOTS") }, 1);
            break;
        case "close" | "c": //cerrar canal especifico
            setTimeout(function () { important_msg(text, "Xapem el Canal") }, 1);
            break;
        case "exit":
            setTimeout(function () { important_msg(text, "SERVICE EXIT") }, 1);
            publisher.close();
            break;
        default:
            default_text(text.toString());
          
    }
});


function important_msg(type, text) {
    var m = JSON.stringify({ "type": type, "text": text });
    showInfMSG(verbose, m)
    publisher.send(m);
}


 function default_text(text) {
     TypeMsg.forEach(function (key) {
         if (text == key){publisher.send(JSON.stringify({ "type": key, "text": "Millor joc es " + key })); return }
          
     }); 
       // console.log("default: " + text.toString() + " no reconocido");
    }
