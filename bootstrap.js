/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");

function startup(aData, aReason) {
  // Helper function that backs up and then clears a pref, if it has a user-set
  // value.
  function resetPref(prefName) {
    if (Services.prefs.prefHasUserValue(prefName)) {
      var existingValue = Services.prefs.getCharPref(prefName);
      Services.prefs.setCharPref("searchreset.backup." + prefName, existingValue);

      Services.prefs.clearUserPref(prefName);
    }
  }

  // Reset the home page and keyword.URL
  resetPref("browser.startup.homepage");
  resetPref("keyword.URL");

  // Reset the New Tab Page
  resetPref("browser.newtab.url");
 
  // Now also reset the default search engine
  resetPref("browser.search.defaultenginename");
  let originalDefaultEngine = Services.search.originalDefaultEngine;
  originalDefaultEngine.hidden = false;
  Services.search.currentEngine = originalDefaultEngine;
  Services.search.moveEngine(originalDefaultEngine, 0);

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