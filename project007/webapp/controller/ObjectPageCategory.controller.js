sap.ui.define(
  [
    "webapp/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
  ],
  function (BaseController, JSONModel, MessageBox, MessageToast) {
    "use strict";

    return BaseController.extend("webapp.controller.ObjectPageCategory", {
      /**
       * Controller's init lifecycle method.
       */
      onInit: function () {
        this.onRegisterManager();
        this.getOwnerComponent().getRouter().getRoute("ObjectPageCategory").attachPatternMatched(this._onPatternMatched, this);
        this._setStateModel();

        this.getView().addEventDelegate(
          {
            onBeforeHide: function () {
              this.onCancelButton();
            },
          },
          this
        );
      },

      /**
       * Creates a view model to store locally on the view.
       *
       * @private
       */
      _setStateModel: function () {
        var oStateModel = new JSONModel({
          EditMode: false,
          StatusButtons: false,
        });

        this.getView().setModel(oStateModel, "stateModel");
      },

      /**
       * "StoreDetails" route pattern matched event handler.
       *
       * @param {sap.ui.base.Event} oEvent event object.
       *
       * @private
       */
      _onPatternMatched: function (oEvent) {
        var that         = this;
        var oDataModel   = this.getView().getModel();
        this.sCategoryId = oEvent.getParameter("arguments").CategoryId;

        oDataModel.metadataLoaded().then(function () {
          var sKey = oDataModel.createKey("/Categories", {
            ID: that.sCategoryId,
          });

          that.getView().bindObject({
            path: sKey,
          });
        });
      },

      /**
       * Edits table fields.
       *
       */
      onEditButton: function () {
        var oStateModel = this.getView().getModel("stateModel");
        oStateModel.setProperty("/EditMode", true);
      },

      /**
       * Close edit mode.
       */
      onCancelButtonPress: function () {
        var oStateModel = this.getView().getModel("stateModel");
        oStateModel.setProperty("/EditMode", false);
      },

      /**
       * Selects a row.
       */
      onSelectionTableCategories: function () {
        var oStateModel         = this.getView().getModel("stateModel");
        var bIsSelectedContexts = this.byId("ProductsTableCategories").getSelectedContexts();

        oStateModel.setProperty("/StatusButtons", !!bIsSelectedContexts.length);
      },

      /**
       * Open product page button press event handler.
       *
       * @param {sap.ui.base.Event} oEvent event object.
       */
      onProductPress: function (oEvent) {
        var nProductId = oEvent.getSource().getBindingContext().getObject("ID");

        this.navigate("ProductInfo", {
          CategoryId: this.sCategoryId,
          productId: nProductId,
        });
      },

      /**
       * Asks for confirmation of deletion.
       *
       */
      onDeleteCategoryButton: function () {
        var that        = this;
        var oODataModel = this.getView().getModel();
        that.getView().setBusy(true);

        MessageBox.confirm(that.i18n("WarningMessage", "Category"), {
          actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
          emphasizedAction: MessageBox.Action.OK,
          onClose: function (sAction) {
            if (sAction === MessageBox.Action.OK) {
              oODataModel.resetChanges();
              that.onConfirmDeletion();
            } else {
              that.getView().setBusy(false);
              MessageToast.show(that.i18n("MessageCategoryNotDeleted"));
            }
          },
        });
      },

      /**
       * Deletes Category.
       *
       */
      onConfirmDeletion: function () {
        var aPathLink = this.byId("ProductsTableCategories").getBinding("items").getContexts().map((oProduct) => oProduct.getPath());

        aPathLink.length ? this._deleteCategoryWithProducts(aPathLink) : this._deleteCategory();
      },

      /**
       * Deletes Category.
       *
       * @private
       */
      _deleteCategory: function () {
        var that        = this;
        var oODataModel = this.getView().getModel();
        var sKey        = oODataModel.createKey("/Categories", {ID: that.sCategoryId});

        oODataModel.remove(sKey, {
          success: function () {
            that.getView().setBusy(false);
            MessageToast.show(that.i18n("MessageDeleteSuccess"));
            that.navigate("ListReport", null, true);
          },
          error: function () {
            that.getView().setBusy(false);
            MessageBox.error(that.i18n("MessageDeleteError"));
          },
        });
      },

      /**
       * Deletes Category with Products.
       *
       * @param {array} aPathLink array Path.
       *
       * @private
       */
      _deleteCategoryWithProducts: function (aPathLink) {
        var that        = this;
        var oODataModel = this.getView().getModel();

        oODataModel.setUseBatch(true);

        var aDeferredGroups = oODataModel.getDeferredGroups();
        aDeferredGroups     = aDeferredGroups.concat(["myID"]);
        oODataModel.setDeferredGroups(aDeferredGroups);

        var nContentID = 1;
        aPathLink.forEach((sPath) => {
          oODataModel.remove(`${sPath}/Category`, {
            headers: { "Content-ID": nContentID },
            groupId: "myID",
          });
          nContentID++;

          oODataModel.remove(sPath, {
            headers: { "Content-ID": nContentID },
            groupId: "myID",
          });
          nContentID++;
        });

        oODataModel.submitChanges({
          groupId: "myID",
          success: function (result) {
            that.getView().setBusy(false);
            MessageToast.show(that.i18n("MessageDeleteSuccess"));
            that.navigate("ListReport", null, true);
          },
          error: function () {
            that.getView().setBusy(false);
            MessageBox.error(that.i18n("MessageDeleteError"));
          },
        });
      },

      /**
       * "Save" button press event handler.
       */
      onSaveButton: function () {
        var oODataModel = this.getView().getModel();

        oODataModel.submitChanges();
        this.onCancelButton();
        MessageToast.show(this.i18n("SuccessEdited"));
      },

      /**
       * Close edit mode.
       */
      onCancelButton: function () {
        var oStateModel = this.getView().getModel("stateModel");
        var oODataModel = this.getView().getModel();

        this.byId("ProductsTableCategories").removeSelections(true);

        oStateModel.setProperty("/StatusButtons", false);
        oStateModel.setProperty("/EditMode", false);
        oODataModel.setUseBatch(false);
        oODataModel.resetChanges();
      },

      /**
       * Cancel button click action.
       *
       */
      onConfirmCancelEditMode: function () {
        var that = this;

        if (this.getView().getModel().hasPendingChanges()) {
          MessageBox.confirm(that.i18n("ConfirmMessage"), {
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            emphasizedAction: MessageBox.Action.YES,
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.YES) {
                that.onSaveButton();
              } else {
                that.onCancelButton();
              }
            },
          });
        } else {
          that.onCancelButton();
        }
      },

      /**
       * Asks for confirmation of deletion.
       *
       */
      onDeleteProductButton: function () {
        var that             = this;
        var nSelectedProduct = this.byId("ProductsTableCategories").getSelectedContexts().length;

        this.getView().setBusy(true);

        MessageBox.confirm(that.i18n("WarningMessage", nSelectedProduct === 1 ? "Product" : "Products"), {
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            emphasizedAction: MessageBox.Action.YES,
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.YES) {
                that.onConfirmDeletionProduct();
              } else {
                that.getView().setBusy(false);
                that.byId("ProductsTableCategories").removeSelections(true);
              }
            },
          }
        );
      },

      /**
       * Deletes product.
       *
       */
      onConfirmDeletionProduct: function () {
        var that             = this;
        var oODataModel      = this.getView().getModel();
        var oStateModel      = this.getView().getModel("stateModel");
        var bEditMode        = oStateModel.getProperty("/EditMode");
        var oProductTable    = this.byId("ProductsTableCategories");
        var nSelectedProduct = oProductTable.getSelectedContexts().length;
        var aSelectedProduct = oProductTable.getSelectedContexts().map((oProduct) => oProduct.getPath());

        oODataModel.setUseBatch(true);

        var aDeferredGroups = oODataModel.getDeferredGroups();
        aDeferredGroups     = aDeferredGroups.concat(["deleteProductID"]);
        oODataModel.setDeferredGroups(aDeferredGroups);

        var nContentID = 1;
        aSelectedProduct.forEach((sPath) => {
          oODataModel.remove(`${sPath}/$links/Category`, {
            headers: { "Content-ID": nContentID },
            groupId: "deleteProductID",
          });
          nContentID++;
          oODataModel.remove(`${sPath}/$links/Supplier`, {
            headers: { "Content-ID": nContentID },
            groupId: "deleteProductID",
          });
          nContentID++;
          oODataModel.remove(sPath, {
            headers: { "Content-ID": nContentID },
            groupId: "deleteProductID",
          });
          nContentID++;
        });

        oODataModel.submitChanges({
          groupId: "deleteProductID",
          success: function () {
            that.getView().setBusy(false);
            bEditMode ? oProductTable.removeSelections(true) : that.onCancelButton();
            MessageToast.show(that.i18n("MessageDeleteSuccess", nSelectedProduct === 1 ? "Product" : "Products"));
          },
          error: function () {
            that.getView().setBusy(false);
            that.onCancelButton();
            MessageBox.error(that.i18n("MessageDeleteError"));
          },
        });
      },
    });
  }
);
