HOST = null; // localhost
PORT = 8001;

// when the daemon started
var starttime = (new Date()).getTime();

var mem = process.memoryUsage();
// every 10 seconds poll for the memory.
setInterval(function () {
  mem = process.memoryUsage();
}, 10*1000);


var sys      = require("sys"),
    express  = require('express'),
    app      = express.createServer(),
    io       = require('socket.io'),
    chat     = require('chat.js'),
    SocketRouter = require('./socketrouter.js');



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

/*
app.get('/who', function(req, res) {
  var data = who();
  var status = data.error && 400 || 200;
  res.send(res, data, status);
});

app.get("/join", function(req, res) {
  var nick = req.param('nick');
  var data = join(nick);
  var status = data.error && 400 || 200;
  res.send(res, data, status);
});

app.get('/part', function(req, res) {
  var id = req.param('id');
  var data = part(id);
  var status = data.error && 400 || 200;
  res.send(res, data, status);
});

app.get('/recv', function(req, res) {
  var since = req.param('since');
  var id = req.param('id');
  
  receive(since, id, function(data) {
    var status = data.error && 400 || 200;
    res.send(res, data, status);
  });
});

app.post('/send', function(req, res) {
  var id = req.param('id');
  var text = req.param('text');
  var data = send(id, text);
  var status = data.error && 400 || 200;
  res.send(res, data, status);
});


app.get("/cmd", function (req, res) {
  var id = req.param('id');
  var cmd = req.param('cmd');
  var data = command(id, cmd);
  var status = data.error && 400 || 200;
  res.send(res, data, status);
});
*/





var socket = io.listen(app);

var router = new SocketRouter(socket);

router.add('message/who', function(req, client, next) {
  var data = chat.who();
  client.send(data);
  next();
});

router.add('message/join', function(req, client, next) {
  var data = chat.join(req.nick);
  client.send(data);
  next();
});

router.add('message/part', function(req, client, next) {
  var data = chat.part(req.id);
  client.send(data);
  next();
});

router.add('message/recv', function(req, client, next) {
  var data = chat.receive(req.since, req.id, function(data) {
    client.send(data);
    next();
  });
});

router.add('message/send', function(req, client, next) {
  var data = chat.send(req.id, req.text);
  client.send(data);
  next();
});

router.add('message/cmd', function(req, client, next) {
  var data = chat.cmd(req.id, req.text);
  client.send(data);
  next();
});







