// this.getOwnerComponent().getRouter().getHashChanger()
sap.ui.define(
  ["webapp/controller/BaseController"],
  function (BaseController) {
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

        oDataModel.metadataLoaded().then(function () {
          var sKey = oDataModel.createKey("/Products", {
            ID: that.sProductId,
          });

          that.getView().bindObject({
            path: sKey
          });
        });
      },

      /**
       * Open products overview page button press event handler.
       */
      onNavToCategory: function () {
        this.navigate("ObjectPageCategory", {CategoryId: this.sCategoryId,});
      }
    });
  }
);
