var zmq = require('zeromq')
var args = process.argv.slice(2);
var subscriber = zmq.socket('sub')

var type = args[0];
var port = 8688;

subscriber.on("message", function(reply) {
	if(reply.toString()==type){
		console.log(type+'-> Received message: ', reply.toString());
			
	 } //else console.log('No ADMISIBLE ', reply.toString());
  
})

subscriber.connect("tcp://localhost:" + port)
subscriber.subscribe("")


process.on('SIGINT', function() {
  subscriber.close()
  console.log('\nClosed')
})
