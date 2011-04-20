$(function($){
  
  var Message = window.Message = Spine.Model.setup('Message', []);
  
  //Message.extend(Spine.Model.Local);
  
  Message.extend({
    
  });
  
  
  
  
  
  window.Messages = Spine.Controller.create({
    
    init: function() {
    
    }
    
  });
  
  
  
  
  
  window.App = Spine.Controller.create({
    el: $('body'),
    
    events: {
      
    },
    
    elements: {
      
    },
    
    init: function() {
      
    }
    
  }).inst();
  
  
});