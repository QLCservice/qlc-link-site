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
 *   ② URLパラメータが無く、ブラウザの履歴がある → history.back()
 *   ③ どちらも無い → フォールバック
 *      ・自分のいるディレクトリ（例: /calm-daikanyama/xxx.html なら calm-daikanyama）が
 *        'qlc-link' 以外 → そのディレクトリのトップ（/calm-daikanyama/ 等）へ
 *      ・'qlc-link' 配下（物件非依存の全国共通サービスページ）→ サイトトップへ
 *
 * ★2026-09-01修正★ 個別物件のLINKサイト（calm-daikanyama等）から qlc-link/ 配下の
 * 共通サービスページを新規タブ（target="_blank"）で開くと、①の back= が無ければ
 * これまで常にサイトトップへ戻っていた。物件のトップへ戻れるよう、①に完全パス指定
 * （back=/物件slug/）を追加し、③のフォールバックも自分のディレクトリを見るよう変更。
 */
(function () {
  var DEFAULT_BACK_URL = 'https://www.qlc-service.com/';

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
