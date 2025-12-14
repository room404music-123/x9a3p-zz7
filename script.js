// --- ゲームの状態を管理する変数 ---
let fans = 0;
let money = 0;
let productionCount = 0;
let reincarnationCount = 0; // 転生回数
let isStoryActive = false; // ストーリー進行中のボタン無効化に使用

// セリフ進行管理
let currentDialog = [];
let currentLineIndex = 0;

// ストーリーの既読を管理するフラグ（バグ防止と既読管理に使用）
const storyFlags = {
    initial: false, 
    afterFirstProduction: false, 
    fan1: false, 
    production10: false, 
    fan10: false, 
    fan100: false, 
    fan1000: false, 
    fan10000: false, 
    fan50000_pre: false,
    
    // コメント制御用のフラグ
    commentsStarted: false,
    startCommentsAfterEnd: false
};

// --- セリフデータ (タップで1行ずつ進むよう、配列でデータ化) ---
const STORY_DATA = {
    // これらのセリフが「STORY」として表示されます
    initial: [ "最近、DTMというものに興味がある。", "とりあえず小さなノートパソコンとヘッドホンを買った。", "今日から私もクリエイター.....？", "浮かれる前に一曲作ってみよう。" ],
    afterFirstProduction: [ "意外とパソコンの操作が難しかった。", "某動画投稿サイトに曲をアップしてみたものの誰にも見つかる気がしない。", "とりあえず今日は寝よう。" ],
    fan1: [ "....。", "よく寝たな。", "あ、", "パソコン、閉じていなかったのか。", "電気代が高くなりそうだな。", "とりあえず閉じておこう。", "....一件のコメント？", "「めちゃくちゃ好きです！センスあると思います！」", "ああ、私の曲を聴いてくれる人は、いたんだ。", "やる気が湧いてくる。", "私にとって一番最初のこのファンを、絶対大事にしよう。" ],
    production10: [ "曲作りにも慣れて来たな。", "ファン数も順調に増えている。", "ご褒美に旅行でもするか。" ],
    fan10: [ "ふと、DTMを始める前の事を考える。", "これまで見てきた配信者は皆ファンが数十万人いた。", "でも、ファン数10人に喜んでいる自分がいる。", "自然に笑みが溢れる。", "これが、古参ってやつか。" ],
    fan100: [ "いつのまにかファンの数が増えていた。これだけの人が私の音楽を愛してくれている...。", "とても感慨深い。", "ここまで来たらもう止まれない。", "折角だから目標を決めてみよう。", "次の目標は..." ],
    fan1000: [ "1000という数字は大きくもあり小さくもある。", "全体的に見たら少ないこの数字も、私にとっては大き過ぎる数字だ。", "1000人が私の音楽を待ち続けていることに少しプレッシャーを感じてしまう。", "大丈夫。これは趣味なのだから。", "次の目標は..." ],
    fan10000: [ "最近の再生数が右肩上がりだと思ったらファン数はもう1万人らしい。あまり実感が湧かないがまあ活動者の中では早めに1万人を達成しているはずだろう。", "楽しい。ワクワクする。", "ここからどうなるか楽しみだ。", "次の目標は..." ],
    fan50000_pre: [ 
        "最近ファンが増えない。ある配信者の言葉を思い出す。", 
        "どんな活動者も勢いがあるのは最初だけ。あとは廃れていくのみなのだ。", 
        "現実を突きつけられると少し悲しくなる。", 
        "あれ。私は何のためにこの活動を始めたのか。趣味じゃなかったのか？", 
        "私は承認欲求の塊になってしまったようだ。", 
        "……ファン数は、頭打ちってとこか。",
        "新しく始めよう。",
        "【[新しく始める] ボタンが解放されました】"
    ],
    // 制作中の独り言は「STORY」として扱わないため、別途変数に保持
    production_start: [ "我ながら、いいアイデアが浮かんだ。早速、楽曲制作に取り掛かろう。", "今日は音が逃げない気がする。", "静かな夜だ。作るなら今。" ],
    production_end: [ "……悪くない。", "これは、ちゃんと届きそうだ。", "もう一度だけ、聴き直す。" ]
};

const COMMENTS = [
    "いい曲", "落ち着く", "これイヤホン推奨", "作業用に助かる", "この音どこから？", 
    "前の曲の方が好きだった", "最近路線変わった？", "伸びたね〜", 
    "古参です", "この人まだ聴いてる人いる？", "昔は良かったおじさん", 
    "この人の影響でDTM始めた"
];

// DOM要素のキャッシュ
const dialogTextEl = document.getElementById('dialog-text');
const storyMarkerEl = document.getElementById('story-marker');
const produceButtonEl = document.getElementById('produce-music-button');
const fanCountEl = document.getElementById('fan-count');
const moneyCountEl = document.getElementById('money-count');
const reincarnateButtonEl = document.getElementById('reincarnate-button');

// --- ファン数とお金の表示、部屋の進化を更新する関数 ---
function updateStats() {
    fanCountEl.textContent = fans.toLocaleString();
    moneyCountEl.textContent = money.toLocaleString();
    
    // 部屋の進化（CSSクラスの切り替え）
    let stage = 0;
    if (fans >= 10000) stage = 3; 
    else if (fans >= 1000) stage = 2; 
    else if (fans >= 100) stage = 1;

    document.body.className = `stage-${stage}`;
    
    // 転生ボタンの表示制御
    if (storyFlags.fan50000_pre) {
        reincarnateButtonEl.style.display = 'block';
    } else {
        reincarnateButtonEl.style.display = 'none';
    }
}

// --- コメントをランダムに流す関数 ---
function addRandomComment() {
    const commentEl = document.createElement('p');
    const randomComment = COMMENTS[Math.floor(Math.random() * COMMENTS.length)];
    
    commentEl.textContent = randomComment;
    commentEl.className = 'comment';
    
    const stream = document.getElementById('comment-stream');
    stream.prepend(commentEl);
    
    // 古いコメントを削除してメモリを節約
    if (stream.children.length > 5) {
        stream.removeChild(stream.lastChild);
    }
}

// --- コメントストリームを開始する関数（ファン1のストーリー完了後に一度だけ呼ばれる） ---
function startCommentStream() {
    if (!storyFlags.commentsStarted) {
        // 5秒ごとにコメントを流す
        setInterval(addRandomComment, 5000); 
        storyFlags.commentsStarted = true;
    }
}

// --- ストーリーの進行を開始する（モーダル開始） ---
function startStory(storyKey) {
    if (isStoryActive) return; 

    isStoryActive = true;
    produceButtonEl.disabled = true; // ボタン無効化

    // ★追加：STORYマーカーを表示★
    storyMarkerEl.style.display = 'block';

    currentDialog = STORY_DATA[storyKey];
    currentLineIndex = 0;
    
    dialogTextEl.textContent = currentDialog[currentLineIndex];
    storyFlags[storyKey] = true; 

    // 初回制作でファン1を確実にする処理
    if (storyKey === 'afterFirstProduction' && fans === 0) {
        fans = 1; 
        updateStats();
    }
    
    // ファン1のストーリーが終わった後にコメントを開始するためのフラグを設定
    if (storyKey === 'fan1') {
        storyFlags.startCommentsAfterEnd = true;
    }
}

// --- 画面タップでセリフを一行進める（タップイベントハンドラー） ---
function advanceDialog() {
    if (!isStoryActive) return;

    currentLineIndex++;

    if (currentLineIndex < currentDialog.length) {
        // 次の行を表示
        dialogTextEl.textContent = currentDialog[currentLineIndex];
    } else {
        // ストーリー終了（モーダル解除）
        isStoryActive = false;
        produceButtonEl.disabled = false; // ボタン有効化
        
        // ★追加：STORYマーカーを非表示★
        storyMarkerEl.style.display = 'none'; 
        
        dialogTextEl.textContent = "タップしてセリフを表示"; 
        
        // --- コメントストリームの開始チェック（ファン1のストーリーが完了したか） ---
        if (storyFlags.startCommentsAfterEnd) {
            startCommentStream(); // コメントの流れをスタート
            storyFlags.startCommentsAfterEnd = false; // フラグをリセット
        }
    }
}

// --- ストーリーの条件をチェックして表示する関数（優先度管理） ---
function checkAndDisplayStory() {
    if (isStoryActive) return; 
    
    let storyKey = null;

    // 1. 転生を促す独り言（ファン数5万）- 最高優先度
    if (fans >= 50000 && !storyFlags.fan50000_pre) {
        storyKey = 'fan50000_pre';
    } 
    // 2. 楽曲制作10回目（制作ストーリー）- ファン数イベントより優先
    else if (productionCount === 10 && !storyFlags.production10) {
        storyKey = 'production10';
    } 
    // 3. ファン数イベント（降順でチェックし、飛び越しバグを防ぐ）
    else if (fans >= 10000 && !storyFlags.fan10000) { storyKey = 'fan10000'; } 
    else if (fans >= 1000 && !storyFlags.fan1000) { storyKey = 'fan1000'; } 
    else if (fans >= 100 && !storyFlags.fan100) { storyKey = 'fan100'; } 
    else if (fans >= 10 && !storyFlags.fan10) { storyKey = 'fan10'; } 
    // 4. ファン数1（初回制作ストーリー後のみ）
    else if (fans >= 1 && !storyFlags.fan1 && storyFlags.afterFirstProduction) {
        storyKey = 'fan1';
    } 
    // 5. 初回楽曲制作後（制作回数1）
    else if (productionCount === 1 && !storyFlags.afterFirstProduction) {
        storyKey = 'afterFirstProduction';
    }

    if (storyKey) {
        startStory(storyKey);
    }
}

// --- 楽曲制作のメインロジック ---
function produceMusic() {
    if (isStoryActive) return; 

    // 制作開始時の独り言（演出）
    const startDialogKey = STORY_DATA.production_start[Math.floor(Math.random() * STORY_DATA.production_start.length)];
    dialogTextEl.textContent = startDialogKey;

    // 制作中を表すためにボタンを一時的に無効化
    produceButtonEl.disabled = true;

    // 1.5秒後に制作完了のロジックを実行
    setTimeout(() => {
        productionCount++;
        
        if (productionCount > 1) {
            fans += Math.floor(Math.random() * 8) + 2; // 2~9人増える
        }
        money += Math.floor(Math.random() * 500) + 100;
        
        updateStats();
        
        // 制作完了時の独り言（演出）を表示
        const endDialogKey = STORY_DATA.production_end[Math.floor(Math.random() * STORY_DATA.production_end.length)];
        dialogTextEl.textContent = endDialogKey;
        
        // ボタンを有効化
        produceButtonEl.disabled = false;
        
        // 0.5秒の短い遅延の後、ファン数ストーリーのチェックに移行
        setTimeout(() => {
             // 待機メッセージに戻す
            dialogTextEl.textContent = "タップしてセリフを表示";
            // 制作後のメインストーリーチェック
            checkAndDisplayStory(); 
        }, 500); 

    }, 1500); // 1.5秒待機
}

// --- 転生処理（[新しく始める]ボタンのロジック） ---
function reincarnate() {
    if (fans < 50000) return; 

    reincarnationCount++;
    
    // リセットされるもの
    fans = 0;
    money = 0;
    productionCount = 0;
    
    // ストーリーフラグをリセット（最終イベント以外）
    for (let key in storyFlags) {
        if (key !== 'fan50000_pre' && key !== 'initial' && key !== 'commentsStarted') { 
             storyFlags[key] = false;
        }
    }
    storyFlags.initial = false; // 最初のセリフは再度表示

    // 転生回数に応じたセリフ
    let reincarnateDialog;
    if (reincarnationCount === 1) {
        reincarnateDialog = "最初からやり直すのも、悪くない。";
    } else if (reincarnationCount === 2) {
        reincarnateDialog = "名前が変わっても、音は残る。";
    } else {
        reincarnateDialog = "私は、まだ作れる。";
    }
    
    dialogTextEl.textContent = "Re:Start... " + reincarnateDialog;
    
    // 部屋の状態を初期に戻す
    document.body.className = 'stage-0';
    
    // 転生ボタンを非表示に戻す
    reincarnateButtonEl.style.display = 'none';

    updateStats(); 
    startStory('initial'); // 最初のセリフに戻る
}

// --- 初期化処理 ---
function initGame() {
    // DOM要素のイベントリスナー設定
    produceButtonEl.onclick = produceMusic;
    document.getElementById('dialog-box').onclick = advanceDialog; 
    reincarnateButtonEl.onclick = reincarnate;
    
    updateStats(); 
    startStory('initial'); // 最初のセリフを表示
}

// ページが完全に読み込まれたらゲームを開始
document.addEventListener('DOMContentLoaded', initGame);
