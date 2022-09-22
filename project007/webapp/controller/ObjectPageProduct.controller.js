// this.getOwnerComponent().getRouter().getHashChanger()
sap.ui.define(
  ["webapp/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageBox",
  "sap/m/MessageToast"],
  function (BaseController, JSONModel, MessageBox, MessageToast) {
    "use strict";

    return BaseController.extend("webapp.controller.ObjectPageProduct", {
      /**
       * Controller's "init" lifecycle method.
       */
      onInit: function () {
        this.getOwnerComponent().getRouter().getRoute("ProductInfo").attachPatternMatched(this._onPatternMatched, this);
      },

      /**
       * "StoreDetails" route pattern matched event handler.
       *
       * @param {sap.ui.base.Event} oEvent event object.
       *
       * @private
       */
      _onPatternMatched: function (oEvent) {
        var that          = this;
        var oDataModel    = this.getView().getModel();
        this.sCategoryId  = oEvent.getParameter("arguments").CategoryId;
        this.sProductId   = oEvent.getParameter("arguments").productId;
        this.editMode     = oEvent.getParameter("arguments").mode === "edit";

        oDataModel.metadataLoaded().then(function () {
          var sKey = oDataModel.createKey("/Products", {
            ID: that.sProductId,
          });

          that.getView().bindObject({
            path: sKey,
            parameters: {
              expand: "Supplier",
            },
          });
        });

        this._setStateModel();
      },

      /**
       * Creates a view model to store locally on the view.
       *
       * @private
       */
       _setStateModel: function () {
        var oStateModel = new JSONModel({
          EditMode: this.editMode,
        });

        this.getView().setModel(oStateModel, "stateModel");
      },

      /**
       * Open products overview page button press event handler.
       * 
       * @param {boolean} bReplace additional Param.
       */
      onNavToCategory: function (bReplace) {
        this.navigate("ObjectPageCategory", {CategoryId: this.sCategoryId, mode: "display"}, bReplace);
      },

      /**
       * Edits table fields.
       *
       */
      onEditButton: function () {
        this.navigate("ProductInfo", {CategoryId: this.sCategoryId, productId: this.sProductId, mode: "edit"}, true);
      },

      /**
       * Asks for confirmation of deletion.
       *
       */
       onDeleteProductButton: function () {
        var that = this;
        this.getView().setBusy(true);

        MessageBox.confirm( that.i18n("WarningMessage", "Product"), {
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            emphasizedAction: MessageBox.Action.YES,
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.YES) {
                that.onConfirmDeletionProduct();
              } else {
                that.getView().setBusy(false);
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
        var that               = this;
        var oODataModel        = this.getView().getModel();
        var sPath              = `/Products(${this.sProductId})`
        var nContentID         = 1;
        var aDeferredGroups    = oODataModel.getDeferredGroups();
        aDeferredGroups        = aDeferredGroups.concat(["deleteProductID"]);

        oODataModel.setDeferredGroups(aDeferredGroups);
        oODataModel.setUseBatch(true);
        oODataModel.remove(`${sPath}/$links/Category`, {
          headers: {"Content-ID": nContentID++},
          groupId: "deleteProductID",
        });

        oODataModel.remove(`${sPath}/$links/Supplier`, {
          headers: {"Content-ID": nContentID++},
          groupId: "deleteProductID",
        });

        oODataModel.remove(sPath, {
          headers: {"Content-ID": nContentID},
          groupId: "deleteProductID",
        });

        oODataModel.submitChanges({
          groupId: "deleteProductID",
          success: function () {
            that.getView().setBusy(false);
            that.onNavToCategory(true);
            MessageToast.show(that.i18n("MessageDeleteSuccess", "Product"));
            oODataModel.setUseBatch(false);
          },
          error: function () {
            that.getView().setBusy(false);
            MessageBox.error(that.i18n("MessageDeleteError"));
            oODataModel.setUseBatch(false);
          },
        });
      },

      /**
       * Cancel button click action.
       *
       */
       onConfirmCancelEditModeOnProduct: function () {
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
       * Close edit mode.
       */
      onCancelButton: function () {
        var oODataModel = this.getView().getModel();

        oODataModel.resetChanges();
        this.navigate("ProductInfo", {CategoryId: this.sCategoryId, productId: this.sProductId, mode: "display"}, true);
      },
    });
  }
);
