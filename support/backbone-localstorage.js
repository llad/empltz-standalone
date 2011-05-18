// Thanks to the backbone example TODO app.

// A simple module to replace `Backbone.sync` with *localStorage*-based
// persistence. Models are given GUIDS, and saved into a JSON object.
// Modified from the example to handle models independent from collections.


// Generate four random hex digits.
function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

// Generate a pseudo-GUID by concatenating random hexadecimal.
function guid() {
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

// Our Store is represented by a single JS object in *localStorage*. Create it
// with a meaningful name, like the name you'd give a table.
var Store = function(name) {
    this.name = name;
    var store = localStorage.getItem(this.name);
    this.data = (store && JSON.parse(store)) || {};
};

_.extend(Store.prototype, {

    // Save the current state of the **Store** to *localStorage*.
    save: function() {
        localStorage.setItem(this.name, JSON.stringify(this.data));
    },

    // Add a model, giving it a (hopefully)-unique GUID, if it doesn't already
    // have an id of it's own.
    create: function(model) {
        if (!model.id) model.id = model.attributes.id = guid();
        if (model.collection) {
            this.data[model.id] = model;
        }
        else {
            this.data = model.toJSON();
        }
        this.save();
        return model;
    },

    // Update a model by replacing its copy in `this.data`.
    update: function(model, type) {
        if (model.collection) {
            this.data[model.id] = model;
        }
        else {
            this.data = model;
        }
        this.save();
        return model;
    },

    // Retrieve a model from `this.data` by id.
    find: function(model,type) {
        if (model.collection) {
            return this.data[model.id];
        }
        return this.data;
        
    },

    // Return the array of all models currently in storage.
    findAll: function() {
        return _.values(this.data);
    },

    // Delete a model from `this.data`, returning it.
    destroy: function(model) {
        delete this.data[model.id];
        this.save();
        return model;
    }

});

// Override `Backbone.sync` to use delegate to the model or collection's
// *localStorage* property, which should be an instance of `Store`.
Backbone.sync = function(method, model, success, error) {

    var resp;
    var store = model.localStorage || model.collection.localStorage;
    var collectionType = false;

    
    if (model.collection || model.models) {
        collectionType = true;
    }
    
    switch (method) {
        case "read":    resp = collectionType ? store.findAll() : store.find(model); break;
        case "create":  resp = store.create(model);                            break;
        case "update":  resp = store.update(model);                            break;
        case "delete":  resp = store.destroy(model);                           break;
    }

    if (resp) {
        success(resp);
    } else {
        error("Record not found");
    }
};