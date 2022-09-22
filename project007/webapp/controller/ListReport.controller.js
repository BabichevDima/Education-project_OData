sap.ui.define(
  [
    "webapp/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/ValueState",
  ],
  function (
    BaseController,
    JSONModel,
    Fragment,
    MessageBox,
    MessageToast,
    Filter,
    FilterOperator,
    ValueState
  ) {
    "use strict";

    return BaseController.extend("webapp.controller.ListReport", {
      /**
       * Controller's "init" lifecycle method.
       */
      onInit: function () {
        this._setStateModel();
        this.onRegisterManager();
        this.getOwnerComponent().getRouter().getRoute("ListReport").attachPatternMatched(this.onPatternMatched, this);
      },

      /**
       * Product overview route pattern matched event handler.
       *
       * @param {sap.ui.base.Event} oEvent event object.
       */
      onPatternMatched: function (oEvent) {
        this.oArgs           = oEvent.getParameter("arguments");
        this.oArgs["?query"] = this.oArgs["?query"] || {};

        this._setValueInFilterBar()
        this.combineFilters();

        this.getView().getModel().setUseBatch(false);
      },

      /**
       * Controller's lifecycle method. This method is called every time the View is rendered, after the HTML is placed in the DOM-Tree.
       *
       * This internal logic is responsible for counting the number of Categories.
       *
       */
      onAfterRendering: function () {
        var oStateModel = this.getView().getModel("stateModel");
        var oBinding    = this.byId('CategoriesTable').getBinding('items');

        oBinding.attachChange(function() {
          oStateModel.setProperty("/CategoriesCount", oBinding.getLength());
        })
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
          sortType: {
            Name: "sort",
            ID: "sort",
          },
        });

        this.getView().setModel(oStateModel, "stateModel");
      },

      /**
       * Selects a row.
       */
      onSelectionTable: function () {
        var oStateModel = this.getView().getModel("stateModel");
        var bIsSelectedContexts =
          this.byId("CategoriesTable").getSelectedContexts();

        oStateModel.setProperty("/StatusButtons", !!bIsSelectedContexts.length);
      },

      /**
       * Close edit mode.
       */
      onCancelButton: function () {
        var oStateModel = this.getView().getModel("stateModel");
        var oODataModel = this.getView().getModel();

        this.byId("CategoriesTable").removeSelections(true);
        this._collectsFields("groupEditValueProduct").forEach(oField => oField.setValueState(ValueState.None));

        oStateModel.setProperty("/StatusButtons", false);
        oStateModel.setProperty("/EditMode", false);
        oODataModel.resetChanges();
      },

      /**
       * Cancel button click action.
       *
       */
      onConfirmCancelEditMode: function () {
       var that = this;
       var bCheck = this._checkFields("groupEditValueProduct");
       var nCountError = this.getView().getModel("messages")?.getData();

       if (this.getView().getModel().hasPendingChanges() || bCheck || nCountError) {
         MessageBox.confirm(that.i18n("ConfirmMessage"), {
           actions: [MessageBox.Action.YES, MessageBox.Action.NO],
           emphasizedAction: MessageBox.Action.YES,
           onClose: function (sAction) {
             if (sAction === MessageBox.Action.YES) {
               that.onCancelButton();
             }
           },
         });
       } else {
         that.onCancelButton();
       }
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
        var nCategoryId = oEvent.getSource().getBindingContext().getObject("ID");

        this.onCancelButton();
        this.navigate("ObjectPageCategory", {CategoryId: nCategoryId, mode: "display"});
      },

      /**
       * Downloads dialog.
       *
       * @param {number} nIDNewCategory ID new category.
       */
      openDialog: function (aCategories) {
        var nNewCategoryID = aCategories[aCategories.length - 1].ID + 1;
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
                Name: null,
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
        var that = this;
        var oODataModel = this.getView().getModel();
        this.getView().setBusy(true);

        oODataModel.read(`/Categories`, {
          urlParameters: { $orderby: "ID" },
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
        this._collectsFields("groupValueNewCategory").forEach(oField => oField.setValueState(ValueState.None));
        this._closeCategoryDialog();
      },

      /**
       * Close dialog.
       *
       * @private
       */
      _closeCategoryDialog() {
        var oODataModel = this.getView().getModel();
        var oView = this.getView();

        this._oDialog.then(function (oDialog) {
          var oCtx = oDialog.getBindingContext();
          oODataModel.deleteCreatedEntry(oCtx);
          oDialog.close();
          oView.setBusy(false);
        });
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
        var that = this;
        var oODataModel = this.getView().getModel();
        var aSelectedCategory = this.byId("CategoriesTable").getSelectedContexts().map((oCategory) => oCategory.getPath());

        oODataModel.setUseBatch(true);

        var aDeferredGroups = oODataModel.getDeferredGroups();
        aDeferredGroups = aDeferredGroups.concat(["deleteCategoryID"]);
        oODataModel.setDeferredGroups(aDeferredGroups);

        var nContentID = 1;
        aSelectedCategory.forEach((sPath) => {
          oODataModel.remove(sPath, {
            headers: { "Content-ID": nContentID },
            groupId: "deleteCategoryID"
          });
          nContentID++;
        });

        oODataModel.submitChanges({
          groupId: "deleteCategoryID",
          success: function () {
            that.onSelectionTable();
            that.byId("CategoriesTable").removeSelections(true);
            that.getView().setBusy(false);
            oODataModel.setUseBatch(false);
          },
          error: function () {
            MessageBox.error(that.i18n("MessageDeleteError"));
          },
        });
      },

      /**
       * Asks for confirmation of deletion.
       *
       */
      onDeleteCategoryButton: function () {
        var that = this;
        var nSelectedCategory = this.byId("CategoriesTable").getSelectedContexts().length;
        this.getView().setBusy(true);

        MessageBox.confirm(
          that.i18n(
            "WarningMessage",
            nSelectedCategory === 1 ? "Category" : "Categories"
          ),
          {
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            emphasizedAction: MessageBox.Action.OK,
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.OK) {
                that.onConfirmDeletion();
                MessageToast.show(that.i18n("MessageDeleteSuccess", nSelectedCategory === 1 ? "Category" : "Categories"));
              } else {
                that.getView().setBusy(false);
                that.byId("CategoriesTable").removeSelections(true);
                that.getView().getModel("stateModel").setProperty("/StatusButtons", false);
                MessageToast.show(that.i18n("MessageCategoryNotDeleted"));
              }
            },
          }
        );
      },

      /**
       * Combine all filters.
       */
      combineFilters: function () {
        var oStateModel         = this.getView().getModel("stateModel");
        var sAllFieldValue      = oStateModel.getProperty("/AllField")?.trim();
        var aCategoryNameValue  = this.byId("Category").getSelectedKeys();
        var nCategoryCharacters = this.byId("CategoryCharacters").getValue();
        var oItemsBinding       = this.byId("CategoriesTable").getBinding("items");
        var aFilters            = [];

        if (sAllFieldValue && !isNaN(sAllFieldValue)) {
          aFilters.push(new Filter("ID", FilterOperator.EQ, sAllFieldValue));
        } else if (sAllFieldValue) {
          aFilters.push(
            new Filter("Name", FilterOperator.Contains, sAllFieldValue)
          );
        }

        if (aCategoryNameValue) {
          aFilters.push(
            ...aCategoryNameValue.map(
              (sValue) => new Filter("Name", FilterOperator.Contains, sValue)
            )
          );
        }

        if (nCategoryCharacters) {
          aFilters.push(
            new Filter({
              path: "Name",
              test: function(oValue) {
                return oValue.length >= nCategoryCharacters
              }
            })
          )
        }

        oItemsBinding.filter(aFilters);
      },

      /**
       * Sets parameters in Route.
       *
       * @param {string} sNameFilter
       */
      setQueryRoute: function (sNameFilter) {
        switch (sNameFilter) {
          case "Name":
            this.byId("searchField").getValue()
              ? (this.oArgs["?query"].Name = this.byId("searchField").getValue())
              : delete this.oArgs["?query"].Name;
            break;
          case "Category":
            this.byId("Category").getSelectedKeys().length
              ? (this.oArgs["?query"].Category = this.byId("Category").getSelectedKeys())
              : delete this.oArgs["?query"].Category;
            break;
          case "Characters":
            !this.byId("CategoryCharacters").getValue()
              ? delete this.oArgs["?query"].Characters
              : (this.oArgs["?query"].Characters = this.byId("CategoryCharacters").getValue());
            break;
        }
        this.navigate("ListReport", this.oArgs, true);
      },

       /**
       * Sets value in filter bar.
       *
       * @private
       */
      _setValueInFilterBar: function() {
        if(this.oArgs["?query"].Name){
          this.byId("searchField").setValue(this.oArgs["?query"].Name);
        }

        if (this.oArgs["?query"].Category){
          var aSelectedCategories = this.oArgs["?query"].Category.split(",");
          this.byId("Category").setSelectedKeys(aSelectedCategories);
        }

        if(this.oArgs["?query"].Characters){
          this.byId("CategoryCharacters").setValue(this.oArgs["?query"].Characters);
        }
      },
    });
  }
);
