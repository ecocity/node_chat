HOST = null; // localhost
PORT = 8001;


var sys      = require("sys"),
    express  = require('express'),
    app      = express.createServer(),
    io       = require('socket.io'),
    chat     = require('./chat'),
    SocketRouter = require('./socketrouter');



// set the view engine
app.set('view engine', 'utml');

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/content'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.listen(Number(process.env.PORT || PORT));

app.get('/', function(req, res) {
  //res.render('index.html', {});
  res.sendfile('views/index.html');
});




var socket = io.listen(app);

var router = new SocketRouter(socket);

router.add('message/who', function(req, client, next) {
  var data = chat.who();
  client.send(data, req);
  next();
});

router.add('message/join', function(req, client, next) {
  var data = chat.join(client.sessionId, req.nick, client.send);
  client.send(data, req);
  next();
});

router.add('message/part', function(req, client, next) {
  var data = chat.part(client.sessionId);
  //client.send(data);
  next();
});

/*router.add('message/recv', function(req, client, next) {
  var data = chat.receive(req.since, client.sessionId, function(data) {
    client.send(data);
    next();
  });
});*/

router.add('message/send', function(req, client, next) {
  var data = chat.send(client.sessionId, req.text);
  client.send(data, req);
  next();
});

router.add('message/cmd', function(req, client, next) {
  var data = chat.cmd(client.sessionId, req.text);
  client.send(data, req);
  next();
});

router.add('connection/', function(req, client, next) {
  client.send(chat.who());
  next();
});

router.add('disconnect/', function(req, client, next) {
  chat.part(client.sessionId)
});







