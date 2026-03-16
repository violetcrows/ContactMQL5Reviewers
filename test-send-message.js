/**
 * Full-page send-message tester – run in browser console on MQL5 product reviews page.
 * Tests both flows in real time:
 *   - Example A: No existing messages → send preset, store sent message.
 *   - Example B: Existing messages in thread → store them only, skip send.
 *   - Example C: Chat error (e.g. friends only) → store error text + profile link, messageType 'friends only'.
 * Processes first N reviews, then downloads a CSV with results for adjustment in main script.
 */
(function () {
  'use strict';

  var MAX_REVIEWS = 5;
  var WAIT_AFTER_OPEN = 5000;
  var WAIT_AFTER_SEND = 2000;

  function log(msg) { console.log('[Send message test] ' + msg); }
  function err(e) { console.error('[Send message test] ERROR:', e && e.message ? e.message : e); }

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function escapeCsv(str) {
    if (str == null) return '';
    var s = String(str).trim();
    if (/[,"\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function toCsvVal(v) {
    if (v == null) return 'N/A';
    var s = String(v).trim();
    return s === '' ? 'N/A' : s;
  }

  function getExistingChatMessages() {
    var list = document.querySelector('.chat-comments-list');
    if (!list) return '';
    var messages = list.querySelectorAll('.chat-message');
    var parts = [];
    for (var i = 0; i < messages.length; i++) {
      var content = messages[i].querySelector('.chat-message__content');
      if (!content) continue;
      var nameEl = content.querySelector('.chat-message__name a');
      var textEl = content.querySelector('.chat-message__text');
      var name = nameEl ? nameEl.textContent.trim() : '';
      var text = textEl ? textEl.textContent.trim() : '';
      if (name || text) parts.push((name ? name + ': ' : '') + text);
    }
    return parts.join('\n---\n');
  }

  function typeAndSendMessage(query) {
    var chatBox = document.querySelector('.chat-editor__textarea');
    if (!chatBox) return;
    chatBox.value = query;
    chatBox.dispatchEvent(new Event('input', { bubbles: true }));
    setTimeout(function () {
      try {
        chatBox.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter', code: 'Enter', keyCode: 13, which: 13, ctrlKey: true, bubbles: true
        }));
      } catch (e) { err(e); }
    }, WAIT_AFTER_SEND);
  }

  function getReviewData(el) {
    var authorEl = el.querySelector('.author');
    var author = authorEl ? authorEl.textContent.trim() : '';
    var textBlock = el.closest('.text');
    var startMessageEl = textBlock ? textBlock.querySelector('.newMessageLink a') : null;
    return { author: author, startMessageEl: startMessageEl };
  }

  function buildCsv(rows) {
    var headers = ['author', 'messageType', 'Message'];
    var out = [headers.map(escapeCsv).join(',')];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      out.push([
        toCsvVal(r.author),
        toCsvVal(r.messageType),
        toCsvVal(r.message)
      ].map(escapeCsv).join(','));
    }
    return '\uFEFF' + out.join('\r\n');
  }

  function downloadCsv(csvContent, filename) {
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    log('Downloaded: ' + filename);
  }

  async function run() {
    try {
      var container = document.querySelector('#content_reviews');
      if (!container) {
        log('No #content_reviews found.');
        return;
      }
      var list = container.querySelectorAll('.comment__info');
      if (!list.length) {
        log('No .comment__info found.');
        return;
      }
      var productEl = document.querySelector('.product-page-title');
      var product = productEl ? productEl.textContent.trim() : 'product';
      var presetMessage = 'Hi,\n\nI noticed your thoughts on ' + product + ' and wanted to hear your experience. Would you recommend it? Thanks!';
      var count = Math.min(MAX_REVIEWS, list.length);
      log('Processing first ' + count + ' reviews. Wait for chat open/send between each.');

      var results = [];

      for (var idx = 0; idx < count; idx++) {
        var el = list[idx];
        var rev = getReviewData(el);
        if (!rev.startMessageEl) {
          log('Review ' + (idx + 1) + ' (' + rev.author + '): No send link, skipping.');
          results.push({ author: rev.author, messageType: 'skipped', message: 'No newMessageLink' });
          continue;
        }

        log('Review ' + (idx + 1) + '/' + count + ' – Opening chat for: ' + rev.author);
        rev.startMessageEl.click();
        await sleep(WAIT_AFTER_OPEN);

        var errWin = document.querySelector('.chat-error-window');
        if (errWin) {
          var errTextEl = document.querySelector('.chat-error-window__text .chat-error-window__text');
          var linkEl = document.querySelector('.chat-error-window__text a');
          var errText = errTextEl ? errTextEl.textContent.trim() : '';
          var profileHref = linkEl ? linkEl.href : '';
          var message = errText + '!!! Profile Link: ' + profileHref;
          log('  → Friends-only (or error). Storing: ' + (errText.slice(0, 50) + '...'));
          results.push({ author: rev.author, messageType: 'friends only', message: message });
        } else {
          var existingMessages = getExistingChatMessages();
          if (existingMessages && existingMessages.trim() !== '') {
            log('  → Existing thread found (' + existingMessages.length + ' chars). Storing only, not sending.');
            results.push({ author: rev.author, messageType: 'existing', message: existingMessages });
          } else {
            log('  → No existing messages. Sending preset...');
            typeAndSendMessage(presetMessage);
            await sleep(WAIT_AFTER_OPEN);
            results.push({ author: rev.author, messageType: 'sent', message: presetMessage });
            log('  → Sent and stored.');
          }
        }
      }

      var filename = 'test-send-message-result_' + new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '') + '.csv';
      downloadCsv(buildCsv(results), filename);
      log('Done. Check CSV: ' + filename);
    } catch (e) {
      err(e);
    }
  }

  run();
})();
