// ===================================
// GLOBAL VARIABLES (プレイヤーの状態)
// ===================================
let playerState = {
    fans: 0,
    money: 5000,   // 初期マネーを増やしてガチャを回せるように
    trend: 50,     // トレンド度の初期値 (0-100)
    productionCount: 0,
    reincarnationCount: 0,
    // ★機材/アイテムのインベントリと装備を管理★
    inventory: [], // 取得したアイテムを格納
    equipment: {}, // 装備中のアイテム
    // UIの状態管理 (FREE, STORY, GACHAなど)
    uiState: "FREE" 
};

// ===================================
// GACHA DATA
// ===================================

const GACHA_COST = 500;

// シア提案のガチャ排出テーブルを採用
const GACHA_TABLE = [
    // N (55%)
    { name: "中古ヘッドホン N", rarity: "N", rate: 55, effect: { fanIncrease: 1, moneyIncrease: 1 } },
    // R (30%)
    { name: "オーディオIF R", rarity: "R", rate: 30, effect: { fanIncrease: 3, moneyIncrease: 3 } },
    // SR (10%)
    { name: "コンデンサマイク SR", rarity: "SR", rate: 10, effect: { fanIncrease: 10, moneyIncrease: 10 } },
    // SSR (5%)
    { name: "ハイエンド機材 SSR", rarity: "SSR", rate: 5, effect: { fanIncrease: 30, moneyIncrease: 30 } }
];

// -----------------------------------
// STORY DATA
// -----------------------------------

// ★全てのストーリーイベントを優先度付きで定義★
const ALL_STORY_EVENTS = [
    // ----------------------------------------------------
    // WORLD 1: 数字の快感
    // ----------------------------------------------------
    
    // 【ゲームスタート時のセリフ】(まだ制作回数0の時)
    { 
        key: "game_start", 
        priority: 120, 
        trigger: (state) => state.productionCount === 0 && state.reincarnationCount === 0, 
        dialogue: [
            "最近、DTMというものに興味がある。",
            "とりあえず小さなノートパソコンとヘッドホンを買った。",
            "今日から私もクリエイター.....？",
            "浮かれる前に一曲作ってみよう。"
        ]
    },
    // 【初回制作後】(制作回数1の時)
    { 
        key: "after_first_production", 
        priority: 110, 
        trigger: (state) => state.productionCount === 1 && state.reincarnationCount === 0, 
        dialogue: [
            "意外とパソコンの操作が難しかった。",
            "某動画投稿サイトに曲をアップしてみたものの誰にも見つかる気がしない。",
            "とりあえず今日は寝よう。"
        ]
    },
    // 【ファン数1 (初回制作後)】(制作回数2以上、ファン数1以上)
    { 
        key: "fans_1_first", 
        priority: 100, 
        trigger: (state) => state.fans >= 1 && state.productionCount > 1 && state.reincarnationCount === 0, 
        dialogue: [
            "....。",
            "よく寝たな。",
            "あ、",
            "パソコン、閉じていなかったのか。",
            "電気代が高くなりそうだな。",
            "とりあえず閉じておこう。",
            "....一件のコメント？",
            "「めちゃくちゃ好きです！センスあると思います！」",
            "ああ、私の曲を聴いてくれる人は、いたんだ。",
            "やる気が湧いてくる。",
            "私にとって一番最初のこのファンを、絶対大事にしよう。"
        ]
    },
    
    // 【ファン数目標達成】
    { key: "fans_10", priority: 90, trigger: (state) => state.fans >= 10 && state.reincarnationCount === 0, 
      dialogue: [
        "ふと、DTMを始める前の事を考える。",
        "これまで見てきた配信者は皆ファンが数十万人いた。",
        "でも、ファン数10人に喜んでいる自分がいる。",
        "自然に笑みが溢れる。",
        "これが、古参ってやつか。"
      ]
    },
    { key: "fans_100", priority: 80, trigger: (state) => state.fans >= 100 && state.reincarnationCount === 0, 
      dialogue: [
        "いつのまにかファンの数が増えていた。",
        "これだけの人が私の音楽を愛してくれている...。",
        "とても感慨深い。",
        "ここまで来たらもう止まれない。",
        "折角だから目標を決めてみよう。",
        "次の目標は..."
      ]
    },
    { key: "fans_1000", priority: 70, trigger: (state) => state.fans >= 1000 && state.reincarnationCount === 0, 
      dialogue: [
        "1000という数字は大きくもあり小さくもある。",
        "全体的に見たら少ないこの数字も、私にとっては大き過ぎる数字だ。",
        "1000人が私の音楽を待ち続けていることに少しプレッシャーを感じてしまう。",
        "大丈夫。",
        "これは趣味なのだから。",
        "次の目標は..."
      ]
    },
    { key: "fans_10000", priority: 60, trigger: (state) => state.fans >= 10000 && state.reincarnationCount === 0, 
      dialogue: [
        "最近の再生数が右肩上がりだと思ったらファン数はもう1万人らしい。",
        "あまり実感が湧かないがまあ活動者の中では早めに1万人を達成しているはずだろう。",
        "楽しい。ワクワクする。",
        "ここからどうなるか楽しみだ。",
        "次の目標は..."
      ]
    },
    { key: "fans_50000_breakdown", priority: 50, trigger: (state) => state.fans >= 50000 && state.reincarnationCount === 0, 
      dialogue: [
        "最近ファンが増えない。",
        "ある配信者の言葉を思い出す。",
        "どんな活動者も勢いがあるのは最初だけ。",
        "あとは廃れていくのみなのだ。",
        "現実を突きつけられると少し悲しくなる。",
        "あれ。",
        "私は何のためにこの活動を始めたのか。",
        "趣味じゃなかったのか？",
        "趣味なら、何も心配することは無いはずなのに。",
        "私は承認欲求の塊になってしまったようだ。",
        "....転生。",
        "一般的に一度活動を終了した人が、キャラクター、名前、設定などを一新し、別の新しい活動者として再デビューすること(私調べ)だ。",
        "これで新しい視聴者を得られるなら。",
        "このアカウントを消して新しい音楽家になれば。",
        "...",
        "目標を達成できるかもしれない。",
      ]
    },
    
    // 【制作回数イベント】
    { key: "production_10", priority: 40, trigger: (state) => state.productionCount === 10 && state.reincarnationCount === 0, 
      dialogue: [
        "曲作りにも慣れて来たな。",
        "ファン数も順調に増えている。",
        "ご褒美に旅行でもするか。"
      ]
    },

    // ----------------------------------------------------
    // WORLD 1.5: 転生1回目 (承認欲求の塊)
    // ----------------------------------------------------
    { key: "reincarnate_1_start", priority: 1000, trigger: (state) => state.reincarnationCount === 1 && state.productionCount === 0, 
      dialogue: [
        "転生1回目",
        "アカウントを一新。",
        "私は新しく生まれ変わった。",
        "普通の音楽が大好きな人間から。",
        "承認欲求の塊という化け物はもう、",
        "何かを楽しむという事を忘れてしまった。"
      ]
    },
    { key: "r1_fans_1", priority: 950, trigger: (state) => state.fans >= 1 && state.reincarnationCount === 1, 
      dialogue: [
        "私にファンがつくのは当たり前。",
        "もっとファンが増えれば幸せになる。",
        "その日が楽しみだ。"
      ]
    },
    { key: "r1_fans_10", priority: 900, trigger: (state) => state.fans >= 10 && state.reincarnationCount === 1, 
      dialogue: [
        "もっと欲しい。",
        "私を褒めて。"
      ]
    },
    { key: "r1_fans_100", priority: 850, trigger: (state) => state.fans >= 100 && state.reincarnationCount === 1, 
      dialogue: [
        "沢山の高評価が私の源。",
        "目標は前回の私を超える事。"
      ]
    },
    { key: "r1_fans_1000", priority: 800, trigger: (state) => state.fans >= 1000 && state.reincarnationCount === 1, 
      dialogue: [
        "前より伸びがいい。",
        "大丈夫。もっと伸びるはず。"
      ]
    },
    { key: "r1_fans_10000", priority: 750, trigger: (state) => state.fans >= 10000 && state.reincarnationCount === 1, 
      dialogue: [
        "やっと一万人。",
        "長くて短かった。",
        "ここからどう伸びるか。",
        "ワクワクする。"
      ]
    },
    { key: "r1_fans_100000_achieved", priority: 700, trigger: (state) => state.fans >= 100000 && state.reincarnationCount === 1, 
      dialogue: [
        "前回を越えた！",
        "10万人を味方に付けて、私は最強だ！",
        "高評価とコメントが嬉しい。",
        "もっと、もっと、もっと、",
        "もっともっともっともっともっともっと。",
        "欲しい。"
      ]
    },
    { key: "r1_fans_200000_streaming", priority: 650, trigger: (state) => state.fans >= 200000 && state.reincarnationCount === 1, 
      dialogue: [
        "もっと評価されたくて配信なるものを始めた。",
        "私のファンが一生懸命私の話を聴いてくれる。",
        "何というか快感なんだ！",
        "私は評価に病みつきになった。"
      ]
    },
    { key: "r1_fans_300000_flame", priority: 600, trigger: (state) => state.fans >= 300000 && state.reincarnationCount === 1, 
      dialogue: [
        "最近ファン数が伸びない。",
        "むしろ減っている気もする。",
        "やっと評価され始めたのに！",
        "なんでなんでなんで！？",
        "私のどこが悪かったの！",
        "某SNSの裏垢で愚痴を呟いてTLを見つめる。",
        "とある投稿が目に入った。",
        "「この配信者問題発言多すぎwwww」",
        "添付ファイルにいたのは私。",
        "返信欄には私を叩く声しか無い。",
        "まさか、炎上...？",
        "私が炎上するわけない！",
        "私はこんな発言をしていない！",
        "__________いいチャンスじゃないか。",
        "これをきっかけに活動を止める。",
        "そして転生する。",
        "やり直そう。",
        "もう一度。",
      ]
    },
    
    // ----------------------------------------------------
    // WORLD 2: 転生2回目以降 (虚無の始まり)
    // ----------------------------------------------------
    { key: "reincarnate_2_start", priority: 2000, trigger: (state) => state.reincarnationCount === 2 && state.productionCount === 0, 
      dialogue: [
        "転生2回目",
        "生まれ変わったことで、ファン数は0に戻った。",
        "でも心地いい。",
        "炎上したって、何度でもやり直せばいい。"
      ]
    },
    { key: "r2_fans_100000", priority: 1900, trigger: (state) => state.fans >= 100000 && state.reincarnationCount >= 2, 
      dialogue: [
        "ここまでは順調だ。",
        "何も起こっていない。",
        "ここで自惚れるような私はもういない。"
      ]
    },
    { key: "r2_fans_200000", priority: 1800, trigger: (state) => state.fans >= 200000 && state.reincarnationCount >= 2, 
      dialogue: [
        "配信ボタンへ手を伸ばす。",
        "もう失敗しない。"
      ]
    }
];

let activeDialogue = null; // 現在再生中のストーリーデータ (キーとセリフ一覧)
let currentDialogueIndex = 0; // 読み込み中のセリフのインデックス

// 既読フラグを保存するオブジェクト
let readStories = {};


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
const inventoryUl = document.getElementById('inventory-ul'); // インベントリUIを取得

// 初期表示を更新
updateUI();

// -----------------------------------
// 抽選ロジック
// -----------------------------------

/**
 * ガチャテーブルの排出率に基づいて、アイテムを抽選する
 */
function drawGachaItem() {
    const rand = Math.random() * 100;
    let sum = 0;

    for (const item of GACHA_TABLE) {
        sum += item.rate;
        if (rand < sum) {
            return item;
        }
    }
    return GACHA_TABLE[0]; 
}

// -----------------------------------
// ガチャ実行
// -----------------------------------

/**
 * ガチャを回すメイン処理
 */
function executeGacha() {
    if (playerState.uiState !== "FREE") return;
    
    if (playerState.money < GACHA_COST) {
        displayDialog("お金が足りません。楽曲制作で稼ごう！");
        return;
    }

    playerState.money -= GACHA_COST;
    playerState.uiState = "GACHA"; // ガチャ中はロック

    const item = drawGachaItem();
    
    // アイテムをインベントリに格納
    playerState.inventory.push(item);

    // アイテムを装備（簡易的に最新アイテムを装備として扱う）
    playerState.equipment[item.name] = item;
    
    // 簡易演出 (SSRのみ一拍置く演出)
    if (item.rarity === "SSR") {
        displayDialog("……\nアイテムを検索中...", false); 
        setTimeout(() => {
            showGachaResult(item);
        }, 1500); // 1.5秒待機
    } else {
        displayDialog("アイテムを検索中...");
        setTimeout(() => {
            showGachaResult(item);
        }, 800); // 0.8秒待機
    }
}

/**
 * ガチャ結果をダイアログに表示
 */
function showGachaResult(item) {
    let message = `【${item.rarity}】のアイテムをゲット！\n\n`;
    message += `**『${item.name}』**`;
    
    displayDialog(message, true); // true: UIをFREEに戻さない
    updateUI();
}

// -----------------------------------
// メイン関数 (produceMusic)
// -----------------------------------

// 楽曲制作（クリック）処理
function produceMusic() {
    // ストーリーが流れていたり、ガチャ結果が表示されている場合はボタン無効
    if (playerState.uiState !== "FREE") return; 

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
    const trendChange = Math.max(1, 5 - Math.abs(playerState.trend - 50) / 10);
    playerState.trend = Math.min(100, playerState.trend + trendChange);

    updateUI();
    
    // ストーリーチェックを呼び出す
    checkStory(); 
}

// -----------------------------------
// ストーリー制御ロジック
// -----------------------------------

function checkStory() {
    // すでにストーリーが再生中の場合は、新しいストーリーをチェックしない
    if (playerState.uiState === "STORY") return;
    
    // 1. 未読かつトリガー条件を満たすストーリーイベントを抽出
    const availableStories = ALL_STORY_EVENTS.filter(event => {
        // すでに読んだストーリーはスキップ
        if (readStories[event.key]) return false;
        
        // トリガー関数を実行して条件を満たしているかチェック
        return event.trigger(playerState);
    });

    if (availableStories.length === 0) {
        // 再生すべきストーリーがなければ終了
        return;
    }

    // 2. 優先度 (priority) が最も高いストーリーを一つだけ選ぶ
    availableStories.sort((a, b) => b.priority - a.priority);
    const storyToPlay = availableStories[0];

    // 3. ストーリー再生準備
    activeDialogue = storyToPlay;
    currentDialogueIndex = 0;
    playerState.uiState = "STORY"; // UIをSTORY状態にロック
    
    // 再生開始
    displayStory(activeDialogue.dialogue[currentDialogueIndex]);
}

/**
 * ダイアログにテキストを表示し、次のクリック動作を設定する
 */
function displayStory(text) {
    // ダイアログテキストを更新
    dialogText.innerHTML = text.replace(/\n/g, '<br>');
    
    // 次のクリック動作を advanceStory に設定
    dialogBox.onclick = advanceStory;
}

/**
 * ストーリーを次のセリフに進める
 */
function advanceStory() {
    if (playerState.uiState !== "STORY" || !activeDialogue) {
        return; // STORYモードでない場合は何もしない
    }

    currentDialogueIndex++;
    
    if (currentDialogueIndex < activeDialogue.dialogue.length) {
        // 次のセリフがある場合
        displayStory(activeDialogue.dialogue[currentDialogueIndex]);
    } else {
        // 全セリフ終了
        
        // 既読フラグを立てる
        readStories[activeDialogue.key] = true; 
        
        // 転生ボタンの強制表示など、特殊処理が必要なストーリーの制御
        if (activeDialogue.key === "fans_50000_breakdown" || activeDialogue.key === "r1_fans_300000_flame") {
            const reincarnateButton = document.getElementById('reincarnate-button');
            if (reincarnateButton) {
                reincarnateButton.style.display = 'block'; // 転生ボタンを表示
            }
        }

        // UIをFREEに戻す
        playerState.uiState = "FREE";
        dialogText.textContent = "(タップしてセリフを表示)";
        dialogBox.onclick = dialogClick; // 通常クリック動作に戻す
        activeDialogue = null;
    }
    updateUI();
}

// -----------------------------------
// UI & ステージ管理
// -----------------------------------

// UIの更新
function updateUI() {
    fanCountElement.textContent = playerState.fans.toLocaleString();
    moneyCountElement.textContent = playerState.money.toLocaleString();
    
    // -----------------------------------
    // 1. ステージ管理（部屋の見た目の更新）
    // -----------------------------------
    let currentStage = 0;
    if (playerState.fans >= 2000000) currentStage = 4;
    else if (playerState.fans >= 1000000) currentStage = 3;
    else if (playerState.fans >= 100000) currentStage = 2;
    else if (playerState.fans >= 10000) currentStage = 1;
    else currentStage = 0;

    roomView.className = `stage-${currentStage}`;

    // -----------------------------------
    // 2. インベントリリストの更新
    // -----------------------------------
    if (inventoryUl) { // inventoryUlが存在するかチェック
        inventoryUl.innerHTML = ''; // リストを初期化
        
        // アイテムをレアリティ順にソート（SSR > SR > R > N）
        const sortedInventory = playerState.inventory.sort((a, b) => {
            const order = { 'SSR': 4, 'SR': 3, 'R': 2, 'N': 1 };
            return order[b.rarity] - order[a.rarity];
        });

        sortedInventory.forEach(item => {
            const listItem = document.createElement('li');
            // レアリティで色分け（簡易版）
            let color = '#fff'; 
            if (item.rarity === 'SSR') color = '#ffeb3b'; // 黄色
            else if (item.rarity === 'SR') color = '#007bff'; // 青
            else if (item.rarity === 'R') color = '#28a745'; // 緑
            
            listItem.innerHTML = `<span style="color: ${color}; font-weight: bold;">[${item.rarity}]</span> ${item.name}`;
            inventoryUl.appendChild(listItem);
        });

        // 装備中のアイテムがない場合、初期メッセージを表示
        if (playerState.inventory.length === 0) {
            const listItem = document.createElement('li');
            listItem.textContent = 'アイテムはありません';
            inventoryUl.appendChild(listItem);
        }
    }
}

/**
 * ダイアログにテキストを表示し、UIの状態を制御する (ガチャ用)
 * @param {string} text - 表示するテキスト
 * @param {boolean} isGachaResult - ガチャ結果表示かどうか (ガチャ結果表示後、クリックでFREEに戻す)
 */
function displayDialog(text, isGachaResult = false) {
    dialogText.innerHTML = text.replace(/\n/g, '<br>'); 

    if (isGachaResult) {
        // ガチャ結果表示中は、ダイアログクリックでFREEに戻るように設定
        dialogBox.onclick = () => {
            playerState.uiState = "FREE";
            dialogText.textContent = "(タップしてセリフを表示)";
            dialogBox.onclick = dialogClick; // 元のクリック動作に戻す
            updateUI();
        };
    } 
    // ストーリーの表示中は advanceStory が onclick を上書きする
}

// ダイアログのクリック処理 (FREEモード時専用)
function dialogClick() {
    // STORYモード中は advanceStory が処理を担当するため、ここでは何もしない
    if (playerState.uiState !== "FREE") return;

    // FREEモード中のクリックは、ダイアログを初期状態に戻す
    displayDialog("(タップしてセリフを表示)");
}


// -----------------------------------
// イベントリスナーのセットアップ
// -----------------------------------
produceButton.addEventListener('click', produceMusic);
// ダイアログボックスのクリック処理の初期設定
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
