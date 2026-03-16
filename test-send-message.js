/**
 * Send-message tester – run in browser console on MQL5 product reviews page.
 * Full flow: find link → click → wait for chat → type preset message → send → report success or error.
 */
(function () {
  function log(msg) { console.log('[Send message test] ' + msg); }
  function err(e) { console.error('[Send message test] ERROR:', e && e.message ? e.message : e); }

  try {
    var el = document.querySelector('#content_reviews .comment__info');
    if (!el) {
      log('No #content_reviews .comment__info found.');
      return;
    }
    var textBlock = el.closest('.text');
    if (!textBlock) {
      log('No .text ancestor for first review.');
      return;
    }
    var startMessageEl = textBlock.querySelector('.newMessageLink a');
    if (!startMessageEl) {
      log('No .newMessageLink a found in first review.');
      return;
    }
    var authorEl = el.querySelector('.author');
    var author = authorEl ? authorEl.textContent.trim() : '?';
    log('Found link for author: ' + author);

    var productEl = document.querySelector('.product-page-title');
    var product = productEl ? productEl.textContent.trim() : 'product';
    var presetMessage = 'Hi,\n\nI noticed your thoughts on ' + product + ' and wanted to hear your experience. Would you recommend it? Thanks!';
    log('Preset message (first 80 chars): ' + presetMessage.slice(0, 80) + '...');

    log('Clicking "Send message" link...');
    startMessageEl.click();

    setTimeout(function () {
      try {
        var chatBox = document.querySelector('.chat-editor__textarea');
        if (!chatBox) {
          err('Chat textarea (.chat-editor__textarea) not found after click.');
          return;
        }
        log('Chat box opened. Typing preset message and sending (Ctrl+Enter)...');
        chatBox.value = presetMessage;
        chatBox.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(function () {
          try {
            chatBox.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              ctrlKey: true,
              bubbles: true
            }));
            log('Tester completed: message entered and send triggered. Check the chat to confirm it was sent.');
          } catch (e) {
            err(e);
          }
        }, 2000);
      } catch (e) {
        err(e);
      }
    }, 5000);
  } catch (e) {
    err(e);
  }
})();