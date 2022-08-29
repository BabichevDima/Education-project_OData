sap.ui.define([], function () {
  "use strict";
  return {

    checkEditMode: function (EditMode) {
      return EditMode ? "None" : "MultiSelect";
    },
  };
});
