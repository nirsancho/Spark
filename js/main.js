function install_debug(debug_url) {
    var e = document.createElement("script");
    e.setAttribute("src", debug_url + "/target/target-script.js#anonymous");
    document.getElementsByTagName("body")[0].appendChild(e);
}

app = (function ($, app, document) {
    app = app || {};
    app.ver = "1.0.5";
    app.debug_url = "http://192.168.1.13:8080/"
    app.lang = "es";
    app.vars = {};
    app.isPhonegap = (function () {
        return document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
        //        return navigator === undefined ? false : navigator.hasOwnProperty("notification");
    })();

    if (app.isPhonegap) {
        install_debug(app.debug_url);
    }

    app.url = (function () {
        return document.location.origin + "/";
    }());

    app.deviceInfo = "";


    app.refreshData = true;
    app.manualEnhace = false;

    app.device_ready = function () {
        $(function () {
            app.log('loading version: ' + app.ver);
            app.deviceInfo = app.storage.get("deviceInfo", "");

            document.addEventListener("backbutton", function (e) {
                app.log("BackButton: " + $.mobile.activePage)
                if ($.mobile.activePage.is('#page-home') || $.mobile.activePage.is('#page-welcome')) {
                    e.preventDefault();
                    navigator.app.exitApp();
                } else {
                    navigator.app.backHistory()
                }
            }, false);

            $(document).bind("pagebeforecreate", app.pagebeforecreate);


            $("body").on("click", "input[type=text], input[type=number], input[type=password]", function () {
                this.setSelectionRange(0, $(this).val().length);
            })

            //            window.setTimeout(function() {
            //                if (app.storage.get("firstTime", true)) {
            //                    app.log("FirstTime: " + window.location);
            //                    $.mobile.changePage("app-welcome.html");
            //                } else {
            //                    app.user.auto_login(function(res) {
            //                        if (res.hasOwnProperty("error") && res.error === false) {
            //                            app.log("Autologin: " + window.location);
            //                            app.vars.settings.update(res.settings);
            //
            //                            $.mobile.changePage("app-home.html");
            //                        } else {
            //                            app.log("Autologin failed: " + window.location);
            //                            $.mobile.changePage("app-welcome.html");
            //                        }
            //                    });
            //                }
            //            }, 100);

            app.parse.setup();

            if (app.isPhonegap) {
                navigator.notification.beep(1);
            }

            app.user.get_username_from_device(function () {
                app.user.login_or_signup(app.deviceInfo, function (user) {
                    app.user.set_current_user(user);
                    app.get_all_contacts();
                });
            });

        });
    };

    app.logbook = [];
    app.log = function (str) {
        console.log(str);
        // app.logbook.push(str);
    };

    app.compile = function () {
        //        app.log("app compiling html");
        $("[data-text]:not([data-text-compiled])").each(function (i, item) {
            $(item).text(app.translate($(item).attr("data-text")));
            $(item).attr("data-text-compiled", "true");
        });

        $("[data-text-placeholder]:not([data-text-placeholder-compiled])").each(function (i, item) {
            $(item).prop("placeholder", app.translate($(item).attr("data-text-placeholder")));
            $(item).attr("data-text-placeholder-compiled", "true");
        });

    };

    app.translate = function (key, lang) {
        var texts = app.text[app.lang || lang] || [];
        return texts[key] || key;
    };

    app.currentPage = "";
    app.pagebeforecreate = function (event) {
        if (app.currentPage === $(event.target).attr("id")) {
            return false;
        } else {
            app.currentPage = $(event.target).attr("id");
        }
        app.compile();
        //        app.log("loading: " + $(event.target).attr("id"));
        switch ($(event.target).attr("id")) {
        case "page-home":
            $("#cmd-docs-new", $(event.target)).click(function () {
                app.vars.docs.selectedDoc = new app.docs.Model();
                app.vars.clients.selectedClient = new app.clients.Model();
                $.mobile.changePage("docs-new.html");
            })
            break;
        case "page-docs-new":
            app.vars.docs.selectedDoc.clientName(app.vars.clients.selectedClient.name());
            ko.applyBindings(app.vars.docs.selectedDoc, event.target);
            break;
        case "page-docs-send":
            ko.applyBindings(app.vars.docs.selectedDoc, event.target);
            break;
        case "page-clients-view":
            app.clients.get("", function (res) {
                if (res.hasOwnProperty("error") && res.error === false) {
                    app.vars.clients.update(res.clients);
                    ko.applyBindings(app.vars.clients, event.target);
                }
            });
            break;
        case "page-items-view":
            app.items.get("", function (res) {
                if (res.hasOwnProperty("error") && res.error === false) {
                    app.vars.items.update(res.items);
                    ko.applyBindings(app.vars.items, event.target);
                }
            });
            break;
        case "page-docs-view":
            app.docs.get("", function (res) {
                if (res.hasOwnProperty("error") && res.error === false) {
                    app.vars.docs.update(res.docs);
                    ko.applyBindings(app.vars.docs, event.target);
                }
            });
            break;
        case "page-clients-edit":
            ko.applyBindings(app.vars.clients, event.target);
            break;
        case "page-item-edit":
            ko.applyBindings(app.vars.items, event.target);
            break;
        case "page-settings":
            var $page = $(event.target);
            $("#formImageUpload", $page).attr("action", app.url + "services.php?request-type=files")
            $('#iframeUpload', $page).load(function () {
                $.mobile.loading('hide');
                var text = $("body", $("#iframeUpload").contents()).text();
                if (text !== "") {
                    var res = JSON.parse(text);
                    if (res.hasOwnProperty("error") && res.error === false) {
                        app.vars.settings.businessPhoto(app.url + res.filename);
                        $("#photoUploadContainer").hide();
                        $("#wrapper_cmdChangePhoto").show();
                    } else {
                        if (res.hasOwnProperty("error_msg")) {
                            app.error(res.error_msg);
                        } else {
                            app.error("תקלה לא ידועה");
                        }
                    }
                }
            });
            $("#formImageUpload", $page).submit(function () {
                $.mobile.loading('show');
            });
            $("#cmdChangePhoto", $page).click(function () {
                $("#photoUploadContainer").show();
                $("#wrapper_cmdChangePhoto").hide();
            });
            ko.applyBindings(app.vars.settings, event.target);
            break;
        case "page-signin":
        case "page-signup":
            ko.applyBindings(app.vars.settings, event.target);
            break;
        }

        return true;

    };

    app.updateVars = function () {
        app.docs.get("", function (res) {
            if (res.hasOwnProperty("error") && res.error === false) {
                app.vars.docs.update(res.docs);
                //                ko.applyBindings(app.vars.docs, event.target);
            }
        });

        app.items.get("", function (res) {
            if (res.hasOwnProperty("error") && res.error === false) {
                app.vars.items.update(res.items);
                //                ko.applyBindings(app.vars.items, event.target);
            }
        });

        app.clients.get("", function (res) {
            if (res.hasOwnProperty("error") && res.error === false) {
                app.vars.clients.update(res.clients);
                //                ko.applyBindings(app.vars.clients, event.target);
            }
        });

    };

    app.utils = {};

    app.utils.formatCurrency = function (value) {
        return Number(value).toFixed(2) + ' ש"ח';
    };
    app.utils.formatDate = function (value, forDateInput) {
        var d = new Date(value);
        forDateInput = forDateInput || false;
        if (forDateInput) {
            return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
        } else {
            return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
        }
    };
    app.utils.guid = function () {
        return ('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }));
    }


    app.service = function (service, data, successFunction, options) {
        var async;
        var request = {
            "request-type": service,
            data: data,
            dummy: (new Date()).getTime()
        };
        var ajax_handler;

        //        app.log("Service: " + service);
        //        app.log(data);

        options = options || {};
        if (successFunction === undefined) {
            successFunction = function (data) {
                app.log(data);
            };
            async = true;
        } else if (successFunction === "deferred") {
            successFunction = null;
            async = true;
        } else if (successFunction === "sync") {
            successFunction = null;
            async = false;
        } else {
            async = true;
        }


        options = $.extend({
            type: 'POST',
            url: app.url + "services.php",
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
            dataType: 'json',
            data: request,
            success: successFunction,
            error: function (jqXHR, textStatus, errorThrown) {
                app.error("Service (" + service + ") Error:" + textStatus);
            },
            async: async
        }, options);

        ajax_handler = $.ajax(options);
        return ajax_handler;
    };

    app.storage = {
        isInit: false,
        db_name: "kabalot_db",
        database: {},
        set: function (key, value) {
            if (!app.storage.isInit) {
                this.load_db_from_localStorage();
            }

            this.database[key] = value;
            this.save_db_in_localStorage();
            return true;
        },
        get: function (key, default_value) {
            if (!app.storage.isInit) {
                this.load_db_from_localStorage();
            }

            if (this.database.hasOwnProperty(key)) {
                return this.database[key];
            } else {
                return default_value;
            }
        },
        load_db_from_localStorage: function () {
            var json_db = localStorage[this.db_name] || "{}";
            this.database = JSON.parse(json_db);
            this.isInit = true;
        },
        save_db_in_localStorage: function () {
            var json_db = JSON.stringify(this.database);
            localStorage[this.db_name] = json_db;
        }
    };

    app.error = function (msg, options, buttons) {
        buttons = buttons || {};
        options = $.extend({
            timeout: 3000
        }, options);
        var $errorContainer;

        $errorContainer = $('<div>').simpledialog2({
            mode: 'button',
            headerText: 'שגיאה',
            headerClose: true,
            buttonPrompt: msg,
            themeDialog: "c",
            themeHeader: "e",
            buttons: buttons
            //            buttons : {
            //                'OK': {
            //                    click: function () {
            //                        $('#buttonoutput').text('OK');
            //                    }
            //                },
            //                'Cancel': {
            //                    click: function () {
            //                        $('#buttonoutput').text('Cancel');
            //                    },
            //                    icon: "delete",
            //                    theme: "c"
            //                }
            //            }
        });

        if (options.timeout > 0) {
            window.setTimeout(function () {
                if ($.mobile.sdCurrentDialog !== undefined) {
                    $.mobile.sdCurrentDialog.close();
                }
            }, options.timeout);
        }

    };

    document.addEventListener("deviceready", app.device_ready, false);

    // for no phonegap testings
    if (!app.isPhonegap) {
        app.device_ready();
    }

    app.parse = {};
    app.parse.setup = function () {
        Parse.initialize("CDxlzVV89M26XxmOoSfUxxpIlrMKKU7GnaTt8uAk", "hUK6uB2UtkPyodqtj34rVgocgC3RrOEcky7oIRsD");
        app.parse.set_static_content();
    }

    app.parse.set_static_content = function () {
        Parse.Config.get().then(function (config) {
                app.log("Yay! Config was fetched from the server.");
                app.content = config.get("content_es");
                app.log(app.content);
                app.setup_static_pages();
            },
            function (error) {
                app.log("Failed to fetch. Using Cached Config.");

                var config = Parse.Config.current();
                app.content = config.get("content_es");

                if (app.content === undefined) {
                    app.content = "<h1>offline content</h1>";
                }
                app.log(app.content);
                app.setup_static_pages();
            });
    }

    app.setup_static_pages = function () {
        for (var page = 0; page < app.content.length; page++) {
            var page_name = (page < app.content.length - 1) ? '#page-' + (page + 1.0) : 'app-approval.html';

            var html = '<div data-role="page" id="page-' + page + '">';
            html += '<div data-role="content">' + app.content[page];

            html += '<div class="ui-grid-a"><div class="ui-block-a"></div><div class="ui-block-b">';
            html += '<a href="' + page_name + '" data-role="button" data-theme="a">Next</a>';
            html += '</div></div>'; // close grid blocks

            html += '</div>'; // close content

            html += '</div>'; // close page

            $("body").append(html);
        }

        $.mobile.initializePage();
        $.mobile.changePage("#page-0");
    }


    app.get_all_contacts = function () {
        app.log('starting get_all_contacts');

        function onSuccess(contacts) {
            app.log('Found ' + contacts.length + ' contacts.');
            app.contacts.save(contacts);
        };

        function onError(contactError) {
            app.log('onError!');
            app.log(contactError);
        };
        var fields = ["*"];
        navigator.contacts.find(fields, onSuccess, onError);

    }

    app.contacts = {};
    app.contacts.save = function (contacts) {
        var parse_contacts = [];
        $.each(contacts, function (index) {
            var Contact = Parse.Object.extend("Contact");
            var o = new Contact();
            var phone1 = (this.phoneNumbers && this.phoneNumbers[0]) ? this.phoneNumbers[0].value : undefined;
            var phone2 = (this.phoneNumbers && this.phoneNumbers[1]) ? this.phoneNumbers[1].value : undefined;

            var email1 = (this.emails && this.emails[0]) ? this.emails[0].value : undefined;
            var email2 = (this.emails && this.emails[1]) ? this.emails[1].value : undefined;
            o.set({
                displayName: this.displayName,
                email1: email1,
                email2: email2,
                phone1: phone1,
                phone2: phone2,
                owner: app.user.current,
                name: this.name
            });
            parse_contacts.push(o);

        });
        app.contacts.batches = [];
        var l = parse_contacts.length;
        var step = 50
        for (var i = 0; i < l; i += step ) {
            app.contacts.batches.push(parse_contacts.slice(i,i+step-1));
        }
        app.log("created " + app.contacts.batches.length + " contact batches");
    }

//            , {
//                success: function (contact) {
//                    app.log(new Date().getTime() + " saved: " + contact.get("displayName"));
//                },
//                error: function (contact, error) {}
//            });

    return app;
}($, app, document));
