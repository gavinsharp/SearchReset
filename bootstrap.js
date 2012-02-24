var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");

function startup(aData, aReason) {
  // Reset the home page and keyword.URL
  function resetPref(prefName) {
    if (Services.prefs.prefHasUserValue(prefName)) {
      var existingValue = Services.prefs.getCharPref(prefName);
      Services.prefs.setCharPref("prefreset.backup." + prefName, existingValue);

      Services.prefs.clearUserPref(prefName);
    }
  }
  resetPref("browser.startup.homepage");
  resetPref("keyword.URL");

  // Now also reset the default search engine
  let originalDefaultEngine = Services.search.originalDefaultEngine;
  originalDefaultEngine.hidden = false;
  Services.search.currentEngine = originalDefaultEngine;

  // Flush changes to disk
  Services.prefs.savePrefFile(null);

  // auto-uninstall after running
  AddonManager.getAddonByID(aData.id, function(addon) {
    addon.uninstall();
  });
}

function shutdown(aData, aReason) { }

function install(aData, aReason) { }

function uninstall(aData, aReason) { }