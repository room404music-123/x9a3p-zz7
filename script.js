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
    readStories: new Set(), // 既読ストーリーを格納するSet
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
// ストーリーとダイアログ管理
// =================================================================

// 🔴 デバッグ優先：ストーリー進行フラグの二重管理を防ぐため、簡略化
let currentStory = null;
let storyIndex = 0;

const STORY_DATA = {
    // 最初の起動時だけ流れるセリフ
    initial: [
        { text: "最近、DTMというものに興味がある。", speaker: "自分" },
        { text: "PCとDAWソフトがあれば、誰でも音楽を作れる時代だ。", speaker: "自分" },
        { text: "まずは趣味程度で、何か一つ曲を作ってみるか。" },
        { text: "楽曲制作のボタンを押してみよう。", action: () => {
             // 最初のチュートリアルが終わったら、UIはFREEに戻る
             playerState.uiState = 'FREE'; 
             saveGame();
        } }
    ],
    // その他のストーリーは一旦省略 (デバッグ優先)
};


// 状態をセーブ
function saveGame() {
    // playerState.readStories は Set なので、JSON.stringifyのために配列に変換
    const saveState = {
        ...playerState,
        readStories: Array.from(playerState.readStories)
    };
    localStorage.setItem('world1_save', JSON.stringify(saveState));
    console.log("Game Saved.");
}

// 状態をロード
function loadGame() {
    const saved = localStorage.getItem('world1_save');
    if (saved) {
        const loadedState = JSON.parse(saved);
        // ロード時に readStories を Set に戻す
        loadedState.readStories = new Set(loadedState.readStories);
        console.log("Game Loaded.");
        return loadedState;
    }
    console.log("No Save Data Found.");
    return null;
}

// 状態のリセット
function resetGame() {
    // 🔴 デバッグ優先: 「新しく始める」ボタンの処理は一旦完全に無効化
    // console.log("Game Reset initiated. (Currently disabled for core debugging)");
    // playerState = initialPlayerState;
    // playerState.readStories.clear();
    // localStorage.removeItem('world1_save');
    // updateUI();
    // checkInitialStory();
    // location.reload(); // デバッグ中はリロードも一旦不要
}

// ----------------------------------------------------------------
// UIとステータスの更新
// ----------------------------------------------------------------

function updateUI() {
    fanCountElement.textContent = formatNumber(playerState.fan);
    moneyCountElement.textContent = formatNumber(playerState.money);
    updateRoomView();
    updateInventoryUI();
    // 🔴 UI状態のログを常に出す
    console.log(`Current UI State: ${playerState.uiState}`);

    // UIロック状態の制御
    const isLocked = playerState.uiState !== 'FREE';

    // 🔴 デバッグ優先: ボタンの disabled を制御する
    produceButton.disabled = isLocked;
    // reincarnateButton.disabled = isLocked; // 転生ボタンは今回はdisplay:noneで無効化

    // ダイアログボックスの見た目を更新 (ストーリー中かどうか)
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
    // 🔴 デバッグログ
    console.log(`Inventory updated. Items: ${playerState.inventory.join(', ')}`);
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
// メインアクション
// ----------------------------------------------------------------

function produceMusic() {
    // 🔴 デバッグ優先: ロックフラグの確認を**一旦コメントアウト**
    // if (playerState.uiState !== 'FREE') return; 
    
    // 🔴 デバッグログ (最優先の確認ポイント)
    console.log(">>> produceMusic button clicked (SUCCESS) <<<");

    if (playerState.uiState !== 'FREE') {
        console.warn("Attempted to produce music while UI is locked.");
        return; // FREEでなければここで止めるのはOK
    }

    // ファンとマネーの増加（デバッグ完了条件①）
    playerState.fan += 100;
    playerState.money += 5;
    
    updateUI();
    saveGame();
}

// ----------------------------------------------------------------
// ストーリーアクション
// ----------------------------------------------------------------

function startStory(storyName) {
    if (playerState.uiState !== 'FREE') {
        console.warn("Attempted to start story while UI is locked.");
        return;
    }
    
    // 🔴 デバッグログ
    console.log(`Starting story: ${storyName}`);

    currentStory = STORY_DATA[storyName];
    storyIndex = 0;
    playerState.uiState = 'STORY';
    dialogTextElement.textContent = ''; // テキストをクリア
    updateUI();
    advanceDialog();
}

function advanceDialog() {
    // 🔴 デバッグ優先: ロックフラグの確認を**一旦コメントアウト**
    // if (playerState.uiState !== 'STORY') return;

    // 🔴 デバッグログ (デバッグ完了条件②)
    console.log(`story advanced (click) - Index: ${storyIndex}`);

    if (currentStory && storyIndex < currentStory.length) {
        const line = currentStory[storyIndex];
        
        // 話者名の表示
        const speaker = line.speaker ? `<span style="color:#007bff; font-weight:bold;">${line.speaker}:</span> ` : '';
        dialogTextElement.innerHTML = speaker + line.text;
        
        // アクションの実行 (アイテム付与など)
        if (line.action) {
            line.action();
        }

        storyIndex++;
        updateUI();
    } else {
        // ストーリー終了
        console.log("Story Finished.");
        
        // 🔴 最重要デバッグポイント
        playerState.uiState = 'FREE'; 
        currentStory = null;
        storyIndex = 0;
        dialogTextElement.textContent = "（タップしてセリフを表示）";
        updateUI();
        saveGame();
    }
}

// ----------------------------------------------------------------
// 初期化とイベントリスナー
// ----------------------------------------------------------------

function checkInitialStory() {
    // 🔴 デバッグ優先: 常に最初のストーリーをチェック
    // デバッグ完了条件③: storyIndex/currentStoryの混在を排除し、初期ストーリだけ直再生
    if (!playerState.readStories.has('initial')) {
        startStory('initial');
        playerState.readStories.add('initial');
    } else {
        // 既読の場合はUIをFREEに戻す
        playerState.uiState = 'FREE';
    }
}

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    checkInitialStory();
    
    // イベントリスナーの登録（ID不一致がないか確認のため、IDを直接指定）
    produceButton.addEventListener('click', produceMusic);
    dialogBox.addEventListener('click', advanceDialog);

    // 🔴 デバッグ優先: 「新しく始める」ボタンは完全に非表示に
    reincarnateButton.style.display = 'none';

    // 🔴 デバッグログ
    console.log("All event listeners registered.");
});

// デバッグ用: リセットボタンの追加 (非表示だが、コンソールから操作可能)
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' && e.ctrlKey) {
        console.log("Ctrl+R pressed. Attempting to reset game...");
        localStorage.clear();
        location.reload();
    }
});
