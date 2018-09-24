 	//auxfunctions1718
 	
 	  // *** getLoad function
var ordered = false;
 	function getLoad() {
 	  var fs     = require('fs')
 	    , data   = fs.readFileSync("/proc/loadavg") // version sincrona 
 	    , tokens = data.toString().split(' ') 
 	    , min1   = parseFloat(tokens[0])+0.01
 	    , min5   = parseFloat(tokens[1])+0.01
 	    , min15  = parseFloat(tokens[2])+0.01
 	    , m      = min1*10 + min5*2 + min15;
 	  return m; 
 	}
 	
 	  // *** randNumber function
 	
 	function randNumber(upper, extra) {
 	  var num = Math.abs(Math.round(Math.random() * upper));
 	  return num + (extra || 0);
 	}
 	
 	  // *** randTime function
 	
 	function randTime(n) {
 	  return Math.abs(Math.round(Math.random() * n)) + 1;
 	}
 	
 	  // *** showArguments function
 	
 	function showMessage(msg) {
 	  msg.forEach( (value,index) => {
 	    console.log( '     Segment %d: %s', index, value );
 	  })
 	}
 	
 	  // *** ordered list functions for workers management
 	  // list has an "ordered" property (true|false) and a data property (array)
 	  // data elements consists of pairs {id, load}
 	
 	function orderedList() {
 	  return {ordered: true, data: []};
 	}
 	
 	function nonempty() {
 	  return (this.data.length > 0);
 	}
function lowest() {  // ordered reads
    if (!this.ordered) {
        data.sort(function (a, b) {
            return parseFloat(b.load) - parseFloat(a.load);
        })
    }
    this.ordered = true;
    return this.data.shift();
}
 	
 	function insert(k) { // unordered writes
 	  this.ordered = false;
 	  this.data.push(k);
      }



function randomIntInc(low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
      }

function lowestPesos(data) {  // ordered reads
    if (!this.ordered) {
        data.sort(function (a, b) {
            return parseFloat(a.load) - parseFloat(b.load);
        });
    }
    this.ordered = true;
    //console.log("this.ordered: " + this.ordered)
    return data.shift(); //{ m: 0 }
}

function show(data) {  // ordered reads
  
    console.log("\n");
    console.log("*******Workers Available*******");
    for (var myobject in data) {
        console.log( + data[myobject].load + ": " + data[myobject].worker);
    }
    console.log("************************\n");
    
}

function insertWorkerLoad(k,data) { // unordered writes
    this.ordered = false;
    data.push(k);
}
 	
 	module.exports.getLoad = getLoad;
 	module.exports.randNumber = randNumber;
 	module.exports.randTime = randTime;
 	module.exports.showMessage = showMessage;
 	module.exports.orderedList = orderedList;
 	module.exports.nonempty = nonempty;
 	module.exports.lowest = lowest;
      module.exports.insert = insert; 
      module.exports.randomIntInc = randomIntInc; 
      module.exports.lowestPesos = lowestPesos;
      module.exports.show = show;
module.exports.insertWorkerLoad = insertWorkerLoad;