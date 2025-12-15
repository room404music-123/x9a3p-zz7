// ===================================
// GLOBAL VARIABLES (プレイヤーの状態)
// ===================================
let playerState = {
    fans: 0,
    money: 5000, // 初期マネーを増やしてガチャを回せるように
    trend: 50,   // トレンド度の初期値 (0-100)
    productionCount: 0,
    reincarnationCount: 0,
    // ★ここに追加した機材の情報が入る★
    equipment: {}, 
    // UIの状態管理 (FREE, STORY, GACHAなど)
    uiState: "FREE" 
};

// ===================================
// STORY & GACHA DATA (ガチャ排出率)
// ===================================

const GACHA_COST = 500;

// ★シア提案の排出率を採用 (遊びやすさ重視)
const GACHA_RATES = {
    'N': 55,
    'R': 30,
    'SR': 10,
    'SSR': 5
};

// 仮の機材アイテムリスト（今は機材ガチャのみ）
const EQUIPMENT_LIST = [
    // N (55%)
    { name: "ノイズ低減イヤホン N", rank: "N", effect: { fanIncrease: 1, moneyIncrease: 1 }, flavor: "初期の必需品。音が漏れる。" },
    { name: "中古のイス N", rank: "N", effect: { fanIncrease: 1, moneyIncrease: 1 }, flavor: "座り心地は最悪だが、まあ座れる。" },
    // R (30%)
    { name: "格安モニター R", rank: "R", effect: { fanIncrease: 3, moneyIncrease: 3 }, flavor: "画面が少し明るくなった。気分が良い。" },
    { name: "普通のキーボード R", rank: "R", effect: { fanIncrease: 3, moneyIncrease: 3 }, flavor: "指に吸い付く感触が心地よい。" },
    // SR (10%)
    { name: "高性能PC SR", rank: "SR", effect: { fanIncrease: 10, moneyIncrease: 10 }, flavor: "レンダリング速度が大幅に向上した。時間短縮は正義。" },
    { name: "マイクセット SR", rank: "SR", effect: { fanIncrease: 10, moneyIncrease: 10 }, flavor: "歌ってみたにも挑戦できる！" },
    // SSR (5%)
    { name: "ゲーミングチェア SSR", rank: "SSR", effect: { fanIncrease: 30, moneyIncrease: 30 }, flavor: "疲れを知らない身体を手に入れた。作業効率爆上がり！" },
    { name: "防音室（簡易） SSR", rank: "SSR", effect: { fanIncrease: 50, moneyIncrease: 50 }, flavor: "夜中でも思いっきり音が出せる最高の環境。" }
];


// ===================================
// DOM ELEMENTS & INITIAL SETUP
// ===================================
const fanCountElement = document.getElementById('fan-count');
const moneyCountElement = document.getElementById('money-count');
const produceButton = document.getElementById('produce-music-button');
const dialogBox = document.getElementById('dialog-box');
const dialogText = document.getElementById('dialog-text');
const roomView = document.getElementById('room-view');
const actionsContainer = document.getElementById('actions');

// 初期表示を更新
updateUI();

// -----------------------------------
// メイン関数
// -----------------------------------

// 楽曲制作（クリック）処理
function produceMusic() {
    if (playerState.uiState !== "FREE") return; // UIロック中は実行しない

    playerState.productionCount++;
    
    // ファンとマネーの増加（ベース値 + 機材効果）
    const baseFanIncrease = 10 + Math.floor(playerState.trend / 10);
    const baseMoneyIncrease = 50;

    let totalFanIncrease = baseFanIncrease;
    let totalMoneyIncrease = baseMoneyIncrease;

    // 機材による効果を合算
    for (const itemName in playerState.equipment) {
        const item = playerState.equipment[itemName];
        totalFanIncrease += item.effect.fanIncrease;
        totalMoneyIncrease += item.effect.moneyIncrease;
    }

    playerState.fans += totalFanIncrease;
    playerState.money += totalMoneyIncrease;

    // トレンド度の増減ロジック (簡易版)
    // 制作すると少し上がり、50より離れると戻りやすくする
    const trendChange = Math.max(1, 5 - Math.abs(playerState.trend - 50) / 10);
    playerState.trend = Math.min(100, playerState.trend + trendChange);

    updateUI();
    
    // ストーリーチェック (今はスキップ)
    // checkStory();
}

// -----------------------------------
// ガチャ関連
// -----------------------------------

/**
 * ランクの重みに基づいて、ランダムなランクを選択する
 */
function getGachaRank() {
    const totalWeight = Object.values(GACHA_RATES).reduce((sum, weight) => sum + weight, 0);
    let randomNum = Math.random() * totalWeight;

    for (const rank in GACHA_RATES) {
        randomNum -= GACHA_RATES[rank];
        if (randomNum <= 0) {
            return rank;
        }
    }
    return 'N'; // フォールバック
}

/**
 * 選択されたランクのアイテムの中からランダムに一つ選ぶ
 */
function getGachaItem(rank) {
    const items = EQUIPMENT_LIST.filter(item => item.rank === rank);
    // すでに持っているアイテムを除外 (ここでは簡易的に、常に取得できるようにしておく)
    
    // ランダムに選ぶ
    const randomIndex = Math.floor(Math.random() * items.length);
    return items[randomIndex];
}

/**
 * ガチャを回すメイン処理
 */
function executeGacha() {
    if (playerState.uiState !== "FREE") return;
    if (playerState.money < GACHA_COST) {
        displayDialog("お金が足りません...");
        return;
    }

    playerState.money -= GACHA_COST;
    playerState.uiState = "GACHA"; // ガチャ中はロック

    const rank = getGachaRank();
    const item = getGachaItem(rank);
    
    // 簡易演出 (1秒後に結果を表示)
    displayDialog("アイテムを検索中...");

    setTimeout(() => {
        
        let message = `**${item.rank}** のアイテムをゲット！\n\n`;
        message += `『${item.name}』\n${item.flavor}`;
        
        // プレイヤーの状態にアイテムを登録
        playerState.equipment[item.name] = item;

        displayDialog(message, true); // true: UIをFREEに戻さない
        updateUI();

    }, 1000); // 1秒待機
}

// -----------------------------------
// UI & ステージ管理
// -----------------------------------

// UIの更新
function updateUI() {
    fanCountElement.textContent = playerState.fans.toLocaleString();
    moneyCountElement.textContent = playerState.money.toLocaleString();
    
    // 現在のファン数に基づいたステージの決定
    let currentStage = 0;
    if (playerState.fans >= 2000000) currentStage = 4;
    else if (playerState.fans >= 1000000) currentStage = 3;
    else if (playerState.fans >= 100000) currentStage = 2;
    else if (playerState.fans >= 10000) currentStage = 1;
    else currentStage = 0;

    // room-viewのクラスを更新してCSSを反映させる
    roomView.className = `stage-${currentStage}`;

    // プレイヤーのトレンド度の表示（今はUIには出さない）
    console.log(`現在のトレンド度: ${playerState.trend}`);
}

/**
 * ダイアログにテキストを表示し、UIの状態を制御する
 * @param {string} text - 表示するテキスト
 * @param {boolean} isGachaResult - ガチャ結果表示かどうか (ガチャ結果表示後、クリックでFREEに戻す)
 */
function displayDialog(text, isGachaResult = false) {
    dialogText.innerHTML = text.replace(/\n/g, '<br>'); // 改行をHTMLタグに変換

    if (isGachaResult) {
        // ガチャ結果表示中は、ダイアログクリックでFREEに戻るように設定
        dialogBox.onclick = () => {
            playerState.uiState = "FREE";
            dialogText.textContent = "(タップしてセリフを表示)";
            dialogBox.onclick = dialogClick; // 元のクリック動作に戻す
            updateUI();
        };
    } else {
        // 通常のダイアログは、即座にFREEに戻す（今は簡易的なため）
        playerState.uiState = "FREE"; 
    }
}

// ダイアログのクリック処理 (今は何もしない)
function dialogClick() {
    // ストーリーが有効な時だけ何かする
    if (playerState.uiState === "GACHA") {
        // ガチャ結果がクリックされるのを待っている
        return; 
    }
    displayDialog("(タップしてセリフを表示)");
}


// -----------------------------------
// イベントリスナーのセットアップ
// -----------------------------------
produceButton.addEventListener('click', produceMusic);
dialogBox.addEventListener('click', dialogClick);


// ★アクションボタンエリアにガチャボタンを追加★
function setupGachaButton() {
    const gachaButton = document.createElement('button');
    gachaButton.id = 'gacha-button';
    gachaButton.textContent = `機材ガチャ (${GACHA_COST}G)`;
    gachaButton.addEventListener('click', executeGacha);
    actionsContainer.appendChild(gachaButton);
}

setupGachaButton();
