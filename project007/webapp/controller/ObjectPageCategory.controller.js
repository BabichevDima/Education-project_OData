sap.ui.define(
  [
    "webapp/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/core/ValueState",
    "sap/ui/core/Core",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
  ],
  function (BaseController, JSONModel, MessageBox, MessageToast, Fragment, ValueState, Core, Filter, FilterOperator) {
    "use strict";

    return BaseController.extend("webapp.controller.ObjectPageCategory", {
      /**
       * Controller's init lifecycle method.
       */
      onInit: function () {
        this.onRegisterManager();
        this.getOwnerComponent().getRouter().getRoute("ObjectPageCategory").attachPatternMatched(this._onPatternMatched, this);
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
          sortType: {
            Name: "sort",
            Price: "sort",
            Description: "sort",
            ReleaseDate: "sort",
            DiscontinuedDate: "sort",
            Rating: "sort",
          },
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
        var oStateModel  = this.getView().getModel("stateModel");
        this.sCategoryId = oEvent.getParameter("arguments").CategoryId;
        this.editMode    = oEvent.getParameter("arguments").mode === "edit";

        oStateModel.setProperty("/EditMode", this.editMode);
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
       * Controller's lifecycle method. This method is called every time the View is rendered, after the HTML is placed in the DOM-Tree.
       *
       * This internal logic is responsible for counting the number of Products.
       *
       */
       onAfterRendering: function () {
        var oStateModel = this.getView().getModel("stateModel");
        var oBinding    = this.byId('ProductsTableCategories').getBinding('items');

        oBinding.attachChange(function() {
          oStateModel.setProperty("/ProductsCount", oBinding.getLength());
        })
      },

      /**
       * Edits table fields.
       *
       */
      onEditButton: function () {
        this.navigate("ObjectPageCategory", {CategoryId: this.sCategoryId, mode: "edit"}, true);
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
        var nProductId = oEvent.getSource().getBindingContext().getObject("ID");

        this.navigate("ProductInfo", {CategoryId: this.sCategoryId, productId: nProductId, mode: "display"});
      },

      /**
       * Asks for confirmation of deletion.
       *
       */
      onDeleteCategoryButton: function () {
        var that = this;
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
        var aPathLink = this.byId("ProductsTableCategories")
          .getBinding("items")
          .getContexts()
          .map((oProduct) => oProduct.getPath());

        aPathLink.length
          ? this._deleteCategoryWithProducts(aPathLink)
          : this._deleteCategory();
      },

      /**
       * Deletes Category.
       *
       * @private
       */
      _deleteCategory: function () {
        var that = this;
        var oODataModel = this.getView().getModel();
        var sKey = oODataModel.createKey("/Categories", {
          ID: that.sCategoryId,
        });

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
        var that = this;
        var oODataModel = this.getView().getModel();

        oODataModel.setUseBatch(true);

        var aDeferredGroups = oODataModel.getDeferredGroups();
        aDeferredGroups = aDeferredGroups.concat(["myID"]);
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
        var nCountError = this.getView().getModel("messages")?.getData().length;

        if (nCountError) {
          var sSuffix = nCountError === 1 ? "" : "s";
          MessageBox.alert(this.i18n("CountError", nCountError, sSuffix));
        } else {
          oODataModel.submitChanges();
          this.onCancelButton();
          MessageToast.show(this.i18n("SuccessEdited"));
        }
      },

      /**
       * Close edit mode.
       */
      onCancelButton: function (bSwitchToDisplayMode) {
        var oStateModel = this.getView().getModel("stateModel");
        var oODataModel = this.getView().getModel();

        this.byId("ProductsTableCategories").removeSelections(true);
        this._collectsFields("groupEditValueProduct").forEach(oField => oField.setValueState(ValueState.None));

        oStateModel.setProperty("/StatusButtons", false);
        oODataModel.setUseBatch(false);
        oODataModel.resetChanges();
        if (!bSwitchToDisplayMode) {
          this.navigate("ObjectPageCategory", {CategoryId: this.sCategoryId, mode: "display"}, true);
        }
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
       * Asks for confirmation of deletion.
       *
       */
      onDeleteProductButton: function () {
        var that = this;
        var nSelectedProduct = this.byId(
          "ProductsTableCategories"
        ).getSelectedContexts().length;

        this.getView().setBusy(true);

        MessageBox.confirm(
          that.i18n(
            "WarningMessage",
            nSelectedProduct === 1 ? "Product" : "Products"
          ),
          {
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            emphasizedAction: MessageBox.Action.YES,
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.YES) {
                that.onConfirmDeletionProduct();
              } else {
                that.getView().setBusy(false);
                that.onCancelButton(true);
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
        var that = this;
        var oODataModel = this.getView().getModel();
        var oProductTable = this.byId("ProductsTableCategories");
        var nSelectedProduct = oProductTable.getSelectedContexts().length;
        var aSelectedProduct = oProductTable
          .getSelectedContexts()
          .map((oProduct) => oProduct.getPath());

        oODataModel.setUseBatch(true);

        var aDeferredGroups = oODataModel.getDeferredGroups();
        aDeferredGroups = aDeferredGroups.concat(["deleteProductID"]);
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
            that.onCancelButton(true);
            MessageToast.show(
              that.i18n(
                "MessageDeleteSuccess",
                nSelectedProduct === 1 ? "Product" : "Products"
              )
            );
          },
          error: function () {
            that.getView().setBusy(false);
            that.onCancelButton();
            MessageBox.error(that.i18n("MessageDeleteError"));
          },
        });
      },

      /**
       * Opens dialog.
       *
       */
      onOpenDialogProduct: function () {
        var that = this;
        var oODataModel = this.getView().getModel();
        this.getView().setBusy(true);

        oODataModel.read(`/Products`, {
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
       * Downloads dialog.
       *
       * @param {Array} aProduct Product array.
       */
      openDialog: function (aProduct) {
        var that          = this;
        var nNewProductID = aProduct[aProduct.length - 1].ID + 1;
        var oView         = this.getView();
        var oODataModel   = oView.getModel();

        if (!this._oDialogProduct) {
          this._oDialogProduct = Fragment.load({
            id: oView.getId(),
            name: "webapp.view.fragments.ProductDialog",
            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            return oDialog;
          });
        }
        this._oDialogProduct
          .then(function (oDialog) {
            var oEntryCtx = oODataModel.createEntry(`/Categories(${that.sCategoryId})/Products`, {
              properties: {
                Name: null,
                Description: null,
                ReleaseDate: null,
                DiscontinuedDate: null,
                Rating: null,
                Price: null,
                ID: nNewProductID,
              },
            });

            oDialog.setBindingContext(oEntryCtx);
            oDialog.setModel(oODataModel);
            oDialog.open();
          })
          .catch(function () {
            MessageBox.error();
            oView.setBusy(false);
          });
      },

      /**
       * Close dialog.
       *
       */
       onDialogCategoryClosePress() {
        var oODataModel = this.getView().getModel();
        var oView = this.getView();

        this._oDialogProduct.then(function (oDialog) {
          var oCtx = oDialog.getBindingContext();
          oODataModel.deleteCreatedEntry(oCtx);
          oView.setBusy(false);
          oDialog.close();
        });

        this._collectsFields("groupValueNewProduct").forEach(oField => oField.setValueState(ValueState.None));
        Core.getMessageManager().removeAllMessages();
      },

      /**
       * Filters products.
       * 
       * @param {sap.ui.base.Event} oEvent event object.
       */
      onFilterProduct: function (oEvent) {
        var oItemsBinding = this.byId("ProductsTableCategories").getBinding("items");
        var sValue        = oEvent.getSource().getValue().trim();
        var aFilters      = [];

        if (!isNaN(Date.parse(sValue)) && !Number(sValue)) {
          aFilters.push(new Filter({
            filters: [
              new Filter("ReleaseDate", FilterOperator.LE, new Date(sValue)),
              new Filter("DiscontinuedDate", FilterOperator.GE, new Date(sValue))
            ],
            and: true,
          }))
        } else if (sValue && !isNaN(sValue)) {
          aFilters.push(new Filter({
            filters: [
              new Filter("Price", FilterOperator.EQ, sValue),
              new Filter("Rating", FilterOperator.EQ, sValue)
            ],
            and: false,
          }))
        } else if (sValue) {
          aFilters.push(new Filter({
            filters: [
              new Filter("Name", FilterOperator.Contains, sValue),
              new Filter("Description", FilterOperator.Contains, sValue)
            ],
            and: false,
          }))
        }
        oItemsBinding.filter(aFilters);
      },
    });
  }
);
