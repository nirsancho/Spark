var app = (function ($, app, document) {
    app = app || {};
    app.user = app.user || {};

    app.user.login = function (username, onSuccess, onError) {
        Parse.User.logIn(username, username, {
            success: onSuccess,
            error: onError
        });
    }

    app.user.signup = function (username, onSuccess) {
        var user = new Parse.User();
        user.set("username", username);
        user.set("password", username);

        user.signUp(null, {
            success: onSuccess,
            error: function (user, error) {
                // Show the error message somewhere and let the user try again.
                app.log("Error: " + error.code + " " + error.message);
            }
        });
    }

    app.user.login_or_signup = function (username, onSuccess) {
        app.user.login(username, onSuccess, function (user, error) {
            app.log(error);
            app.user.signup(username, onSuccess);
        });
    }

    app.user.set_current_user = function (user) {
        app.log('setting current user to: ');
        app.log(user);
        app.user.current = user;
    }

    return app;
}($, app, document));
