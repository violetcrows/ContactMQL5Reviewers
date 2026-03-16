/**
 * MQL5 Market Review Contact & Export
 * Usage: mqlContact(mode [, pageNum])
 * - mode: 'download' | 'contact' | 'bothdc' | 'bothcd'
 * - pageNum (optional): run only on this page; omit to run on all pages (1..target)
 * Examples: mqlContact('download'), mqlContact('contact', 3), mqlContact('bothcd', 2)
 */
(function () {
    'use strict';

    function sleep(ms) {
        return new Promise(function (r) { setTimeout(r, ms); });
    }

    function escapeCsv(str) {
        if (str == null) return '';
        var s = String(str).trim();
        if (/[,"\r\n]/.test(s)) {
            return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
    }

    function toCsvVal(v) {
        if (v == null) return 'N/A';
        var s = String(v).trim();
        return s === '' ? 'N/A' : s;
    }

    function buildCsv(reviews) {
        var headers = ['author', 'reviewDate', 'ratings', 'reviewText', 'reviewReplyText', 'reviewReplyDate', 'profileLink', 'Message', 'MessageType'];
        var row = headers.map(escapeCsv).join(',');
        var rows = [row];
        for (var i = 0; i < reviews.length; i++) {
            var r = reviews[i];
            row = [
                toCsvVal(r.author),
                toCsvVal(r.reviewDate),
                toCsvVal(r.ratings),
                toCsvVal(r.reviewText),
                toCsvVal(r.reviewReplyText),
                toCsvVal(r.reviewReplyDate),
                toCsvVal(r.profileLink),
                toCsvVal(r.message),
                toCsvVal(r.messageType)
            ].map(escapeCsv).join(',');
            rows.push(row);
        }
        return '\uFEFF' + rows.join('\r\n');
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
        console.log('Downloaded: ' + filename);
    }

    function sanitizeFilename(name) {
        return (name || 'product').replace(/[/\\:*?"<>|]/g, '_').replace(/\s+/g, '_').trim() || 'product';
    }

    function generateQuery(productName) {
        var greetings = [
            'Hi',
            'Hello',
            'Hi there',
            'Hey',
            'Good morning',
            'Good afternoon',
            'Good evening',
            'Greetings',
            'Howdy',
            'Hi friend',
            'Hey friend',
            'Hello friend',
            'Hi mate',
            'Hey mate',
            'Hello there',
            'Hiya',
            'Hey there',
            'Hello again',
            'Hi again',
            "Hey, how's it going"
        ];
        var openings = [
            'I noticed your thoughts on ' + productName + ' and was curious to learn more.',
            'I came across your review of ' + productName + ' and wanted to hear your opinion.',
            'I saw your comment regarding ' + productName + ' and it caught my attention.',
            'I read your review of ' + productName + ' and found it very insightful.',
            'I stumbled upon your thoughts on ' + productName + ' and had a question.',
            'I noticed your experience with ' + productName + ' and wanted to ask a few things.',
            'I saw your review of ' + productName + ' and would love to know your perspective.',
            'I came across your feedback on ' + productName + ' and wanted to get your take.',
            'I read your comment about ' + productName + ' and it seemed very helpful.',
            'I noticed your insights on ' + productName + ' and wanted to ask a couple of questions.',
            'I saw your review of ' + productName + ' and was hoping you could clarify a few points.',
            'I came across your post about ' + productName + ' and wanted your opinion.',
            'I read your thoughts on ' + productName + ' and it really caught my interest.',
            'I noticed your comment on ' + productName + ' and I was curious to learn more.',
            'I saw your feedback on ' + productName + ' and it seemed very useful.',
            'I came across your review of ' + productName + ' and had a couple of questions.',
            'I read your experience with ' + productName + ' and wanted to get your advice.',
            'I noticed your post regarding ' + productName + ' and it was very informative.',
            "I saw your thoughts on " + productName + " and I'd love to hear more.",
            'I came across your comment on ' + productName + ' and it really helped me understand it better.'
        ];
        var intentions = [
            "I'm thinking of trying this EA and wanted your honest opinion.",
            "I'm exploring options and would love to hear your experience.",
            "I'm planning to invest in this EA and wanted your feedback.",
            "I'm evaluating this EA and your thoughts would help a lot.",
            "I'm interested in this EA and wanted to know your experience.",
            "I'm considering purchasing this EA and value your insight.",
            "I'm looking into this EA and your feedback would be helpful.",
            "I'm researching this EA before buying and wanted your take.",
            "I'm curious about this EA and would love to hear from you.",
            "I'm planning to get this EA and your experience matters.",
            "I'm exploring this EA and wanted to ask about your results.",
            "I'm thinking of buying this EA and would love your advice.",
            "I'm evaluating options and your experience with this EA helps.",
            "I'm interested in this EA and wanted real user feedback.",
            "I'm considering trying this EA and wanted to hear from you.",
            "I'm planning to purchase this EA and your thoughts are valuable.",
            "I'm researching this EA before deciding and would love your insight.",
            "I'm curious about this EA and your opinion would be helpful.",
            "I'm looking into buying this EA and wanted your honest feedback.",
            "I'm thinking about this EA and your experience would guide me."
        ];
        var questions = [
            'How has your experience been with it so far?',
            'Has it met your expectations in live trading?',
            'Would you recommend it to someone new?',
            'Which feature has been most helpful for you?',
            'Have you faced any challenges while using it?',
            'How consistent have the results been?',
            'Does it perform well under different market conditions?',
            'Based on your experience, would you suggest it to others?',
            'How easy was it to set up and start using?',
            'Have you noticed any significant improvements over time?',
            "Do you think it's worth the investment?",
            'How reliable has it been in real trading?',
            'What features do you find most useful?',
            'Are there any drawbacks youve encountered?',
            'How long have you been using it?',
            "Would you say it's beginner-friendly or more advanced?",
            'Has it saved you time or improved your trading efficiency?',
            'How responsive is the support or community around it?',
            'Does it meet your expectations compared to other EAs youve tried?',
            'Do you have any advice for someone considering it?'
        ];
        var details = [
            'Any thoughts on stability, risk, or settings that worked well would be appreciated.',
            "I'd love to hear about any settings or strategies that improved performance.",
            'If you could share tips on risk management that worked for you, that would help.',
            'Any insights on optimizing it for different market conditions would be great.',
            "I'm curious about any challenges you faced and how you overcame them.",
            'Would you mind sharing details about the settings that gave the best results?',
            'Any advice on maximizing performance while keeping risk low would be appreciated.',
            "If there are features you found particularly useful, I'd love to know.",
            'Insights on both strengths and weaknesses would be very helpful.',
            'Any feedback on consistency and reliability in real trading would be great.',
            "I'd appreciate any tips that helped improve your results.",
            'If you have recommendations for beginners using it, please share.',
            'Any lessons learned from your experience would be valuable.',
            "I'd love to know how you balanced risk and reward while using it.",
            'Insights on settings adjustments for different market conditions would help.',
            'Any real-world examples of its performance would be appreciated.',
            "I'm interested in any tweaks or strategies that made it work better.",
            "If there are any pitfalls to avoid, I'd like to hear about them.",
            'Any advice on maintaining stable performance over time would be great.',
            'Your detailed experience, including settings and risk management, would help a lot.'
        ];
        var closing = [
            'Thanks a lot for your time and help!',
            'I appreciate any advice you can share.',
            'Thank you for taking a moment to share your experience.',
            'Thanks for your insights and guidance!',
            'I really appreciate your feedback.',
            'Thank you for your valuable input!',
            'Thanks in advance for your time and thoughts.',
            "I'm grateful for any advice you can provide.",
            'Thanks for helping me understand this better.',
            'I appreciate your willingness to share your experience.',
            'Thanks for your guidance—it means a lot!',
            'Thank you for your help and insights!',
            'I really value your opinion, thanks for sharing!',
            'Thanks for taking the time to respond!',
            'I appreciate any tips or feedback you can give.',
            "Thank you for your thoughts—they're very helpful!",
            'Thanks so much for your time and input!',
            "I'm grateful for your advice and perspective.",
            'Thanks for providing your experience and guidance!',
            'I really appreciate your help with this!'
        ];
        function pick(arr) {
            return arr[Math.floor(Math.random() * arr.length)];
        }
        return pick(greetings) + ',\n\n' + pick(openings) + ' ' + pick(intentions) + ' ' + pick(questions) + '\n\n' + pick(details) + '\n\n' + pick(closing);
    }

    function getReviewData(el) {
        var authorEl = el.querySelector('.author');
        var linkEl = authorEl;
        var link = linkEl && linkEl.href ? (linkEl.href.indexOf('http') === 0 ? linkEl.href : window.location.origin + linkEl.href) : '';
        var author = authorEl ? authorEl.textContent.trim() : '';
        var spans = el.querySelectorAll('span');
        var reviewDate = '';
        for (var s = 0; s < spans.length; s++) {
            var t = spans[s].textContent.trim();
            if (/^\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2}/.test(t)) {
                reviewDate = t;
                break;
            }
        }
        var ratingDiv = el.querySelector('.g-rating');
        var ratingLabels = [
            'Description quality and completeness',
            'Reliability and usability',
            'User support'
        ];
        var ratingsString = '';
        if (ratingDiv) {
            ratingsString = (ratingDiv.onmouseover && ratingDiv.onmouseover.toString()) || ratingDiv.getAttribute('onmouseover') || ratingDiv.getAttribute('onclick') || '';
        }
        var ratingsValues = ratingsString ? (function () {
            var m = ratingsString.match(/\[([\d.,\s]+)\]/);
            return m ? m[1].split(',').map(Number) : [];
        }()) : [];
        if (ratingsValues.length === 0 && ratingDiv && ratingDiv.className) {
            var vMatch = ratingDiv.className.match(/g-rating_v(\d+)/);
            if (vMatch) {
                var singleVal = Number(vMatch[1]) / 10;
                ratingsValues = [singleVal, singleVal, singleVal];
            }
        }
        var formattedRatings = ratingsValues.length > 0
            ? ratingsValues.map(function (value, index) {
                return ratingLabels[index] + ': ' + value;
            }).join('; ')
            : '';
        var textBlock = el.closest('.text');
        var commentBlock = el.closest('.comment');
        var reviewText = textBlock ? (textBlock.querySelector('p') ? textBlock.querySelector('p').textContent.trim() : '') : '';
        var replyDesc = commentBlock ? (commentBlock.querySelector('.review_reply__description') ? commentBlock.querySelector('.review_reply__description').textContent.trim() : '') : '';
        var replyDateEl = commentBlock ? commentBlock.querySelector('.review_reply__date_created') : null;
        var reviewReplyDate = replyDateEl ? replyDateEl.textContent.trim() : '';
        var startMessageEl = textBlock ? textBlock.querySelector('.newMessageLink a') : null;
        var startMessageLink = startMessageEl && startMessageEl.href ? (startMessageEl.href.indexOf('http') === 0 ? startMessageEl.href : window.location.origin + startMessageEl.href) : '';

        return {
            author: author,
            reviewDate: reviewDate,
            ratings: formattedRatings,
            reviewText: reviewText,
            reviewReplyText: replyDesc,
            reviewReplyDate: reviewReplyDate,
            profileLink: link,
            startMessageLink: startMessageLink,
            startMessageEl: startMessageEl
        };
    }

    function sendMessageForElement(review, productName) {
        if (!review.startMessageEl) return;
        review.startMessageEl.click();
    }

    function typeAndSendMessage(query) {
        var chatBox = document.querySelector('.chat-editor__textarea');
        if (!chatBox) return;
        chatBox.value = query;
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
            } catch (e) {
                console.error('typeAndSendMessage send step:', e && e.message ? e.message : e);
            }
        }, 2000);
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

    function getChatErrorMessage() {
        var errWin = document.querySelector('.chat-error-window');
        if (!errWin) return null;
        var errTextEl = document.querySelector('.chat-error-window__text .chat-error-window__text');
        var linkEl = document.querySelector('.chat-error-window__text a');
        var errText = errTextEl ? errTextEl.textContent.trim() : '';
        var profileHref = linkEl ? linkEl.href : '';
        return errText + '!!! Profile Link: ' + profileHref;
    }

    async function mqlContact(mode, pageNum) {
        var valid = ['download', 'contact', 'bothdc', 'bothcd'].indexOf(mode) !== -1;
        if (!valid) {
            console.error('mqlContact(mode [, pageNum]): use "download", "contact", "bothdc", or "bothcd"');
            return;
        }

        var titleEl = document.querySelector('.product-page-title');
        var product = titleEl ? titleEl.textContent.trim() : 'product';
        var paginatorLinks = document.querySelectorAll('.paginatorEx a');
        var target = paginatorLinks.length ? Number(paginatorLinks[paginatorLinks.length - 1].textContent) : 1;
        var pathMatch = window.location.pathname.match(/\/product\/(\d+)/);
        var productId = pathMatch ? pathMatch[1] : '';
        var reviewsPath = '/market/product/' + productId + '/reviews';
        var filename = sanitizeFilename(product) + '-reviews.csv';

        var singlePage = pageNum != null && !isNaN(Number(pageNum));
        var pageNumN = singlePage ? Number(pageNum) : 0;
        var pageList = singlePage ? [pageNumN] : [];
        if (!singlePage) {
            for (var p = 1; p <= target; p++) pageList.push(p);
        } else if (pageNumN < 1 || pageNumN > target) {
            console.error('mqlContact: pageNum ' + pageNum + ' is out of range (1–' + target + ')');
            return;
        }

        var allReviews = [];
        var doDownload = mode === 'download' || mode === 'bothdc' || mode === 'bothcd';
        var doContact = mode === 'contact' || mode === 'bothdc' || mode === 'bothcd';
        var downloadFirst = mode === 'bothdc';

        if (typeof market === 'undefined' || !market.getReviewsByFilter) {
            console.error('market.getReviewsByFilter not found. Run this on the MQL5 product reviews page.');
            return;
        }

        function loadPage(page) {
            if (market.getReviewsByFilter.length >= 3) {
                market.getReviewsByFilter(reviewsPath, 'new', page);
            } else {
                market.getReviewsByFilter(reviewsPath, 'new');
            }
        }

        if (downloadFirst) {
            for (var j = 0; j < pageList.length; j++) {
                var pageJ = pageList[j];
                loadPage(pageJ);
                await sleep(5000);
                var elements = document.querySelectorAll('#content_reviews .comment__info');
                console.log('Page ' + pageJ + ' (download pass) – Count: ' + elements.length);
                for (var i = 0; i < elements.length; i++) {
                    var d = getReviewData(elements[i]);
                    allReviews.push({
                        author: d.author,
                        reviewDate: d.reviewDate,
                        ratings: d.ratings,
                        reviewText: d.reviewText,
                        reviewReplyText: d.reviewReplyText,
                        reviewReplyDate: d.reviewReplyDate,
                        profileLink: d.profileLink,
                        message: 'N/A',
                        messageType: 'N/A'
                    });
                }
            }
            downloadCsv(buildCsv(allReviews), filename);
            allReviews = [];
        }

        for (var pageIdx = 0; pageIdx < pageList.length; pageIdx++) {
            var page = pageList[pageIdx];
            loadPage(page);
            await sleep(5000);
            var list = document.querySelectorAll('#content_reviews .comment__info');
            console.log('Page ' + page + (downloadFirst ? ' (contact pass)' : '') + ' – Count: ' + list.length);
            for (var idx = 0; idx < list.length; idx++) {
                var rev = getReviewData(list[idx]);
                if (doDownload && !downloadFirst) {
                    var copy = { author: rev.author, reviewDate: rev.reviewDate, ratings: rev.ratings, reviewText: rev.reviewText, reviewReplyText: rev.reviewReplyText, reviewReplyDate: rev.reviewReplyDate, profileLink: rev.profileLink, message: '', messageType: '' };
                    allReviews.push(copy);
                }
                if (doContact && rev.startMessageEl) {
                    rev.startMessageEl.click();
                    await sleep(5000);
                    var chatErr = getChatErrorMessage();
                    if (chatErr !== null) {
                        if (doDownload && !downloadFirst && allReviews.length > 0) {
                            allReviews[allReviews.length - 1].message = chatErr;
                            allReviews[allReviews.length - 1].messageType = 'friends only';
                        }
                    } else {
                        var existingMessages = getExistingChatMessages();
                        if (existingMessages && existingMessages.trim() !== '') {
                            if (doDownload && !downloadFirst && allReviews.length > 0) {
                                allReviews[allReviews.length - 1].message = existingMessages;
                                allReviews[allReviews.length - 1].messageType = 'existing';
                            }
                        } else {
                            var msg = generateQuery(product);
                            console.log(msg);
                            typeAndSendMessage(msg);
                            await sleep(5000);
                            if (doDownload && !downloadFirst && allReviews.length > 0) {
                                allReviews[allReviews.length - 1].message = msg;
                                allReviews[allReviews.length - 1].messageType = 'sent';
                            }
                        }
                    }
                }
            }
        }

        if (doDownload && !downloadFirst) {
            downloadCsv(buildCsv(allReviews), filename);
        }
    }

    window.mqlContact = mqlContact;
    console.log('mqlContact ready. Usage: mqlContact(mode [, pageNum])');
    console.log('mode: "download" | "contact" | "bothdc" | "bothcd"');
    console.log('pageNum (optional): run only on that page; omit to run on all pages');
})();
