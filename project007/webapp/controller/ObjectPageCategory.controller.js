sap.ui.define(
  [
    "project007/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/ValueState",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
  ],
  function (
    BaseController,
    JSONModel,
    Filter,
    FilterOperator,
    ValueState,
    MessageToast,
    Fragment,
    MessageBox
  ) {
    "use strict";

    return BaseController.extend("project007.controller.ObjectPageCategory", {
      /**
       * Controller's init lifecycle method.
       */
      onInit: function () {
        this.getOwnerComponent()
          .getRouter()
          .getRoute("ObjectPageCategory")
          .attachPatternMatched(this._onPatternMatched, this);
        this._setStateModel();
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
        var that = this;
        var oDataModel = this.getView().getModel("oData");
        this.sCategoryId = oEvent.getParameter("arguments").CategoryId;

        oDataModel.metadataLoaded().then(function () {
          var sKey = oDataModel.createKey("/Categories", {
            ID: that.sCategoryId,
          });

          that.getView().bindObject({
            path: sKey,
            model: "oData",
          });
        });
      },

      /**
       * Edits table fields.
       *
       * @param {sap.ui.base.Event} oEvent event object.
       */
      onEditButton: function (oEvent) {
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
        var oStateModel = this.getView().getModel("stateModel");
        var bIsSelectedContexts = this.byId(
          "ProductsTableCategories"
        ).getSelectedContexts();

        oStateModel.setProperty("/StatusButtons", !!bIsSelectedContexts.length);
      },

      /**
       * Open product page button press event handler.
       *
       * @param {sap.ui.base.Event} oEvent event object.
       */
      onProductPress: function (oEvent) {
        var nProductId = oEvent
          .getSource()
          .getBindingContext("oData")
          .getObject("ID");

        this.navigate("ProductInfo", {
          CategoryId: this.sCategoryId,
          productId: nProductId,
        });
      },
    });
  }
);
