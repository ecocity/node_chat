$(function($){
  window.Controllers = {};
  
  
  window.Controllers.Message = Spine.Controller.create({
    
    proxied: ['render'],
    
    template: function(data) {
      return $.template('#messageTmpl')(data);
    },
    
    init: function() { },
    
    render: function() {
      this.el.html(this.template(this.item));
      return this;
    }
    
  });
  
  window.Controllers.Log = Spine.Controller.create({
    
    init: function() {
      this.App.bind('send:message show:message', addMessage);
    },
    
    addMessage: function(msg) {
      var message = Controllers.Message.inst({item:item});
      this.el.append(message.render().el);
    }
    
  });
  
  
  
  
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
    }
    
    send: function(text) {
      var msg = Model.Message.inst({
        messageType : 'msg',
        date : +new Date,
        nick : App.user.nick,
        text : text
      });
      //this.App.log.addMessage(msg);
      this.App.trigger('send:message', msg);
      
      console.log("Send : " + msg);
    }
      
    
  });
  
  
  
  
  window.Controllers.Status = Spine.Controller.create({
    
    // Ensure these functions are called with the current
    // scope as they're used in event callbacks
    proxied: ["render"],
    
    template: function(data) {
      return $.template('statusTmpl')(data);
    },
    
    init: function() {
      this.status = Model.Status.inst();
      this.status.bind('update', render);
    },
    
    render: function() {
      this.el.html(this.template(this.status));
    }
    
  });
  
  
  window.Controllers.Users = Spine.Controller.create({
    
  });
  
  
  window.Controllers.Socket = Spine.Controller.create({
    
    proxied: ['connect', 'connected', 'received', 'disconnected', 'send'],
    
    url: '', // populated by App
    
    init: function() {
      var that = this;
      this.socket = new io.Socket(this.url);
		  this.socket.on('connect', function(){ that.connected(arguments); });
		  this.socket.on('message', function(){ that.received(arguments); });
		  this.socket.on('disconnect', function(){ that.disconnected(arguments); });
		  
		  this.App.bind('send:message', send);
    },
    
    connect: function() {
      this.socket.connect();
    },

    connected: function() {
      var args = Array.prototype.slice.call(arguments,0);
      this.App.trigger("socket:connected", Array.prototype.slice.call(arguments,0));
      console.log('connected to host ' + this.url);
      console.log('connected', args);
    },

    received: function(message) {
      console.log('message', arguments);
      
      if (message.error) {
        
      }
      else if (message.type) {
        // nick, type, text, timestamp
        var msg = Model.Message.inst(message);
        this.App.trigger('show:message', msg);
      }
      else if (message.rss) {
        // update status
      }
    },

    disconnected: function() {
      var args = Array.prototype.slice.call(arguments,0);
      this.App.trigger("socket:disconnected", Array.prototype.slice.call(arguments,0));
      console.log("disconnected from host " + this.url);
    },

    send: function(message) {
      this.socket.send(message);
    }
    
  });
  
  
  
  window.App = Spine.Controller.create({
    el: $('body'),
    
    events: {
      
    },
    
    elements: {
      '#status': 'statusEl',
      '#entry' : 'entryEl',
      '#users' : 'usersEl'
      '#log'   : 'logEl',
    },
    
    init: function() {
      // current user
      this.user = User.inst();
      
      // controllers
      this.users = Controllers.Users.inst({el:this.usersEl});
      this.entry = Controllers.Entry.inst({el:this.entryEl});
      this.status = Controllers.Status.inst({el:this.statusEl});
      this.log = Controllers.Log.inst({el:this.logEl});
      
      this.socket = Controllers.Socket.inst({url:''});
    }
    
  }).inst();
  
  
});
