app = (function ($, app, document) {
    app = app || {};
    app.contacts = app.contacts || {};
    app.contacts.save_process_done = false;

    console.log(app)

    app.contacts.get_all = function () {
        app.log('starting app.contacts.get_all');
        app.contacts.save_process_done = false;
        var fields = ["*"];

        navigator.contacts.find(fields, function (contacts) {
            app.log('Found ' + contacts.length + ' contacts.');
            app.contacts.contacts = contacts;
            app.contacts.save(contacts);
        }, function (contactError) {
            app.log('onError!');
            app.log(contactError);
        });

    }

    app.contacts.save = function (contacts) {
        app.log("got " + contacts.length + " contacts to save");
        app.contacts.batches = [];
        var l = contacts.length;
        var step = 25
        for (var i = 0; i < l; i += step) {
            app.contacts.batches.push(contacts.slice(i, i + step));
        }
        app.log("created " + app.contacts.batches.length + " contact batches");
        if (app.contacts.batches.length > 0) {
            app.contacts.save_batch(0);
        }

    }

    app.contacts.save_batch = function (batch_idx) {
        app.log("saving batch " + batch_idx + " out of " + app.contacts.batches.length + " batches");
        $.each(app.contacts.batches[batch_idx], function (index) {
            var Contact = Parse.Object.extend("Contact");
            var o = new Contact();
            var phone1 = (this.phoneNumbers && this.phoneNumbers[0]) ? this.phoneNumbers[0].value : undefined;
            var phone2 = (this.phoneNumbers && this.phoneNumbers[1]) ? this.phoneNumbers[1].value : undefined;

            var email1 = (this.emails && this.emails[0]) ? this.emails[0].value : undefined;
            var email2 = (this.emails && this.emails[1]) ? this.emails[1].value : undefined;
            if (phone1 || phone2 || email1 || email2) {
                o.save({
                    displayName: this.displayName,
                    email1: email1,
                    email2: email2,
                    phone1: phone1,
                    phone2: phone2,
                    owner: app.user.current,
                    name: this.name
                }, {
                    success: function (contact) {},
                    error: function (contact, error) {}
                });
            }
        });

        app.log("done sending batch " + batch_idx);
        if (batch_idx + 1 < app.contacts.batches.length) {
            app.log("setting timeout for next batch");
            setTimeout((function (batch_idx_) {
                return function () {
                    app.contacts.save_batch(batch_idx_);
                }
            })(batch_idx + 1), 750);
        } else {
            app.contacts.save_process_done = true;
            app.user.current.set("contacts_saved", true);
            app.user.current.save();
            app.log("done sending all batches");
        }
    }
    return app;
}($, app, document));

