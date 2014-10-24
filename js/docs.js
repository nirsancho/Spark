var app = (function($, app, console, document) {
    app = app || {};
    app.docs = app.docs || {};

    var docs = app.docs;

    docs.Model = function(doc) {
        var self = this;

        self.filterClients = function(data) {
            $("#client-list li").hide();
            if (data !== "") {
                var $li = $("#client-list li:contains(" + data + ")");
                if ($li.length > 0) {
                    $li.show();
                    $("#client-list-wrapper").show("slide");
                } else {
                    $("#client-list-wrapper").hide("slide");
                }
            } else {
                $("#client-list-wrapper").hide("slide");
            }
        };

        self.update = function(doc)
        {
            doc = doc || {};
            var docItems;
            var payments;

            if (typeof doc.docItems === 'function') {
                docItems = doc.docItems();
            } else {
                docItems = JSON.parse(doc.items || "[]");
            }

            if (app.utils.koUpdateOrCreateObservableArray(self, "docItems", docItems, function(item) {
                return new app.items.Model(item);
            })) {
                app.utils.indexSubscribe(self.docItems);
            }

            payments = JSON.parse(doc.payments || "[]");
            if (app.utils.koUpdateOrCreateObservableArray(self, "payments", payments, function(payment) {
                return new docs.PaymentModel(payment);
            })) {

            }


            app.utils.koUpdateOrCreateObservable(self, "idDoc", doc.idDoc || "");
            app.utils.koUpdateOrCreateObservable(self, "docNum", doc.docNum || parseInt(app.vars.settings.financeDocCounter()));
            app.utils.koUpdateOrCreateObservable(self, "status", doc.status || "new");
            app.utils.koUpdateOrCreateObservable(self, "emissionDate", doc.emissionDate || app.utils.formatDate(new Date(), true));


            if (app.utils.koUpdateOrCreateObservable(self, "clientName", self.clientsModel.selectedClient.name() || "")) {
                self.clientName.subscribe(self.filterClients);
            }
        };


        //        items = items || [];
        //        self.docItems = ko.observableArray();
        self.selectedItem = new app.items.Model({});
        self.clientsModel = app.vars.clients;
        self.update(doc);


        //        self.idDoc = ko.observable("");
        //        self.docNum = ko.observable();

        //        app.utils.indexSubscribe(self.docItems);

        self.grandTotal = ko.computed(function() {
            var total = 0;
            $.each(self.docItems(), function() {
                total += this.subtotal();
            });
            return total;
        });

        self.grandTotalWithVat = ko.computed(function() {
            var val;
            if (app.vars.settings.financeAddVat === "yes") {
                val = self.grandTotal() * (1 + app.vars.settings.financeVatValue() / 100);
            } else {
                val = self.grandTotal();
            }

            if (self.payments().length > 0) {
                var payment = self.payments()[0];
                payment.amount(val);
            }

            return val;
        });

        self.afterRender = function(elements) {
            if (app.manualEnhace) {
                $(elements).trigger("create");
            }
        };

        self.itemListShow = function(docItem) {
            var index = docItem.index() - 1;
            var $scope = $("[data-name='divDocItem'][data-index='" + index + "']");
            var $divWrapper = $('[data-name="item-list-wrapper"]', $scope);
            var $li = $("[data-name='item-list'] > li", $scope);

            //            $("[data-name='docItemName']",$scope).val("*");
            $li.show();
            $divWrapper.show("slide");
        };

        self.filterItems = function(data, thisDocItem) {
            var index = thisDocItem.index() - 1;
            var $scope = $("[data-name='divDocItem'][data-index='" + index + "']");
            var $li = $("[data-name='item-list'] > li", $scope);
            var $divWrapper = $('[data-name="item-list-wrapper"]', $scope);
            $li.hide();
            if (data !== "") {
                var dataToFilter = data === "*" ? "" : data;
                var $filtered_li = $("li:contains(" + dataToFilter + ")", $divWrapper);
                if ($filtered_li.length > 0) {
                    $filtered_li.show();
                    $($divWrapper).show("slide");
                } else {
                    $($divWrapper).hide("slide");
                }
            } else {
                $($divWrapper).hide("slide");
            }
        };

        self.add = function() {
            var docItem = new app.items.Model();
            var filterFunction = (function(thisDocItem) {
                return function(data) {
                    self.filterItems(data, thisDocItem);
                };
            }(docItem));

            docItem.name.subscribe(filterFunction);
            app.manualEnhace = true;
            self.docItems.push(docItem);
            app.manualEnhace = false;

        };

        self.remove = function(item) {
            self.docItems.remove(item);
            if (self.docItems().length === 0) {
                self.add();
            }
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


        self.clientCreate = function() {
            var userInput = self.clientName();
            var client = new app.clients.Model();

            if (parseInt(userInput) > 0) {
                client.phones.push({
                    phone: userInput,
                    type: ""
                });
            } else {
                client.name(userInput);
            }

            app.vars.clients.edit(client, undefined, "doc-editor");
        };

        self.clientEdit = function() {
            app.vars.clients.edit(self.clientsModel.selectedClient, undefined, "doc-editor");
        };

        self.clientCreateOrEdit = function() {
            if (self.clientsModel.selectedClient.idClient().length > 0 &&
                    self.clientsModel.selectedClient.name() == self.clientName()) {
                self.clientEdit();
            } else {
                self.clientCreate();
            }
        };

        self.selectClient = function(data) {
            self.clientsModel.selectClient(data, "doc-editor");
            self.clientName(self.clientsModel.selectedClient.name());
            $("#client-list-wrapper").hide();
        };

        self.selectItem = function(docItem, selectedItem) {
            docItem.idItem(selectedItem.idItem());
            docItem.name(selectedItem.name());
            docItem.price(selectedItem.price());
            $('[data-name="item-list-wrapper"]').hide();
        };

        self.save = function() {
            var data = {};
            data.idDoc = self.idDoc();
            data.docNum = self.docNum();
            data.status = self.status();
            data.emissionDate = self.emissionDate();
            data.payments = JSON.parse(ko.toJSON(self.payments()));

            data.client = self.clientsModel.selectedClient.toJS();

            data.totalNoVat = self.grandTotal();
            data.total = self.grandTotalWithVat();
            data.items = JSON.parse(ko.toJSON(self.docItems));

            if (data.idDoc === "") {
                app.docs.create(data, function(res) {
                    if (res.hasOwnProperty("error") && res.error === false) {
                        self.idDoc(res.idDoc);
                        app.vars.settings.financeDocCounter(1 + parseInt(app.vars.settings.financeDocCounter()));
                        app.vars.settings.save("");
                        if (self.validate()) {
                            docs.makePdf(self.idDoc());
                            $.mobile.changePage("docs-send.html");
                        }
                    }
                });
            } else {
                app.docs.modify(data, function(res) {
                    if (res.hasOwnProperty("error") && res.error === false) {
                        if (self.validate()) {
                            docs.makePdf(self.idDoc());
                            $.mobile.changePage("docs-send.html");
                        }
                    }
                });
            }
        };

        self.validate = function() {
            var errors = [], error_text = "";
            var no_email = false;
            var grandTotal = self.grandTotalWithVat();

            if (self.clientsModel.selectedClient.name() === "") {
                errors.push("validation-client-no-name");
            }

            if (self.clientsModel.selectedClient.emails().length === 0
                    || self.clientsModel.selectedClient.emails()[0].email === "") {
                no_email = true;
            }

            if (no_email && (self.clientsModel.selectedClient.phones().length === 0
                    || self.clientsModel.selectedClient.phones()[0].phone === "")) {
                errors.push("validation-client-no-contact");
            }

            ko.utils.arrayForEach(self.payments(), function(payment) {
                grandTotal -= payment.amount();
            });
            if (grandTotal > 0) {
                error_text = "<strong>" + app.utils.formatCurrency(grandTotal) + "</strong> " +
                        app.translate("validation-total-is-more-than-payed");
            } else if (grandTotal < 0) {
                error_text = "<strong>" + app.utils.formatCurrency(-grandTotal) + "</strong> " +
                        app.translate("validation-total-is-less-than-payed");
            }

            if (errors.length > 0) {
                var text = [];
                $(errors).each(function() {
                    text.push($("<li></li>").text(app.translate(this)));
                });
                $("#popupClientValidationContent").empty();
                $("#popupClientValidationContent").append(text);
                $("#popupClientValidation").popup("open");

                return false;
            } else if (grandTotal !== 0) {
                error_text += ". " + app.translate("validation-total-review");
                app.error(error_text, {
                    timeout: -1
                }, {back: {text: app.translate("general-back"),
                        click: function() {
                            return true;
                        }, icon: "back", iconpos: "right"
                    }});

                return false;
            } else {
                return true;
            }
        };

        self.send = function(data) {
            //            $.mobile.changePage("app-home.html");

            $("#before-send").hide();
            $("#after-send").show();
            $("#cmdBack").hide();

            app.docs.modify({
                idDoc: self.idDoc(),
                status: "sent"
            }, function() {
                if (data.hasOwnProperty("email")) {

                } else if (data.hasOwnProperty("phone")) {
                    var link = 'sms:' + data.phone + '?body=שמחנו לתת שירות. ' + app.url + 'data/docs/' + self.idDoc() + '.pdf';
                    window.location = link;
                }
            });
        };

        self.paymentAdd = function(payment) {
            app.manualEnhace = true;
            self.payments.push(new docs.PaymentModel(payment));
            app.manualEnhace = false;
        };

        self.paymentRemove = function(payment) {
            self.payments.remove(payment);
            if (self.payments().length === 0) {
                self.paymentAdd();
            }
        };

        if (self.idDoc() === "") {
            self.add();
            self.paymentAdd();
        }

    };

    docs.PaymentModel = function(payment) {
        var self = this;
        payment = payment || [];

        self.update = function(payment) {
            app.utils.koUpdateOrCreateObservable(self, "type", payment.type || "cash");
            app.utils.koUpdateOrCreateObservable(self, "amount", payment.amount || 0);
            app.utils.koUpdateOrCreateObservable(self, "checkNum", payment.checkNum || "");
            app.utils.koUpdateOrCreateObservable(self, "checkBank", payment.checkBank || "");
            app.utils.koUpdateOrCreateObservable(self, "checkDate", payment.checkDate || "");
            app.utils.koUpdateOrCreateObservable(self, "cardType", payment.cardType || "");
            app.utils.koUpdateOrCreateObservable(self, "cardDate", payment.cardDate || "");
            app.utils.koUpdateOrCreateObservable(self, "cardNum", payment.cardNum || "");
            app.utils.koUpdateOrCreateObservable(self, "bankAccount", payment.bankAccount || "");
            app.utils.koUpdateOrCreateObservable(self, "bankBranch", payment.bankBranch || "");
        };

        self.update(payment);
    };

    docs.CollectionModel = function(docCollection) {
        var self = this;
        docCollection = docCollection || [];

        self.update = function(docCollection) {
            app.utils.koUpdateOrCreateObservableArray(self, "docs", docCollection, function(doc) {
                doc.client = JSON.parse(doc.client);
                return doc;
            });
        };

        self.selectedDoc = new app.docs.Model({});

        self.create = function() {
            self.edit(new app.docs.Model());
        };

        self.edit = function(doc, event, origen) {
            //            app.refreshData = false;

            if (doc.client !== undefined) {
                app.vars.clients.selectedClient = new app.clients.Model(doc.client);
            }
            self.selectedDoc.update(doc);
            $.mobile.changePage("docs-new.html");

        };

        self.update(docCollection);
    };

    docs.create = function(data, onDone) {
        data.action = "create";
        return app.service("docs", data, onDone);
    };

    docs.modify = function(data, onDone) {
        data.action = "modify";
        return app.service("docs", data, onDone);
    };

    docs.remove = function(idItem, onDone) {
        var data = {
            idItem: idItem,
            action: "remove"
        };

        return app.service("docs", data, onDone);
    };

    docs.get = function(idDoc, onDone) {
        var data = {
            idItem: idDoc,
            action: "get"
        };

        return app.service("docs", data, onDone);
    };

    docs.makePdf = function(idDoc, onDone) {
        var data = {
            idDoc: idDoc
        };

        return app.service("docs-make-pdf", data, onDone);
    }

    return app;
}($, app, console, document));
