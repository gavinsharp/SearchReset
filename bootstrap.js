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
    let status = "";
    if (Services.prefs.prefIsLocked(prefName) && DEBUG) status = "\n(LOCKED)";

    if (Services.prefs.prefHasUserValue(prefName)) {
      var existingValue = Services.prefs.getCharPref(prefName);
      Services.prefs.setCharPref("searchreset.backup." + prefName, existingValue);

      Services.prefs.clearUserPref(prefName);

      if (DEBUG) status = "\n\nold: " + existingValue;
    }

    if (DEBUG) Services.prompt.alert(null, "RESET", prefName + status + "\ncur: " + Services.prefs.getCharPref(prefName));
  }

  // Reset the home page and keyword.URL
  resetPref("browser.startup.homepage"); // complex value
  resetPref("keyword.URL");

  // Reset the New Tab Page
  resetPref("browser.newtab.url");

  // Now also reset the default search engine
  resetPref("browser.search.defaultenginename");  // complex value

  let originalDefaultEngine = Services.search.originalDefaultEngine;

  if (originalDefaultEngine) {
    originalDefaultEngine.hidden = false;
    Services.search.currentEngine = originalDefaultEngine;
    Services.search.moveEngine(originalDefaultEngine, 0);

    // reset the search engine used on the about:home page
    // code reused from AboutHomeUtils
    // http://mxr.mozilla.org/mozilla-central/source/browser/components/nsBrowserContentHandler.js#838
    let submission = originalDefaultEngine.getSubmission("_searchTerms_");
    let engine = {name: originalDefaultEngine.name, searchUrl: submission.uri.spec};
    let aboutHomeURI = Services.io.newURI("moz-safe-about:home", null, null);

    try {
      let ssm = Components.classes["@mozilla.org/scriptsecuritymanager;1"].getService(Components.interfaces.nsIScriptSecurityManager);
      let principal = (ssm.getCodebasePrincipal || ssm.getNoAppCodebasePrincipal)(aboutHomeURI);

      let dsm = Components.classes["@mozilla.org/dom/storagemanager;1"].getService(Components.interfaces.nsIDOMStorageManager);

      dsm.getLocalStorageForPrincipal(principal, "").setItem("search-engine", JSON.stringify(engine));
     } catch(e) { if (DEBUG) Services.prompt.alert(null, "ERROR resetting about:home" ,e); }    
  } else if (DEBUG) Services.prompt.alert(null, "ERROR", "NO originalDefaultEngine");
  
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

