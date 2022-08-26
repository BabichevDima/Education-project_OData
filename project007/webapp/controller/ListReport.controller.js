sap.ui.define(
  [
    "project007/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
  ],
  function (BaseController, JSONModel, Fragment, MessageBox, MessageToast) {
    "use strict";

    return BaseController.extend("project007.controller.ListReport", {
      /**
       * Controller's "init" lifecycle method.
       */
      onInit: function () {
        this._setStateModel();
        this.onRegisterManager();
      },

      /**
       * Creates a view model to store locally on the view.
       *
       * @private
       */
      _setStateModel: function () {
        var oStateModel = new JSONModel({
          StatusButtons: false,
          EditMode:      false,
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
        var oODataModel = this.getView().getModel("oData");

        this.byId("CategoriesTable").getItems().forEach((elem) => (elem.mProperties.selected = false));
        this.byId("CategoriesTable").setMode("MultiSelect");

        oStateModel.setProperty("/StatusButtons", false);
        oStateModel.setProperty("/EditMode", false);
        oODataModel.resetChanges();
      },

      /**
       * Edits table fields.
       *
       * @param {sap.ui.base.Event} oEvent event object.
       */
      onEditButton: function () {
        var oStateModel = this.getView().getModel("stateModel");
        oStateModel.setProperty("/EditMode", true);
        this.byId("CategoriesTable").setMode("None");
      },

      /**
       * Dialog product edit "Save" button press event handler.
       */
      onSaveButton: function () {
        var that = this;
        var oODataModel = this.getView().getModel("oData");

        if (oODataModel.hasPendingChanges()) {
          oODataModel.submitChanges();
          this.onCancelButton();
          MessageToast.show(that.getResourceBundle("CategorySuccessEdited"));
        } else {
          MessageToast.show(that.getResourceBundle("CategoryNotEdited"));
        }
      },

      /**
       * Opens the dialog VH.
       *
       * @param {sap.ui.base.Event} oEvent event object.
       */
      handleValueHelp: function (oEvent) {
        var sInputValue = oEvent.getSource().getValue();
        var oView = this.getView();
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
        var nCategoryId = oEvent
          .getSource()
          .getBindingContext("oData")
          .getObject("ID");

        if (!this.getView().getModel("stateModel").getProperty("/EditMode")) {
          this.navigate("ObjectPageCategory", {
            CategoryId: nCategoryId,
          });
        } else {
          MessageBox.warning(this.getResourceBundle("WarningEditMode"));
        }
      },

      /**
       * Downloads dialog.
       *
       * @param {number} nIDNewCategory ID new category.
       */
      openDialog: function (nIDNewCategory) {
        var oView = this.getView();
        var oODataModel = oView.getModel("oData");

        if (!this.oDialog) {
          this.oDialog = sap.ui.xmlfragment(
            oView.getId(),
            `project007.view.fragments.CategoryDialog`,
            this
          );
          oView.addDependent(this.oDialog);
        }

        var oEntryCtx = oODataModel.createEntry("/Categories", {
          properties: {
            Name: "TEST NEW Category",
            ID: nIDNewCategory,
          },
        });

        this.oDialog.setBindingContext(oEntryCtx);
        this.oDialog.setModel(oODataModel);
        oView.setBusy(false);
        this.oDialog.open();
      },

      /**
       * Opens dialog.
       *
       */
      onOpenDialogCategory: function () {
        var that        = this;
        var oODataModel = this.getView().getModel("oData");
        this.getView().setBusy(true);

        oODataModel.read(`/Categories`, {
          success: function (mData) {
            that.openDialog(mData.results.length);
          },
          error: function () {
            MessageBox.error("Error!!!");
          },
        });
      },

      /**
       * "Search stores" event handler of the "SearchField".
       *
       * @param {sap.ui.base.Event} oEvent event object.
       */
      onDialogCategoryClosePress: function () {
        var oODataModel = this.getView().getModel("oData");
        var oCtx        = this.oDialog.getBindingContext();

        oODataModel.deleteCreatedEntry(oCtx);
        this.oDialog.close();
      },

      /**
       * Creates element.
       *
       * @param {string} sQuery create type.
       */
      onCreateCategory: function () {
        this.getView().getModel("oData").submitChanges();
        this.onDialogCategoryClosePress();
      },

      /**
       * Deletes product.
       *
       */
      onDeleteButton: function () {
        var that              = this;
        var oODataModel       = this.getView().getModel("oData");
        var oStateModel       = this.getView().getModel("stateModel");
        var aSelectedCategory = this.byId("CategoriesTable").getSelectedContexts().map((oCategory) => oCategory.getPath());

        aSelectedCategory.forEach((sPath) => {
          oODataModel.remove(sPath, {
            success: function () {
              that.getView().setBusy(false);
              MessageToast.show(`${sPath} was remove`);
              that.onSelectionTable();
              oStateModel.setProperty("/StatusButtons", false);
            },
            error: function () {
              MessageBox.error("Error!!!");
            },
          });
        });
      },

      /**
       * Asks for confirmation of deletion.
       *
       */
      onWarningMessageDialogPress: function () {
        var that = this;
        this.getView().setBusy(true);

        MessageBox.confirm(
          that.getResourceBundle("WarningMessage") + ` Category?`,
          {
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            emphasizedAction: MessageBox.Action.OK,
            onClose: function (sAction) {
              if (sAction === "OK") {
                that.onDeleteButton();
                MessageToast.show(that.getResourceBundle("MessageDeleteSuccess"));
              } else {
                that.getView().setBusy(false);
                MessageToast.show(that.getResourceBundle("MessageNotDeleteSuccessCategory"));
              }
            },
          }
        );
      },
    });
  }
);
