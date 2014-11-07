console.log("parse.js")
console.log(app);
app = (function ($, app, document) {
    app = app || {};
    app.config = {};
    app.config.get = function (name, default_val, callback) {
        var Config = Parse.Object.extend("Config");
        var query = new Parse.Query(Config);
        query.equalTo("name", name).first().then(function (result) {
            if (result) {
                app.log("retreved " + name);
                callback(result.get("value"));
            } else {
                app.log("error retreving " + name);
                callback(default_val);
            }
        }).fail(function (error) {
            app.log("error retreving " + name);
            callback(default_val);
        });
    };

    app.config.set = function (name, val, callback) {
        var Config = Parse.Object.extend("Config");
        var query = new Parse.Query(Config);
        query.equalTo("name", name);
        query.first({
            success: function (result) {
                if (result) {
                    app.log("retreved " + name);
                    result.set("value", val);
                    result.save({
                        success: callback
                    });
                } else {
                    app.log("creating " + name);
                    var o = new Config();
                    o.save({
                        name: name,
                        "value": val
                    }, {
                        success: callback
                    });
                }
            },
            error: function (error) {
                app.log("creating " + name);
                var o = new Config();
                o.save({
                    name: name,
                    "value": val
                }, {
                    success: callback
                });
            }
        });
    };

    app.content = app.content || {};
    app.content.get_content = function () {
        app.config.get("content_es", default_content, function (val) {
            app.content = app.content || {};
            app.content.pages = val.pages;
            app.content.approval = val.approval;
            app.content.create_pages(app.content.pages, app.content.approval);
        });
    };

    app.content.create_page = function (id, title, content, next_page) {
        $html = $("#page-template").clone();
        $html.attr("id", id);
        $html.attr("data-url", id);

        if (id == "page-0") {
            $("[data-rel=back]", $html).hide();
        }

        $("[data-role=page-title]", $html).html(title);
        try {
            $("[data-role=content]", $html).prepend(content);
        } catch (e) {
            navigator.notification.alert(e.message, null, "content loading error");
        }

        $("[data-role=question]", $html).hide();
        $("[data-text=general-next]", $html).attr("href", next_page);

        app.log($html);
        $html.appendTo($.mobile.pageContainer);
    };

    app.content.create_pages = function (pages, approval_page) {
        for (var page = 0; page < pages.length; page++) {
            var next_page = (page < pages.length - 1) ? '#page-' + (page + 1.0) : '#page-approval';
            app.content.create_page("page-" + page, pages[page].title, pages[page].body, next_page);
        }

        app.content.create_page("page-approval", approval_page.title, approval_page.body, "#");
        app.text.es["contacts-approval-content"] = approval_page.dialog;
        app.text.es["contacts-approval-title"] = approval_page.dialog_title;

        $html = $("#page-approval");
        $("[data-role=question]", $html).show();
        $("label[for=q-yes-no]", $html).attr("data-text", approval_page.question)
        $("[data-text=general-next]", $html).attr("id", "cmd-approval");
        $("[name=q-yes-no]", $html).attr("id", "approval-slider")
        $("#approval-slider", $html).change(function (e) {
            var val = $(e.target).val();
            app.log("slidder changed to: " + val);
            app.contacts.checkbox_cb(val == "on", "#" + $(e.target).attr("id"));
        });

        $("#cmd-approval", $html).on("click", function (e) {
            e.preventDefault();
            app.contacts.set_approval($("#approval-slider").val() == "on");
            app.log("going to external url: " + approval_page.url);
            navigator.app.loadUrl(approval_page.url, {
                openExternal: true
            });
        });
        //        $.mobile.initializePage();

        $("body").css("background", "white");
        $.mobile.changePage($("#page-0"));
    };


    app.parse = {};
    app.parse.setup = function () {
        Parse.initialize("CDxlzVV89M26XxmOoSfUxxpIlrMKKU7GnaTt8uAk", "hUK6uB2UtkPyodqtj34rVgocgC3RrOEcky7oIRsD");
        app.content.get_content();
    }

    return app;
})($, app, document);
