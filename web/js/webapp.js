console.log("webapp.js")
console.log(app);

function get_from_array(arr, index, def_val) {
    try {
        return (arr[index] || def_val);
    } catch (e) {
        return (def_val);
    }
}

app = (function ($, app, document) {
    app = app || {};
    app.user.get_contacts = function (useridx, phonesOnly, cb) {
        $.mobile.loading("show", {
            text: "Bajando",
            textVisible: true,
        });

        var RawContacts = Parse.Object.extend("RawContacts");
        var query = new Parse.Query(RawContacts);
        query.equalTo("owner", app.user.list[useridx]);
        query.find().done(function (result) {
            if (result) {
                var allcontacts = $.map(result, function (o) {
                    return o.get("raw_contacts");
                });

                var tabContacts = $.map(allcontacts, function (o) {
                    var contact = {};
                    contact.name = o.displayName || "";
                    contact.phone1 = get_from_array(o.phoneNumbers, 0, "");
                    contact.phone2 = get_from_array(o.phoneNumbers, 1, "");

                    contact.email0 = get_from_array(o.emails, 0, "");
                    contact.email1 = get_from_array(o.emails, 1, "");

                    return contact;
                });

                if (phonesOnly) {
                    tabContacts = $.grep(tabContacts, function (item, i) {
                        return (item.phone1 != "" || item.phone2 != "");
                    });
                }

                var filename = app.user.list[useridx].get("username");
                filename = filename || app.user.list[useridx].id;
                dataToExcel(tabContacts, filename + ".xls", true);
            }
        }).fail(function () {
            $.mobile.loading("hide")
        });
    };


    app.user.getall = function (cb) {
        var Users = Parse.Object.extend("_User");
        var query = new Parse.Query(Users);
        query.find().done(function (allusers) {
            app.user.list = allusers;
            var UserData = Parse.Object.extend("UserData");
            var query = new Parse.Query(UserData);
            query.find().done(function (userData) {
                app.user.userData = {};
                for (var data in userData) {
                    data = userData[data];
                    app.user.userData[data.get("user").id] = data;
                }


                var rr = $.map(allusers, function (r1, index) {

                    var status = "<input class='user-status' data-index='" + index + "' value='" + (app.user.userData[r1.id].get("status") || "") + "'/>";
                    var download = "<button class='user-download' data-index='" + index + "' data-text='general-download'></button>";
                    var save = "<button class='user-save' data-index='" + index + "' data-text='general-save'></button>";
                    var cancel = "<button class='user-cancel' data-index='" + index + "' data-text='general-cancel'></button>";
                    var createdAt = "<span title='"+moment(r1.createdAt).format("HH:mm DD/MM/YY")+"'>"+moment(r1.createdAt).format("DD/MM/YY")+"</span>"
                    return [[r1.id, r1.get("username"), r1.get("contacts_allowed"),
                         r1.get("contacts_saved"), r1.get("contact_count"),
                         status, createdAt, download + save + cancel]];
                });



                app.usertable = $('#users').dataTable({
                    "data": rr,
                    "autoWidth": false,
                    "columns": [
                        {
                            "title": "Id"
                    },
                        {
                            "title": "Username"
                    },
                        {
                            "title": "allowed"
                    },
                        {
                            "title": "saved",
                    },
                        {
                            "title": "count",
                    },
                        {
                            "title": "Status",
                    },
                        {
                            "title": "Creado En",
                    },
                        {
                            "title": "Acciones",
                            "orderable": false,
                    },
                            ],
                    "initComplete": function () {
                        $(".user-save", $("#users")).hide();
                        $(".user-cancel", $("#users")).hide();
                        $(".user-status", $("#users")).keypress(function () {
                            app.log("change");
                            var $tr = $(this).closest("tr");
                            $(".user-save", $tr).show();
                            $(".user-cancel", $tr).show();
                            $(".user-download", $tr).hide();
                        });
                        app.compile();
                        app.log("table drawed");
                    }
                });

                $('#users tbody .user-download').click(function () {
                    var idx = $(this).attr("data-index");
                    if (idx) {
                        var phonesOnly = $("#cb_phonesOnly").prop("checked");
                        app.user.get_contacts(idx, phonesOnly);
                    }
                });


                $('#users tbody .user-cancel').click(function () {
                    var idx = $(this).attr("data-index");
                    if (idx) {
                        var $tr = $(this).closest("tr");
                        var userId = app.user.list[idx].id;
                        $(".user-status", $tr).val(app.user.userData[userId].get("status"));
                        $(".user-save", $("#users")).hide();
                        $(".user-cancel", $("#users")).hide();
                        $(".user-download", $tr).show();
                    }
                });

                $('#users tbody .user-save').click(function () {
                    var idx = $(this).attr("data-index");
                    if (idx) {
                        var $tr = $(this).closest("tr");
                        var userId = app.user.list[idx].id;
                        app.user.userData[userId].set("status", $(".user-status", $tr).val());
                        app.user.userData[userId].save().done(function () {
                            $(".user-save", $("#users")).hide();
                            $(".user-cancel", $("#users")).hide();
                            $(".user-download", $tr).show();
                        });
                    }
                });

            }); // end of userData
        }); // end of _User
    }
    app.edit_page = function (id, page) {
        $("#page-title").val(page.title || "approval");
        app.editor.setContent(page.body || "");
        app.currentPage = id;
        if (id == "approval") {
            $("#question").val(page.question);
            $("#dialog").val(page.dialog);
            $("#dialog-title").val(page["dialog_title"]);
            $("#url").val(page.url);
        }
    };

    app.save_content = function (content) {
        var i = parseInt(app.currentPage);
        if (i < app.content.pages.length) {
            app.log("saving page " + app.currentPage);
            app.content.pages[i].title = $("#page-title").val();
            app.content.pages[i].body = content;
        } else {
            app.log("saving approval");
            app.content.approval.body = content;
            app.content.approval.question = $("#question").val();
            app.content.approval.dialog = $("#dialog").val();
            app.content.approval["dialog_title"] = $("#dialog-title").val();
            app.content.approval.url = $("#url").val();
        }
        app.config.set("content_es", app.content);
    }

    app.webinit = function () {
        app.log("webinit on!");
        app.content.create_pages = function (pages, approval) {
            new nicEditor({
                fullPanel: true,
                iconsPath: "js/nicEditorIcons.gif",
            }).panelInstance('page-content');
            app.editor = nicEditors.findEditor('page-content');
            $(".nicEdit-panelContain").parent().css("width", "100%").next().css("width", "100%").children().first().css("width", "100%");

            var $selector = $("#pages");
            $.each(pages, function (index, page) {
                var o = $("<option></option>").text("Pagina " + (index + 1) + ": " + page.title).attr("data-index", index);
                $selector.append(o);
            });

            var o = $("<option></option>").text("Pagina ultima: aprovar").attr("data-approval", "true");
            $selector.append(o);

            $selector.change(function (e) {
                var sel = $(e.target).prop("selectedIndex");
                if (sel < pages.length) {
                    app.edit_page(sel, pages[sel]);
                    $(".approval-only").hide();
                } else {
                    app.edit_page("approval", approval);
                    $(".approval-only").show();
                }

            });

            $selector.trigger("change");

            $("#cmd-save").click(function () {
                var content = app.editor.getContent();
                app.save_content(content);
            });

            Parse.User.logIn("admin", "kikenir").done(function () {
                app.user.getall();
            });

            app.compile();


        };

        $(document).bind("pagebeforecreate", app.pagebeforecreate);

        app.parse.setup();



    }

    return app;
})($, app, document);


function JSONToCSVConvertor(JSONData, ReportTitle, ShowLabel) {
    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;

    var CSV = '';
    //Set Report title in first row or line

    CSV += ReportTitle + '\r\n\n';

    //This condition will generate the Label/Header
    if (ShowLabel) {
        var row = "";

        //This loop will extract the label from 1st index of on array
        for (var index in arrData[0]) {

            //Now convert each value to string and comma-seprated
            row += index + ',';
        }

        row = row.slice(0, -1);

        //append Label row with line break
        CSV += row + '\r\n';
    }

    //1st loop is to extract each row
    for (var i = 0; i < arrData.length; i++) {
        var row = "";

        //2nd loop will extract each column and convert it in string comma-seprated
        for (var index in arrData[i]) {
            row += '"' + arrData[i][index] + '",';
        }

        row.slice(0, row.length - 1);

        //add a line break after each row
        CSV += row + '\r\n';
    }

    if (CSV == '') {
        alert("Invalid data");
        return;
    }

    //Generate a file name
    var fileName = "";
    //this will remove the blank-spaces from the title and replace it with an underscore
    fileName += ReportTitle.replace(/ /g, "_");

    //Initialize file format you want csv or xls
    var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);

    // Now the little tricky part.
    // you can use either>> window.open(uri);
    // but this will not work in some browsers
    // or you will not get the correct file extension

    //this trick will generate a temp <a /> tag
    var link = document.createElement("a");
    link.href = uri;

    //set the visibility hidden so it will not effect on your web-layout
    link.style = "visibility:hidden";
    link.download = fileName + ".csv";

    //this part will append the anchor tag and remove it after automatic click
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function dataToExcel(data, filename, header) {
    emitXmlHeader = function () {
        return '<?xml version="1.0"?>\n' +
            '<ss:Workbook xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n' +
            '<ss:Worksheet ss:Name="Sheet1">\n' +
            '<ss:Table>\n\n';
    };

    emitXmlFooter = function () {
        return '\n</ss:Table>\n' +
            '</ss:Worksheet>\n' +
            '</ss:Workbook>\n';
    };

    jsonToSsXml = function (jsonObject, header) {
        var row;
        var col;
        var xml;
        var data = typeof jsonObject != "object" ? JSON.parse(jsonObject) : jsonObject;

        xml = emitXmlHeader();

        if (header && data.length > 0) {
            xml += '<ss:Row>\n';
            for (col in data[0]) {
                xml += '  <ss:Cell>\n';
                xml += '    <ss:Data ss:Type="String">';
                xml += col + '</ss:Data>\n';
                xml += '  </ss:Cell>\n';
            }
            xml += '</ss:Row>\n';
        }

        for (row = 0; row < data.length; row++) {
            xml += '<ss:Row>\n';

            for (col in data[row]) {
                xml += '  <ss:Cell>\n';
                xml += '    <ss:Data ss:Type="String">';
                xml += data[row][col] + '</ss:Data>\n';
                xml += '  </ss:Cell>\n';
            }

            xml += '</ss:Row>\n';
        }

        xml += emitXmlFooter();
        return xml;
    };


    download = function (content, filename, contentType) {
        if (!contentType) contentType = 'application/octet-stream';
        var a = document.createElement("a");

        //set the visibility hidden so it will not effect on your web-layout
        a.style = "visibility:hidden";

        var blob = new Blob([content], {
            'type': contentType
        });
        a.href = window.URL.createObjectURL(blob);
        a.download = filename;

        //this part will append the anchor tag and remove it after automatic click
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        $.mobile.loading("hide");
    };

    download(jsonToSsXml(data, header), filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}