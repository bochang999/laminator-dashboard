# ラミオペ・ダッシュボード - 技術仕様書

## アーキテクチャ

### システム構成
- **フロントエンド**: HTML5 + CSS3 + JavaScript (ES6+)
- **データ管理**: localStorage API
- **UI フレームワーク**: Vanilla JavaScript（軽量化のため）
- **レスポンシブ**: Mobile-First CSS Grid/Flexbox

### ファイル構成
```
laminator-dashboard/
├── index.html          # メインUI
├── style.css          # スタイルシート
├── script.js          # メインロジック
├── manifest.json      # PWA設定
├── sw.js             # Service Worker
└── icons/            # アプリアイコン群
```

## データモデル

### ジョブデータ構造
```javascript
const job = {
    id: String,           // ユニークID
    timestamp: Date,      // 追加日時
    sheets: Number,       // 実生産枚数
    paperLength: Number,  // 紙の長さ(mm)
    overlapWidth: Number, // 重ね幅(mm)
    processSpeed: Number, // 加工速度(m/min)
    usageLength: Number,  // 使用長(m)
    processingTime: Number, // 生産時間(分)
    inputMode: String     // 'direct' | 'parts'
}
```

### 日次データ構造
```javascript
const dailyData = {
    date: String,         // YYYY-MM-DD
    jobs: Array,          // ジョブ配列
    extraTime: Number,    // 手動追加時間(分)
    totalSheets: Number,  // 合計枚数
    totalUsage: Number,   // 合計使用メーター
    totalTime: Number     // 合計作業時間(分)
}
```

## 計算ロジック仕様

### 基本計算式

#### 1. 実生産枚数計算
```javascript
// 部数モード時
const actualSheets = Math.ceil(copies / pages) + extraSheets;
```

#### 2. 使用長計算
```javascript
const usageLength = (paperLength - overlapWidth) / 1000; // メートル変換
```

#### 3. 生産時間計算
```javascript
const processingTime = actualSheets * usageLength / processSpeed; // 分
```

#### 4. 終了時刻計算
```javascript
const finishTime = startTime + totalProcessingTime + extraTime + breakTime + cleanupTime;
```

### 時刻管理

#### 基本設定
```javascript
const timeSettings = {
    workStart: "08:30",
    workEnd: "17:00", 
    lunchBreak: 60,        // 分
    cleanupTime: 15,       // 分
    sameFilmChange: 10,    // 分
    diffFilmChange: 15     // 分
}
```

#### デッドライン判定
- **15:30警告**: 上司判断時刻アラート
- **16:45警告**: 定時終業アラート
- **17:00超過**: 残業アラート

## UI/UX仕様

### デザインシステム
- **カラーパレット**: ブルー系（#2196F3）メイン
- **フォント**: システムフォント優先
- **アイコン**: 絵文字ベース（軽量化）

### レスポンシブ設計
```css
/* モバイルファースト */
.input-group input {
    min-height: 48px;     /* タッチ対応 */
    font-size: 16px;      /* ズーム防止 */
    padding: 12px;        /* 余裕のある操作領域 */
}

.btn {
    min-height: 56px;     /* Material Design基準 */
    border-radius: 8px;   /* 角丸 */
    font-weight: bold;    /* 視認性向上 */
}
```

### タブ構成
1. **時間計算機タブ**: メイン機能
2. **フィルム判定タブ**: シミュレーター

### モーダル設計
- **レポートモーダル**: 日次サマリー表示
- **設定モーダル**: 時間設定変更

## PWA仕様

### manifest.json
```json
{
    "name": "ラミオペ・ダッシュボード",
    "short_name": "ラミオペ",
    "description": "ラミネート加工作業管理ツール",
    "start_url": "/",
    "display": "standalone",
    "orientation": "portrait",
    "theme_color": "#2196F3",
    "background_color": "#ffffff"
}
```

### Service Worker機能
- オフラインキャッシュ対応
- アプリシェル保存
- 計算機能のオフライン動作保証

## データ永続化

### localStorage運用
```javascript
// 日次データ保存
localStorage.setItem('laminator_daily_' + dateString, JSON.stringify(dailyData));

// 設定データ保存  
localStorage.setItem('laminator_settings', JSON.stringify(settings));

// 日付変更時の自動リセット
if (currentDate !== savedDate) {
    // 前日データのアーカイブ
    // 新日データの初期化
}
```

### データ容量管理
- 過去30日分のデータ保持
- 古いデータの自動削除
- エクスポート機能（将来拡張）

---

## Ver.1.1 技術仕様更新 (2025-08-12)

### 更新されたデータモデル

#### フィルムセッション構造（新規）
```javascript
const filmSession = {
    id: String,              // ユニークID (timestamp)
    startTime: Date,         // セッション開始時刻
    endTime: Date | null,    // セッション終了時刻
    jobs: Array,             // ジョブデータ配列
    status: String,          // 'active' | 'completed'
    filmCapacity: Number,    // フィルム初期容量(m)
    filmRemaining: Number,   // 現在の残量(m)
    filmUsed: Number        // 使用済み量(m)
}
```

#### ジョブデータ構造（拡張）
```javascript
const job = {
    id: String,              // ユニークID
    timestamp: Date,         // 追加日時
    sheets: Number,          // 実生産枚数
    paperLength: Number,     // 紙の長さ(mm)
    overlapWidth: Number,    // 重ね幅(mm)
    processSpeed: Number,    // 加工速度(m/min)
    usageLength: Number,     // 使用長(m)
    processingTime: Number,  // 生産時間(分)
    inputMode: String,       // 'direct' | 'parts'
    completed: Boolean,      // 完了フラグ（新規）
    completedAt: Date | null, // 完了時刻（新規）
    actualCompletionTime: Date | null // 実際の完了時刻（新規）
}
```

#### アプリケーション状態構造（更新）
```javascript
const appState = {
    date: String,                    // 現在日付
    filmSessions: Array,             // フィルムセッション配列
    currentFilmSessionId: String,    // 現在のアクティブセッションID
    extraTime: Number,               // 手動追加時間(分)
    workStarted: Boolean,            // 業務開始フラグ
    workStartTime: Date | null,      // 業務開始時刻
    targetEndTime: String,           // 目標終業時刻
    timeSettings: Object             // 時間設定オブジェクト
}
```

#### 時間設定構造（新規）
```javascript
const timeSettings = {
    workStart: String,      // 始業時刻 "08:30"
    workEnd: String,        // 定時終業時刻 "17:00"
    overtimeEnd: String,    // 残業終業時刻 "18:00"
    lunchBreak: Number,     // 昼休み時間(分) 60
    cleanupTime: Number,    // 片付け時間(分) 15
    sameFilmChange: Number, // 同種フィルム交換時間(分) 10
    diffFilmChange: Number  // 異種フィルム交換時間(分) 15
}
```

### 更新されたUI/UX仕様

#### 3カラム時間表示システム
```css
.time-display-grid {
    display: grid;
    grid-template-columns: 1fr 1.5fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
}

.time-column {
    text-align: center;
    padding: 12px;
    background: var(--bg-secondary);
    border-radius: 8px;
}

.time-column.primary {
    background: var(--primary-color);
    color: white;
    font-weight: bold;
}
```

#### 改善されたジョブ表示
```javascript
// 新しいジョブを上部表示（逆順ソート）
session.jobs.slice().reverse().map(job => renderJobItem(job))

// セッション固有の情報表示
<div class="session-film-info">
    使用: ${session.filmUsed.toFixed(1)}m / 残り: ${session.filmRemaining.toFixed(1)}m
</div>
```

#### 設定モーダル仕様
```html
<!-- ユーザー設定UI -->
<div class="settings-section">
    <h4>勤務時間設定</h4>
    <input type="time" id="settingWorkStart" value="08:30">
    <input type="time" id="settingWorkEnd" value="17:00">
    <input type="time" id="settingOvertimeEnd" value="18:00">
    <input type="number" id="settingLunchBreak" value="60">
    <input type="number" id="settingCleanupTime" value="15">
    <input type="number" id="settingDiffFilmChange" value="15">
</div>
```

### 更新された計算ロジック

#### フィルム残量管理（セッション固有）
```javascript
// ジョブ追加時のセッション固有残量更新
this.currentFilmSession.filmRemaining -= jobData.usageLength;
this.currentFilmSession.filmUsed += jobData.usageLength;

// ジョブ削除時の残量復元
session.filmRemaining += job.usageLength;
session.filmUsed = Math.max(0, session.filmUsed - job.usageLength);
```

#### 完了時刻再計算システム（強化版）
```javascript
recalculateFinishTime() {
    // 未完了ジョブのみの合計時間計算
    const allJobs = this.filmSessions.flatMap(session => session.jobs);
    const incompleteJobs = allJobs.filter(job => !job.completed);
    const totalProcessingTime = incompleteJobs.reduce((total, job) => 
        total + job.processingTime, 0);
    
    // 現在時刻基準の終了予定計算
    const now = new Date();
    const remainingTime = totalProcessingTime + this.extraTime + 
        this.timeSettings.cleanupTime;
    
    return new Date(now.getTime() + remainingTime * 60000);
}
```

#### 3カラム時間表示ロジック
```javascript
// 開始時刻：手動設定可能
editStartTime() {
    const newTime = prompt('開始時刻を入力してください (HH:MM形式)');
    // 業務開始状態更新・時刻設定
}

// 目標時刻：定時/残業切替
editTargetTime() {
    const isOvertime = this.targetEndTime === this.timeSettings.overtimeEnd;
    this.targetEndTime = isOvertime ? 
        this.timeSettings.workEnd : this.timeSettings.overtimeEnd;
}
```

### 削除された機能

#### フィルム残量電卓機能
- **削除対象**: `showUtilityTool()`, `hideUtilityTool()`, `calculateFilmRemaining()`
- **UI削除**: フィルム電卓モーダル・ヘッダーボタン
- **理由**: ユーザー要求によるシンプル化

### データ永続化の変更

#### localStorage キー更新
```javascript
// Ver.1.1では統合キーを使用
localStorage.setItem('laminator_dashboard_v3', JSON.stringify(appState));

// データ構造の後方互換性維持
if (data.date === today) {
    // 既存データ復元（セッション構造対応）
    this.filmSessions = data.filmSessions || [];
    this.timeSettings = { ...this.timeSettings, ...data.timeSettings };
}
```

#### セッション状態復元
```javascript
// 現在のアクティブセッション復元
if (data.currentFilmSessionId) {
    this.currentFilmSession = this.filmSessions.find(s => 
        s.id === data.currentFilmSessionId);
}
```

### パフォーマンス最適化

#### セッション固有計算の効率化
- グローバル状態削減によるメモリ使用量最適化
- セッション別処理による計算負荷分散
- 不要な全体再計算の削減

#### UI更新の最適化
- セッション展開/折りたたみによる表示負荷軽減
- 3カラム表示による情報密度向上
- ソート処理の軽量化（`slice().reverse()`）