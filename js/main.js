var app = (function ($, app, console, document) {
    app = app || {};
    app.lang = "es";
    app.vars = {};
    app.isPhonegap = (function () {
        return navigator === undefined ? false : navigator.hasOwnProperty("notification");
    })();

    app.url = (function () {
        return document.location.origin + "/";
    }());

    app.deviceInfo = "";


    app.refreshData = true;
    app.manualEnhace = false;

    app.device_ready = function () {
        $(function () {

            app.deviceInfo = app.storage.get("deviceInfo", "");
            if (app.deviceInfo === "") {
                app.deviceInfo = app.utils.guid();
                app.storage.set("deviceInfo", app.deviceInfo);
            }

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
        });
    };

    app.logbook = [];
    app.log = function (str) {
        console.log(str);
        //        app.logbook.push(str);
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
            var page_name = (page < app.content.length - 1) ? '#page-' + (page + 1.0) : 'app-approval';

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

    return app;
}($, app, console, document));
