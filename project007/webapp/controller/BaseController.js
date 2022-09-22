sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "webapp/model/formatter",
    "sap/ui/core/ValueState",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Sorter",
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, formatter, ValueState, MessageToast, MessageBox, Sorter) {
    "use strict";

    return Controller.extend("webapp.controller.BaseController", {
      formatter: formatter,
      /**
       * Go to next page demo.
       *
       * @param {string} sRoute path to page.
       * @param {Object} oParams additional options.
       */
      navigate: function (sRoute, oParams, flag) {
        this.getOwnerComponent().getRouter().navTo(sRoute, oParams, flag);
      },

      /**
       * Returns a value from the i18n model.
       *
       * @param {string} sText value name.
       * @param {string} sRecipient extra options.
       * @param {string} sSuffix extra options.
       *
       * @returns {string} value.
       */
      i18n: function (sText, sRecipient, sSuffix) {
        return this.getView().getModel("i18n").getResourceBundle().getText(sText, [sRecipient, sSuffix]);
      },

      /**
       * Open list report page button press event handler.
       */
      onNavToCategoriesOverview: function () {
        var oStateModel = this.getView().getModel("stateModel");
        var EditMode = oStateModel.getProperty("/EditMode");

        if (!EditMode) {
          this.navigate("ListReport");
        }
      },

      /**
       * Register the view with the message manager.
       */
      onRegisterManager: function () {
        this.oMessageManager = sap.ui.getCore().getMessageManager();
        this.oMessageManager.registerObject(this.getView(), true);
        this.getView().setModel(
          this.oMessageManager.getMessageModel(),
          "messages"
        );
      },

      /**
       * Сollects an array.
       *
       * @param {array} aFieldGroupId array elements.
       * @param {string} sQuery type control.
       *
       * @returns array elements.
       */
      collectsArray: function (aFieldGroupId, sQuery) {
        return aFieldGroupId.filter((oItem) => oItem.isA(`sap.m.${sQuery}`));
      },

      /**
       * Сollects an array of fields.
       *
       * @param {string} sGroupID id group.
       *
       * @returns array elements.
       *
       * @private
       */
      _collectsFields: function (sGroupID) {
        var aFieldGroupId = this.getView().getControlsByFieldGroupId(sGroupID);
        var aInput = this.collectsArray(aFieldGroupId, "Input");
        var aDatePicker = this.collectsArray(aFieldGroupId, "DatePicker");

        return [...aInput, ...aDatePicker];
      },

      /**
       * Сhecks for empty fields.
       *
       * @param {string} sGroupID id group.
       *
       * @returns array elements.
       *
       * @private
       */
      _checkFields: function (sGroupID) {
        var bCheck = sGroupID === "groupValueNewProduct" ? this._checkData() : false;
        this._collectsFields(sGroupID).forEach((oField) => {
          if (!oField.getValue().trim()) {
            oField.setValueState(ValueState.Error);
            bCheck = true;
          }
        });
        return bCheck;
      },

      /**
       * check field.
       *
       * @param {sap.ui.base.Event} oEvent event object.
       */
      checkField: function (oEvent) {
        oEvent.getSource().setValueState(ValueState.None);
      },

      /**
       * Creates element.
       *
       * @param {string} sProperty type new element.
       *
       */
      onCreate: function (sProperty) {
        var nCountError = this.getView().getModel("messages")?.getData().length;
        var sSuffix = nCountError === 1 ? "" : "s";

        switch (sProperty) {
          case "Product":
          case "Category":
            this._createNewElement(sProperty, nCountError, sSuffix);
            break;
          default:
            if (this._checkFields("groupEditValueProduct")) {
              MessageBox.alert(this.i18n("AlertMessage"));
            } else if (this._checkDataInTable("groupEditValueProduct")) {
              MessageBox.alert(this.i18n("AlertInvalidDateMessage"));
            } else if (nCountError) {
              MessageBox.alert(this.i18n("CountError", nCountError, sSuffix));
            } else {
              this.getView().getModel().submitChanges();
              this.onCancelButton();
              MessageToast.show(this.i18n("SuccessEdited"));
            }
            break;
        }
      },

      /**
       * Creates new element.
       *
       * @param {string} sProperty type new element.
       * @param {number} nCountError count errors.
       * @param {string} sSuffix suffix.
       *
       */
       _createNewElement: function (sProperty, nCountError, sSuffix) {
        if (this._checkFields(`groupValueNew${sProperty}`)) {
          MessageBox.alert(this.i18n("AlertMessage"));
        } else if (nCountError) {
          MessageBox.alert(this.i18n("CountError", nCountError, sSuffix));
        } else {
          this.getView().getModel().submitChanges();
          this.onDialogCategoryClosePress();
          MessageToast.show(this.i18n(`SuccessCreated${sProperty}`));
        }
      },

      /**
       * Check Discontinued Data.
       *
       * @private
       */
      _checkData: function () {
        var sReleaseDate = this.byId("NewProductReleaseDate");
        var sDiscontinuedDate = this.byId("NewProductDiscontinuedDate");
        var bCheck = false;

        if (new Date(sReleaseDate.getValue()) > new Date(sDiscontinuedDate.getValue())) {
          bCheck = true;
          sDiscontinuedDate.setValue("");
          sDiscontinuedDate.setValueState(ValueState.Error);
        }
        return bCheck
      },

      /**
       * Check Discontinued Date in table.
       *
       * @private
       */
      _checkDataInTable: function(sGroupID){
        var aFieldGroupId = this.getView().getControlsByFieldGroupId(sGroupID);
        var aDatePicker   = this.collectsArray(aFieldGroupId, "DatePicker");
        var bCheck        = false;

        for (let i = 0; i < aDatePicker.length; i++){
          var j = i + 1;
          if (new Date(aDatePicker[i].getValue().trim()) > new Date(aDatePicker[j].getValue().trim())) {
            aDatePicker[j].setValueState(ValueState.Error);
            aDatePicker[j].setValue('');
            bCheck = true;
          }
          i++
        }
        return bCheck
      },

     /**
     * Sort products button press event handler.
     *
     * @param {string} sPropertyName sorting type.
     * @param {string} sTableID Table ID.
     */
      onSortButtonPress: function (sPropertyName, sTableID) {
        var oStateModel = this.getView().getModel("stateModel");
        var oItemsBinding = this.byId(sTableID).getBinding("items");

        oItemsBinding.sort(this.getSorter(sPropertyName, oStateModel));
      },

      /**
       * Return constructor object.
       *
       * @param {string} sPropertyName sorted column name.
       * @param {object} oStateModel JSON modal.
       *
       * @returns Constructor object.
       */
      getSorter: function (sPropertyName, oStateModel) {
        var oSortType = oStateModel.getProperty("/sortType");
        var oSorter;

        Object.keys(oSortType).forEach(function (sTypeName) {
          if (sPropertyName === sTypeName) {
            switch (oSortType[sTypeName]) {
              case "sort":
                oStateModel.setProperty(
                  `/sortType/${sTypeName}`,
                  "sort-ascending"
                );
                oSorter = new Sorter(sPropertyName, false);
                break;
              case "sort-ascending":
                oStateModel.setProperty(
                  `/sortType/${sTypeName}`,
                  "sort-descending"
                );
                oSorter = new Sorter(sPropertyName, true);
                break;
              default:
                oStateModel.setProperty(`/sortType/${sTypeName}`, "sort");
                oSorter = null;
                break;
            }
          } else {
            oStateModel.setProperty(`/sortType/${sTypeName}`, "sort");
          }
        });
        return oSorter;
      },

      /**
       * Creates new element.
       *
       * @param {string} sProperty type new element.
       * @param {number} nCountError count errors.
       * @param {string} sSuffix suffix.
       *
       */
      _createNewElement: function (sProperty, nCountError, sSuffix) {
        if (this._checkFields(`groupValueNew${sProperty}`)) {
          MessageBox.alert(this.i18n("AlertMessage"));
        } else if (nCountError) {
          MessageBox.alert(this.i18n("CountError", nCountError, sSuffix));
        } else {
          this.getView().getModel().submitChanges();
          this.onDialogCategoryClosePress();
          MessageToast.show(this.i18n(`SuccessCreated${sProperty}`));
        }
      },
    });
  }
);
