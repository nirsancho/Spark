console.log("lang-es.js")
console.log(app)

app = (function (app) {
    app = app || {};
    app.text = app.text || {};
    app.text.es = {
        "general-yes": "Si",
        "general-no": "No",
        "general-back": "Atras",
        "general-save": "Guardar",
        "general-cancel": "Cancelar",
        "general-delete": "Borrar",
        "general-add": "Anadir",
        "general-next": 'Siguiente',
        "general-continue": 'Continuar',
        "general-close": 'Cerrar',
        "general-download": 'Bajar',
        "general-send": 'Mandar',
        "general-remove": 'Borrar',

        "contacts-approval-title": "Compartir con Contactos",
        "contacts-approval-content": "Tus contactos... Compartir?",

        "approval-url": "URL despues de ultima pajina",
        "approval-question": "Pregunta de aprovar",
        "approval-dialog": "Contenido de dialogo al no aprovar",
        "approval-dialog-title": "Titulo de dialogo al no aprovar",

        "form-name": "Nombre",
        "form-email": "Email",
        "form-tel": "Telefono Movil",

        "editor-page-title": "Titulo de Pajina",
        "editor-page-content": "Contenido de Pajina",

        "webapp-contactos": "Ver Contactos",
        "webapp-editor": "Ver Editor",
        "webapp-contactos-phonesonly": "Solo Bajar Contactos con Telefono",

    };

    return app;
}(app));
