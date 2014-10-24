var app = (function($, app, console, document) {
    app = app || {};
    app.clients = app.clients || {};

    var clients = app.clients;

    clients.Model = function(client) {
        var self = this;
        client = client || {};
        self.idClient = ko.observable(client.idClient || "");
        self.name = ko.observable(client.name || "");
        self.emails = ko.observableArray(JSON.parse(client.emails || "[]"));
        self.phones = ko.observableArray(JSON.parse(client.phones || "[]"));
        self.addresses = ko.observableArray(JSON.parse(client.addresses || "[]"));
        self.origen = ko.observable(client.origen || "app");
        self.editOrigen = "client-editor";

        self.contactData = ko.computed(function() {
            var contactData = "";

            $(self.emails()).each(function(i, item) {
                contactData += item.email + " ";
            });

            $(self.phones()).each(function(i, item) {
                contactData += item.phone + " ";
            });

            return contactData;
        });

        self.addField = function(type, data) {
            var types = type === "address" ? "addresses" : type + "s";
            var newElement = {};
            newElement.type = "";
            newElement[type] = "";
            self[types].push(newElement);
        };

        self.removeField = function(type, data) {
            var types = type === "address" ? "addresses" : type + "s";
            self[types].remove(data);
            if (self[types]().length === 0) {
                self.addField(type);
            }
        };

        self.toJS = function() {
            var data = JSON.parse(ko.toJSON(self));
            data.emails = JSON.stringify(data.emails);
            data.phones = JSON.stringify(data.phones);
            data.addresses = JSON.stringify(data.addresses);
            return data;
        };

        self.save = function() {
            var data = self.toJS();

            if (data.idClient === "") {
                app.clients.create(data, function(res) {
                    if (res.hasOwnProperty("error") && res.error === false) {
                        self.idClient(res.idClient);
                        history.back();
                    }
                });
            } else {
                app.clients.modify(data, function(res) {
                    if (res.hasOwnProperty("error") && res.error === false) {
                        history.back();
                    }
                });
            }
        };

        self.remove = function(client) {
            var buttons = {};
            buttons[app.translate("clients-remove-popup-delete")] = {
                click: function() {
                    var idClient = client.idClient() || "";
                    if (idClient.length > 0) {
                        app.clients.remove(idClient, function(res) {
                            if (res.hasOwnProperty("error") && res.error === false) {
                                self.idClient("");
                                history.back();
                            }
                        });
                    }
                },
                icon: "delete",
                iconpos: "right",
                theme: "a"
            };

            buttons[app.translate("clients-remove-popup-cancel")] = {
                click: function() {

                },
                icon: "back",
                iconpos: "right",
                theme: "c"
            };

            $('<div>').simpledialog2({
                mode: 'button',
                headerText: app.translate("clients-remove-popup-header"),
                headerClose: true,
                buttonPrompt: app.translate("clients-remove-popup-content"),
                themeDialog: "c",
                themeHeader: "e",
                buttons : buttons
            });

        };
    };

    clients.CollectionModel = function(clientCollection) {
        var self = this;

        self.update = function(clientCollection) {
            app.utils.koUpdateOrCreateObservableArray(self, "clients", clientCollection, function(client) {
                return new app.clients.Model(client);
            });
        };

        self.selectedClient = new clients.Model({});
        self.fieldTypes = ko.observableArray([app.text.he["general-field-types-work"],
            app.text.he["general-field-types-home"],
            app.text.he["general-field-types-other"]]);

        self.selectClient = function(client, origen) {
            self.selectedClient.editOrigen = origen || "client-editor";

            self.selectedClient.idClient(client.idClient());
            self.selectedClient.name(client.name());
            self.selectedClient.emails(client.emails.slice(0));
            self.selectedClient.phones(client.phones.slice(0));
            self.selectedClient.addresses(client.addresses.slice(0));
            self.selectedClient.origen(client.origen());
        };

        self.edit = function(data, event, origen) {
            //            if (origen == "doc-editor") {
            //                app.refreshData = false;
            //            } else {
            //                app.refreshData = true;
            //            }

            self.selectClient(data, origen);

            if (self.selectedClient.emails().length === 0)
                self.selectedClient.addField("email");
            if (self.selectedClient.phones().length === 0)
                self.selectedClient.addField("phone");
            if (self.selectedClient.addresses().length === 0)
                self.selectedClient.addField("address");

            $.mobile.changePage("clients-edit.html");

        };


        self.create = function() {
            self.edit(new clients.Model());
        };

        self.afterRender = function(elements) {
            $(elements).trigger("create");
        };

        self.getFromContacts = function(){
            if (app.isPhonegap) {
                navigator.contacts.find(["*"], function(contacts){
                    app.error(JSON.serialize(contacts));
                }, function(error){
                    app.error(error);
                }, {});
            }
        };

        self.update(clientCollection);
        return this;
    };

    clients.create = function(data, onDone) {
        /* var data = {
         name: name,
         emails: emails,
         phones: phones,
         addresses: addresses,
         action: "create"
         };
         */
        data.action = "create";
        return app.service("clients", data, onDone);
    };

    clients.modify = function(data, onDone) {
        data.action = "modify";
        return app.service("clients", data, onDone);
    };

    clients.remove = function(idClient, onDone) {
        var data = {
            idClient: idClient,
            action: "remove"
        };

        return app.service("clients", data, onDone);
    };

    clients.get = function(idClient, onDone) {
        // idClient can be ""
        var data = {
            idClient: idClient
        };

        return app.service("clients_get", data, onDone);
    };

    return app;
}($, app, console, document));
