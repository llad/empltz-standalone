// Note:  This borrows heavily from the example Todo app in Backbone.js source


$(function(){


    // plt Model
    // ----------
    window.Plt = Backbone.Model.extend({

        // Default attributes for the template (plt).
        defaults: {
            type: 'mailto',
            name: 'Empty plt'
            //to: '',
            //subject: '',
            //body: '',
        },

        // Remove this from *localStorage* and delete its view.
        clear: function() {
            this.destroy();
            this.view.remove();
        }

    });
    
    // options Model
    // ----------
    window.Options = Backbone.Model.extend({
        
        localStorage: new Store("empltzOptions"),

        // Default attributes for the template (plt).
        defaults: {
            sms: false
        }

    });
    
    // Create the user Options
    window.userOptions = new Options();



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

        // Plts are sorted by their original insertion order.
        comparator: function(plt) {
            return plt.get('order');
        }

    });

    // Create our global collection of **pltz**.
    window.Pltz = new PltList();


    // Item View
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
        
        // This creates the mailto or sms URL from the underlying attributes.
        // TODO not the most efficient place to put it, since we have to determine every time we display,
        // rather than just on updates.
        createURL: function() {
            plt = this.model.toJSON();
            if (!plt.to & !plt.subject & !plt.body) {
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
        
        render: function() {
            p = this.model.toJSON();
            p.url = this.createURL();
            $(this.el).html(this.template(p));
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
            "click #addButton"          : "addPlt",
            "click #optionsButton"      : "optionsForm"

        },

        initialize: function() {

            _.bindAll(this, 'addNew', 'addOne', 'addAll', 'updateList');


            Pltz.bind('add',    this.addNew);
            Pltz.bind('refresh', this.addAll);
            Pltz.bind('change', this.updateList);
            Pltz.bind('remove', this.updateList);

            Pltz.fetch();
            userOptions.fetch();
            console.log(userOptions);

        },

        // Add a single plt right before the ending list divider
        addOne: function(plt) {
            var view = new PltView({model: plt});
            this.$('#liend').before(view.render().el);
        },

        // adds all on refresh or initial load
        addAll: function() {
            Pltz.each(this.addOne);
            $('.ui-listview').listview('refresh');
        },
        
        addNew: function(plt) {
            this.addOne(plt);
            $('.ui-listview').listview();
            $('.ui-listview').listview('refresh');
            
        },

        updateList: function() {
            $('.ui-listview').listview('refresh');
        },
        
        
        // TODO have issue with list corners refreshing when deleting
        // trying to write something that will correct them after a removal
        //  this clears everything and re-writes, but can't get the swipe delete to bind
        // after that.
        // I don't use this since it doesn't work, just added list dividers around the list
        // and the corners are not an issue.
        updateRemoved: function() {
            if ($('.ui-listview')[0]) {
                   $('.ui-listview').children().remove();
            }
            this.trigger('refresh');
            $('.ui-page').trigger('pageshow');
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
        },
        
        optionsForm: function() {
            // start out making sure that submit is not bound from earlier calls.
            // Need to do this because you can close the dialog box without submitting.
            $('form#optionsForm').unbind('submit.options');
            opts = userOptions.toJSON();
            console.log(userOptions);
            console.log('isnew: ' + userOptions.isNew());
            _.each(opts, function(v, k){
                var smsSlider = $("select#slider");
                if (k === 'sms') {
                    
                    if (v) {
                        smsSlider[0].selectedIndex = 0;
                    }
                    else {
                        smsSlider[0].selectedIndex = 1;
                    }
                    smsSlider.slider();
                    smsSlider.slider("refresh");
                }
            });

            $('form#optionsForm').bind('submit.options', function(e) {
                var fields = $(this).serializeArray();
                _.each(fields, function(field, i){
                    var name = field.name;
                    userOptions.attributes[name] = (field.value === 'true');
                });
                console.log('isnew2: ' + userOptions.isNew());
                userOptions.save();
                console.log(userOptions);          
                $.mobile.changePage('list','pop',true);
                $('this').unbind('submit.options');
                return false;
            });
        }

    });

    // Deal with jQM issue of not deactivating buttons
    $('.ui-page').live('pagehide', function(){
        $('a[href="#"]').removeClass('ui-btn-active');
    });


    // Swipe to Delete
    // ---------------
    // Not a very 'Backbone' implementation but works.
    // There were many issues binding to particular page IDs or classes
    // but works if you use * or the jQM class for the page.
    // This was not an issue in the pre-Backbone implementation.
    $('.ui-page').live('pageshow',function(event, ui){

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
    
    //update any pre-Backbone plts
    (function updateOld() {
        if (!localStorage.versionEmpltz || localStorage.versionEmpltz === '0.8') {
            for (var j = 0; j < localStorage.length; j++) {
                var key = localStorage.key(j);

                if (key.indexOf('empltz.') !== -1) {
                    var p = {};
                    p = JSON.parse(localStorage.getItem(localStorage.key(j)));
                    if (p.type === undefined) {
                        p.type = 'mailto';
                    }
                    p.to = p.To;
                    delete p.To;
                    p.subject = p.Subject;
                    delete p.Subject;
                    p.body = p.Body;
                    delete p.Body;
                    p.order = Pltz.nextOrder();
                    Pltz.create(p);
                    localStorage.versionEmpltz = '0.9';
                }
            }
        }
    
    })(); 
    

    // Finally, we kick things off by creating the **App**.
    window.App = new AppView();

});
