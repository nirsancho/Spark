var app = (function($, app, console, document) {
    app = app || {};
    app.items = app.items || {};

    var items = app.items;

    items.create = function(data, onDone) {
        data.action = "create";
        return app.service("items", data, onDone);
    };

    items.modify = function(data, onDone) {
        data.action = "modify";
        return app.service("items", data, onDone);
    };

    items.remove = function(idItem, onDone) {
        var data = {
            idItem: idItem,
            action: "remove"
        };

        return app.service("items", data, onDone);
    };

    items.get = function(idItem, onDone) {
        // idClient can be ""
        var data = {
            idItem: idItem,
            action: "get"
        };

        return app.service("items", data, onDone);
    };


    items.Model = function(item) {
        var self = this;
        item = item || {};
        self.name = ko.observable(item.name || "");
        self.idItem = ko.observable(item.idItem || "");
        self.description = ko.observable(item.description || "");
        self.quantity = ko.observable(1);
        self.price = ko.observable(parseFloat(item.price) || 0);
        self.subtotal = ko.computed(function() {
            return self.price ? self.price() * parseInt("0" + self.quantity(), 10) : 0;
        });

        self.remove = function(item) {
            var buttons = {};
            buttons[app.translate("items-remove-popup-delete")] = {
                click: function() {
                    var idItem = item.idItem() || "";
                    if (idItem.length > 0) {
                        app.items.remove(idItem, function(res) {
                            if (res.hasOwnProperty("error") && res.error === false) {
                                history.back();
                            }
                        });
                    }
                },
                icon: "delete",
                iconpos: "right",
                theme: "a"
            };

            buttons[app.translate("items-remove-popup-cancel")] = {
                click: function() {

                },
                icon: "back",
                iconpos: "right",
                theme: "c"
            };

            $('<div>').simpledialog2({
                mode: 'button',
                headerText: app.translate("items-remove-popup-header"),
                headerClose: true,
                buttonPrompt: app.translate("items-remove-popup-content"),
                themeDialog: "c",
                themeHeader: "e",
                buttons : buttons
            });


        };

        self.save = function() {
            var data = JSON.parse(ko.toJSON(self));

            if (data.idItem === "") {
                app.items.create(data, function(res) {
                    if (res.hasOwnProperty("error") && res.error === false) {
                        history.back();
                    }
                });
            } else {
                app.items.modify(data, function(res) {
                    if (res.hasOwnProperty("error") && res.error === false) {
                        history.back();
                    }
                });
            }
        };
    };



    items.CollectionModel = function(itemCollection) {
        var self = this;
        itemCollection = itemCollection || [];

        self.update = function(itemCollection) {
            app.utils.koUpdateOrCreateObservableArray(self, "items", itemCollection, function(item) {
                return new app.items.Model(item);
            });
        };


        self.selectedItem = new app.items.Model({});

        self.afterRender = function(elements) {
        //            $(elements).trigger("create");
        };

        self.create = function() {
            self.edit(new app.items.Model());
        };

        self.edit = function(data) {
            self.selectedItem.idItem(data.idItem());
            self.selectedItem.name(data.name());
            self.selectedItem.description(data.description());
            self.selectedItem.price(data.price());

            $.mobile.changePage("items-edit.html");
        };

        self.update(itemCollection);
    };

    return app;
}($, app, console, document));
