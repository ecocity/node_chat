

// when the daemon started
var starttime = (new Date()).getTime();

var mem = process.memoryUsage();
// every 10 seconds poll for the memory.
setInterval(function () {
  mem = process.memoryUsage();
}, 10*1000);



var MESSAGE_BACKLOG = 200,
    SESSION_TIMEOUT = 60 * 1000;



/**
 * Channel
 *
 * @api public
 */
 

var channel = exports.channel = new function () {
  var messages = []; //,
      //callbacks = [];

  this.appendMessage = function (nick, type, text) {
    var m = { 
      nick: nick,
      type: type, // "msg", "join", "part"
      text: text,
      timestamp: +new Date
    };

    switch (type) {
      case "msg":
        console.log("<" + nick + "> " + text);
        break;
      case "join":
        console.log(nick + " join");
        break;
      case "part":
        console.log(nick + " part");
        break;
    }

    messages.push( m );

    /*
    while (callbacks.length > 0) {
      callbacks.shift().callback([m]);
    }
    */
    
    var keys = Object.keys(sessions);
    for (var i = 0, l = keys.length; i < l; i++) {
      sessions[keys[i]].send([m]);
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
  /*setInterval(function () {
    var now = new Date();
    while (callbacks.length > 0 && now - callbacks[0].timestamp > 30*1000) {
      callbacks.shift().callback([]);
    }
  }, 3000);*/
};





/**
 * Create a new session
 *
 * @param {String} nick
 * @return {object}
 */

var sessions = {};

function createSession (id, nick, messageCallback) {
  if (nick.length > 50) return null;
  if (/[^\w_\-^!]/.exec(nick)) return null;

  for (var i in sessions) {
    var session = sessions[i];
    if (session && session.nick === nick) return null;
  }

  var session = {
    nick: nick, 
    id: id, //Math.floor(Math.random()*99999999999).toString(),
    timestamp: new Date(),
    
    send: messageCallback,

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

/**
 * interval to kill off old sessions
 */

/*setInterval(function () {
  var now = new Date();
  for (var id in sessions) {
    if (!sessions.hasOwnProperty(id)) continue;
    var session = sessions[id];

    if (now - session.timestamp > SESSION_TIMEOUT) {
      session.destroy();
    }
  }
}, 1000);*/





/**
 * Get the nicks of all users
 *
 * @return {object}
 * @api public
 */

function who() {
  var nicks = [];
  for (var id in sessions) {
    if (!sessions.hasOwnProperty(id)) continue;
    var session = sessions[id];
    nicks.push(session.nick);
  }
  return { nicks: nicks, rss: mem.rss };
}

/**
 * Join the chat
 *
 * @param {String} nick
 * @return {object}
 * @api public
 */
 
function join(id, nick, messageCallback) {
  if (nick == null || nick.length === 0) {
    return { error:'Bad nick.' };
  }
  var session = createSession(id, nick, messageCallback);
  if (session == null) {
    return { error:'Nick in use.' };
  }
  
  channel.appendMessage(session.nick, "join");
  
  return { 
    id: id,
    nick: session.nick,
    rss: mem.rss,
    starttime: starttime
  };
}

/**
 * Leave chat
 *
 * @param {String} id
 * @return {object}
 * @api public
 */
 
function part(id) {
  var session = sessions[id];
  if (id && session) {
    session.destroy();
  }
  return { rss: mem.rss };
}

/**
 * Ready to receive messages
 *
 * @param {int} since
 * @param {String} id
 * @param {Function} fn
 * @api public
 */

/*function receive(since, id, fn) {
  if (!since) {
    fn({ error: 'Must supply since parameter' });
    return;
  }
  
  var session = sessions[id];
  if (id && session) {
    session.poke();
  }

  var since = parseInt(since, 10);
  
  channel.query(since, function (messages) {
    if (session) session.poke();
    fn({ messages: messages, rss: mem.rss });
  });
}*/

/**
 * Send a message
 *
 * @param {String} id
 * @param {String} text
 * @return {object}
 * @api public
 */
 
function send(id, text) {
  var session = sessions[id];
  if (!session || !text) {
    return { error: 'No such session id' };
  }

  session.poke();

  channel.appendMessage(session.nick, 'msg', text);
  return { rss: mem.rss };
}

/**
 * Execute a command
 *
 * @param {String} id
 * @param {String} cmd
 * @return {object}
 * @api public
 */
 
function cmd(id, cmd) {
  var session = sessions[id];
  if (!session || !cmd) {
    return { error: "No such session id" };
  }

  session.poke();

  /* TODO: implement commands  */

  return { rss : mem.rss };
}




/**
 * Exports
 */
 
exports.who = who;
exports.join = join;
exports.part = part;
//exports.receive = receive;
exports.send = send;
exports.cmd = cmd;