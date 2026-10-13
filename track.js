/**
 * track.js — qlc-service.com 共通のアクセス計測（ページビュー）
 *
 * ・Cookie・個人情報は使わない。「いつ・どのサイトの・どのページが開かれたか」だけを、管理用GASへ送る。
 * ・計測ID(bid)は、URLの先頭のディレクトリ名から自動で決める（新しいサイトも自動で計測される）。
 *     /                      → national（全国版）
 *     /kanto/ … /west/       → kanto 等（地域版）
 *     /staging/…             → staging（テスト）
 *     /calm-daikanyama/…     → calm-daikanyama   など、先頭ディレクトリ名そのまま
 *     /foo.html（直下の1枚）  → root
 * ・サービス詳細ページ（/qlc-link/…）は、どのサイトから来たか（?back=）も label に残す。
 * ・自前のビーコン（log=1）を持つ既存ページとは二重に数えないよう、GASの公開処理が差し込む対象を限定している。
 * ・GASの githubPutFile_ が、HTML公開時に <script src="/track.js" defer></script> を自動で差し込む（admin/ を除く）。
 */
(function () {
  try {
    if (!/(^|\.)qlc-service\.com$/.test(location.hostname)) return;     // 本番ドメイン以外（手元での確認など）は数えない
    if (window.__qlcTracked) return; window.__qlcTracked = true;          // 同じページで2回数えない
    if (/bot|crawl|spider|headless|preview/i.test(navigator.userAgent || '')) return;
    if (document.visibilityState === 'prerender') return;

    var LOG = 'https://script.google.com/macros/s/AKfycbz07q7G3kYMk25qL6eu64IMKClKTscHtt4JWagyDkXWCW4c6SDmRiKUTqjCuh8UyfZH/exec';
    var seg = (location.pathname || '/').split('/').filter(Boolean);
    var first = seg[0] || '';
    var bid = !first ? 'national' : (/\.html?$/i.test(first) ? 'root' : first.toLowerCase());

    var path = (location.pathname || '/').replace(/index\.html?$/i, '');
    var label = path;
    var back = '';
    try { back = new URLSearchParams(location.search).get('back') || ''; } catch (e) {}
    if (back && /^\/[A-Za-z0-9_\-\/\.]*$/.test(back)) label += ' ← ' + back;

    var img = new Image();
    img.src = LOG + '?log=1&bid=' + encodeURIComponent(bid) + '&type=pageview&label=' + encodeURIComponent(label.slice(0, 120)) + '&t=' + Date.now();
  } catch (e) {}
})();
