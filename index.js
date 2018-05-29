const os = require('os');
const URI = require('url');
const http = require('http');

function Falcon(options) {
  if (!(this instanceof Falcon)) {
    return new Falcon(options);
  }
  if (typeof options == 'string') {
    options = {
      api: options
    };
  }
  var self = this,
    defaults = {
      tags: '',
      step: 60,
      value: 0,
      counterType: 'GAUGE',
      endpoint: os.hostname(),
      api: 'http://127.0.0.1:1988/v1/push',
      timestamp: function () {
        return Math.floor(+new Date() / 1000);
      },
    };
  //
  for (var key in options) {
    defaults[key] = options[key];
  }
  //
  this.data = {};
  this.queue = [];
  this.options = defaults;
  return this;
}

Falcon.COUNTER_TYPE = {
  GAUGE: 'GAUGE',
  COUNTER: 'COUNTER'
};

Falcon.prototype.use = function (middleware) {
  middleware.apply(this, [this]);
  return this;
};

Falcon.prototype.set = function (key, value) {
  this.data[key] = value;
  return this;
};

Falcon.prototype.metric = function (name, value) {
  if (name) {
    this.set('metric', name);
  }
  if (value) {
    this.set('value', value);
  }
  return this;
};
/**
 * [function description]
 * @return {[type]} [description]
 */
Falcon.prototype.endpoint = function (value) {
  this.set.apply(this, ['endpoint', value]);
  return this;
};
/**
 * [function description]
 * @return {[type]} [description]
 */
Falcon.prototype.timestamp = function (value) {
  this.set.apply(this, ['timestamp', value]);
  return this;
};
/**
 * [function description]
 * @return {[type]} [description]
 */
Falcon.prototype.value = function (value) {
  this.set.apply(this, ['value', value]);
  return this;
};
/**
 * [function description]
 * @return {[type]} [description]
 */
Falcon.prototype.step = function (value) {
  this.set.apply(this, ['step', value]);
  return this;
};
/**
 * [function description]
 * @return {[type]} [description]
 */
Falcon.prototype.type = function (value) {
  this.set.apply(this, ['counterType', value.toUpperCase()]);
  return this;
};
/**
 * [function description]
 * @return {[type]} [description]
 */
Falcon.prototype.tags = function (tags) {
  var arr = [];
  Object.keys(tags || {}).map(function (key) {
    arr.push([key, tags[key]].join('='));
  });
  this.data['tags'] = arr.join(',');
  return this;
};

Falcon.prototype.end = function () {
  var self = this;
  ([
    'step',
    'tags',
    'value',
    'metric',
    'endpoint',
    'timestamp',
    'counterType'
  ]).map(function (key) {
    if (
      typeof self.data[key] == 'undefined' &&
      typeof self.options[key] == 'undefined'
    ) throw new Error(`'${key}' is required .`);
    //
    if (typeof self.data[key] == 'undefined') {
      if (typeof self.options[key] == 'function') {
        self.data[key] = self.options[key](self);
      } else if (typeof self.options[key] != 'undefined') {
        self.data[key] = self.options[key];
      }
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
Falcon.prototype.send = function (callback = () => {}) {
  const { api } = this.options;
  const req = http.request(Object.assign(URI.parse(api), {
    method: 'POST'
  }), res => {
    const buffer = [];
    res
      .on('error', callback)
      .on('data', chunk => buffer.push(chunk))
      .on('end', () => {
        callback && callback(null, Buffer.concat(buffer));
        this.queue = [];
      });
  })
  req.on('error', callback);
  req.end(JSON.stringify(this.queue));
  return this;
};

module.exports = Falcon;