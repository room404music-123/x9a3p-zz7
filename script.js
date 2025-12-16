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

// 🔴 🔴 🔴 究極の強制初期化フラグ 🔴 🔴 🔴
// 
// この行をデプロイ後、一度だけサイトを読み込めば全てのセーブデータが消去されます。
// 
// 🚨 初期化が完了したら、この行は必ず削除するかコメントアウトしてください！
// localStorage.removeItem('world1_save'); 
// localStorage.clear(); 
// 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 

let playerState = loadGame() || initialPlayerState;

// DOM要素の取得 (変更なし)
const fanCountElement = document.getElementById('fan-count');
const moneyCountElement = document.getElementById('money-count');
const gameContainer = document.getElementById('game-container');
const dialogBox = document.getElementById('dialog-box');
const dialogTextElement = document.getElementById('dialog-text');
const storyMarkerElement = document.getElementById('story-marker');
const produceMusicButton = document.getElementById('produce-music-button'); 
const reincarnateButton = document.getElementById('reincarnate-button'); 
const inventoryUl = document.getElementById('inventory-ul');

// =================================================================
// ストーリーとダイアログ管理 (変更なし)
// =================================================================

let currentStory = null;
let storyIndex = 0;

const STORY_DATA = {
    initial: [
        { text: "最近、DTMというものに興味がある。", speaker: "自分" },
        // ... (以下、STORY_DATAの内容は省略、変更なし)
        { text: "PCとDAWソフトがあれば、誰でも音楽を作れる時代だ。", speaker: "自分" },
        { text: "まずは趣味程度で、何か一つ曲を作ってみるか。" },
        { text: "楽曲制作のボタンを押してみよう。", action: () => {
             playerState.uiState = 'FREE'; 
             saveGame();
        } }
    ],
    second_step: [
        { text: "いいね、初めての曲ができた。思ったよりファンが増えてるぞ。", speaker: "自分" },
        { text: "次はもっと本格的な機材がほしいな。", speaker: "自分" },
        { text: "この調子で、制作を続けていこう！" }
    ]
};

function saveGame() {
    const saveState = { ...playerState, readStories: Array.from(playerState.readStories) };
    localStorage.setItem('world1_save', JSON.stringify(saveState));
    console.log("Game Saved.");
}

function loadGame() {
    const saved = localStorage.getItem('world1_save');
    if (saved) {
        const loadedState = JSON.parse(saved);
        loadedState.readStories = new Set(loadedState.readStories);
        if (loadedState.uiState === 'STORY') {
            loadedState.uiState = 'FREE';
        }
        console.log(">>> Load Success: Saved Data State <<<", loadedState);
        // 🔴 ここで強制的にファン数とマネーが初期値になっているかチェック
        if (loadedState.fan > 500000 || loadedState.money > 10000) { // 極端な異常値が残っていた場合
             console.warn("異常値検出。ファン数とマネーを初期化します。");
             loadedState.fan = 0;
             loadedState.money = 0;
             loadedState.inventory = [];
             loadedState.readStories = new Set();
             // 再度セーブし、クリーンなデータで上書き
             localStorage.setItem('world1_save', JSON.stringify({...loadedState, readStories: []}));
             return loadedState;
        }
        return loadedState;
    }
    console.log(">>> Load Fail: No Save Data Found. Starting New Game. <<<");
    return null;
}

// ----------------------------------------------------------------
// ⚠️ 注意: resetGame関数は一時的に再コメントアウト (reincarnateButtonの無効化のため)
// ----------------------------------------------------------------
function resetGame() {
    console.log("Game Reset initiated: Clearing state and localStorage.");
    playerState = { ...initialPlayerState };
    playerState.readStories = new Set();
    playerState.uiState = 'FREE'; 
    localStorage.removeItem('world1_save');
    updateUI(); 
    location.reload(); 
}

// ----------------------------------------------------------------
// UIとアクション関数群 (変更なし)
// ----------------------------------------------------------------
function updateUI() { /* 省略 */
    fanCountElement.textContent = formatNumber(playerState.fan);
    moneyCountElement.textContent = formatNumber(playerState.money);
    updateRoomView();
    updateInventoryUI();
    updateActionButtons(); 
    const isLocked = playerState.uiState !== 'FREE';
    produceMusicButton.disabled = isLocked;
    dialogBox.style.border = isLocked ? '2px solid #ffc107' : '2px solid #555';
    storyMarkerElement.style.display = isLocked ? 'block' : 'none';
}

function updateActionButtons() {
    produceMusicButton.style.display = 'block'; 
    produceMusicButton.textContent = "楽曲制作"; 
}
// ... (以下、他のUI, Action, Story関数は変更なし)
function produceMusic() { /* 省略 */ }
function startStory(storyName) { /* 省略 */ }
function advanceDialog() { /* 省略 */ }
function checkStoryTriggers() { /* 省略 */ }

// ----------------------------------------------------------------
// 初期化とイベントリスナー
// ----------------------------------------------------------------

function checkInitialStory() { /* 省略 */ }

document.addEventListener('DOMContentLoaded', () => {
    
    // 🔴 ⚠️ 暫定対応: リセットボタンを再び非表示に戻す ⚠️ 🔴
    reincarnateButton.style.display = 'none'; 
    
    updateUI();
    checkInitialStory();
    
    // イベントリスナーの再登録 (変更なし)
    produceMusicButton.addEventListener('click', produceMusic);
    produceMusicButton.addEventListener('touchstart', (e) => { e.preventDefault(); produceMusic(); });
    dialogBox.addEventListener('click', advanceDialog);
    dialogBox.addEventListener('touchstart', (e) => { e.preventDefault(); advanceDialog(); });
});
