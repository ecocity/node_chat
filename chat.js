

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
    
    var keys = Object.keys(sessions), session;
    for (var i = 0, l = keys.length; i < l; i++) {
      session = sessions[keys[i]];
      if (session.nick === m.nick) continue;
      session.send([m]);
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
    }
  };

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
  
  channel.query(0, function(messages) {
    if (messages && messages.length > 0) {
      session.send(messages);
    }
  });
  
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
