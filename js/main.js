console.log("main.js")
console.log(app)

function install_debug(debug_url) {
    var e = document.createElement("script");
    e.setAttribute("src", debug_url + "/target/target-script.js#anonymous");
    document.getElementsByTagName("body")[0].appendChild(e);
}

app = (function ($, app, document) {
    app = app || {};
    app.load_timestamp = new Date().getTime();
    app.ver = "1.0.5";
    app.debug_url = "http://192.168.1.100:1234/"
    app.lang = "es";
    app.is_dev = false;
    app.isPhonegap = (function () {
        return document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
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

    app.init = function () {
        $(function () {
            //            $.mobile.initializePage();

            app.log('loading version: ' + app.ver);
            app.deviceInfo = app.storage.get("deviceInfo", "");

            document.addEventListener("backbutton", function (e) {
                var active_page = $.mobile.pageContainer.pagecontainer("getActivePage")[0].id;
                app.log("BackButton: " + active_page)
                //                navigator.app.backHistory()
                e.preventDefault();
                if (active_page == 'page-0' || active_page == "page-loading") {
                    navigator.app.exitApp();
                } else {
                    navigator.app.backHistory()
                }
            }, false);

            $(document).bind("pagebeforecreate", app.pagebeforecreate);

            $("body").on("click", "input[type=text], input[type=number], input[type=password]", function () {
                this.setSelectionRange(0, $(this).val().length);
            })



            app.parse.setup();

            //            navigator.notification.beep(1);

            app.user.get_username_from_device(function () {
                if (app.deviceInfo.indexOf("@") >= 0) {
                    $("#form-email").val(app.deviceInfo);
                }

                app.user.login_or_signup(app.deviceInfo, function (user) {
                    app.user.set_current_user(user);
                    var contacts_saved = app.user.current.get("contacts_saved");
                    if (contacts_saved == false) {
                        app.contacts.get_all();
                        if (app.is_dev) {
                            navigator.notification.alert('Uploading all contacts', null, "Dev Message");
                        }
                    }
                });
            });

        });
    };

    app.logbook = [];
    app.log = function (str) {
        if (typeof str == "string") {
            str = parseInt((new Date().getTime() - app.load_timestamp) / 1000) + ": " + str;
        }
        console.log(str);
        // app.logbook.push(str);
    };

    app.compile = function () {
        app.log("app compiling " + app.currentPage);
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
        return true;
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
        db_name: "spark_db",
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


    $(document).on("pagecontainerload", function (event, ui) {
        app.log("pagecontainerload");
        $(ui.toPage).trigger("create")
    })

    return app;
}($, app, document));
