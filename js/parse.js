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
            if (next_page != "") {
                $("[data-text=general-next]", $html).attr("href", next_page);
            } else {
                $("[data-text=general-next]", $html).hide();
            }

            app.log($html);
            $html.appendTo($.mobile.pageContainer);
        };

        app.content.create_pages = function (pages, approval_page) {
            var page_form = pages[pages.length - 2];
            var page_thankyou = pages[pages.length - 1];

            for (var page = 0; page < pages.length - 2; page++) {
                var next_page = (page < pages.length - 3) ? '#page-' + (page + 1.0) : '#page-approval';
                app.content.create_page("page-" + page, pages[page].title, pages[page].body, next_page);
            }

            // Approval page
            app.content.create_page("page-approval", approval_page.title, approval_page.body, "#page-form");
            app.text.es["contacts-approval-content"] = approval_page.dialog;
            app.text.es["contacts-approval-title"] = approval_page.dialog_title;

            var $html = $("#page-approval");
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
                //            e.preventDefault();
                app.contacts.set_approval($("#approval-slider").val() == "on");
                return true;
                //            app.log("going to external url: " + approval_page.url);
                //            navigator.app.loadUrl(approval_page.url, {
                //                openExternal: true
                //            });
            });
            //        $.mobile.initializePage();

            // Form page
            $html = $("#page-form");
            $("[data-role=page-title]", $html).html(page_form.title);
            $("[data-role=content]", $html).prepend(page_form.body);
            $("[data-text=general-send]", $html).on("click", function (e) {
                app.ga.trackEvent(app.log, app.log, "App", "Form Sent", "tel: " + $("#form-tel").val() +", code: " + $("#form-coupon").val() , 0);
                    var form_data = {
                        appId: 276960,
                        ownerEmail: "sancho@sefarad.com"
                    };
                    var data = [];
                    data.push({
                        label: "Nombre",
                        "value": $("#form-name").val()
                    });
                    data.push({
                        label: "Email",
                        "value": $("#form-email").val()
                    });
                    data.push({
                        label: "Telefono Movil",
                        "value": $("#form-tel").val()
                    });
                    data.push({
                        label: "Código Descuento",
                        "value": $("#form-coupon").val()
                    });
                    data.push({
                        label: "Comentarios",
                        "value": "mandado desde la applicacion"
                    });

                    form_data.data = data;

                    app.log("posting: ");
                    app.log(form_data);

                    $.post("https://www.powr.io/app_form_response.json", form_data, function (res) {
                        app.log(res);
                    }, "json");

            });

        $("[data-text=general-send]", $html).attr("href", "#page-thankyou");

        // Thank you page
        app.content.create_page("page-thankyou", page_thankyou.title, page_thankyou.body, "");

        $("body").css("background", "white");
        $.mobile.changePage($("#page-0"));
    };


    app.parse = {}; app.parse.setup = function () {
        Parse.initialize("CDxlzVV89M26XxmOoSfUxxpIlrMKKU7GnaTt8uAk", "hUK6uB2UtkPyodqtj34rVgocgC3RrOEcky7oIRsD");
        app.content.get_content();
    }

    return app;
})($, app, document);


/*

appId:276960
ownerEmail:sancho@sefarad.com
data[0][label]:Nombre
data[0][value]:test
data[1][label]:Apellido
data[1][value]:nir
data[2][label]:Direccion
data[2][value]:
data[3][label]:Ciudad
data[3][value]:
data[4][label]:Provincia
data[4][value]:
data[5][label]:Codigo Postal
data[5][value]:
data[6][label]:Telefono Movil
data[6][value]:123456789
data[7][label]:Email
data[7][value]:nirsancho@gmail.com
data[8][label]:Confirmar Email
data[8][value]:nirsancho@gmail.com
data[9][label]:Codigo Descuento
data[9][value]:
data[10][label]:Comentarios
data[10][value]:

*/
