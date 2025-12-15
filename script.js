// =================================================================
// プレイヤーの状態と初期設定
// =================================================================
const initialPlayerState = {
    fan: 0,
    money: 0,
    stage: 0,
    inventory: [],
    // UIの状態を管理: 'FREE', 'STORY', 'GACHA'
    uiState: 'FREE', 
    readStories: new Set(),
};

let playerState = loadGame() || initialPlayerState;

// DOM要素の取得
const fanCountElement = document.getElementById('fan-count');
const moneyCountElement = document.getElementById('money-count');
const gameContainer = document.getElementById('game-container');
const dialogBox = document.getElementById('dialog-box');
const dialogTextElement = document.getElementById('dialog-text');
const storyMarkerElement = document.getElementById('story-marker');
const produceButton = document.getElementById('produce-music-button');
const reincarnateButton = document.getElementById('reincarnate-button');
const inventoryUl = document.getElementById('inventory-ul');

// =================================================================
// ストーリーとダイアログ管理 (省略 - 変更なし)
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
};

function saveGame() {
    const saveState = {
        ...playerState,
        readStories: Array.from(playerState.readStories)
    };
    localStorage.setItem('world1_save', JSON.stringify(saveState));
    console.log("Game Saved.");
}

function loadGame() {
    const saved = localStorage.getItem('world1_save');
    if (saved) {
        const loadedState = JSON.parse(saved);
        loadedState.readStories = new Set(loadedState.readStories);
        console.log("Game Loaded.");
        return loadedState;
    }
    console.log("No Save Data Found.");
    return null;
}

function resetGame() {
    // 🔴 デバッグ優先: 転生処理は引き続き無効化
}

// ----------------------------------------------------------------
// UIとステータスの更新 (省略 - 変更なし)
// ----------------------------------------------------------------

function updateUI() {
    fanCountElement.textContent = formatNumber(playerState.fan);
    moneyCountElement.textContent = formatNumber(playerState.money);
    updateRoomView();
    updateInventoryUI();
    console.log(`Current UI State: ${playerState.uiState}`);

    const isLocked = playerState.uiState !== 'FREE';

    produceButton.disabled = isLocked;

    dialogBox.style.border = isLocked ? '2px solid #ffc107' : '2px solid #555';
    storyMarkerElement.style.display = isLocked ? 'block' : 'none';
}

function updateRoomView() {
    const newStage = getStage(playerState.fan);
    if (newStage !== playerState.stage) {
        gameContainer.classList.remove(`stage-${playerState.stage}`);
        gameContainer.classList.add(`stage-${newStage}`);
        playerState.stage = newStage;
    }
}

function getStage(fan) {
    if (fan >= 2000000) return 4;
    if (fan >= 1000000) return 3;
    if (fan >= 100000) return 2;
    if (fan >= 10000) return 1;
    return 0;
}

function updateInventoryUI() {
    inventoryUl.innerHTML = '';
    playerState.inventory.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `🎸 ${item}`;
        inventoryUl.appendChild(li);
    });
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// ----------------------------------------------------------------
// メインアクション (省略 - 変更なし)
// ----------------------------------------------------------------

function produceMusic() {
    if (playerState.uiState !== 'FREE') {
        console.warn("Attempted to produce music while UI is locked.");
        return;
    }
    
    // 🔴 デバッグログ
    console.log(">>> produceMusic fired <<<");

    playerState.fan += 100;
    playerState.money += 5;
    
    updateUI();
    saveGame();
}

// ----------------------------------------------------------------
// ストーリーアクション (省略 - 変更なし)
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
    // 🔴 デバッグログ
    console.log(`advanceDialog fired - Index: ${storyIndex}, UI State: ${playerState.uiState}`);
    
    if (playerState.uiState !== 'STORY') {
        // ロックフラグの解除ミスを疑い、ログを出して強制解除
        console.warn("Dialog attempted to advance while UI was NOT 'STORY'. Force unlock.");
        playerState.uiState = 'FREE'; // ⑥ 強制解除
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
// 初期化とイベントリスナー (重要修正箇所)
// ----------------------------------------------------------------

function checkInitialStory() {
    if (!playerState.readStories.has('initial')) {
        // 🔴 ⑥ デバッグ用に一時的に初期値を強制解除
        playerState.uiState = 'FREE'; 
        startStory('initial');
        playerState.readStories.add('initial');
    } else {
        playerState.uiState = 'FREE';
    }
}

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    checkInitialStory();
    
    // ① クリックイベントを強化: clickとtouchstartを併用
    produceButton.addEventListener('click', produceMusic);
    produceButton.addEventListener('touchstart', (e) => {
        e.preventDefault(); // クリックの二重発火防止
        produceMusic();
    });

    // ① dialogBoxにもtouchstartを追加
    dialogBox.addEventListener('click', advanceDialog);
    dialogBox.addEventListener('touchstart', (e) => {
        e.preventDefault(); // スクロール防止とclickの二重発火防止
        advanceDialog();
    });

    // 🔴 ⑦ タップが本当に届いているかのログ確認
    document.addEventListener("pointerdown", e => {
      console.log("--- Tap Event Debug ---");
      console.log("tap target:", e.target);
      const actualElement = document.elementFromPoint(e.clientX, e.clientY);
      console.log("actual element at point:", actualElement);
      // タップした要素が想定と違う、またはnullなら重なりを疑う
      if (e.target !== actualElement) {
          console.error("WARNING: Tap target mismatch! An overlay might be intercepting the tap.");
      }
      console.log("-----------------------");
    });


    reincarnateButton.style.display = 'none';

    console.log("All event listeners registered, including touch support.");
});
