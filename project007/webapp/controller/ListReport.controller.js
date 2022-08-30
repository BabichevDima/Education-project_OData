sap.ui.define(
  [
    "webapp/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  function (BaseController, JSONModel, Fragment, MessageBox, MessageToast, Filter, FilterOperator) {
    "use strict";

    return BaseController.extend("webapp.controller.ListReport", {
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
        var oODataModel = this.getView().getModel();

        this.byId("CategoriesTable").removeSelections(true);

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
      },

      /**
       * Dialog product edit "Save" button press event handler.
       */
      onSaveButton: function () {
        var oODataModel = this.getView().getModel();

        if (oODataModel.hasPendingChanges()) {
          oODataModel.submitChanges();
          this.onCancelButton();
          MessageToast.show(this.i18n("CategorySuccessEdited"));
        } else {
          MessageToast.show(this.i18n("CategoryNotEdited"));
        }
      },

      /**
       * Open product page button press event handler.
       *
       * @param {sap.ui.base.Event} oEvent event object.
       */
      onCategoryPress: function (oEvent) {
        var nCategoryId = oEvent
          .getSource()
          .getBindingContext()
          .getObject("ID");

        this.navigate("ObjectPageCategory", {
          CategoryId: nCategoryId,
        });

      },

      /**
       * Downloads dialog.
       *
       * @param {number} nIDNewCategory ID new category.
       */
      openDialog: function (aCategories) {
        var nNewCategoryID = aCategories[aCategories.length-1].ID+1;
        var oView = this.getView();
        var oODataModel = oView.getModel();

        if (!this._oDialog) {
          this._oDialog = Fragment.load({
            id: oView.getId(),
            name: "webapp.view.fragments.CategoryDialog",
            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            return oDialog;
          });
        }
        this._oDialog
          .then(function (oDialog) {
            var oEntryCtx = oODataModel.createEntry("/Categories", {
              properties: {
                Name: "TEST NEW Category",
                ID: nNewCategoryID,
              },
            });

            oDialog.setBindingContext(oEntryCtx);
            oDialog.setModel(oODataModel);
            oView.setBusy(false);
            oDialog.open();
          })
          .catch(function () {
            MessageBox.error();
            oView.setBusy(false);
          });
      },

      /**
       * Opens dialog.
       *
       */
      onOpenDialogCategory: function () {
        var that        = this;
        var oODataModel = this.getView().getModel();
        this.getView().setBusy(true);

        oODataModel.read(`/Categories`, {
          urlParameters: {$orderby: "ID"},
          success: function (mData) {
            that.openDialog(mData.results);
          },
          error: function (response) {
            MessageBox.error(response.message);
            that.getView().setBusy(false);
          },
        });
      },

      /**
       * "Search stores" event handler of the "SearchField".
       *
       */
      onDialogCategoryClosePress: function () {
        this._closeCategoryDialog();
      },

      /**
       * Close dialog.
       *
       */
      _closeCategoryDialog() {
        var oODataModel = this.getView().getModel();
        var oView = this.getView();

        this._oDialog.then(function (oDialog) {
          var oCtx = oDialog.getBindingContext();
          oODataModel.deleteCreatedEntry(oCtx);
          oDialog.close();
          oView.setBusy(false);
        })
      },

      /**
       * Creates element.
       *
       */
      onCreateCategory: function () {
        this.getView().getModel().submitChanges();
        this._closeCategoryDialog();
      },

      /**
       * Deletes product.
       *
       */
       onConfirmDeletion: function () {
        var that              = this;
        var oODataModel       = this.getView().getModel();
        var oStateModel       = this.getView().getModel("stateModel");
        var aSelectedCategory = this.byId("CategoriesTable").getSelectedContexts().map((oCategory) => oCategory.getPath());

        aSelectedCategory.forEach((sPath) => {
          oODataModel.remove(sPath, {
            success: function () {
              that.onSelectionTable();
              oStateModel.setProperty("/StatusButtons", false);
            },
            error: function () {
              MessageBox.error(that.i18n("MessageDeleteError"));
            },
          });
        });
      },

      /**
       * Asks for confirmation of deletion.
       *
       */
      onDeleteCategoryButton: function () {
        var that = this;
        var nSelectedCategory = this.byId("CategoriesTable").getSelectedContexts().length;

        MessageBox.confirm(
          that.i18n("WarningMessage", nSelectedCategory === 1 ? "Category" : "Categories"),
          {
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            emphasizedAction: MessageBox.Action.OK,
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.OK) {
                that.onConfirmDeletion();
                MessageToast.show(that.i18n("MessageDeleteSuccess"));
              } else {
                that.getView().setBusy(false);
                MessageToast.show(that.i18n("MessageNotDeleteSuccessCategory"));
              }
            },
          }
        );
      },

      /**
      * Combine all filters.
      */
       combineFilters: function() {
        var oStateModel         = this.getView().getModel("stateModel");
        var sAllFieldValue      = oStateModel.getProperty("/AllField")?.trim();
        var aCategoryNameValue  = this._getArrayCategories();
        var oItemsBinding       = this.byId("CategoriesTable").getBinding("items");
        var aFilters            = [];

        if (sAllFieldValue && !isNaN(sAllFieldValue)){
          aFilters.push(new Filter("ID", FilterOperator.EQ, sAllFieldValue));
        } else if (sAllFieldValue){
          aFilters.push(new Filter("Name", FilterOperator.Contains, sAllFieldValue));
        }

        if (aCategoryNameValue) {
          aFilters.push(...aCategoryNameValue.map((sValue) => {return new Filter("Name", FilterOperator.Contains, sValue)}));
        }
        oItemsBinding.filter(aFilters)
      },

      /**
       * Get an array of suppliers.
       * 
       * @returns {Array} Suppliers.
       * 
       * @private
       */
      _getArrayCategories: function () {
       var aSelectedItems = this.byId("Category").getSelectedItems();
       if(aSelectedItems.length){
        return aSelectedItems.map(oItem => oItem.getText())
       }
      },
    });
  }
);
