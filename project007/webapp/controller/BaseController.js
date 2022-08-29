sap.ui.define(
  ["sap/ui/core/mvc/Controller"],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller) {
    "use strict";

    return Controller.extend("webapp.controller.BaseController", {
      /**
       * Go to next page demo.
       *
       * @param {string} sRoute path to page.
       * @param {Object} oParams additional options.
       */
      navigate: function (sRoute, oParams, flag) {
        this.getOwnerComponent().getRouter().navTo(sRoute, oParams, flag);
      },

      /**
       * Returns a value from the i18n model.
       *
       * @param {string} sText value name.
       * @param {string} sRecipient extra options.
       *
       * @returns {string} value.
       */
      i18n: function (sText, sRecipient) {
        return this.getView().getModel("i18n").getResourceBundle().getText(sText, [sRecipient]);
      },

      /**
       * Open products overview page button press event handler.
       */
      onNavToCategoriesOverview: function () {
        this.navigate("ListReport");
      },

      /**
       * Register the view with the message manager.
       */
      onRegisterManager: function () {
        var oMessageManager = sap.ui.getCore().getMessageManager();
        oMessageManager.registerObject(this.getView(), true);
        this.getView().setModel(oMessageManager.getMessageModel(), "messages");
      },
    });
  }
);
