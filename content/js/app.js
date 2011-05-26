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
    
    proxied: [ 'addMessage' ],
    
    init: function() {
      this.App.bind('send:message show:message', this.addMessage);
    },
    
    addMessage: function(message) {
      
      var msg = _.clone(message);
    
      if (msg.type) {
        if (msg.type == 'join')
          msg.text = 'joined';
        else if (msg.type == 'part')
          msg.text = 'left';
      }
      
      if (App.user && msg.text.charAt(0) === '@' && msg.text.indexOf('@'+App.user.nick) != 0) return;
      
      msg.text = $.toStaticHTML(msg.text);
      msg.text = $.detectURLs(msg.text);
      
      var message = Controllers.Message.inst({item:msg});
      this.el.append(message.render().el);
      
      this.el.scrollTop(this.el[0].scrollHeight);
      
      App.updateTitle(1);
      
      if (!App.hasFocus && msg.type === 'msg') {
        App.notification.show(msg.nick+' says', msg.text.substring(0,60), 'alert', 3000);
        App.sounds.message.play();
      }
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
        type : 'msg',
        timestamp : +new Date,
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
      //this.status.bind('update', this.render);
      
      this.App.bind('status:update', this.render);
    },
    
    render: function(status) {
      if (status) _.extend(this.status, status);
      this.el.html(this.template(this.status));
    }
    
  });
  
  
  
  /**
   * Users Controller
   */
  
  window.Controllers.Users = Spine.Controller.create({
    
    proxied: [ 'render', 'userLeft', 'userJoined' ],
    
    events: {
      'click li': 'selectUser'
    },
    
    nicks: [],
    
    selectedNick : '',
    
    init: function() {
      this.App.bind('user:part', this.userLeft);
      this.App.bind('user:join', this.userJoined);
    },
    
    template: function(data) {
      return $.template('usersTmpl')(data);
    },
    
    render: function() {
      this.el.html(this.template({ 
        users:this.nicks, 
        selected:this.selectedNick,
        me: App.user && App.user.nick || ''
      }));
    },
    
    userLeft: function(nicks) {
      if (!nicks || !_.isArray(nicks)) return;
      var arr = nicks.slice(0);
      arr.unshift(this.nicks);
      this.nicks = _.without.apply(_, arr);
      this.render();
      
      this.App.trigger('status:update', {userCount:this.nicks.length});
    },
    
    userJoined: function(nicks) {
      if (!nicks || !_.isArray(nicks)) return;
      
      Array.prototype.push.apply(this.nicks, nicks);
      this.nicks = _.uniq(this.nicks.sort(), true);
      this.render();
      
      this.App.trigger('status:update', {userCount:this.nicks.length});
    },
    
    selectUser: function(ev) {
      var item = $(ev.target);
        
      item.parent().find('li').removeClass('selected');
      item.addClass('selected');
      
      this.selectedNick = item.html();
    }
    
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
      if (ev.type == 'keypress' && ev.keyCode != 13) return;
      ev.preventDefault();
      var nick = $('#txtNick').val();
      this.App.trigger('login:join', nick);
    }
    
  });
  
  
  /**
   * Sound Controller
   */
   
  window.Controllers.Sound = Spine.Controller.create({
     
    proxied: ['play'],
     
    sound: 'message',
     
    ready: false,
     
    channels: [],
     
    init: function() {
      var clip = document.createElement('audio');
      clip.src = 'audio/' + this.sound + (clip.canPlayType('audio/ogg') ? '.ogg' : '.mp3');
      
      clip.addEventListener('canplaythrough', function(ev){
        this.ready = true;
      }, false);
      
      clip.load();
      clip.autobuffer = true;
      clip.preload = 'auto';
      
      for (var i = 0; i < 4; i++) {
        this.channels.push(clip.cloneNode(true));
      }
    },
    
    play: function() {
      if (!this.ready) return;
      var clip;
      for (var i = 0, channel; channel = this.channels[i++];) {
        if (channel.paused || channel.ended) {
          if (channel.ended) channel.currentTime = 0;
          clip = channel;
          break;
        }
      }
      if (!clip) {
        clip = this.channels[0];
        clip.pause();
        clip.currentTime = 0;
      }
      clip.play();
    }
    
  });
  
  
  /**
   * Notification Controller
   */
   
  window.Controllers.Notification = Spine.Controller.create({
    
    proxied: [ 'show', 'enable' ],
    
    events: {
      'click': 'enable'
    },
    
    enabled: false,
    supported: !!window.webkitNotifications,
    
    init: function() {
      if (!this.supported) {
        this.el.hide();
      }
      else if (window.webkitNotifications.checkPermission() == 0) {
        this.enabled = true;
        this.el.hide();
      }
    },
    
    enable: function() {
      if (window.webkitNotifications.checkPermission() !== 0) {
        window.webkitNotifications.requestPermission(this.proxy(function(){
          if (window.webkitNotifications.checkPermission() === 0) {
            this.enabled = true;
            this.el.hide();
          }
        }));
      }
    },
    
    show: function(title, content, icon, duration) {
      if (!this.enabled) return;
      
      var noti = window.webkitNotifications.createNotification('img/'+icon+'.png', title, content);
      noti.show();
      setTimeout(
        function(){noti.cancel();}, 
        duration && Math.min(5000, Math.max(1000, duration)) || 2500
      );
    }
    
  });
  
  
  /**
   * Socket Controller
   */
  
  window.Controllers.Socket = Spine.Controller.create({
    
    proxied: ['connect', 'connected', 'received', 'disconnected', 'send', 'login'],
    
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
      this.App.bind('login:join', this.login);
    },
    
    login: function(nick) {
      this.connect();
      this.App.bind('socket:connected', this.proxy(function(){
        this.send({nick:nick,cmd:'join'});
      }));
    },
    
    connect: function() {
      this.socket.connect();
    },

    connected: function() {
      var args = Array.prototype.slice.call(arguments,0);
      this.App.trigger("socket:connected", Array.prototype.slice.call(arguments,0));
    },

    received: function(message) {
    
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
        this.App.trigger('user:join', [message.nick]);
      }
      
      
      // update status
      if (message.rss) {
        this.App.trigger('status:update', {rss:message.rss});
      }
      if (message.starttime) {
        this.App.trigger('status:update', {starttime:message.starttime});
      }
      if (message.nicks || message.type == 'join' || message.type == 'part') {
        this.App.trigger('user:' + (message.type || 'join'), message.nicks || [message.nick]);
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
  
  
  
  /**
   * Application
   */
  
  window.App = Spine.Controller.create({
    el: $('body'),
    
    proxied: ['onJoin'],
    
    events: { },
    
    elements: {
      '.notify': 'notifyEl',
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
      this.hasFocus = true;
      this.unreadCount = 0;
      
      // controllers
      this.users = Controllers.Users.inst({el:this.usersEl});
      this.entry = Controllers.Entry.inst({el:this.entryEl});
      this.status = Controllers.Status.inst({el:this.statusEl});
      this.log = Controllers.Log.inst({el:this.logEl});
      this.login = Controllers.Login.inst({el:this.loginEl});
      this.notification = Controllers.Notification.inst({el:this.notifyEl});
      
      this.socket = Controllers.Socket.inst({url:''});
      
      this.sounds = {
        "message" : Controllers.Sound.inst({sound:"message"})
      };
      
      // events
      this.App.bind('login:success', this.onJoin);
    },
    
    onJoin: function(user) {
      if (!user) return;
      this.user = user;
      this.loginEl.toggle();
      //this.appEl.toggle();
    },
    
    updateTitle: function(cnt) {
      if (cnt) this.unreadCount += cnt;
      
      if (this.hasFocus) {
        this.unreadCount = 0;
        document.title = 'node chat';
      }
      else if (this.unreadCount > 0) {
        document.title = '(' + this.unreadCount + ') node chat';
      }
    }
    
  }).inst();
  
  // listen for browser events so we know when the window has focus
  $(window).bind('blur', function() {
    App.hasFocus = false;
  });

  $(window).bind('focus', function() {
    App.hasFocus = true;
    App.updateTitle();
  });
  
});
