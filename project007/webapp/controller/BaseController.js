sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "webapp/model/formatter",
    "sap/ui/core/ValueState",
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, formatter, ValueState) {
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
       * @param {string} sSuffix extra options.
       *
       * @returns {string} value.
       */
      i18n: function (sText, sRecipient, sSuffix) {
        return this.getView().getModel("i18n").getResourceBundle().getText(sText, [sRecipient, sSuffix]);
      },

      /**
       * Open list report page button press event handler.
       */
      onNavToCategoriesOverview: function () {
        var oStateModel = this.getView().getModel("stateModel");
        var EditMode = oStateModel.getProperty("/EditMode");

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
        this.getView().setModel(this.oMessageManager.getMessageModel(),"messages");
      },

      /**
       * Сollects an array.
       *
       * @param {array} aFieldGroupId array elements.
       * @param {string} sQuery type control.
       *
       * @returns array elements.
       */
      collectsArray: function (aFieldGroupId, sQuery) {
        return aFieldGroupId.filter((oItem) => oItem.isA(`sap.m.${sQuery}`));
      },

      /**
       * Сollects an array of fields.
       *
       * @param {string} sGroupID id group.
       *
       * @returns array elements.
       *
       * @private
       */
      _collectsFields: function (sGroupID) {
        var aFieldGroupId = this.getView().getControlsByFieldGroupId(sGroupID);
        var aInput        = this.collectsArray(aFieldGroupId, "Input");
        var aDatePicker   = this.collectsArray(aFieldGroupId, "DatePicker");

        return [...aInput, ...aDatePicker];
      },

      /**
       * Сhecks for empty fields.
       *
       * @param {string} sGroupID id group.
       *
       * @returns array elements.
       *
       * @private
       */
      _checkFields: function (sGroupID) {
        var bCheck = false;
        this._collectsFields(sGroupID).forEach((oField) => {
          if (!oField.getValue()) {
            oField.setValueState(ValueState.Error);
            bCheck = true;
          }
        });
        return bCheck;
      },

      /**
       * check field.
       *
       * @param {sap.ui.base.Event} oEvent event object.
       */
      checkField: function (oEvent) {
        oEvent.getSource().setValueState(ValueState.None);
      },
    });
  }
);
