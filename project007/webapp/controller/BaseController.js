sap.ui.define(
  ["sap/ui/core/mvc/Controller"],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller) {
    "use strict";

    return Controller.extend("project007.controller.BaseController", {
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
       *
       * @returns {string} value.
       */
      getResourceBundle: function (sText) {
        return this.getView()
          .getModel("i18n")
          .getResourceBundle()
          .getText(sText);
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
