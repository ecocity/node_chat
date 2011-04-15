HOST = null; // localhost
PORT = 8001;

// when the daemon started
var starttime = (new Date()).getTime();

var mem = process.memoryUsage();
// every 10 seconds poll for the memory.
setInterval(function () {
  mem = process.memoryUsage();
}, 10*1000);


var sys = require("sys"),
    express = require('express'),
    app = express.createServer(),
    io = require('socket.io');



var MESSAGE_BACKLOG = 200,
    SESSION_TIMEOUT = 60 * 1000;

var channel = new function () {
  var messages = [],
      callbacks = [];

  this.appendMessage = function (nick, type, text) {
    var m = { nick: nick
            , type: type // "msg", "join", "part"
            , text: text
            , timestamp: (new Date()).getTime()
            };

    switch (type) {
      case "msg":
        sys.puts("<" + nick + "> " + text);
        break;
      case "join":
        sys.puts(nick + " join");
        break;
      case "part":
        sys.puts(nick + " part");
        break;
    }

    messages.push( m );

    while (callbacks.length > 0) {
      callbacks.shift().callback([m]);
    }

    while (messages.length > MESSAGE_BACKLOG)
      messages.shift();
  };

  this.query = function (since, callback) {
    var matching = [];
    for (var i = 0; i < messages.length; i++) {
      var message = messages[i];
      if (message.timestamp > since)
        matching.push(message)
    }

    if (matching.length != 0) {
      callback(matching);
    } else {
      callbacks.push({ timestamp: new Date(), callback: callback });
    }
  };

  // clear old callbacks
  // they can hang around for at most 30 seconds.
  setInterval(function () {
    var now = new Date();
    while (callbacks.length > 0 && now - callbacks[0].timestamp > 30*1000) {
      callbacks.shift().callback([]);
    }
  }, 3000);
};

var sessions = {};

function createSession (nick) {
  if (nick.length > 50) return null;
  if (/[^\w_\-^!]/.exec(nick)) return null;

  for (var i in sessions) {
    var session = sessions[i];
    if (session && session.nick === nick) return null;
  }

  var session = { 
    nick: nick, 
    id: Math.floor(Math.random()*99999999999).toString(),
    timestamp: new Date(),

    poke: function () {
      session.timestamp = new Date();
    },

    destroy: function () {
      channel.appendMessage(session.nick, "part");
      delete sessions[session.id];
    }
  };

  sessions[session.id] = session;
  return session;
}

// interval to kill off old sessions
setInterval(function () {
  var now = new Date();
  for (var id in sessions) {
    if (!sessions.hasOwnProperty(id)) continue;
    var session = sessions[id];

    if (now - session.timestamp > SESSION_TIMEOUT) {
      session.destroy();
    }
  }
}, 1000);


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

app.get('/who', function(req, res) {
  var nicks = [];
  for (var id in sessions) {
    if (!sessions.hasOwnProperty(id)) continue;
    var session = sessions[id];
    nicks.push(session.nick);
  }
  res.send({ nicks: nicks, rss: mem.rss }, 200);
  return;
});

app.get("/join", function(req, res) {
  var nick = req.param('nick');
  if (nick == null || nick.length === 0) {
    res.send({ error:'Bad nick.' }, 400);
    return;
  }
  var session = createSession(nick);
  if (session == null) {
    res.send({ error:'Nick in use.' }, 400);
    return;
  }
  
  channel.appendMessage(session.nick, "join");
  res.send({ 
    id: session.id,
    nick: session.nick,
    rss: mem.rss,
    starttime: starttime
  });
  return;
});

app.get('/part', function(req, res) {
  var id = req.param('id');
  var session;
  if (id && sessions[id]) {
    session = sessions[id];
    session.destroy();
  }
  res.send({ rss: mem.rss });
});

app.get('/recv', function(req, res) {
  if (!req.param('since')) {
    res.send({ error: 'Must supply since parameter' }, 400);
    return;
  }
  var id = req.param('id');
  var session;
  if (id && sessions[id]) {
    session = sessions[id];
    session.poke();
  }

  var since = parseInt(req.param('since'), 10);
  
  channel.query(since, function (messages) {
    if (session) session.poke();
    res.send({ messages: messages, rss: mem.rss });
  });
});

app.post('/send', function(req, res) {
  var id = req.param('id');
  var text = req.param('text');
  
  console.log(id, text, req.body);

  var session = sessions[id];
  if (!session || !text) {
    res.send({ error: 'No such session id' }, 400);
    return;
  }

  session.poke();

  channel.appendMessage(session.nick, 'msg', text);
  res.send({ rss: mem.rss });
});


app.get("/cmd", function (req, res) {
  var id = req.param('id');
  var text = req.param('cmd');

  var session = sessions[id];
  if (!session || !cmd) {
    res.send({ error: "No such session id" }, 400);
    return;
  }

  session.poke();

  /* TODO: implement commands  */

  res.send({ rss: mem.rss });
});







