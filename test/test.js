var os     = require('os');
var Falcon = require('../');

var falcon = new Falcon({
  endpoint: os.hostname()
});
//
var usage = process.memoryUsage();
for(var key in usage){
  falcon.metric('memory.' + key, usage[key]).end();
}

falcon.send();
