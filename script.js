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

// 🔴 最終デバッグフラグ：ONにするとゲーム内デバッグメニューが表示される
const IS_DEBUG_MODE = true; 

let playerState = loadGame() || initialPlayerState;

// DOM要素の取得
const fanCountElement = document.getElementById('fan-count');
const moneyCountElement = document.getElementById('money-count');
const dialogBox = document.getElementById('dialog-box');
const dialogTextElement = document.getElementById('dialog-text');
const storyMarkerElement = document.getElementById('story-marker');
const produceMusicButton = document.getElementById('produce-music-button'); 
const reincarnateButton = document.getElementById('reincarnate-button'); 

// 🚨 エラー表示用のDOM要素 (前回導入)
const errorIndicator = document.createElement('div');
errorIndicator.id = 'error-indicator';
errorIndicator.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; 
    background: red; color: white; padding: 10px; 
    text-align: center; font-weight: bold; z-index: 9999;
    display: none;
`;
document.body.appendChild(errorIndicator);


// =================================================================
// セーブ/ロード (リセット機能は loadGame から分離)
// =================================================================

function saveGame() {
    try {
        const saveState = { ...playerState, readStories: Array.from(playerState.readStories) };
        localStorage.setItem('world1_save', JSON.stringify(saveState));
    } catch (e) {
        errorIndicator.textContent = `❌ セーブエラー: ${e.message}`;
        errorIndicator.style.display = 'block';
    }
}

function loadGame() {
    const saved = localStorage.getItem('world1_save');
    if (saved) {
        try {
            const loadedState = JSON.parse(saved);
            loadedState.readStories = new Set(loadedState.readStories);
            // 永続的なUIロック回避 (解決済み)
            if (loadedState.uiState === 'STORY') {
                loadedState.uiState = 'FREE';
            }
            return loadedState;
        } catch (e) {
             // JSONパースエラー時は初期値で開始
             return null; 
        }
    }
    return null;
}

// 🔴 恒久対策: ゲーム内から localStorage を強制リセット
function hardResetFromGame() {
    localStorage.removeItem('world1_save');
    // 初期状態に戻る
    playerState = { ...initialPlayerState };
    playerState.readStories = new Set();
    playerState.uiState = 'FREE';
    // 強制リロード (最も確実)
    location.reload(); 
}


// =================================================================
// デバッグツールUIの構築 (新規)
// =================================================================

function buildDebugUI() {
    if (!IS_DEBUG_MODE) return;
    
    // 1. デバッグ開閉ボタン
    const debugButton = document.createElement('button');
    debugButton.textContent = '⚙️ DEBUG';
    debugButton.style.cssText = `
        position: fixed; top: 10px; right: 10px; z-index: 999;
        background: #4CAF50; color: white; border: none; padding: 5px 10px;
        border-radius: 5px; cursor: pointer;
    `;
    
    // 2. デバッグパネル
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.cssText = `
        position: fixed; top: 50px; right: 10px; z-index: 998;
        background: rgba(0, 0, 0, 0.9); padding: 15px; border-radius: 5px;
        color: white; width: 250px; display: none;
        font-size: 12px;
    `;

    // 3. 状態表示エリア
    const stateDisplay = document.createElement('p');
    stateDisplay.id = 'debug-state';
    stateDisplay.innerHTML = 'Status...';
    debugPanel.appendChild(stateDisplay);

    // 4. 強制リセットボタン
    const resetButton = document.createElement('button');
    resetButton.textContent = '☢️ 強制初期化 (データ削除)';
    resetButton.style.cssText = 'background: #f44336; color: white; border: none; padding: 5px; margin-top: 10px; width: 100%; cursor: pointer;';
    resetButton.addEventListener('click', hardResetFromGame);
    debugPanel.appendChild(resetButton);

    // 開閉ロジック
    debugButton.addEventListener('click', () => {
        const isVisible = debugPanel.style.display === 'block';
        debugPanel.style.display = isVisible ? 'none' : 'block';
        updateDebugPanel(); 
    });

    document.body.appendChild(debugButton);
    document.body.appendChild(debugPanel);
}

// デバッグパネルの状態を更新
function updateDebugPanel() {
    const stateDisplay = document.getElementById('debug-state');
    if (stateDisplay) {
        stateDisplay.innerHTML = `
            ファン: ${formatNumber(playerState.fan)} (${playerState.fan})<br>
            お金: $${formatNumber(playerState.money)} (${playerState.money})<br>
            UI状態: ${playerState.uiState}<br>
            Stage: ${playerState.stage}<br>
            Read: ${playerState.readStories.size}
        `;
    }
}


// ----------------------------------------------------------------
// UIとステータスの更新 (デバッグパネル更新を追加)
// ----------------------------------------------------------------
function updateUI() {
    // ... (既存のファン数、マネー表示更新ロジックは省略) ...
    fanCountElement.textContent = formatNumber(playerState.fan);
    moneyCountElement.textContent = formatNumber(playerState.money);
    
    // 🔴 デバッグパネルの状態も更新
    updateDebugPanel(); 

    // ... (既存のボタン無効化、ダイアログ表示ロジックは省略) ...
}

// ----------------------------------------------------------------
// メインアクション ( try-catch を維持 )
// ----------------------------------------------------------------
function produceMusic() {
    if (playerState.uiState !== 'FREE') {
        return;
    }
    
    // 🔴 try-catch で処理を囲み、エラーを画面に表示する
    try {
        playerState.fan += 100;
        playerState.money += 5;
        
        checkStoryTriggers(); 

        updateUI();
        saveGame();
        
        errorIndicator.style.display = 'none';

    } catch (e) {
        errorIndicator.textContent = `❌ CRITICAL ERROR: ${e.message}`;
        errorIndicator.style.display = 'block';
        console.error("CRITICAL ERROR in produceMusic:", e);
    }
}

// ... (他の関数は変更なし) ...

// ----------------------------------------------------------------
// 初期化とイベントリスナー (window.onload を維持)
// ----------------------------------------------------------------

function registerEventListeners() {
    // ... (イベント登録はそのまま) ...
    produceMusicButton.addEventListener('click', produceMusic);
    produceMusicButton.addEventListener('touchstart', (e) => { e.preventDefault(); produceMusic(); });
    dialogBox.addEventListener('click', advanceDialog);
    dialogBox.addEventListener('touchstart', (e) => { e.preventDefault(); advanceDialog(); });
}

function checkInitialStory() { /* 省略 */ }


window.onload = () => {
    // 🔴 デバッグUIを構築
    buildDebugUI(); 
    
    registerEventListeners();
    checkInitialStory();
    updateUI(); // 初回UI更新
}

// ... (formatNumber, advanceDialog, checkStoryTriggers など、その他の関数はそのまま) ...
