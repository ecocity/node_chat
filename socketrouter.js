function wrap(func, wrapper) {
  return function() {
    var args = [func].concat(slice.call(arguments));
    return wrapper.apply(this, args);
  };
}


var SocketRouter = exports = module.exports = function SocketRouter(socket) {
  
  this.routeMap = {};
  this.socket = socket;
  
  socket.on('connection', function(client) {
    
    client.send = wrap(client.send, function(fn, message, req) {
      if (req) {
        message.req = req;
        fn(message);
      }
    });
    
    createHandler('connection')();
    
    client.on('message', createHandler('message'));
    client.on('disconnect', createHandler('disconnect'));
    
    function createHandler(event) {
      return function(data) {
        if (!data) data = {};
        if (!data.cmd) data.cmd = '';
          
        // handle the event
        this.handle(event, data, client, function(err) {
          // send the error if there was one
          if (err) client.send({ error:err, req:data });
        });
        
      }; 
    }
    
  });
  
};



SocketRouter.prototype.add = function(path) {

  this.routeMap[path] = this.routeMap[path] || [];
  
  Array.prototype.slice.call(arguments, 1).forEach(function(fn){
    this.routeMap[path].push(fn);
  }, this);
  
};



SocketRouter.prototype.handle = function(event, req, client, out) {
  
  var route = this.routeMap[event + '/' + req.cmd];
  
  var stack = this.routeMap[route];
  var index = 0;
  
  function next(err) {
    fn = stack[index++];
    
    if (!fn) {
      if (out) return out(err);
    }
    
    try {
      if (typeof fn === 'function') {
        fn(req, client, next);
      }
      else {
        next();
      }
    }
    catch (e) {
      console.error(e.stack + '\n');
      next(e);
    }
  }
  
  next();
};


