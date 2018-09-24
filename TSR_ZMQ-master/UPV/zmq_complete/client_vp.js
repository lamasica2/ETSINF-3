var zmq = require('zmq');
var cliente = zmq.socket('req');

var brokerURL = 'tcp://localhost:8059'|| process.argv[2];
var myID =   'NONE' || process.argv[3];
var myMSG =  'Hello' || process.argv[4];
var clase = process.argv[5];


if(myID != 'NONE'){cliente.identity = myID;}
cliente.connect(brokerURL);
console.log('Client (%s), clase (%s), connected to %s', myID, clase, brokerURL);

cliente.on('message',function(msg){
    console.log('Client (%s) has received reply "%s"', myID, msg.toString());
    process.exit(0);
});
cliente.send([myMSG,clase]);