/**
 * track.js — qlc-service.com 共通のアクセス計測（ページビュー＋会社案内ページの詳細計測）
 *
 * ・Cookie・個人情報は使わない。「いつ・どのサイトの・どのページが・どう開かれ、どこまで見られたか」だけを、管理用GASへ送る。
 * ・計測ID(bid)は、URLの先頭のディレクトリ名から自動で決める（新しいサイトも自動で計測される）。
 *     /                      → national（全国版）
 *     /kanto/ … /west/       → kanto 等（地域版）
 *     /staging/…             → staging（テスト）
 *     /calm-daikanyama/…     → calm-daikanyama   など、先頭ディレクトリ名そのまま
 *     /foo.html（直下の1枚）  → root
 * ・サービス詳細ページ（/qlc-link/…）は、どのサイトから来たか（?back=）も label に残す。
 * ・自前のビーコン（log=1）を持つ既存ページとは二重に数えないよう、GASの公開処理が差し込む対象を限定している。
 * ・GASの githubPutFile_ が、HTML公開時に <script src="/track.js" defer></script> を自動で差し込む（admin/ を除く）。
 *
 * ★詳細計測（2026-10-28〜）：DETAIL_BIDS に入っている bid（会社案内ページ＝BtoBの関心を見たいページ）だけ、次を追加で送る。
 *   すべて type=click の label に、先頭の見出しで種類を付けて送る（GAS側の変更なしで、getAccessStats で集計できる）。
 *   ・流入｜ページ｜入口/内部遷移｜どこから来たか｜端末｜言語｜utm      … 1回/ページ表示
 *   ・クリック｜ページ｜種類（お問い合わせ★・デモ・電話…）｜ボタンの文字 … クリックのたび
 *   ・終了｜ページ｜滞在時間｜スクロール到達｜見た見出し(§番号)｜見出し数   … ページを離れるとき1回
 *   集計は Linkサイト更新スクリプト/btob_report.mjs。
 */
(function () {
  try {
    if (!/(^|\.)qlc-service\.com$/.test(location.hostname)) return;     // 本番ドメイン以外（手元での確認など）は数えない
    if (window.__qlcTracked) return; window.__qlcTracked = true;          // 同じページで2回数えない
    if (/bot|crawl|spider|headless|preview/i.test(navigator.userAgent || '')) return;
    if (document.visibilityState === 'prerender') return;

    var LOG = 'https://script.google.com/macros/s/AKfycbz07q7G3kYMk25qL6eu64IMKClKTscHtt4JWagyDkXWCW4c6SDmRiKUTqjCuh8UyfZH/exec';
    var DETAIL_BIDS = { 'root': 1, 'internet-concierge': 1, 'kaji-concierge': 1, 'remote-concierge': 1 };

    var seg = (location.pathname || '/').split('/').filter(Boolean);
    var first = seg[0] || '';
    var bid = !first ? 'national' : (/\.html?$/i.test(first) ? 'root' : first.toLowerCase());

    var path = (location.pathname || '/').replace(/index\.html?$/i, '');
    var label = path;
    var back = '';
    try { back = new URLSearchParams(location.search).get('back') || ''; } catch (e) {}
    if (back && /^\/[A-Za-z0-9_\-\/\.]*$/.test(back)) label += ' ← ' + back;

    function url(type, lab) {
      return LOG + '?log=1&bid=' + encodeURIComponent(bid) + '&type=' + type + '&label=' + encodeURIComponent(String(lab).slice(0, 120)) + '&t=' + Date.now();
    }
    function send(type, lab) { try { var img = new Image(); img.src = url(type, lab); } catch (e) {} }

    send('pageview', label);

    if (!DETAIL_BIDS[bid]) return;

    // ページ名は、拡張子の有無で分かれないよう統一する（/kaji-concierge.html と /kaji-concierge を同じに）
    var page = path.replace(/\.html?$/i, '') || '/';

    // ---- 流入 ----
    var dev = (function () { var w = window.innerWidth || screen.width || 0; return w < 768 ? 'スマホ' : (w < 1100 ? 'タブレット' : 'PC'); })();
    var lang = (navigator.language || '').slice(0, 2);
    var ref = (function () {
      try {
        var r = document.referrer; if (!r) return '直接/不明';
        var u = new URL(r), h = u.hostname.replace(/^www\./, '');
        var p = u.pathname.replace(/index\.html?$/i, '').slice(0, 40);
        if (/(^|\.)ql-c\.co\.jp$/.test(h)) return '公式サイト ql-c.co.jp' + (p.length > 1 ? p : '');
        if (/(^|\.)qlc-service\.com$/.test(h)) return 'サイト内' + p;
        if (/(^|\.)google\./.test(h)) return '検索:google';
        if (/(^|\.)yahoo\./.test(h)) return '検索:yahoo';
        if (/(^|\.)bing\./.test(h)) return '検索:bing';
        if (/(^|\.)(t\.co|x\.com|twitter\.com)$/.test(h)) return 'X';
        if (/facebook|instagram|line\.me|linkedin/.test(h)) return 'SNS:' + h;
        return h;
      } catch (e) { return '不明'; }
    })();
    var utm = '';
    try {
      var q = new URLSearchParams(location.search);
      var us = q.get('utm_source'), um = q.get('utm_medium'), uc = q.get('utm_campaign');
      if (us || um || uc) utm = '｜utm:' + [us, um, uc].filter(Boolean).join('/');
    } catch (e) {}
    var entry = true;
    try { entry = !sessionStorage.getItem('qlc_trk_s'); sessionStorage.setItem('qlc_trk_s', '1'); } catch (e) {}
    send('click', '流入｜' + page + '｜' + (entry ? '入口' : '内部遷移') + '｜' + ref + '｜' + dev + '｜' + lang + utm);

    // ---- クリック ----
    function classify(href) {
      var h = String(href || '');
      if (/^tel:/i.test(h)) return '電話';
      if (/^mailto:/i.test(h)) return 'メール';
      if (/ql-c\.co\.jp\/contact/i.test(h)) return 'お問い合わせ★';
      if (/concierge-service\.jp/i.test(h)) return 'デモサイト';
      var m = h.match(/qlc-service\.com\/(remote-concierge|internet-concierge|kaji-concierge)/i);
      if (m) return '紹介ページへ:' + m[1].toLowerCase();
      if (/privacy-policy/i.test(h)) return 'プライバシーポリシー';
      if (/compliance/i.test(h)) return 'コンプライアンス';
      if (/chezvous\.co\.jp/i.test(h)) return 'シェヴ';
      if (/ql-c\.co\.jp/i.test(h)) return '会社サイト';
      if (/\.pdf(\?|#|$)/i.test(h)) return '資料PDF';
      try { var u = new URL(h); if (u.hostname.replace(/^www\./, '') === 'qlc-service.com') return 'サイト内:' + u.pathname.slice(0, 30); return '外部:' + u.hostname.replace(/^www\./, ''); } catch (e) { return 'その他'; }
    }
    document.addEventListener('click', function (e) {
      try {
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a) return;
        var t = (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 18);
        send('click', 'クリック｜' + page + '｜' + classify(a.href) + '｜' + t);
      } catch (err) {}
    }, true);
    // 埋め込み動画（YouTube等）の操作：iframeにフォーカスが移ったら1回だけ数える
    var ifrDone = false;
    window.addEventListener('blur', function () {
      setTimeout(function () {
        try {
          var el = document.activeElement;
          if (!ifrDone && el && el.tagName === 'IFRAME') { ifrDone = true; send('click', 'クリック｜' + page + '｜動画（操作）｜' + (el.title || '').slice(0, 18)); }
        } catch (err) {}
      }, 50);
    });

    // ---- 滞在・スクロール・見出し（終了時に1回だけ送る）----
    var heads = [];
    try { heads = Array.prototype.slice.call(document.querySelectorAll('h1,h2')); } catch (e) {}
    var seen = {};
    var maxDepth = 0;
    function measure() {
      try {
        var de = document.documentElement, b = document.body;
        var vh = window.innerHeight || de.clientHeight || 0;
        var total = Math.max(de.scrollHeight, b ? b.scrollHeight : 0, 1);
        var pos = (window.pageYOffset || de.scrollTop || 0) + vh;
        var d = Math.min(100, Math.round(pos / total * 100));
        if (d > maxDepth) maxDepth = d;
        // 見出しが画面の上〜85%の位置に入ったら「見た」とする
        for (var i = 0; i < heads.length; i++) {
          var r = heads[i].getBoundingClientRect();
          if (r.height > 0 && r.top < vh * 0.85 && r.bottom > 0) seen[i + 1] = 1;
        }
      } catch (e) {}
    }
    var ticking = false;
    function onScroll() { if (ticking) return; ticking = true; (window.requestAnimationFrame || function (f) { setTimeout(f, 100); })(function () { ticking = false; measure(); }); }
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    var visMs = 0, visStart = (document.visibilityState === 'visible') ? Date.now() : 0;
    var ended = false;
    function bucketSec(s) { return s < 5 ? '〜5秒' : s < 15 ? '5〜15秒' : s < 30 ? '15〜30秒' : s < 60 ? '30〜60秒' : s < 120 ? '1〜2分' : s < 300 ? '2〜5分' : '5分以上'; }
    function bucketDepth(d) { return d >= 100 ? '100%' : d >= 75 ? '75%' : d >= 50 ? '50%' : d >= 25 ? '25%' : '25%未満'; }
    function finish() {
      if (ended) return; ended = true;
      try {
        measure();
        if (visStart) { visMs += Date.now() - visStart; visStart = 0; }
        var secs = Math.round(visMs / 1000);
        var ids = Object.keys(seen).sort(function (a, b) { return a - b; }).join(',');
        var lab = '終了｜' + page + '｜' + bucketSec(secs) + '｜' + bucketDepth(maxDepth) + '｜§' + (ids || '-') + '｜' + heads.length;
        var u = url('click', lab);
        if (window.fetch) { fetch(u, { method: 'GET', mode: 'no-cors', keepalive: true, credentials: 'omit' }).catch(function () { send('click', lab); }); }
        else send('click', lab);
      } catch (err) {}
    }
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') { if (visStart) { visMs += Date.now() - visStart; visStart = 0; } finish(); }
      else if (!ended && !visStart) visStart = Date.now();
    });
    window.addEventListener('pagehide', finish);
  } catch (e) {}
})();
