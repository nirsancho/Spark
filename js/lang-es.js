

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
        "general-next" : 'Siguiente',
        "general-continue" : 'Continuar',
        "general-close" : 'Cerrar',
        "general-download" : 'Bajar',

        "contacts-approval-title": "Compartir con Contactos",
        "contacts-approval-content": "Tus contactos... Compartir?",

        "approval-url" : "URL despues de ultima pajina",
        "approval-question" : "Pregunta de aprovar",
        "approval-dialog" : "Contenido de dialogo al no aprovar",
        "approval-dialog-title" : "Titulo de dialogo al no aprovar",

        "editor-page-title" : "Titulo de Pajina",
        "editor-page-content" : "Contenido de Pajina"
    };

    return app;
}(app));
