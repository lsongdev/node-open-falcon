var os      = require('os');
var _       = require('lodash');
var request = require('superagent');
var debug   = require('debug')('open-falcon');

function Falcon(options){
  if(!(this instanceof Falcon)){
    return new Falcon(options);
  }
  if(typeof options == 'string'){
    options = {
      api: options
    };
  }

  this.options  = options;
  this.data     = {};
  this.queue    = [];
  return this;
}

Falcon.COUNTER_TYPE = {
  GAUGE  : 'GAUGE',
  COUNTER: 'COUNTER'
};


Falcon.prototype.use = function(middleware){
  middleware.apply(this, [ this ]);
  return this;
};

Falcon.prototype.set = function(key, value){
  this.data[ key ] = value;
  return this;
};

Falcon.prototype.metric = function(value){
  this.set.apply(this, [ 'metric', value ]);
  return this;
};
/**
 * [function description]
 * @return {[type]} [description]
 */
Falcon.prototype.endpoint = function(value){
  this.set.apply(this, [ 'endpoint', value ]);
  return this;
};
/**
 * [function description]
 * @return {[type]} [description]
 */
Falcon.prototype.timestamp = function(value){
  this.set.apply(this, [ 'timestamp', value ]);
  return this;
};
/**
 * [function description]
 * @return {[type]} [description]
 */
Falcon.prototype.value = function(value){
  this.set.apply(this, [ 'value', value ]);
  return this;
};
/**
 * [function description]
 * @return {[type]} [description]
 */
Falcon.prototype.step = function(value){
  this.set.apply(this, [ 'step', value ]);
  return this;
};
/**
 * [function description]
 * @return {[type]} [description]
 */
Falcon.prototype.type = function(value){
  this.set.apply(this, [ 'counterType', value ]);
  return this;
};
/**
 * [function description]
 * @return {[type]} [description]
 */
Falcon.prototype.tags = function(tags){
  var arr = [];
  Object.keys(tags || {}).map(function(key){
    arr.push([ key, tags[key] ].join('='));
  });
  this.data[ 'tags' ] = arr.join(',');
  return this;
};

Falcon.prototype.defaults = function(name){
  switch(name){
    case 'endpoint':
      return os.hostname();
    case 'timestamp':
      return +new Date();
    case 'counterType':
      return 'COUNTER';
    case 'step':
      return 60;
  }
}

Falcon.prototype.end = function(){
  var self = this;
  [ 'endpoint', 'timestamp', 'metric', 'value', 'step', 'counterType', 'tags' ].map(function(key){
    self.data[ key ] = self.data[ key ] || self.defaults(key);
    if(typeof self.data[ key ] == 'undefined'){
      throw new Error( `'${key}' is required .`)
    }
  });
  this.queue.push(this.data);
  this.data = {};
  return this;
}

/**
 * [function description]
 * @return {[type]} [description]
 */
Falcon.prototype.send = function(callback){
  var self = this;
  request
    .post(this.options.api)
    .send(this.queue)
    .end(function(){
      callback && callback.apply(self, arguments);
      self.queue = [];
    });
  return this;
};


Falcon.memory = function(name){
  return function(f){
    var usage = process.memoryUsage();

    f
      .metric(`${name}.rss`)
      .value(usage.rss)
      .type(Falcon.COUNTER_TYPE.GAUGE)
      .tags()
      .end()

    f
      .metric(`${name}.heapTotal`)
      .value(usage.heapTotal)
      .type(Falcon.COUNTER_TYPE.GAUGE)
      .tags()
      .end()

    f
      .metric(`${name}.heapUsed`)
      .value(usage.heapUsed)
      .type(Falcon.COUNTER_TYPE.GAUGE)
      .tags()
      .end()

  };
};

Falcon.cpu = function(name){
  return function(f){
    f.metric(name);
  };
};


module.exports = Falcon;
