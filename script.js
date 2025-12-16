// --- 安全な初期化とデバッグユーティリティ ---
// 開発環境判定（必要ならビルドフラグで切り替えてください）
const IS_DEV = location.hostname === 'localhost' || location.search.includes('dev=1');

// 起動時に開発用フラグを自動セット（ローカル開発のみ）
if (IS_DEV) localStorage.setItem('debug_allow_reset', '1');

// 名前空間付きキーの例: save.game
function getDefaultState() {
  return {
    fans: 0,
    money: 0,
    uiState: 'FREE',
    storyProgress: 0
  };
}

// バリデーションユーティリティ
function clampNumber(n, min, max) {
  if (typeof n !== 'number' || Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

// loadGame: セーブ読み込み + バリデーション + 可視化ログ
function loadGame() {
  let state;
  try {
    const raw = localStorage.getItem('save.game');
    state = raw ? JSON.parse(raw) : getDefaultState();
  } catch (err) {
    console.warn('[DBG] loadGame: parse error, using default', err);
    state = getDefaultState();
  }

  // バリデーション（上限は適宜調整）
  state.fans = clampNumber(Number(state.fans || 0), 0, 1e7);
  state.money = clampNumber(Number(state.money || 0), 0, 1e9);
  state.uiState = typeof state.uiState === 'string' ? state.uiState : 'FREE';
  state.storyProgress = clampNumber(Number(state.storyProgress || 0), 0, 9999);

  // グローバルに保持して UI 初期化で参照できるようにする
  window.__GAME_STATE = state;

  // 可視化ログ（必ず出る）
  console.table({
    fans: state.fans,
    money: state.money,
    uiState: state.uiState,
    storyProgress: state.storyProgress,
    debugAllowReset: localStorage.getItem('debug_allow_reset') || '0'
  });

  return state;
}

// --- UI 初期化の堅牢化 ---
// DOM 構築とイベント登録を分離して確実にハンドラを付ける
function buildDOMIfNeeded() {
  // 既存の DOM 構築ロジックをここに呼ぶ
  if (typeof buildGameUI === 'function') {
    buildGameUI();
  } else {
    console.warn('[DBG] buildGameUI not found; ensure DOM is created elsewhere');
  }
}

function attachUIEventHandlers() {
  // 例: 楽曲制作ボタン
  const makeBtn = document.querySelector('.make-song-btn');
  if (makeBtn) {
    // remove してから attach して冪等に
    makeBtn.replaceWith(makeBtn.cloneNode(true));
    const fresh = document.querySelector('.make-song-btn');
    fresh.addEventListener('click', onMakeSongClicked);
  } else {
    console.warn('[DBG] make-song-btn not found when attaching handlers');
  }

  // ダイアログのタップ等も同様に attach
  const dialog = document.querySelector('.dialog-box');
  if (dialog) {
    dialog.addEventListener('click', onDialogClicked);
  }
  console.log('[DBG] attachUIEventHandlers done');
}

// 初期化エントリ（load 後に呼ぶ）
function initUI() {
  buildDOMIfNeeded();
  // 次フレームでイベント登録して DOM が確実に反映された状態にする
  requestAnimationFrame(() => {
    attachUIEventHandlers();
    // overlay があるか自動チェックしてログ出力
    autoDetectOverlay();
    console.log('[DBG] UI initialized and handlers attached');
  });
}

// --- overlay 判定と一時無効化ユーティリティ ---
function elementAtCenter() {
  return document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
}

function detectOverlayAt(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  // ボタンやゲーム領域以外の要素が返るなら overlay の可能性
  // ここでは簡易判定: ゲーム領域に属するクラス名を持たない要素を overlay とみなす
  const allowedSelectors = ['.game-root', '.make-song-btn', '.dialog-box', 'canvas'];
  const isAllowed = allowedSelectors.some(sel => el.closest && el.closest(sel));
  return isAllowed ? null : el;
}

// 一時的に overlay の pointer-events を無効化して動作確認する
function disableOverlayPointerEvents(el) {
  if (!el) return;
  const prev = el.style.pointerEvents;
  el.style.pointerEvents = 'none';
  el.dataset._dbg_prev_pointer = prev === undefined ? '' : prev;
  console.log('[DBG] disabled pointer-events on', el);
}

// 元に戻す
function restoreOverlayPointerEvents(el) {
  if (!el || !el.dataset) return;
  el.style.pointerEvents = el.dataset._dbg_prev_pointer || '';
  delete el.dataset._dbg_prev_pointer;
  console.log('[DBG] restored pointer-events on', el);
}

// 自動チェック: 画面中央で overlay を検出してログ出力
function autoDetectOverlay() {
  const x = window.innerWidth / 2;
  const y = window.innerHeight / 2;
  const overlay = detectOverlayAt(x, y);
  if (overlay) {
    console.warn('[DBG] overlay detected at center:', overlay, 'try disabling pointer-events to test');
    // 開発時のみ自動で一時無効化（IS_DEV のみ）
    if (IS_DEV) {
      disableOverlayPointerEvents(overlay);
      setTimeout(() => restoreOverlayPointerEvents(overlay), 3000);
    }
  } else {
    console.log('[DBG] no overlay detected at center');
  }
}

// --- デバッグ用ハードリセット（開発専用） ---
function hardResetFromGame() {
  if (localStorage.getItem('debug_allow_reset') !== '1') {
    console.warn('[DBG] hardReset blocked: debug flag not set');
    return;
  }
  // 名前空間に基づいて消す（安全策）
  const keys = Object.keys(localStorage).filter(k => k.startsWith('save.') || k.startsWith('game.') || k === 'save.game');
  keys.forEach(k => localStorage.removeItem(k));
  console.log('[DBG] cleared keys:', keys);
  // 強制リロードで初期状態へ
  location.reload();
}

// --- イベントハンドラの例（既存ロジックに合わせて置き換えてください） ---
function onMakeSongClicked(e) {
  console.log('[DBG] make song clicked', e);
  // 既存の楽曲制作処理を呼ぶ
  if (typeof handleMakeSong === 'function') handleMakeSong(e);
}

function onDialogClicked(e) {
  console.log('[DBG] dialog clicked', e);
  if (typeof handleDialogClick === 'function') handleDialogClick(e);
}

// --- 起動シーケンス登録 ---
window.addEventListener('load', () => {
  // 1) セーブ読み込み（先に状態を確定）
  loadGame();
  // 2) UI 初期化（DOM 構築 → ハンドラ登録）
  initUI();
  // 3) 全体 pointer イベント到達ログ（開発時のみ）
  if (IS_DEV) {
    document.addEventListener('pointerdown', e => {
      console.log('[DBG] pointerdown target:', e.target, 'x,y:', e.clientX, e.clientY);
    }, { capture: true });
  }
});
