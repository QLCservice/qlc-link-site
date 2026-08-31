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
 *   ① URLパラメータ ?back=qlc-XXXX → その物件のサービスメニューへ
 *   ② ブラウザの履歴がある → history.back()
 *   ③ どちらもない → デフォルトの汎用ページ（全国トップ）へ
 *
 * ★2026-08-31修正★ 個別物件のLINKサイト（例：calm-daikanyama/）のカードは
 * target="_blank"で新規タブを開くため、②の履歴が無い状態（history.length===1）が
 * 常態化する。以前はこの場合に「関東版」へ飛ばしていたが、物件やユーザーの所在地に
 * 関わらず関東版へ誘導するのは不適切なため、全国トップページへ変更した。
 * なお、①のback=パラメータは「/{id}/services/」（リモートコンシェルジュの物件）専用の
 * 仕組みで、calm-daikanyamaのような独立LINKサイト（/{id}/）には現状対応していない。
 */
(function () {
  var DEFAULT_BACK_URL = 'https://www.qlc-service.com/';

  function getBackUrl() {
    try {
      var p = new URLSearchParams(window.location.search);
      var buildingId = p.get('back');
      if (buildingId) {
        return 'https://qlc-service.com/' + encodeURIComponent(buildingId) + '/services/';
      }
    } catch (e) {}
    return null;
  }

  function goBack() {
    var url = getBackUrl();
    if (url) {
      window.location.href = url;
    } else if (history.length > 1) {
      history.back();
    } else {
      window.location.href = DEFAULT_BACK_URL;
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
