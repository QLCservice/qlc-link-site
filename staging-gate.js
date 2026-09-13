/**
 * staging-gate.js
 * qlc-service.com/staging/ 配下用の簡易パスワードゲート。
 *
 * これは本物のセキュリティ機構ではありません。URLを知らない人が誤って開いてしまうのを
 * 防ぐための簡易的な壁です（パスワードはこのファイル自体に平文で書かれており、
 * ソースを見れば誰でも分かります）。個人情報や決済情報を扱わないテストページ向けの
 * 軽い抑止として使う想定です。
 *
 * 使い方：staging/配下の各ページの<head>のできるだけ早い位置に置く
 *   <script src="/staging-gate.js"></script>
 */
(function () {
  var KEY = 'qlc_staging_auth';
  var PASS = '1234';

  try {
    if (sessionStorage.getItem(KEY) === '1') return; // このタブで認証済みならそのまま表示
  } catch (e) {}

  // 認証前は本文を隠す（正しいコンテンツが一瞬見えてしまうのを防ぐ）
  document.documentElement.style.visibility = 'hidden';

  function init() {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#1C2B40;' +
      'display:flex;align-items:center;justify-content:center;' +
      'font-family:"Noto Sans JP","Hiragino Kaku Gothic ProN",sans-serif;';
    overlay.innerHTML =
      '<div style="background:#F6F2EA;border-radius:12px;padding:32px 28px;max-width:300px;width:88%;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.35);">' +
        '<div style="font-size:14px;font-weight:700;color:#1C2B40;margin-bottom:6px;">テストページ</div>' +
        '<div style="font-size:12px;color:#6B6760;margin-bottom:16px;">パスワードを入力してください</div>' +
        '<input type="password" id="qlcStagingPw" inputmode="numeric" style="width:100%;padding:10px 12px;border:1.5px solid #B79358;border-radius:8px;font-size:14px;margin-bottom:10px;box-sizing:border-box;">' +
        '<div id="qlcStagingErr" style="color:#C0392B;font-size:11.5px;margin-bottom:8px;min-height:14px;"></div>' +
        '<button id="qlcStagingBtn" style="width:100%;background:#B79358;color:#1C2B40;border:none;border-radius:18px;padding:10px 0;font-size:13px;font-weight:600;cursor:pointer;">開く</button>' +
      '</div>';
    document.body.appendChild(overlay);
    document.documentElement.style.visibility = 'visible';

    var input = document.getElementById('qlcStagingPw');
    var err = document.getElementById('qlcStagingErr');

    function tryEnter() {
      if (input.value === PASS) {
        try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
        overlay.parentNode.removeChild(overlay);
      } else {
        err.textContent = 'パスワードが違います';
        input.value = '';
        input.focus();
      }
    }
    document.getElementById('qlcStagingBtn').addEventListener('click', tryEnter);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryEnter(); });
    input.focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
