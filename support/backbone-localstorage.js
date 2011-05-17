// A simple module to replace `Backbone.sync` with *localStorage*-based
// persistence. Models are given GUIDS, and saved into a JSON object. Simple
// as that.

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
        console.log('save');
        console.log(JSON.stringify(this.data));
        localStorage.setItem(this.name, JSON.stringify(this.data));
    },

    // Add a model, giving it a (hopefully)-unique GUID, if it doesn't already
    // have an id of it's own.
    create: function(model,type) {
        console.log('create');
        if (!model.id) model.id = model.attributes.id = guid();
        if (type === 'aModel') {
            console.log('modelID ' + model.id);
            console.log(this.data);
            this.data = model.toJSON();
        }
        else {
            this.data[model.id] = model;
        }
        this.save();
        return model;
    },

    // Update a model by replacing its copy in `this.data`.
    update: function(model, type) {
        if (type === 'aModel') {
            console.log('update');
            console.log('model');
            this.data = model;
        }
        else {
            this.data[model.id] = model;
        }
        this.save();
        return model;
    },

    // Retrieve a model from `this.data` by id.
    find: function(model,type) {
        console.log('find');
        if (type === 'aModel') {
            return this.data;
        }
        return this.data[model.id];
        
    },

    // Return the array of all models currently in storage.
    findAll: function() {
        console.log('findAll');
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
    var type;
    var modelID;
    
    if (!model.collection) {
        type = 'aModel';
        modelID = model.id;
    } else {
        type = 'aCollection';
        modelID = model.id;
    }
    
    console.log(method);
    console.log(model);
    console.log(model.id);
    
    

    switch (method) {
        case "read":    resp = model.id ? store.find(model,type) : store.findAll(); break;
        case "create":  resp = store.create(model,type);                            break;
        case "update":  resp = store.update(model,type);                            break;
        case "delete":  resp = store.destroy(model);                           break;
    }

    if (resp) {
        success(resp);
    } else {
        error("Record not found");
    }
};