sap.ui.define(
  [
    "project007/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
  ],
  function (BaseController, JSONModel, Fragment, MessageBox) {
    "use strict";

    return BaseController.extend("project007.controller.ListReport", {
      /**
       * Controller's "init" lifecycle method.
       */
      onInit: function () {
        this._setStateModel();
      },

      /**
       * Creates a view model to store locally on the view.
       *
       * @private
       */
      _setStateModel: function () {
        var oStateModel = new JSONModel({
          StatusButtons: false,
          EditMode: false,
        });

        this.getView().setModel(oStateModel, "stateModel");
      },

      /**
       * Selects a row.
       */
      onSelectionTable: function () {
        var oStateModel         = this.getView().getModel("stateModel");
        var bIsSelectedContexts = this.byId("CategoriesTable").getSelectedContexts();

        oStateModel.setProperty("/StatusButtons", !!bIsSelectedContexts.length);
      },

      /**
       * Close edit mode.
       */
      onCancelButton: function () {
        var oStateModel = this.getView().getModel("stateModel");

        this.byId("CategoriesTable").getItems().forEach((elem) => (elem.mProperties.selected = false));
        oStateModel.setProperty("/StatusButtons", false);
        oStateModel.setProperty("/EditMode", false);
      },

      /**
       * Edits table fields.
       *
       * @param {sap.ui.base.Event} oEvent event object.
       */
      onEditButton: function () {
        var oStateModel = this.getView().getModel("stateModel");
        oStateModel.setProperty("/EditMode", true);
      },

      /**
       * Opens the dialog VH.
       *
       * @param {sap.ui.base.Event} oEvent event object.
       */
      handleValueHelp: function (oEvent) {
        var sInputValue = oEvent.getSource().getValue();
        var oView       = this.getView();
        oView.setBusy(true);

        if (!this._pValueHelpDialog) {
          this._pValueHelpDialog = Fragment.load({
            id: oView.getId(),
            name: "project007.view.fragments.ValueHelpDialog",
            controller: this,
          }).then(function (oValueHelpDialog) {
            oView.addDependent(oValueHelpDialog);
            return oValueHelpDialog;
          });
        }
        this._pValueHelpDialog
          .then(function (oValueHelpDialog) {
            oValueHelpDialog.open(sInputValue);
            oView.setBusy(false);
          })
          .catch(function () {
            MessageBox.error();
            oView.setBusy(false);
          });
      },

      /**
       * Open product page button press event handler.
       *
       * @param {sap.ui.base.Event} oEvent event object.
       */
      onCategoryPress: function (oEvent) {
        var nCategoryId = oEvent.getSource().getBindingContext("oData").getObject("ID");

        if (!this.getView().getModel("stateModel").getProperty("/EditMode")) {
          this.navigate("ObjectPageCategory", {
            CategoryId: nCategoryId,
          });
        } else {
          MessageBox.warning(this.getResourceBundle("WarningEditMode"));
        }
      }
    });
  }
);
