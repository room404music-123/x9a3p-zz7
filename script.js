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

// 🔴 常に初期状態から始めるため、loadGameは一度だけ実行
let playerState = loadGame() || initialPlayerState;

// DOM要素の取得 (変更なし)
const fanCountElement = document.getElementById('fan-count');
const moneyCountElement = document.getElementById('money-count');
const gameContainer = document.getElementById('game-container');
const dialogBox = document.getElementById('dialog-box');
const dialogTextElement = document.getElementById('dialog-text');
const storyMarkerElement = document.getElementById('story-marker');
const produceMusicButton = document.getElementById('produce-music-button'); 
const reincarnateButton = document.getElementById('reincarnate-button'); // 🔴 リセットボタンとして利用
const inventoryUl = document.getElementById('inventory-ul');

// =================================================================
// ストーリーとダイアログ管理 (変更なし)
// =================================================================

let currentStory = null;
let storyIndex = 0;

const STORY_DATA = {
    initial: [
        { text: "最近、DTMというものに興味がある。", speaker: "自分" },
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
        return loadedState;
    }
    console.log(">>> Load Fail: No Save Data Found. Starting New Game. <<<");
    return null;
}

// 🔴 修正: 全数値を初期化し、強制リロードする
function resetGame() {
    console.log("Game Reset initiated: Clearing state and localStorage.");
    
    // playerStateを初期状態のディープコピーで上書き
    playerState = { ...initialPlayerState };
    playerState.readStories = new Set();
    playerState.uiState = 'FREE'; 
    
    localStorage.removeItem('world1_save');
    
    // UIを更新してから強制リロードし、クリーンな状態を保証
    updateUI(); 
    location.reload(); 
}

// ----------------------------------------------------------------
// UIとステータスの更新 (変更なし)
// ----------------------------------------------------------------
function updateUI() {
    fanCountElement.textContent = formatNumber(playerState.fan);
    moneyCountElement.textContent = formatNumber(playerState.money);
    updateRoomView();
    updateInventoryUI();
    updateActionButtons(); 
    
    console.log(`Current UI State: ${playerState.uiState}`);

    const isLocked = playerState.uiState !== 'FREE';

    produceMusicButton.disabled = isLocked;

    dialogBox.style.border = isLocked ? '2px solid #ffc107' : '2px solid #555';
    storyMarkerElement.style.display = isLocked ? 'block' : 'none';
}

function updateActionButtons() {
    produceMusicButton.style.display = 'block'; 
    produceMusicButton.textContent = "楽曲制作"; 
}

function updateRoomView() { /* 省略 */ }
function getStage(fan) { /* 省略 */
    if (fan >= 2000000) return 4;
    if (fan >= 1000000) return 3;
    if (fan >= 100000) return 2;
    if (fan >= 10000) return 1;
    return 0;
}
function updateInventoryUI() { /* 省略 */ }
function formatNumber(num) { /* 省略 */
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// ----------------------------------------------------------------
// メインアクション (変更なし)
// ----------------------------------------------------------------

function produceMusic() {
    if (playerState.uiState !== 'FREE') {
        console.warn("Attempted to produce music while UI is locked.");
        return;
    }
    
    console.log(">>> produceMusic fired: Basic Production <<<");

    playerState.fan += 100;
    playerState.money += 5;
    
    checkStoryTriggers(); 

    updateUI();
    saveGame();
}

// ----------------------------------------------------------------
// ストーリーアクション (変更なし)
// ----------------------------------------------------------------
function startStory(storyName) {
    if (playerState.uiState !== 'FREE') {
        console.warn("Attempted to start story while UI is locked.");
        return;
    }
    
    console.log(`Starting story: ${storyName}`);

    currentStory = STORY_DATA[storyName];
    storyIndex = 0;
    playerState.uiState = 'STORY';
    dialogTextElement.textContent = '';
    updateUI();
    advanceDialog();
}

function advanceDialog() {
    console.log(`advanceDialog fired - Index: ${storyIndex}, UI State: ${playerState.uiState}`);
    
    if (playerState.uiState !== 'STORY') {
        console.warn("Dialog attempted to advance while UI was NOT 'STORY'. Force unlock and return.");
        playerState.uiState = 'FREE'; 
        updateUI();
        return;
    }

    if (currentStory && storyIndex < currentStory.length) {
        const line = currentStory[storyIndex];
        
        const speaker = line.speaker ? `<span style="color:#007bff; font-weight:bold;">${line.speaker}:</span> ` : '';
        dialogTextElement.innerHTML = speaker + line.text;
        
        if (line.action) {
            line.action();
        }

        storyIndex++;
        updateUI();
    } else {
        console.log("Story Finished. Setting UI State to FREE.");
        
        playerState.uiState = 'FREE'; 
        currentStory = null;
        storyIndex = 0;
        dialogTextElement.textContent = "（タップしてセリフを表示）";
        updateUI();
        saveGame();
    }
}

// ----------------------------------------------------------------
// ストーリートリガーチェック (変更なし)
// ----------------------------------------------------------------

function checkStoryTriggers() {
    if (playerState.fan >= 500 && !playerState.readStories.has('second_step')) {
       startStory('second_step');
       playerState.readStories.add('second_step');
    }
}


// ----------------------------------------------------------------
// 初期化とイベントリスナー (🔴 リセットボタンを一時的に有効化)
// ----------------------------------------------------------------

function checkInitialStory() {
    if (!playerState.readStories.has('initial')) {
        console.log("Initial story not read. Starting story.");
        playerState.uiState = 'FREE'; 
        startStory('initial');
        playerState.readStories.add('initial');
    } else {
        console.log("Initial story already read. Ensuring UI State is FREE.");
        playerState.uiState = 'FREE';
    }
}

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', () => {
    console.log("--- DOMContentLoaded fired. Starting Init Sequence. ---");
    
    updateUI();
    checkInitialStory();
    
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

    // 🔴 一時的なリセットボタンの有効化とイベント登録
    reincarnateButton.style.display = 'block'; // ボタンを可視化
    reincarnateButton.textContent = "[全数値リセット実行]"; // テキストを変更
    reincarnateButton.addEventListener('click', resetGame);
    reincarnateButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        resetGame(); // タッチでもリセットが走るようにする
    });

    console.log("--- Initialization complete. Final State Check ---", {
        fan: playerState.fan,
        money: playerState.money,
        uiState: playerState.uiState
    });
});
