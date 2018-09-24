var zmq = require('zeromq')
var args = process.argv.slice(2);
var publisher = zmq.socket('pub');
var type = {"NOTICIES":0,"OFERTES":0};
var aux = require("./auxfunctions1718.js");
var num = args[0];
var arg1 = args[1];
var arg2 = args[2];

publisher.bind('tcp://*:8688', function(err) {
  if(err)
    console.log(err)
  else
    console.log("Listening on 8688...")
})

var msg = JSON.stringify( {"type": '',"text": '',});

for (var i = 1; i < num; i++)
    if (i < num / 2) {
        setTimeout(function () {
            console.log(JSON.stringify({ "type": arg1, "text": aux.randomIntInc(0, 99) }));
            publisher.send(args[1]);
        }, 2000 * i);
        }else{
                setTimeout(function() {
                    console.log(JSON.stringify({ "type": arg2, "text": aux.randomIntInc(0, 999) }));
                    publisher.send(args[2])
                }, 2000 * i);
    }

process.on('SIGINT', function() {
  publisher.close()
  console.log('\nClosed')
})
