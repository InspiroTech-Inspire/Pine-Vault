// ==UserScript==
// @name         Pine Vault auto-paste
// @namespace    pinevault
// @version      2.0
// @description  One click from Pine Vault: opens the TradingView Pine Editor, pastes your code and adds it to the chart
// @match        https://*.tradingview.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==
(function () {
  'use strict';
  if (window.top !== window) return;

  var KEY = 'pinevault', TS = 'pinevault_ts', raw = null;
  var m = location.hash.match(/pinevault=([A-Za-z0-9_-]+)/);
  try {
    if (m) {
      raw = m[1];
      sessionStorage.setItem(KEY, raw);
      sessionStorage.setItem(TS, String(Date.now()));
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    } else {
      var ts = Number(sessionStorage.getItem(TS) || 0);
      if (Date.now() - ts < 120000) raw = sessionStorage.getItem(KEY);
    }
  } catch (e) {}
  if (!raw) return;

  var code;
  try {
    var b = raw.split('-').join('+').split('_').join('/');
    while (b.length % 4) b += '=';
    var bin = atob(b);
    code = new TextDecoder().decode(Uint8Array.from(bin, function (c) { return c.charCodeAt(0); }));
  } catch (e) { return; }

  function finish() { try { sessionStorage.removeItem(KEY); sessionStorage.removeItem(TS); } catch (e) {} }

  // ---- on-screen status banner ----
  var box = null, hideTimer = null;
  function say(msg, bad, autohide) {
    (function put() {
      if (!document.body) { setTimeout(put, 100); return; }
      if (!box) {
        box = document.createElement('div');
        box.style.cssText = 'position:fixed;z-index:2147483647;bottom:16px;left:16px;max-width:360px;padding:10px 14px;border-radius:8px;font:13px/1.4 system-ui,sans-serif;color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.4)';
        document.body.appendChild(box);
      }
      box.style.background = bad ? '#d93025' : '#2962ff';
      box.textContent = 'Pine Vault: ' + msg;
      clearTimeout(hideTimer);
      if (autohide) hideTimer = setTimeout(function () { if (box) box.remove(); box = null; }, autohide);
    })();
  }

  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  async function waitFor(fn, t) {
    var s = Date.now();
    while (Date.now() - s < t) { var v = fn(); if (v) return v; await sleep(250); }
    return null;
  }
  function vis(e) { return !!e && e.getClientRects().length > 0; }
  function findBtn(sels, re) {
    var i, e;
    for (i = 0; i < sels.length; i++) { e = document.querySelector(sels[i]); if (vis(e)) return e; }
    var els = document.querySelectorAll('button,[role=tab],[role=button]');
    for (i = 0; i < els.length; i++) {
      e = els[i]; if (!vis(e)) continue;
      var t = (e.getAttribute('aria-label') || '') + ' ' + (e.getAttribute('title') || '') + ' ' + (e.getAttribute('data-name') || '') + ' ' + e.textContent;
      if (re.test(t)) return e;
    }
    return null;
  }
  function editorTextarea() {
    var tas = document.querySelectorAll('.monaco-editor textarea');
    for (var i = 0; i < tas.length; i++) { var c = tas[i].closest('.monaco-editor'); if (vis(c)) return tas[i]; }
    return null;
  }
  function setCode(ta) {
    try {
      if (window.monaco && window.monaco.editor) {
        var eds = window.monaco.editor.getEditors ? window.monaco.editor.getEditors() : [];
        for (var i = 0; i < eds.length; i++) {
          var dom = eds[i].getDomNode && eds[i].getDomNode();
          if (dom && vis(dom)) { eds[i].setValue(code); return true; }
        }
      }
    } catch (e) {}
    ta.focus();
    document.execCommand('selectAll');
    return document.execCommand('insertText', false, code);
  }
  function codeIsInEditor() {
    var probe = code.replace(/\s+/g, '').slice(0, 15);
    var view = document.querySelector('.monaco-editor .view-lines');
    return !!view && view.textContent.replace(/\s+/g, '').indexOf(probe) > -1;
  }
  async function copyFallback() { try { await navigator.clipboard.writeText(code); } catch (e) {} }

  async function run() {
    say('waiting for the chart to load…');
    await waitFor(function () { return document.querySelector('[data-name=legend],.chart-container'); }, 45000);
    await sleep(1500);

    say('opening the Pine Editor…');
    var ta = editorTextarea();
    for (var attempt = 0; attempt < 3 && !ta; attempt++) {
      var tab = findBtn(['[data-name="pine-dialog-button"]', 'button[data-name*="pine" i]'], /pine editor|^\s*pine\s*$/i);
      if (tab) tab.click();
      ta = await waitFor(editorTextarea, 5000);
    }
    if (!ta) { await copyFallback(); say('could not find the Pine Editor. Code is on your clipboard: open the editor, paste, click Add to chart.', true); finish(); return; }

    say('pasting your code…');
    await sleep(800);
    ta = editorTextarea() || ta;
    var ok = setCode(ta);
    await sleep(700);
    if (!ok || !codeIsInEditor()) {
      await copyFallback();
      say('paste did not take. Code is on your clipboard: click in the editor, select all, paste, then Add to chart.', true);
      finish(); return;
    }

    say('adding to chart…');
    var add = await waitFor(function () {
      return findBtn(['[data-name="add-script-to-chart"]', 'button[title*="Add to chart" i]', 'button[aria-label*="Add to chart" i]'], /add to chart|update on chart/i);
    }, 8000);
    if (add) {
      add.click();
    } else {
      ta.focus();
      ['keydown', 'keyup'].forEach(function (t) {
        ta.dispatchEvent(new KeyboardEvent(t, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, ctrlKey: true, metaKey: /Mac/.test(navigator.platform), bubbles: true, cancelable: true }));
      });
    }
    await sleep(1500);
    say('done. If the indicator is not on the chart, press Add to chart.', false, 6000);
    finish();
  }

  run().catch(function (e) { say('error: ' + (e && e.message ? e.message : e), true); finish(); });
})();
