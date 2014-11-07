console.log("webapp.js")
console.log(app);
app = (function ($, app, document) {
    app = app || {};


    app.webinit = function () {
        app.log("webinit on!");
        app.setup_static_pages = function (content, content_static) {


        };

        app.parse.setup();

    }

    return app;
})($, app, document);
