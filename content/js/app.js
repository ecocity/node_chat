$(function($){
  window.Controllers = {};
  
  
  /**
   * Message Controller
   */
  
  window.Controllers.Message = Spine.Controller.create({
    
    proxied: ['render'],
    
    template: function(data) {
      return $.template('messageTmpl')(data);
    },
    
    init: function() { },
    
    render: function() {
      this.el.html(this.template(this.item));
      return this;
    }
    
  });
  
  
  /**
   * Log Controller
   */
  
  window.Controllers.Log = Spine.Controller.create({
    
    init: function() {
      this.App.bind('send:message show:message', this.addMessage);
    },
    
    addMessage: function(msg) {
      var message = Controllers.Message.inst({item:msg});
      this.el.append(message.render().el);
    }
    
  });
  
  
  
  
  /**
   * Entry Controller
   */
  
  window.Controllers.Entry = Spine.Controller.create({
    
    events: {
      'keypress':'onKeyPress'
    },
    
    init: function(){
      
    },
    
    onKeyPress: function(e) {
      if (e.keyCode != 13) return;
      var target = $(e.target),
          msg = target.attr("value").replace("\n", "");
      if (!$.isBlank(msg)) this.send(msg);
      target.attr("value", ""); // clear the entry field.
    },
    
    send: function(text) {
      var msg = Models.Message.inst({
        messageType : 'msg',
        date : +new Date,
        nick : App.user.nick,
        text : text,
        cmd : 'send'
      });
      
      // tell the app that we have a message to send
      this.App.trigger('send:message', msg);
    }
      
    
  });
  
  
  
  
  /**
   * Status Controller
   */
  
  window.Controllers.Status = Spine.Controller.create({
    
    // Ensure these functions are called with the current
    // scope as they're used in event callbacks
    proxied: ["render"],
    
    template: function(data) {
      return $.template('statusTmpl')(data);
    },
    
    init: function() {
      this.status = Models.Status.inst({ userCount:'?', rss:'0' });
      this.status.bind('update', this.render);
    },
    
    render: function(status) {
      if (status) this.status = status;
      this.el.html(this.template(this.status));
    }
    
  });
  
  
  
  /**
   * Users Controller
   */
  
  window.Controllers.Users = Spine.Controller.create({
    
  });
  
  
  
  
  
  
  /**
   * Login Controller
   */
  
  window.Controllers.Login = Spine.Controller.create({
    
    events: {
      'click #btnJoin': 'join',
      'keypress #txtNick': 'join'
    },
    
    init: function() {
      
    },
    
    join: function(ev) {
      if (ev.type = 'keypress' && ev.keyCode != 13) return;
      ev.preventDefault();
      var nick = $('#txtNick').val();
      this.App.trigger('login:join', nick);
    }
    
  });
  
  
  /**
   * Socket Controller
   */
  
  window.Controllers.Socket = Spine.Controller.create({
    
    proxied: ['connect', 'connected', 'received', 'disconnected', 'send'],
    
    url: 'mike.freyday.com', // populated by App
    
    options: {
      port:8001,
      transports:['websocket']
    },
    
    init: function() {
      this.socket = new io.Socket(this.url, this.options);
      this.socket.on('connect', this.connected);
      this.socket.on('message', this.received);
      this.socket.on('disconnect', this.disconnected);
        
      this.App.bind('send:message', this.send);
      this.App.bind('login:join', this.proxy(function(nick){ this.send({nick:nick,cmd:'join'}); }));
    },
    
    connect: function() {
      this.socket.connect();
    },

    connected: function() {
      var args = Array.prototype.slice.call(arguments,0);
      this.App.trigger("socket:connected", Array.prototype.slice.call(arguments,0));
    },

    received: function(message) {
      console.log('message', arguments);
      
      // error message
      if (message.error) {
        console.error('NODE : ' + message.error);
        var msg = Models.Message.inst({ text:message.error, type:'error', timestamp:new Date(), nick:'' });
        this.App.trigger('show:message', msg);
      }
      // event message
      else if (message.type) {
        // nick, type, text, timestamp
        var msg = Models.Message.inst(message);
        this.App.trigger('show:message', msg);
      }
      // login message
      else if (message.id && message.nick) {
        var user = Models.User.inst({ id:message.id, nick:message.nick });
        this.App.trigger('login:success', user);
      }
      
      
      // update status
      if (message.rss) {
        this.App.trigger('status:rss', message.rss);
      }
      if (message.starttime) {
        this.App.trigger('status:starttime', message.starttime);
      }
    },

    disconnected: function() {
      var args = Array.prototype.slice.call(arguments,0);
      this.App.trigger("socket:disconnected", Array.prototype.slice.call(arguments,0));
      console.log("disconnected from host " + this.url);
    },

    send: function(message) {
      console.log("send", message);
      this.socket.send(message);
    }
    
  });
  
  
  
  /**
   * Application
   */
  
  window.App = Spine.Controller.create({
    el: $('body'),
    
    proxied: ['onJoin'],
    
    events: {
      
    },
    
    elements: {
      '.status': 'statusEl',
      '#entry' : 'entryEl',
      '.users' : 'usersEl',
      '.log'   : 'logEl',
      '.login' : 'loginEl',
      '.app'   : 'appEl'
    },
    
    init: function() {
      // current user
      this.user = null;
      
      // controllers
      this.users = Controllers.Users.inst({el:this.usersEl});
      this.entry = Controllers.Entry.inst({el:this.entryEl});
      this.status = Controllers.Status.inst({el:this.statusEl});
      this.log = Controllers.Log.inst({el:this.logEl});
      this.login = Controllers.Login.inst({el:this.loginEl});
      
      this.socket = Controllers.Socket.inst({url:''});
      this.socket.connect();
      
      // events
      this.App.bind('login:success', this.onJoin)
    },
    
    onJoin: function(user) {
      console.log('login:success', user);
      if (!user) return;
      this.user = user;
      this.loginEl.toggle();
      this.appEl.toggle();
    }
    
  }).inst();
  
  
});
