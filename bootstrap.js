/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var Cu = Components.utils;
var Ci = Components.interfaces;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");

function logStatus(m) {
  Services.console.logStringMessage("SearchReset: " + m);
}

function startup(aData, aReason) {
  // Helper function that backs up and then clears a pref, if it has a user-set
  // value.
  function resetPref(prefName) {
    if (!Services.prefs.prefHasUserValue(prefName)) {
      logStatus("No need to reset " + prefName);
      return;
    }

    logStatus("Resetting " + prefName);
    var existingValue = Services.prefs.getCharPref(prefName);
    Services.prefs.setCharPref("searchreset.backup." + prefName, existingValue);
    Services.prefs.clearUserPref(prefName);
  }

  // Reset the home page and keyword.URL
  resetPref("browser.startup.homepage");
  resetPref("keyword.URL");

  // Reset the New Tab Page
  resetPref("browser.newtab.url");

  // Now also reset the default search engine
  // To be compatible with all versions before/after bug 738818, get the default
  // defaultenginename pref value manually.
  var defEnginePref = "browser.search.defaultenginename";
  resetPref(defEnginePref);
  var defaultEngineName;
  try {
    defaultEngineName = Services.prefs.getComplexValue(defEnginePref, Ci.nsIPrefLocalizedString).data;
  } catch (ex) {
    // This shouldn't happen, but maybe an extension screwed things up?
    Components.utils.reportError("SearchReset: Unable to get defaultEngineName: " + ex);
  }

  if (defaultEngineName) {
    logStatus("Found default engine name");
    // Be compatible with versions prior to the creation of Services.search.init (bug 722332, Firefox 16)
    if (Services.search.init) {
      logStatus("Initializing search service");
      Services.search.init(function (result) {
        if (!Components.isSuccessCode(result)) {
          Components.utils.reportError("Search service initialization failed: " + result);
          flushPrefsAndUninstall();
          return;
        }
        resetDefaultEngine();
        flushPrefsAndUninstall();
      });
    } else {
      // Pre-Firefox 16 (bug 722332)
      logStatus("Search service doesn't require initialization");
      resetDefaultEngine();
      flushPrefsAndUninstall();
    }
  } else {
    flushPrefsAndUninstall();
  }

  function resetDefaultEngine() {
    logStatus("Resetting default engine");
    var originalDefaultEngine = Services.search.getEngineByName(defaultEngineName);
    originalDefaultEngine.hidden = false;
    Services.search.currentEngine = originalDefaultEngine;
    Services.search.moveEngine(originalDefaultEngine, 0);
  }

  function flushPrefsAndUninstall() {
    logStatus("Flushing prefs and uninstalling");
    // Flush changes to disk
    Services.prefs.savePrefFile(null);

    // auto-uninstall after running
    AddonManager.getAddonByID(aData.id, function(addon) {
      addon.uninstall();
      logStatus("Addon uninstalled");
    });
  }
}

function shutdown(aData, aReason) { }

function install(aData, aReason) { }

function uninstall(aData, aReason) { }