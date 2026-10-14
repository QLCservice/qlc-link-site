/**
 * back-nav.js
 * QLC Link サービス詳細ページ共通：戻るナビゲーション
 *
 * 使い方：各サービス詳細HTMLの </body> 直前に以下を1行追加するだけ
 *   <script src="/back-nav.js"></script>
 *
 * 動作：
 *   .qtop a（画面上部の「← 戻る」）と .qback（画面下部の「← サービス一覧に戻る」）を
 *   自動的に検出し、以下の優先順位で戻り先を決定する。
 *   ① URLパラメータ ?back=... がある → その指定先へ（下記2形式に対応）
 *      ・back=/calm-daikanyama/ のように「/」始まりの値 → そのパスへそのまま遷移
 *        （物件専用の独立LINKサイト用。カード側で ?back=%2F{物件slug}%2F を付けておく）
 *      ・back=qlc-XXXX のようにIDのみの値 → https://qlc-service.com/qlc-XXXX/services/ へ
 *        （リモートコンシェルジュの物件用、従来からの形式）
 *   ② 【2026-10-14追加】「自分の物件以外へ出さない」物件（RESTRICTED_SITES）から来たタブでは、
 *      URLパラメータが無くても、そのタブで最後に来た物件のトップへ戻す（サイト全体のトップへは出さない）。
 *      来た物件は、①の back= か、直前のページ（document.referrer）から判定して、タブ内に覚えておく。
 *   ③ URLパラメータが無く、ブラウザの履歴がある → history.back()
 *   ④ どれも無い → フォールバック
 *      ・自分のいるディレクトリ（例: /calm-daikanyama/xxx.html なら calm-daikanyama）が
 *        'qlc-link' 以外 → そのディレクトリのトップ（/calm-daikanyama/ 等）へ
 *      ・'qlc-link' 配下（物件非依存の全国共通サービスページ）→ サイトトップへ
 *
 * ★2026-09-01修正★ 個別物件のLINKサイト（calm-daikanyama等）から qlc-link/ 配下の
 * 共通サービスページを新規タブ（target="_blank"）で開くと、①の back= が無ければ
 * これまで常にサイトトップへ戻っていた。物件のトップへ戻れるよう、①に完全パス指定
 * （back=/物件slug/）を追加し、③のフォールバックも自分のディレクトリを見るよう変更。
 *
 * ★2026-10-14追加★ QLC以外の物件・会社（大井町トラックス レジデンス、シェヴ）が自分の物件の外
 * （QLCの全国版トップなど）へ出られないよう、②を追加。対象は下の RESTRICTED_SITES に書く。
 * 物件を増やすときは、ここに「/物件slug/」を足す。
 */
(function () {
  var DEFAULT_BACK_URL = 'https://www.qlc-service.com/';
  // 自分の物件の外（全国版トップ・他の物件）へ出さない物件・会社
  var RESTRICTED_SITES = ['/oimachi-tracks/', '/chezvous/'];
  var STORE_KEY = 'qlc_origin_site';

  function isRestricted(path) {
    for (var i = 0; i < RESTRICTED_SITES.length; i++) {
      if (path.indexOf(RESTRICTED_SITES[i]) === 0) return RESTRICTED_SITES[i];
    }
    return '';
  }

  // このタブに「来た物件」を覚える／消す（制限物件のときだけ覚える）
  function rememberOrigin() {
    var site = '';
    try {
      var back = new URLSearchParams(window.location.search).get('back');
      // 覚えるのは「来たページそのもの」（例：/chezvous/services/）。物件のトップだけとは限らないため。
      if (back && back.charAt(0) === '/' && isRestricted(back)) site = back.split('?')[0].split('#')[0];
      if (!site && document.referrer) {
        var r = new URL(document.referrer);
        if (r.origin === window.location.origin && isRestricted(r.pathname)) site = r.pathname;
      }
    } catch (e) {}
    try {
      if (site) sessionStorage.setItem(STORE_KEY, site);
      else if (new URLSearchParams(window.location.search).get('back') || document.referrer) {
        // 別の入口から来たことが分かるときは、前の記憶を消す
        var ref = '';
        try { var rr = new URL(document.referrer); ref = rr.origin === window.location.origin ? rr.pathname : ''; } catch (e2) {}
        if (!(ref && ref.indexOf('/qlc-link/') === 0)) sessionStorage.removeItem(STORE_KEY);
      }
    } catch (e) {}
  }

  function getBackUrl() {
    try {
      var p = new URLSearchParams(window.location.search);
      var back = p.get('back');
      if (back) {
        if (back.charAt(0) === '/') {
          return window.location.origin + back;
        }
        return 'https://qlc-service.com/' + encodeURIComponent(back) + '/services/';
      }
    } catch (e) {}
    // ② 制限物件から来たタブなら、その物件のトップへ
    try {
      var site = sessionStorage.getItem(STORE_KEY);
      if (site && isRestricted(site)) return window.location.origin + site;
    } catch (e) {}
    return null;
  }

  function getDefaultBackUrl() {
    try {
      var parts = window.location.pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && parts[0] !== 'qlc-link') {
        return window.location.origin + '/' + parts[0] + '/';
      }
    } catch (e) {}
    return DEFAULT_BACK_URL;
  }

  function goBack() {
    var url = getBackUrl();
    if (url) {
      window.location.href = url;
    } else if (history.length > 1) {
      history.back();
    } else {
      window.location.href = getDefaultBackUrl();
    }
  }

  // グローバルに公開（onclick="goBack()" でも呼べるように）
  window.goBack = goBack;

  // ページ読み込み後、戻るリンクを自動で差し替え
  function applyBackNav() {
    rememberOrigin();
    var selectors = ['.qtop a', '.qback'];
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        // 「戻る」「サービス一覧」が含まれるリンクだけ対象にする
        var text = el.textContent || '';
        if (text.indexOf('戻') !== -1 || text.indexOf('サービス') !== -1) {
          el.addEventListener('click', function (e) {
            e.preventDefault();
            goBack();
          });
          el.style.cursor = 'pointer';
          // href を # にしておくと誤ナビゲーションを防げる
          el.setAttribute('href', '#');
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyBackNav);
  } else {
    applyBackNav();
  }
})();
