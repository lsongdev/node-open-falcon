var Falcon = require('../');

var falcon = new Falcon(
  'http://127.0.0.1:1988/v1/push'
);
//
// falcon
//   .metric('cpu.idle')
//   .endpoint()
//   .timestamp()
//   .value(1)
//   .step(20)
//   .type(Falcon.COUNTER_TYPE.COUNTER)
//   .tags({name: 'aa', 'bb':1})
//   .end()
//   // .send()
//   .use(function(f){
//     f.metric('test')
//     f.value('aa');
//     f.step(60);
//     f.type('s');
//     f.tags({a:1});
//   })
//   .use(function(f){
//     f.metric('a')
//     f.value('aa');
//     f.step(60);
//     f.type('s');
//     f.tags({a:2});
//   })
//   .send(function(err, res){
//     console.log(res);
//   })

setInterval(function(){

  falcon
    .use(Falcon.memory('memory'))
    .send()

}, 1000);
