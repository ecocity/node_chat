$(function($){
  window.Models = {};
  
  var Message = window.Models.Message = Spine.Model.setup('Message', ['type', 'timestamp', 'nick', 'text', 'cmd']);
  Message.include({
  
    date: function() {
      var d = !this.timestamp ? new Date() :
        (this.timestamp instanceof Date) === false ? new Date(this.timestamp) :
        this.timestamp;
      
      return $.timeString(d);
    }
  
  });
  
  
  
  var User = window.Models.User = Spine.Model.setup('User', ['id', 'nick']);
  User.extend({
    
  });
  
  
  
  
  var Status = window.Models.Status = Spine.Model.setup('Status', ['users', 'starttime', 'rss']);
  Status.include({
    
    userCount: function() {
      return this.users && this.users.length || 0;
    },
    
    uptime: function() {
      return $.relativeTime(this.starttime);
    },
    
    memory: function() {
      return this.rss && (this.rss/(1024*1024)).toFixed(1) || "??";
    }
    
  });
  Status.extend({
    
  });
  
});
