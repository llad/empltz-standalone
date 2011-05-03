

$(function(){


// plt Model
// ----------
window.Plt = Backbone.Model.extend({

    // Default attributes for the todo.
    defaults: {
        name: 'Empty plt',
        To: 'empty@no.email',
        Subject: 'Empty subject..',
        Body: 'Empty body'
    },

    // initize each plt
    initialize: function() {
        if (!this.get("name")) {
            this.set({"name": this.defaults.name});
            
        }
    },

    // Remove this from *localStorage* and delete its view.
    clear: function() {
        this.destroy();
        this.view.remove();
    }

});


// plt Collection
// ---------------

// The collection of plts is backed by *localStorage* instead of a remote
// server.
window.PltList = Backbone.Collection.extend({

  // Reference to this collection's model.
  model: Plt,

  // Save all of the plts items under the `"pltz"` namespace.
  localStorage: new Store("pltz"),
  

  // We keep the pltz in sequential order, despite being saved by unordered
  // GUID in the database. This generates the next order number for new items.
  nextOrder: function() {
    if (!this.length) return 1;
    return this.last().get('order') + 1;
  },

  // Todos are sorted by their original insertion order.
  comparator: function(plt) {
    return plt.get('order');
  }

});

// Create our global collection of **pltz**.
window.Pltz = new PltList;

// Todo Item View
// --------------

// The DOM element for a todo item...
window.PltView         = Backbone.View.extend({
    

    // Backbone view element definitions
    tagName:  "li",
    className: "plt",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
        "click .pltEdit"              : "edit"
        
    //    "click span.todo-destroy"   : "clear",
    //    "keypress .todo-input"      : "updateOnEnter"
    },

    // The TodoView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a **Todo** and a **TodoView** in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
        _.bindAll(this, 'render');
        this.model.view = this;
        //this.model.save({name: "hello"});
        //this.model.bind('change', this.render);
    },

    // TODO figure out why doing a listview refresh here doesn't actually refresh the list.
    render: function() {
        $(this.el).html(this.template(this.model.toJSON()));
        $('.ui-listview').listview('refresh');
        return this;
    },
    
    // I think I'm doing this in the template, so no here.
    // To avoid XSS (not that it would be harmful in this particular app),
    // we use `jQuery.text` to set the contents of the todo item.
    //setContent: function() {
    //    var content     = this.model.get('content');
    //    this.$('.todo-content').text(content);
    //},

    
    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
        $.mobile.changePage('edit','pop',false,false);
        var thisPlt = this.model;
        var plt = this.model.toJSON();
        jQuery.each(plt, function(k, v){
            if (k === 'type') {
                $('input[value="' + plt[k] + '"]').attr("checked",true);
            }
            else {
                var element = '#' + k;
                $(element).val(plt[k]);
            }
        });
        $("input[type='radio']").checkboxradio("refresh");
        
        
        $('form#edit').submit(function() {
                event.preventDefault();
                var fields = $(this).serializeArray();
                jQuery.each(fields, function(i, field){
                    var name = field.name;
                    plt[name] = field.value;
                });
                
                // TODO should I use save or not?
                thisPlt.save(plt);
                // TODO  we have a page refresh issue.
                $.mobile.changePage('list','pop',true,false);
                return false;
            });
    },

    // Close the `"editing"` mode, saving changes to the todo.
    close: function() {
        this.model.save({content: this.input.val()});
        $(this.el).removeClass("editing");
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
        if (e.keyCode == 13) this.close();
    },

    // Remove this view from the DOM.
    remove: function() {
        $(this.el).remove();
    },

    // Remove the item, destroy the model.
    clear: function() {
        this.model.clear();
    }

});


// The Application
  // ---------------

  // Our overall **AppView** is the top-level piece of UI.
  window.AppView = Backbone.View.extend({
    

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#list"),


    // At initialization we bind to the relevant events on the `Todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting todos that might be saved in *localStorage*.
    initialize: function() {
        
      _.bindAll(this, 'addOne', 'addAll', 'updateList');


      Pltz.bind('add',     this.addOne);
      Pltz.bind('refresh', this.addAll);
      Pltz.bind('change', this.updateList);

      Pltz.fetch();
      //Pltz.add([{name: 'hello'}]);

    },


    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(plt) {
      var view = new PltView({model: plt});
      this.$('#templateList').append(view.render().el);
    },

    // adds all on refresh or initial load
    addAll: function() {
      Pltz.each(this.addOne);
    },
    
    // if we change one, we have to re-write the list to get jQuery mobile to show correctly.
    // TODO look for cooler way to do this, see notes on rerender in PltView.
    updateList: function() {
        if ($('.ui-listview')[0]) {
            $('.ui-listview').children().remove();
        }
      Pltz.each(this.addOne);
      $('.ui-listview').listview('refresh');
    }

  });

  // Finally, we kick things off by creating the **App**.
  window.App = new AppView;

});
