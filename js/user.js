var app = (function($, app, console, document) {
    app = app || {};
    app.user = app.user || {};

    app.user.idUser = "";
    app.user.authToken = "";

    app.user.SettingsModel = function(settings) {
        var self = this;

        self.save = function(nextPage) {
            var settings = JSON.parse(ko.toJSON(self));
            if (nextPage === "home") {
                onDone = function() {
                    $.mobile.changePage("app-home.html");
                };
            } else {
                onDone = function() {
                };
            }
            app.user.saveSettings(settings, onDone);
        };

        self.update = function(settings) {
            settings = settings || {};
            if (settings === false) {
                settings = {};
            }

            app.utils.koUpdateOrCreateObservable(self, "accountName", settings.accountName || "");
            app.utils.koUpdateOrCreateObservable(self, "accountEmail", settings.accountEmail || "");
            app.utils.koUpdateOrCreateObservable(self, "accountPhone", settings.accountPhone || "");
            app.utils.koUpdateOrCreateObservable(self, "accountPassword", settings.accountPassword || "");

            app.utils.koUpdateOrCreateObservable(self, "businessName", settings.businessName || "");
            app.utils.koUpdateOrCreateObservable(self, "businessDesc", settings.businessDesc || "");
            app.utils.koUpdateOrCreateObservable(self, "businessPhone", settings.businessPhone || "");
            app.utils.koUpdateOrCreateObservable(self, "businessFax", settings.businessFax || "");
            app.utils.koUpdateOrCreateObservable(self, "businessEmail", settings.businessEmail || "");
            app.utils.koUpdateOrCreateObservable(self, "businessAddress", settings.businessAddress || "");
            app.utils.koUpdateOrCreateObservable(self, "businessPhoto", settings.businessPhoto || "");
            app.utils.koUpdateOrCreateObservable(self, "businessCategory", settings.businessCategory || "");

            app.utils.koUpdateOrCreateObservable(self, "financeDocCounter", settings.financeDocCounter || 1);
            app.utils.koUpdateOrCreateObservable(self, "financeAddVat", settings.financeAddVat || "no");
            app.utils.koUpdateOrCreateObservable(self, "financeVatValue",settings.financeVatValue || 18);

        };

        self.signup = function() {
            app.user.create(self.accountEmail(), self.accountPhone(), app.deviceInfo, self.accountPassword(), function(res) {
                if (res.hasOwnProperty("error") && res.error === false) {
                    app.log("singup successfully");
                    $("#step1").slideUp();
                    $("#step2").slideDown();
                    app.storage.set("firstTime", false);
                } else {
                    app.error("Error user create: " + res.error_msg);
                }
            });
        };

        self.signin = function() {
            app.user.login(self.accountEmail(), self.accountPassword(), "", function(res) {
                if (res.hasOwnProperty("error") && res.error === false) {
                    app.log("Logged in successfully");
                    app.vars.settings.update(res.settings);
                    app.storage.set("firstTime", false);
                    $.mobile.changePage("app-home.html");
                } else {
                    app.error("Error logging in: " + res.error_msg);
                }
            });
        };

        self.logout = function() {
            app.user.logout(function(res) {
                if (res.hasOwnProperty("error") && res.error === false) {
                    $.mobile.changePage("app-welcome.html");
                }
            });
        };

        self.update(settings);
    };

    app.user.saveSettings = function(settings, onDone) {
        var data = {
            action: "saveSettings",
            settings: settings
        };

        return app.service("user", data, onDone);
    };

    app.user.create = function(email, phone, device, password, onDone) {
        var data = {
            action: "create",
            email: email,
            phone: phone,
            device: device,
            password: password
        };

        var onSuccess;
        if (typeof onDone === "function") {
            onSuccess = function(response) {
                app.user.idUser = response.idUser;
                app.user.authToken = response.token;
                app.storage.set("authToken", app.user.authToken);

                onDone(response);
            };
        } else {
            onSuccess = onDone;
        }

        return app.service("user", data, onSuccess);
    };

    app.user.login = function(email, password, token, onDone) {
        var data = {
            action: "login",
            email: email,
            password: password,
            token: token
        };

        var onSuccess;
        if (typeof onDone === "function") {
            onSuccess = function(response) {
                app.user.idUser = response.idUser;
                app.user.authToken = response.token;
                app.storage.set("authToken", app.user.authToken);

                app.updateVars();

                onDone(response);
            };
        } else {
            onSuccess = onDone;
        }
        return app.service("user", data, onSuccess);
    };

    app.user.logout = function(onDone) {
        app.user.idUser = "";
        app.user.authToken = "";
        app.storage.set("authToken", "");
        return app.service("user", {action: "logout"}, onDone);
    };

    app.user.auto_login = function(onDone) {
        return app.user.login("", "", app.storage.get("authToken", ""), onDone);
    };

    app.user.change_password = function(password, onDone) {
        var data = {
            password: password
        };
        return app.service("user_change_password", data, onDone);
    };

    return app;
}($, app, console, document));
