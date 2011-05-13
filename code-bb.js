// Note:  This borrows heavily from the example Todo app in Backbone.js source


$(function(){


    // plt Model
    // ----------
    window.Plt = Backbone.Model.extend({
        
        // This creates the mailto or sms URL from the underlying attributes.
        createURL: function() {
            plt = this.toJSON();
            if (!plt.to || !plt.subject || !plt.body) {
                return 'mailto:empltz@onmachine.org';
            }
            var url = "";
            if (plt.type === 'sms') {
                url += plt.type + ':' + plt.to + '?';
            }
            else {
                url += plt.type + ':' + plt.to + '?' +
                'subject=' + plt.subject + '&';
            }
            url += 'body=' + plt.body;
            
            return encodeURI(url);
        },

        // Default attributes for the todo.
        defaults: {
            type: 'mailto',
            name: 'Empty plt',
            to: '',
            subject: '',
            body: '',
            url:this.createURL
        },

        // initize each plt with some defaults.
        // TODO actually check each attribute in defaults and set it if 
        initialize: function() {
            ds = this.defaults;
            for (var k in ds) {
                if (!this.get(k)) {
                    obj = {};
                    obj[k] = ds[k];
                    this.set(obj);
                }                
            }

        },
        

        
        // parse is called by Backbone before saving, so seems like a good time to add
        // in the mailto URL for the plt.  However, it is also called before fetching
        // which we don't really need since it was saved.  Might look at changing this.
        parse: function(response) {
            response.set({url: this.createURL(), silent: true});
            return response;
        },

        // Remove this from *localStorage* and delete its view.
        clear: function() {
            this.destroy();
            this.view.remove();
        }

    });


    // plt Collection
    // ---------------

    // The collection of items is backed by *localStorage* instead of a remote
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

    window.PltView         = Backbone.View.extend({


        // Backbone view element definitions
        tagName:  "li",
        className: "plt",

        // Cache the template function for a single item.
        template: _.template($('#item-template').html()),

        // The DOM events specific to an item.
        events: {
            "click .pltEdit"              : "editForm"
        },


        initialize: function() {
            
            _.bindAll(this, 'changeRender', 'render');
            
            // Any changes (edits) to an item need to be re-rendered with a special function
            this.model.bind('change', this.changeRender);
            
            // Set this view as the view for the model
            this.model.view = this;
        },
        
        render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            return this;
        },
        
        
        // On edit have to remove all the jQM classes or jQM won't know that it needs
        // to be refreshed in listview('refresh')
        changeRender: function() {
            $(this.el).removeAttr('class').addClass('plt');
            this.render();
            return this;
        },

        // This supports the edit form
        editForm: function() {
            // start out making sure that submit is not bound from earlier calls.
            // Need to do this because you can close the dialog box without submitting.
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
                    // Add the order
                    plt.order = Pltz.nextOrder();
                    
                    // Create the new plt
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
