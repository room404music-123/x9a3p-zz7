// =================================================================
// プレイヤーの状態と初期設定
// =================================================================
const initialPlayerState = {
    fan: 0,
    money: 0,
    stage: 0,
    inventory: [],
    uiState: 'FREE', 
    readStories: new Set(),
};

// 🔴 新規追加: デバッグフラグ (初期値: false)
// リセット実行後に true に変えてデプロイし、リセットが走ったら false に戻す
let debugAllowReset = false; 

let playerState = loadGame() || initialPlayerState;

// ... (DOM要素の取得は変更なし)

// ----------------------------------------------------------------
// セーブ/ロード (修正なし)
// ----------------------------------------------------------------
function saveGame() { /* 省略 */ }

function loadGame() {
    // 🔴 起動時ログの強化
    const saved = localStorage.getItem('world1_save');
    let loadedState = null;

    if (saved) {
        loadedState = JSON.parse(saved);
        loadedState.readStories = new Set(loadedState.readStories);
        if (loadedState.uiState === 'STORY') {
            loadedState.uiState = 'FREE';
        }
    } else {
        loadedState = { ...initialPlayerState };
    }

    // 🔴 起動時ログを console.table で出力
    console.table({
        'Fan': loadedState.fan,
        'Money': loadedState.money,
        'UI State': loadedState.uiState,
        'Stories Read': loadedState.readStories.size,
        'Debug Reset': debugAllowReset
    });
    
    // 🔴 安全リセットのロジック: debugAllowReset が true の場合のみ実行
    if (debugAllowReset) {
        console.warn("DEBUG RESET MODE: Forcing full game state and localStorage wipe.");
        localStorage.removeItem('world1_save');
        // 初期状態を返す
        return { ...initialPlayerState, readStories: new Set() };
    }
    
    return loadedState;
}

// ----------------------------------------------------------------
// リセット機能 (再構築)
// ----------------------------------------------------------------

// ⚠️ この関数はもう使わない。リセットは debugAllowReset フラグで行う。
function resetGame() {
    console.warn("resetGame() function is deprecated. Use debugAllowReset flag for full wipe.");
}

// ----------------------------------------------------------------
// 初期化とイベントリスナー (大幅修正)
// ----------------------------------------------------------------

// 🔴 イベントリスナー登録を分離し、より遅延したタイミングで実行
function registerEventListeners() {
    console.log("Registering Event Listeners...");
    
    // 楽曲制作ボタン
    produceMusicButton.addEventListener('click', produceMusic);
    produceMusicButton.addEventListener('touchstart', (e) => {
        e.preventDefault(); 
        produceMusic();
    });

    // ダイアログボックス
    dialogBox.addEventListener('click', advanceDialog);
    dialogBox.addEventListener('touchstart', (e) => {
        e.preventDefault(); 
        advanceDialog();
    });

    // 🔴 リセットボタンは非表示
    reincarnateButton.style.display = 'none'; 
}

function checkInitialStory() { /* 変更なし */ }

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', () => {
    console.log("--- DOMContentLoaded fired. Starting Init Sequence. ---");
    
    updateUI();
    
    // 🔴 ここでイベントリスナーは登録しない！

    console.log("--- Initialization complete. Waiting for safe event registration. ---");
});

// 🔴 ページ上の全てのコンテンツが読み込まれてからイベントリスナーを登録
window.onload = () => {
    console.log("--- window.onload fired. Registering events and checking story. ---");
    registerEventListeners();
    checkInitialStory();
}
