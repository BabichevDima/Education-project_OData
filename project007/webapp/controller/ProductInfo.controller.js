// this.getOwnerComponent().getRouter().getHashChanger()
sap.ui.define(
  [
    'project007/controller/BaseController',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Sorter',
    'sap/m/MessageToast'
  ],
  function(
    BaseController,
    Filter,
    FilterOperator,
    JSONModel,
    Sorter,
    MessageToast
  ) {
    'use strict';


    return BaseController.extend('project007.controller.ProductInfo', {
      /**
			 * Controller's "init" lifecycle method.
			 */
      onInit: function() {

      },

    });
  }
);
