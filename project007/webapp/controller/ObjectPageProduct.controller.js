// this.getOwnerComponent().getRouter().getHashChanger()
sap.ui.define(
  ["webapp/controller/BaseController",
  "sap/ui/model/json/JSONModel"],
  function (BaseController, JSONModel) {
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
       */
      onNavToCategory: function () {
        this.navigate("ObjectPageCategory", {CategoryId: this.sCategoryId, mode: "display"});
      },

      /**
       * Edits table fields.
       *
       */
      onEditButton: function () {
        this.navigate("ProductInfo", {CategoryId: this.sCategoryId, productId: this.sProductId, mode: "edit"}, true);
      },
    });
  }
);
