

$(function(){


// plt Model
// ----------
window.Plt = Backbone.Model.extend({

    // Default attributes for the todo.
    defaults: {
        name: 'Empty plt',
        to: 'empty@no.email',
        subject: 'Empty subject..',
        body: 'Empty body'
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
window.Pltz = new PltList();

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
    },

    // The TodoView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a **Todo** and a **TodoView** in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
        _.bindAll(this, 'render');
        this.model.view = this;
        this.model.bind('change', this.render);
    },

    render: function() {
        $(this.el).removeAttr('class').addClass('plt');
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
    },
    

    edit: function() {
        $('form#editForm').unbind('submit.edit');
        thisPlt = this.model;
        var plt = thisPlt.toJSON();
        _.each(plt, function(v, k){
             if (k === 'type') {
                $('form#editForm input[value="' + plt[k] + '"]')
                .attr("checked",true);
            }
            else {
                var element = '#' + k;
                $(element).val(plt[k]);
            }
        });
        $("form#editForm input[type='radio']").checkboxradio();
        $("form#editForm input[type='radio']").checkboxradio("refresh");
        
        
        $('form#editForm').bind('submit.edit', function(e) {
                var fields = $(this).serializeArray();
                _.each(fields, function(field, i){
                    var name = field.name;
                    plt[name] = field.value;
                });
                thisPlt.save(plt);
                $.mobile.changePage('list','pop',true);
                $('this').unbind('submit.edit');
                return false;
            });
    },

    // Remove this view from the DOM.
    remove: function() {
        $(this.el).remove();
        Pltz.trigger('change');
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

    events: {
        "click #addButton"          : "addPlt"
    
    },

    // At initialization we bind to the relevant events on the `Todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting todos that might be saved in *localStorage*.
    initialize: function() {
        
      _.bindAll(this, 'addOne', 'addAll', 'updateList');


      Pltz.bind('add',    this.addOne);
      Pltz.bind('refresh', this.addAll);
      Pltz.bind('change', this.updateList);

      Pltz.fetch();

    },

    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(plt) {
      var view = new PltView({model: plt});
      this.$('#templateList').append(view.render().el);
      $('.ui-listview').listview('refresh');
    },

    // adds all on refresh or initial load
    addAll: function() {
      Pltz.each(this.addOne);
    },
    

    updateList: function() {
        //if ($('.ui-listview')[0]) {
        //    $('.ui-listview').children().remove();
        //}
        
        //Pltz.each(this.addOne);
        $('.ui-listview').listview('refresh');
    },
    
    addPlt: function() {
        var $addform = $('form#addForm');
        $addform.unbind('submit.add');
        $addform[0].reset();
        $('form#addForm input[value="mailto"]').attr("checked",true);
        $("form#addForm input[type='radio']").checkboxradio();
        $("form#addForm input[type='radio']").checkboxradio("refresh");
        $addform.bind('submit.add', function(e) {
            e.preventDefault();
            var plt = {};
            var fields = $(this).serializeArray();
            _.each(fields, function(field, i){
                var name = field.name;
                plt[name] = field.value;
            });
            Pltz.create(plt);
            $.mobile.changePage('list','pop',true);
            return false;
        });
    }

  });

    // Deal with jQM issue of not deactivating buttons
    $('*').live('pagehide', function(){
        $('a[href="#"]').removeClass('ui-btn-active');
    });
    
    
    // Swipe to Delete
    // Not a very 'Backbone' implementation but works
    $('.swipedelete').live('pageshow',function(event, ui){
        console.log('pageshow');
        // Trigger a change to refresh page because swiping won't
        // work after opening and closing a dialog (add or edit).
        // TODO figure out a better way.
        //Pltz.trigger('change');
        
        $('.plt').bind('swipe', function(e){
            var $plt = $(this);
            var id = $plt.find('a.pltLink').attr('id');
            
            // if there are 
            if (!$plt.children('.aDeleteBtn')[0]) {
                $('.swipedelete').bind('click.delete', function(e){
                    $('.aDeleteBtn').remove();
                    $('.swipedelete').unbind('click.delete');
                    return false;
                });
                
                $('.aDeleteBtn').remove();
                var $aDeleteBtn = $('<a>Delete</a>')
                    .attr({
                    'class': 'aDeleteBtn ui-btn-up-r',
                    'id': $plt.attr('id')
                });
                $plt.prepend($aDeleteBtn);
                $('.aDeleteBtn').bind('click.delButton', function (e) {
                    e.preventDefault();
                    var modelToDel = Pltz.get(id);
                    modelToDel.clear();
                });
            }    
            else {
                $('.aDeleteBtn').remove();
                $('.swipedelete').unbind('click.delete');

            }
        });
    });

    // Finally, we kick things off by creating the **App**.
    window.App = new AppView();

});
