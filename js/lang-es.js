

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

        "contacts-approval-title": "Compartir con Contactos",
        "contacts-approval-content": "Tus contactos... Compartir?"
    };

    return app;
}(app));
