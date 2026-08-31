/**
 * text-size.js
 * QLC Link 全ページ共通：文字を大きく表示するトグル機能
 *
 * 使い方：各ページの </body> 直前に以下を1行追加するだけ
 *   <script src="/text-size.js"></script>
 *
 * 動作：
 *   画面右下に「Aa 文字を大きく」ボタンを自動生成する。押すと画面全体が拡大表示され、
 *   もう一度押すと標準サイズに戻る。設定は localStorage に保存されるため、
 *   同じ端末・ブラウザであれば別のページに移動しても拡大表示が保持される。
 *
 * ねらい：QRコードから来訪される居住者様はスマートフォンでの閲覧が中心で、
 * ご高齢の方にも配慮した「文字を大きくできる」導線を全ページ共通で用意する。
 */
(function () {
  var STORAGE_KEY = 'qlc_text_large';
  var ZOOM_LEVEL = 1.18;
  var large = false;
  try { large = window.localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) {}

  var btn;

  function apply() {
    document.body.style.zoom = large ? String(ZOOM_LEVEL) : '';
    if (btn) {
      btn.textContent = large ? 'Aa 標準の文字サイズに戻す' : 'Aa 文字を大きく';
      btn.setAttribute('aria-pressed', large ? 'true' : 'false');
    }
  }

  function toggle() {
    large = !large;
    try { window.localStorage.setItem(STORAGE_KEY, large ? '1' : '0'); } catch (e) {}
    apply();
  }

  function createButton() {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'qlcTextSizeToggle';
    btn.setAttribute('aria-pressed', 'false');
    btn.style.cssText = [
      'position:fixed', 'right:14px', 'bottom:14px', 'z-index:9999',
      'background:#1C2B40', 'color:#F6F2EA', 'border:1.5px solid #B79358',
      'border-radius:20px', 'padding:10px 16px', 'font-size:12.5px', 'font-weight:600',
      'font-family:"Noto Sans JP","Hiragino Kaku Gothic ProN",sans-serif',
      'box-shadow:0 2px 10px rgba(0,0,0,.22)', 'cursor:pointer', 'line-height:1.4'
    ].join(';');
    btn.addEventListener('click', toggle);
    document.body.appendChild(btn);
    apply();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createButton);
  } else {
    createButton();
  }
})();
