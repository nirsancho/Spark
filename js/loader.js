app = app || {};
app.loader.is_phonegap = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
app.loader.scripts_loaded = false;
app.loader.device_ready = !app.loader.is_phonegap;
app.loader.fire_init = function () {
    if (scripts_loaded && device_ready) {
        callback();
    }
}

app.loader.loadScripts = function (scripts, callback) {
    if (app.loader.is_localhost) {
        $.ajaxSetup({
            cache: true
        });
    }

    var scripts = scripts || [];
    if (scripts.length == 0) {
        app.loader.scripts_loaded = true;
        app.loader.callback();
    }
    for (var i = 0; i < scripts.length; i++) {
        (function (i) {
            $.getScript(app.loader.basepath + scripts[i], function () {

                if (i + 1 == scripts.length) {
                    app.loader.scripts_loaded = true;
                    app.loader.callback();
                }
            });
        })(i);
    }
};

if (app.loader.is_phonegap) {
    document.addEventListener("deviceready", function () {
        app.loader.device_ready = true;
        app.loader.fire_init();
    }, false);
}

app.loader.loadScripts(app.loader.scripts);
