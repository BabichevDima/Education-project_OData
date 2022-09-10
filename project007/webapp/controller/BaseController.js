sap.ui.define(
  ["sap/ui/core/mvc/Controller",
  "webapp/model/formatter",],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, formatter) {
    "use strict";

    return Controller.extend("webapp.controller.BaseController", {
      formatter: formatter,
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
       * Open list report page button press event handler.
       */
      onNavToCategoriesOverview: function () {
        var oStateModel = this.getView().getModel("stateModel");
        var EditMode    = oStateModel.getProperty("/EditMode");

        if (!EditMode) {
          this.navigate("ListReport");
        }
      },

      /**
       * Register the view with the message manager.
       */
      onRegisterManager: function () {
        this.oMessageManager = sap.ui.getCore().getMessageManager();
        this.oMessageManager.registerObject(this.getView(), true);
        this.getView().setModel(this.oMessageManager.getMessageModel(), "messages");
      },

      /**
       * Сollects an array.
       * 
       * @param {array} aFieldGroupId array elements.
       * @param {string} sQuery type control.
       * 
       * @returns array elements.
       */
      collectsArray: function (aFieldGroupId, sQuery){
        return aFieldGroupId.filter(oItem => oItem.isA(`sap.m.${sQuery}`));
      },
    });
  }
);
