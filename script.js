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
// ストーリーとダイアログ管理
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

// 状態をセーブ
function saveGame() {
    const saveState = {
        ...playerState,
        readStories: Array.from(playerState.readStories)
    };
    localStorage.setItem('world1_save', JSON.stringify(saveState));
    console.log("Game Saved.");
}

// 状態をロード (★★★ 重点修正箇所 ★★★)
function loadGame() {
    const saved = localStorage.getItem('world1_save');
    if (saved) {
        const loadedState = JSON.parse(saved);
        loadedState.readStories = new Set(loadedState.readStories);
        
        // 🔴 致命的なバグ対策: ロード時に状態を検証
        // ストーリーデータなしで'STORY'状態で復元すると永久ロックするため、強制的に'FREE'に戻す
        if (loadedState.uiState === 'STORY') {
            console.warn("Save data loaded with uiState='STORY'. Force resetting to 'FREE' to prevent lock.");
            loadedState.uiState = 'FREE';
        }

        // ログ出力 (要求されたデバッグ情報)
        console.log(">>> Load Success: Saved Data State <<<", {
            fan: loadedState.fan,
            money: loadedState.money,
            uiState: loadedState.uiState,
            readStoriesSize: loadedState.readStories.size
        });

        return loadedState;
    }
    console.log(">>> Load Fail: No Save Data Found. Starting New Game. <<<");
    return null;
}

// 状態のリセット
function resetGame() {
    // 転生処理は引き続き無効化
}

// ----------------------------------------------------------------
// UIとステータスの更新
// ----------------------------------------------------------------

function updateUI() {
    fanCountElement.textContent = formatNumber(playerState.fan);
    moneyCountElement.textContent = formatNumber(playerState.money);
    updateRoomView();
    updateInventoryUI();
    console.log(`Current UI State: ${playerState.uiState}`);

    const isLocked = playerState.uiState !== 'FREE';

    // 楽曲制作ボタンの有効/無効化（ボタンがガチャボタンの役割も兼ねるため、updateUIで制御）
    // 🔴 ガチャボタン出現のデバッグとして、ファン数1000でボタンのテキストを仮に変更
    if (playerState.fan >= 1000) {
         produceButton.textContent = "ガチャ (デバッグ)";
    } else {
         produceButton.textContent = "楽曲制作";
    }

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
// メインアクション
// ----------------------------------------------------------------

function produceMusic() {
    if (playerState.uiState !== 'FREE') {
        console.warn("Attempted to produce music while UI is locked.");
        return;
    }
    
    console.log(">>> produceMusic fired <<<");

    // 🔴 ガチャの条件が整っていたら、ここでガチャ処理に分岐させる
    if (playerState.fan >= 1000) {
        console.log("ガチャ条件達成。本来はここでガチャ処理へ。");
        // startGacha(); // (未実装)
        playerState.money -= 100;
        playerState.fan += 5000;
        playerState.inventory.push("マイク");
    } else {
        // 通常の楽曲制作
        playerState.fan += 100;
        playerState.money += 5;
    }
    
    // ストーリーチェックを挟む (ここで新しいストーリー開始の判定を入れる)
    checkStoryTriggers(); 

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
// ストーリートリガーチェック
// ----------------------------------------------------------------

function checkStoryTriggers() {
    // 🔴 ストーリートリガーのロジックは今後ここに追記
    // if (playerState.fan >= 10000 && !playerState.readStories.has('first_hit')) {
    //    startStory('first_hit');
    // }
}


// ----------------------------------------------------------------
// 初期化とイベントリスナー
// ----------------------------------------------------------------

function checkInitialStory() {
    // 🔴 初期ストーリーは loadGame で uiState が FREE に戻っていることを前提に実行
    if (!playerState.readStories.has('initial')) {
        console.log("Initial story not read. Starting story.");
        startStory('initial');
        playerState.readStories.add('initial');
    } else {
        console.log("Initial story already read. Ensuring UI State is FREE.");
        playerState.uiState = 'FREE';
    }
}

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', () => {
    // 🔴 デバッグログ (初期化順序確認)
    console.log("--- DOMContentLoaded fired. Starting Init Sequence. ---");
    
    updateUI();
    checkInitialStory();
    
    // イベントリスナーの登録
    produceButton.addEventListener('click', produceMusic);
    produceButton.addEventListener('touchstart', (e) => {
        e.preventDefault(); 
        produceMusic();
    });

    dialogBox.addEventListener('click', advanceDialog);
    dialogBox.addEventListener('touchstart', (e) => {
        e.preventDefault(); 
        advanceDialog();
    });

    // タップデバッグログは一旦コメントアウトし、ログを整理
    /*
    document.addEventListener("pointerdown", e => {
      // 省略
    });
    */

    reincarnateButton.style.display = 'none';

    console.log("All event listeners registered, including touch support.");
    // 🔴 デバッグログ (最終的なUI状態確認)
    console.log("--- Initialization complete. Final State Check ---", {
        fan: playerState.fan,
        money: playerState.money,
        uiState: playerState.uiState
    });
});
