// =====ここからログシステム Ver.2.4 =====
// グローバルログ配列の初期化
window.appLogs = [];

document.addEventListener('DOMContentLoaded', () => {
    // コンソール出力を記録する関数
    function addLogToArray(level, message, color) {
        const timestamp = new Date().toLocaleTimeString();
        window.appLogs.push({
            timestamp,
            level,
            message,
            color
        });
        // 最新200件のみ保持
        if (window.appLogs.length > 200) {
            window.appLogs.shift();
        }
    }

    // オリジナルのコンソール機能を保存
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn
    };

    // console.logをオーバーライド
    console.log = function(...args) {
        originalConsole.log.apply(console, args);
        const message = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ');
        addLogToArray('LOG', message, '#FFFFFF');
    };

    // console.errorをオーバーライド
    console.error = function(...args) {
        originalConsole.error.apply(console, args);
        const message = args.map(a => a instanceof Error ? a.stack : (typeof a === 'object' ? JSON.stringify(a, null, 2) : a)).join(' ');
        addLogToArray('ERROR', message, '#FF7B7B');
    };
    
    // console.warnをオーバーライド
    console.warn = function(...args) {
        originalConsole.warn.apply(console, args);
        const message = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ');
        addLogToArray('WARN', message, '#FFD700');
    };

    // エラーハンドリング
    window.onerror = function(message, source, lineno, colno, error) {
        console.error(`[Uncaught Error] ${message} at ${source}:${lineno}:${colno}`);
        return false;
    };

    window.onunhandledrejection = function(event) {
        console.error(`[Unhandled Promise Rejection] Reason: ${event.reason}`);
    };
    
    console.log('ログシステムが起動しました。');
});

// ログページ表示機能
function showLogPage() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    
    // メインコンテンツを非表示
    mainContent.style.display = 'none';
    
    // ログページを作成
    const logPageHTML = `
        <div id="log-page" class="main-dashboard">
            <section class="log-page-header">
                <div class="log-page-controls">
                    <button id="back-to-dashboard-btn" class="btn btn-secondary">← ダッシュボードに戻る</button>
                    <button id="clear-logs-btn" class="btn btn-danger btn-sm">ログクリア</button>
                </div>
                <h3>📋 システムログ</h3>
                <p class="log-info">総ログ数: ${window.appLogs.length}件</p>
            </section>
            
            <section class="log-container">
                ${window.appLogs.length === 0 ? 
                    '<div class="empty-log-state">まだログが記録されていません</div>' :
                    window.appLogs.map(log => `
                        <div class="log-entry">
                            <span class="log-timestamp">[${log.timestamp}]</span>
                            <span class="log-level log-level-${log.level.toLowerCase()}">${log.level}</span>
                            <span class="log-message">${log.message}</span>
                        </div>
                    `).join('')
                }
            </section>
        </div>
    `;
    
    // ログページを挿入
    mainContent.insertAdjacentHTML('afterend', logPageHTML);
    
    // 戻るボタンのイベントリスナー
    document.getElementById('back-to-dashboard-btn').addEventListener('click', showDashboard);
    document.getElementById('clear-logs-btn').addEventListener('click', clearLogs);
}

// ダッシュボード表示機能
function showDashboard() {
    const mainContent = document.getElementById('main-content');
    const logPage = document.getElementById('log-page');
    
    if (logPage) {
        logPage.remove();
    }
    
    if (mainContent) {
        mainContent.style.display = 'block';
    }
}

// ログクリア機能
function clearLogs() {
    window.appLogs = [];
    showLogPage(); // ページを再描画
}

// =====ここまでログシステム Ver.2.4 =====

// ラミオペ・ダッシュボード Ver.3.0 - 統合ダッシュボード仕様

class LaminatorDashboard {
    constructor() {
        this.filmSessions = []; // フィルムセッション管理
        this.currentFilmSession = null; // 現在のフィルムセッション
        this.extraTime = 0; // 手動追加時間（分）
        this.defaultFilmCapacity = 500; // デフォルトフィルム容量（m）
        this.workStarted = false; // 業務開始フラグ
        this.workStartTime = null; // 業務開始時刻
        this.targetEndTime = "17:00"; // 目標終業時刻
        
        // 時間設定
        this.timeSettings = {
            workStart: "08:30",
            workEnd: "17:00",
            overtimeEnd: "18:00",  // 残業終業時刻
            lunchBreak: 60,        // 分
            cleanupTime: 15,       // 分
            sameFilmChange: 10,    // 分（同種フィルム交換）
            diffFilmChange: 15     // 分（異種フィルム交換）
        };

        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateCurrentTime();
        this.updateTimeDisplay();
        this.updateFinishTime();
        this.renderJobList();
        
        // 1秒ごとに時刻更新
        setInterval(() => {
            this.updateCurrentTime();
        }, 1000);
    }

    setupEventListeners() {
        // 入力モード切替
        document.querySelectorAll('input[name="inputMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.switchInputMode(e.target.value);
            });
        });

        // モーダル背景クリックで閉じる
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    switchInputMode(mode) {
        const directMode = document.getElementById('directMode');
        const partsMode = document.getElementById('partsMode');

        if (mode === 'direct') {
            directMode.classList.add('active');
            partsMode.classList.remove('active');
        } else {
            directMode.classList.remove('active');
            partsMode.classList.add('active');
        }
    }

    // 業務開始
    startWork() {
        if (!this.workStarted) {
            this.workStarted = true;
            this.workStartTime = new Date();
            this.updateTimeDisplay();
            this.updateFinishTime();
            this.saveData();
            this.showToast('業務を開始しました', 'success');
        } else {
            this.showToast('業務は既に開始されています', 'info');
        }
    }

    // 開始時刻編集
    editStartTime() {
        const currentTimeStr = this.workStarted && this.workStartTime ? 
            this.workStartTime.toTimeString().slice(0, 5) : this.timeSettings.workStart;
        
        const newTime = prompt('開始時刻を入力してください (HH:MM形式)', currentTimeStr);
        if (newTime && this.isValidTimeFormat(newTime)) {
            if (!this.workStarted) {
                // 業務未開始の場合は即座に業務開始
                const today = new Date();
                const [hours, minutes] = newTime.split(':');
                this.workStartTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));
                this.workStarted = true;
            } else {
                // 業務開始済みの場合は時刻を修正
                const [hours, minutes] = newTime.split(':');
                this.workStartTime.setHours(parseInt(hours), parseInt(minutes));
            }
            this.updateTimeDisplay();
            this.updateFinishTime();
            this.saveData();
            this.showToast('開始時刻を更新しました', 'success');
        }
    }

    // 目標時刻編集
    editTargetTime() {
        const currentTarget = this.targetEndTime;
        const isOvertime = currentTarget === this.timeSettings.overtimeEnd;
        
        if (confirm(isOvertime ? '定時（17:00）に切り替えますか？' : '残業モードに切り替えますか？')) {
            this.targetEndTime = isOvertime ? this.timeSettings.workEnd : this.timeSettings.overtimeEnd;
            this.updateTimeDisplay();
            this.showToast(`目標時刻を${this.targetEndTime}に変更しました`, 'success');
            this.saveData();
        }
    }

    // 時間表示更新
    updateTimeDisplay() {
        // 開始時刻表示
        const workStartElement = document.getElementById('workStartTime');
        if (this.workStarted && this.workStartTime) {
            workStartElement.textContent = this.workStartTime.toTimeString().slice(0, 5);
            workStartElement.classList.add('active');
        } else {
            workStartElement.textContent = this.timeSettings.workStart;
            workStartElement.classList.remove('active');
        }

        // 目標時刻表示
        const targetElement = document.getElementById('targetEndTime');
        targetElement.textContent = this.targetEndTime;
        targetElement.classList.toggle('overtime', this.targetEndTime === this.timeSettings.overtimeEnd);
    }

    // 時刻形式検証
    isValidTimeFormat(timeStr) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(timeStr);
    }




    // 現在のフィルムでジョブを追加
    addJobToCurrentFilm() {
        const jobData = this.getJobInputData();
        if (!jobData) return;

        // 現在のフィルムセッションがない場合は作成
        if (!this.currentFilmSession) {
            this.currentFilmSession = this.createNewFilmSession();
            this.filmSessions.push(this.currentFilmSession);
        }

        // セッション固有のフィルム残量チェック
        // ユーザー指定の初期残量がある場合はセッションを更新
        if (jobData.initialFilmRemaining !== null && jobData.initialFilmRemaining >= 0) {
            this.currentFilmSession.filmCapacity = jobData.initialFilmRemaining;
            this.currentFilmSession.filmRemaining = jobData.initialFilmRemaining;
            this.currentFilmSession.filmUsed = 0;
        }

        if (this.currentFilmSession.filmRemaining < jobData.usageLength) {
            if (!confirm(`フィルム残量が不足しています。\n必要: ${jobData.usageLength.toFixed(2)}m\n残量: ${this.currentFilmSession.filmRemaining.toFixed(2)}m\n\nそれでも追加しますか？`)) {
                return;
            }
        }

        // ジョブを追加してセッション固有の残量を更新
        this.currentFilmSession.jobs.push(jobData);
        this.currentFilmSession.filmRemaining = Math.max(0, this.currentFilmSession.filmRemaining - jobData.usageLength);
        this.currentFilmSession.filmUsed += jobData.usageLength;

        this.saveData();
        this.renderJobList();
        this.updateFinishTime();
        this.updateFilmDisplay();
        this.clearInputs();
        this.showToast(`ジョブを現在のフィルムに追加しました (${jobData.sheets}枚)`, 'success');
    }

    // 新しいフィルムでジョブを追加
    addJobToNewFilm() {
        const jobData = this.getJobInputData();
        if (!jobData) return;

        // 現在のフィルムセッションを完了
        if (this.currentFilmSession && this.currentFilmSession.jobs.length > 0) {
            this.currentFilmSession.status = 'completed';
            this.currentFilmSession.endTime = new Date();
        }

        // 新しいフィルムセッション作成
        this.currentFilmSession = this.createNewFilmSession();
        
        // ユーザー指定の初期残量がある場合はそれを使用
        if (jobData.initialFilmRemaining !== null && jobData.initialFilmRemaining >= 0) {
            this.currentFilmSession.filmCapacity = jobData.initialFilmRemaining;
            this.currentFilmSession.filmRemaining = jobData.initialFilmRemaining;
            this.currentFilmSession.filmUsed = 0;
        }
        
        this.filmSessions.push(this.currentFilmSession);

        // ジョブを追加してセッション固有の残量を更新
        this.currentFilmSession.jobs.push(jobData);
        this.currentFilmSession.filmRemaining = Math.max(0, this.currentFilmSession.filmRemaining - jobData.usageLength);
        this.currentFilmSession.filmUsed += jobData.usageLength;

        // フィルム交換時間を追加
        this.extraTime += this.timeSettings.diffFilmChange;

        this.saveData();
        this.renderJobList();
        this.updateFinishTime();
        this.updateFilmDisplay();
        this.clearInputs();
        this.showToast(`新しいフィルムでジョブを追加しました (交換時間 +${this.timeSettings.diffFilmChange}分)`, 'success');
    }

    // ジョブ入力データを取得・検証
    getJobInputData() {
        const inputMode = document.querySelector('input[name="inputMode"]:checked').value;
        let sheets;

        // 枚数計算
        if (inputMode === 'direct') {
            sheets = parseInt(document.getElementById('directSheets').value);
            if (!sheets || sheets <= 0) {
                alert('生産枚数を正しく入力してください');
                return null;
            }
        } else {
            const copies = parseInt(document.getElementById('partsCopies').value);
            const pages = parseInt(document.getElementById('partsPages').value);
            const extra = parseInt(document.getElementById('partsExtra').value) || 0;

            if (!copies || !pages || copies <= 0 || pages <= 0) {
                alert('部数と面数を正しく入力してください');
                return null;
            }

            // CEILING関数: 実生産枚数 = CEILING(部数 / 面数) + 予備枚数
            sheets = Math.ceil(copies / pages) + extra;
        }

        // 共通パラメータ取得
        const paperLength = parseFloat(document.getElementById('paperLength').value);
        const overlapWidth = parseFloat(document.getElementById('overlapWidth').value);
        const processSpeed = parseFloat(document.getElementById('processSpeed').value);
        const initialFilmRemaining = parseFloat(document.getElementById('initialFilmRemaining').value) || null;

        if (!paperLength || !overlapWidth || !processSpeed || 
            paperLength <= 0 || overlapWidth < 0 || processSpeed <= 0) {
            alert('加工条件を正しく入力してください');
            return null;
        }

        // 計算実行
        const usageLength = (paperLength - overlapWidth) / 1000; // メートル変換
        const processingTime = sheets * usageLength / processSpeed; // 分
        
        // 妥当性チェック
        if (usageLength <= 0) {
            alert('紙の長さは重ね幅より大きくしてください');
            return null;
        }
        
        if (processingTime > 480) { // 8時間以上の場合警告
            if (!confirm(`計算結果が ${processingTime.toFixed(1)}分（${(processingTime/60).toFixed(1)}時間）です。続行しますか？`)) {
                return null;
            }
        }

        // ジョブデータ作成
        return {
            id: Date.now().toString(),
            timestamp: new Date(),
            sheets: sheets,
            paperLength: paperLength,
            overlapWidth: overlapWidth,
            processSpeed: processSpeed,
            usageLength: usageLength,
            processingTime: processingTime,
            inputMode: inputMode,
            completed: false,
            initialFilmRemaining: initialFilmRemaining // ユーザー指定の初期残量
        };
    }

    // 新しいフィルムセッション作成
    createNewFilmSession() {
        const filmCapacity = this.getFilmCapacity();
        
        // フィルム容量入力がキャンセルまたは無効な場合は null を返す
        if (filmCapacity === null) {
            return null;
        }
        
        return {
            id: Date.now().toString(),
            startTime: new Date(),
            endTime: null,
            jobs: [],
            status: 'active', // active, completed
            filmCapacity: filmCapacity, // 新しいフィルムの初期容量
            filmRemaining: filmCapacity, // 現在の残量
            filmUsed: 0 // 使用済み量
        };
    }

    // フィルム容量を取得（ユーザー入力またはキャンセル）
    getFilmCapacity() {
        const userInput = prompt('新しいフィルムの容量 (m) を入力してください:', '');
        
        // キャンセルが押された場合のみ処理を中断
        if (userInput === null) {
            return null;
        }
        
        // 空入力または無効な数値の場合は0として処理を続行
        const filmCapacity = parseFloat(userInput);
        if (isNaN(filmCapacity) || filmCapacity < 0) {
            return 0;
        }
        
        return filmCapacity;
    }

    // ジョブリスト表示
    renderJobList() {
        const container = document.getElementById('jobListContainer');
        
        if (this.filmSessions.length === 0) {
            container.innerHTML = `
                <div class="new-film-button-container">
                    <button class="btn btn-warning new-film-btn" onclick="dashboard.showJobInputForm(this, null)">
                        + 新しいフィルムでジョブを開始
                    </button>
                </div>
                <div class="empty-state">
                    まだジョブが登録されていません
                </div>
            `;
            return;
        }

        // 各セッションの状態を更新
        this.updateSessionStatuses();

        // フィルムセッションを降順で表示（新しいフィルムが上部）
        const reversedSessions = [...this.filmSessions].reverse();
        
        const sessionsHtml = reversedSessions.map((session, displayIndex) => {
            const originalIndex = this.filmSessions.length - displayIndex;
            const sessionStatus = this.getSessionStatus(session);
            // 全ジョブの総使用メーター数を正確に計算
            const totalUsed = session.jobs.reduce((total, job) => total + (job.sheets * job.usageLength), 0);
            
            // Ver.2.5: フィルム不足判定
            const filmShortage = this.getFilmShortageStatus(session);
            
            return `
            <div class="film-session ${filmShortage.isShortage ? 'film-shortage' : ''}">
                <div class="session-header" onclick="dashboard.toggleSession('${session.id}')">
                    <div class="session-title">
                        フィルム ${originalIndex} (${session.jobs.length}ジョブ)
                        <div class="session-film-info">
                            使用: ${totalUsed.toFixed(1)}m / 
                            <span class="film-capacity-display ${filmShortage.cssClass}" onclick="event.stopPropagation(); dashboard.showFilmCapacityInputUI('${session.id}')" title="クリックして初期容量を設定">
                                残り: ${(session.filmCapacity - totalUsed).toFixed(1)}m (容量: ${session.filmCapacity.toFixed(1)}m)
                                ${filmShortage.isShortage ? ` 🚨 ${filmShortage.message}` : ''}
                            </span>
                        </div>
                        <div class="film-button-group">
                            <button class="btn btn-sm btn-success film-add-job-btn" onclick="event.stopPropagation(); dashboard.showJobInputForm(this, '${session.id}')">
                                + ジョブを追加
                            </button>
                            <button class="btn btn-sm btn-primary film-add-film-btn" onclick="event.stopPropagation(); dashboard.addFilmToSession('${session.id}')">
                                + フィルムを追加
                            </button>
                        </div>
                    </div>
                    <div class="session-status ${sessionStatus.status}">
                        ${sessionStatus.label}
                    </div>
                </div>
                <div id="session-${session.id}" class="session-jobs">
                    ${session.jobs.slice().reverse().map(job => `
                        <div class="job-item ${job.completed ? 'completed' : ''}" onclick="dashboard.editJobSheets('${session.id}', '${job.id}')">
                            <div class="job-actions-left">
                                <button class="job-delete-btn" onclick="event.stopPropagation(); dashboard.deleteJob('${session.id}', '${job.id}')" title="削除">
                                    🗑️
                                </button>
                            </div>
                            <div class="job-info">
                                <div class="job-name">${this.formatTime(job.timestamp)} のジョブ</div>
                                <div class="job-details">
                                    ${job.sheets}枚 / ${job.usageLength.toFixed(2)}m / ${job.processingTime.toFixed(1)}分 / ${(job.sheets * job.usageLength).toFixed(1)}m
                                    ${job.completed ? `<br><strong>完了時刻: ${this.formatTime(job.completedAt)}</strong>` : ''}
                                </div>
                            </div>
                            <div class="job-actions-right">
                                ${job.completed ? `
                                    <button class="job-uncomplete-btn" onclick="event.stopPropagation(); dashboard.uncompleteJob('${session.id}', '${job.id}')">
                                        未完了に戻す
                                    </button>
                                ` : `
                                    <button class="job-complete-btn" onclick="event.stopPropagation(); dashboard.completeJob('${session.id}', '${job.id}')">
                                        完了
                                    </button>
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `}).join('');

        // 新しいフィルム用ボタンを末尾に常時表示
        const newFilmButton = `
            <div class="new-film-button-container">
                <button class="btn btn-warning new-film-btn" onclick="dashboard.showJobInputForm(this, null)">
                    + 新しいフィルムでジョブを開始
                </button>
            </div>
        `;

        container.innerHTML = sessionsHtml + newFilmButton;
    }

    // インラインでジョブ入力フォームを表示
    showJobInputForm(targetElement, sessionId) {
        // 既存のフォームがあれば削除
        const existingForm = document.querySelector('.inline-job-form');
        if (existingForm) {
            existingForm.remove();
        }

        const formId = `jobForm-${Date.now()}`;
        const formHtml = `
            <div class="inline-job-form" id="${formId}">
                <div class="job-form-container">
                    <h4>${sessionId ? 'このフィルムにジョブを追加' : '新しいフィルムでジョブを開始'}</h4>
                    
                    <!-- 入力モード選択 -->
                    <div class="input-mode-selector">
                        <div class="radio-option">
                            <input type="radio" id="${formId}-mode-copies" name="${formId}-inputMode" value="copies" checked>
                            <label for="${formId}-mode-copies">生産枚数指定</label>
                        </div>
                        <div class="radio-option">
                            <input type="radio" id="${formId}-mode-sheets" name="${formId}-inputMode" value="sheets">
                            <label for="${formId}-mode-sheets">実生産枚数指定</label>
                        </div>
                    </div>

                    <!-- 生産枚数指定モード -->
                    <div id="${formId}-mode-copies-inputs" class="input-mode active">
                        <div class="form-row">
                            <div class="form-group">
                                <label>生産枚数</label>
                                <input type="number" id="${formId}-copies" placeholder="1000" min="1" step="1">
                            </div>
                            <div class="form-group">
                                <label>印刷面数 (1または2)</label>
                                <input type="number" id="${formId}-pages" placeholder="2" min="1" max="2" step="1" value="2">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>用紙長さ (mm)</label>
                                <input type="number" id="${formId}-paperLength" placeholder="540" min="1" step="0.1">
                            </div>
                            <div class="form-group">
                                <label>重なり幅 (mm)</label>
                                <input type="number" id="${formId}-overlapWidth" placeholder="0" min="0" step="0.1" value="0">
                            </div>
                        </div>
                    </div>

                    <!-- 実生産枚数指定モード -->
                    <div id="${formId}-mode-sheets-inputs" class="input-mode">
                        <div class="form-row">
                            <div class="form-group">
                                <label>実生産枚数</label>
                                <input type="number" id="${formId}-sheets" placeholder="500" min="1" step="1">
                            </div>
                            <div class="form-group">
                                <label>1枚あたり使用長 (m)</label>
                                <input type="number" id="${formId}-usageLength" placeholder="0.54" min="0.001" step="0.001">
                            </div>
                        </div>
                    </div>

                    <!-- 共通項目 -->
                    <div class="form-row">
                        <div class="form-group">
                            <label>加工速度 (m/分)</label>
                            <input type="number" id="${formId}-processSpeed" placeholder="12" min="0.1" step="0.1" value="12">
                        </div>
                        ${!sessionId ? `
                        <div class="form-group">
                            <label>フィルム初期残量 (m)</label>
                            <input type="number" id="${formId}-initialFilmRemaining" placeholder="2000" min="0" step="1">
                        </div>
                        ` : ''}
                    </div>

                    <!-- ボタン -->
                    <div class="form-actions">
                        <button type="button" class="btn btn-primary" onclick="dashboard.handleSaveJob('${formId}', '${sessionId}')">
                            ${sessionId ? 'ジョブを追加' : 'ジョブを開始'}
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('${formId}').remove()">
                            キャンセル
                        </button>
                    </div>
                </div>
            </div>
        `;

        // ボタンの直後に挿入
        targetElement.insertAdjacentHTML('afterend', formHtml);

        // イベントリスナーを設定
        const modeRadios = document.querySelectorAll(`input[name="${formId}-inputMode"]`);
        modeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                // すべてのモードを非表示
                document.querySelectorAll(`#${formId} .input-mode`).forEach(mode => mode.classList.remove('active'));
                // 選択されたモードを表示
                document.getElementById(`${formId}-mode-${e.target.value}-inputs`).classList.add('active');
            });
        });
    }

    // インラインフォームからジョブデータを保存
    handleSaveJob(formId, sessionId) {
        const form = document.getElementById(formId);
        if (!form) return;

        // 入力モードを取得
        const inputMode = form.querySelector('input[name="' + formId + '-inputMode"]:checked').value;
        
        let jobData;
        try {
            if (inputMode === 'copies') {
                // 生産枚数指定モード
                const copies = parseFloat(form.querySelector(`#${formId}-copies`).value);
                const pages = parseFloat(form.querySelector(`#${formId}-pages`).value);
                const paperLength = parseFloat(form.querySelector(`#${formId}-paperLength`).value);
                const overlapWidth = parseFloat(form.querySelector(`#${formId}-overlapWidth`).value);
                const processSpeed = parseFloat(form.querySelector(`#${formId}-processSpeed`).value);

                if (!copies || !pages || !paperLength || !processSpeed) {
                    this.showToast('必要な項目を入力してください', 'error');
                    return;
                }

                // 計算処理
                const sheets = Math.ceil(copies / pages);
                const usageLength = (paperLength - overlapWidth) / 1000; // mm → m
                const processingTime = (sheets * usageLength) / processSpeed;

                jobData = {
                    id: Date.now().toString(),
                    timestamp: new Date(),
                    sheets: sheets,
                    paperLength: paperLength,
                    overlapWidth: overlapWidth,
                    processSpeed: processSpeed,
                    usageLength: usageLength,
                    processingTime: processingTime,
                    inputMode: 'copies',
                    completed: false,
                    completedAt: null,
                    initialFilmRemaining: sessionId ? null : (parseFloat(form.querySelector(`#${formId}-initialFilmRemaining`)?.value) || null)
                };

            } else {
                // 実生産枚数指定モード
                const sheets = parseFloat(form.querySelector(`#${formId}-sheets`).value);
                const usageLength = parseFloat(form.querySelector(`#${formId}-usageLength`).value);
                const processSpeed = parseFloat(form.querySelector(`#${formId}-processSpeed`).value);

                if (!sheets || !usageLength || !processSpeed) {
                    this.showToast('必要な項目を入力してください', 'error');
                    return;
                }

                const processingTime = (sheets * usageLength) / processSpeed;

                jobData = {
                    id: Date.now().toString(),
                    timestamp: new Date(),
                    sheets: sheets,
                    paperLength: null,
                    overlapWidth: null,
                    processSpeed: processSpeed,
                    usageLength: usageLength,
                    processingTime: processingTime,
                    inputMode: 'sheets',
                    completed: false,
                    completedAt: null,
                    initialFilmRemaining: sessionId ? null : (parseFloat(form.querySelector(`#${formId}-initialFilmRemaining`)?.value) || null)
                };
            }

            // セッションにジョブを追加
            if (sessionId && sessionId !== 'null') {
                // 既存のフィルムセッションに追加
                this.addJobToExistingSession(sessionId, jobData);
            } else {
                // 新しいフィルムセッションを作成
                this.addJobToNewFilmSession(jobData);
            }

            // フォームを削除
            form.remove();

        } catch (error) {
            console.error('ジョブ保存エラー:', error);
            this.showToast('ジョブの保存中にエラーが発生しました', 'error');
        }
    }

    // 既存セッションにジョブを追加
    addJobToExistingSession(sessionId, jobData) {
        const session = this.filmSessions.find(s => s.id === sessionId);
        if (!session) {
            this.showToast('指定されたフィルムセッションが見つかりません', 'error');
            return;
        }

        // フィルム残量チェック
        if (session.filmRemaining < jobData.usageLength) {
            if (!confirm(`フィルム残量が不足しています。\n必要: ${jobData.usageLength.toFixed(2)}m\n残量: ${session.filmRemaining.toFixed(2)}m\n\nそれでも追加しますか？`)) {
                return;
            }
        }

        // ジョブを追加してセッション固有の残量を更新
        session.jobs.push(jobData);
        session.filmRemaining = Math.max(0, session.filmRemaining - jobData.usageLength);
        session.filmUsed += jobData.usageLength;

        this.saveData();
        this.renderJobList();
        this.updateFinishTime();
        this.updateFilmDisplay();
        
        this.showToast(`ジョブをフィルムに追加しました (${jobData.sheets}枚)`, 'success');
    }

    // 新しいフィルムセッションを作成してジョブを追加
    addJobToNewFilmSession(jobData) {
        // 新しいフィルムセッション作成
        this.currentFilmSession = this.createNewFilmSession();
        
        // フィルム容量入力がキャンセルされた場合は処理を中断
        if (this.currentFilmSession === null) {
            this.showToast('フィルム作成がキャンセルされました', 'info');
            return;
        }
        
        // ユーザー指定の初期残量がある場合はそれを使用
        if (jobData.initialFilmRemaining !== null && jobData.initialFilmRemaining >= 0) {
            this.currentFilmSession.filmCapacity = jobData.initialFilmRemaining;
            this.currentFilmSession.filmRemaining = jobData.initialFilmRemaining;
            this.currentFilmSession.filmUsed = 0;
        }
        
        this.filmSessions.push(this.currentFilmSession);

        // ジョブを追加してセッション固有の残量を更新
        this.currentFilmSession.jobs.push(jobData);
        this.currentFilmSession.filmRemaining = Math.max(0, this.currentFilmSession.filmRemaining - jobData.usageLength);
        this.currentFilmSession.filmUsed += jobData.usageLength;

        // フィルム交換時間を追加（2個目以降のフィルムの場合）
        if (this.filmSessions.length > 1) {
            this.extraTime += this.timeSettings.diffFilmChange;
        }

        this.saveData();
        this.renderJobList();
        this.updateFinishTime();
        this.updateFilmDisplay();
        
        const exchangeMessage = this.filmSessions.length > 1 ? ` (交換時間 +${this.timeSettings.diffFilmChange}分)` : '';
        this.showToast(`新しいフィルムでジョブを追加しました${exchangeMessage}`, 'success');
    }

    // セッション状態管理：親フィルムブロックの状態を子ジョブに基づいて自動更新
    updateSessionStatuses() {
        this.filmSessions.forEach(session => {
            // nullセッションをスキップ
            if (!session || !session.jobs) return;
            
            const completedJobs = session.jobs.filter(job => job.completed);
            const totalJobs = session.jobs.length;
            
            if (totalJobs === 0) {
                session.status = 'active'; // 空のセッションは進行中
            } else if (completedJobs.length === totalJobs) {
                session.status = 'completed'; // 全ジョブ完了
            } else {
                session.status = 'active'; // 一つでも未完了があれば進行中
            }
        });
    }

    // セッション状態を取得（表示用）
    getSessionStatus(session) {
        const completedJobs = session.jobs.filter(job => job.completed);
        const totalJobs = session.jobs.length;
        
        if (totalJobs === 0) {
            return { status: 'active', label: '進行中' };
        } else if (completedJobs.length === totalJobs) {
            return { status: 'completed', label: '完了' };
        } else {
            return { status: 'active', label: '進行中' };
        }
    }

    // セッション展開/折りたたみ
    toggleSession(sessionId) {
        const sessionJobs = document.getElementById(`session-${sessionId}`);
        sessionJobs.classList.toggle('collapsed');
    }

    // ジョブ完了
    completeJob(sessionId, jobId) {
        const session = this.filmSessions.find(s => s.id === sessionId);
        if (!session) {
            console.error('セッションが見つかりません:', sessionId);
            return;
        }

        const job = session.jobs.find(j => j.id === jobId);
        if (!job) {
            console.error('ジョブが見つかりません:', jobId);
            return;
        }

        // 確定終了時刻を記録
        const completedAt = new Date();
        job.completed = true;
        job.completedAt = completedAt;
        job.actualCompletionTime = completedAt; // 実際の完了時刻

        // フィルム残量を正しく更新（完了時にフィルム使用量を反映）
        if (!job.wasFilmUsageApplied) {
            const totalJobUsage = job.sheets * job.usageLength;
            session.filmRemaining = Math.max(0, session.filmRemaining - totalJobUsage);
            session.filmUsed += totalJobUsage;
            job.wasFilmUsageApplied = true; // 重複適用防止フラグ
        }

        // セッション状態も更新
        this.updateSessionStatuses();

        // 全体の終了時刻を再計算（完了したジョブは実時間から除外）
        this.recalculateFinishTime();

        this.saveData();
        this.renderJobList();
        this.updateFinishTime();
        
        const completedTimeStr = completedAt.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit'
        });
        this.showToast(`ジョブを完了しました（${completedTimeStr}）`, 'success');
    }

    // ジョブ未完了に戻す
    uncompleteJob(sessionId, jobId) {
        const session = this.filmSessions.find(s => s.id === sessionId);
        if (!session) {
            console.error('セッションが見つかりません:', sessionId);
            return;
        }

        const job = session.jobs.find(j => j.id === jobId);
        if (!job) {
            console.error('ジョブが見つかりません:', jobId);
            return;
        }

        // 完了状態をリセット
        job.completed = false;
        job.completedAt = null;
        job.actualCompletionTime = null;

        // フィルム残量を戻す（未完了に戻す時にフィルム使用量を戻す）
        if (job.wasFilmUsageApplied) {
            const totalJobUsage = job.sheets * job.usageLength;
            session.filmRemaining += totalJobUsage;
            session.filmUsed = Math.max(0, session.filmUsed - totalJobUsage);
            job.wasFilmUsageApplied = false; // フラグをリセット
        }

        // セッション状態も更新（親ブロックが自動的に「進行中」に戻る）
        this.updateSessionStatuses();

        // 全体の終了時刻を再計算
        this.recalculateFinishTime();

        this.saveData();
        this.renderJobList();
        this.updateFinishTime();
        
        this.showToast('ジョブを未完了に戻しました', 'info');
    }

    // フィルム残量追加機能
    addFilmRemaining(sessionId, jobId) {
        const session = this.filmSessions.find(s => s.id === sessionId);
        if (!session) return;

        const job = session.jobs.find(j => j.id === jobId);
        if (!job) return;

        const currentRemaining = session.filmRemaining;
        const adjustmentAmount = prompt(
            `フィルム残量を調整してください:\n\n` +
            `現在の残量: ${currentRemaining.toFixed(1)}m\n` +
            `このジョブの必要量: ${(job.sheets * job.usageLength).toFixed(2)}m\n\n` +
            `調整量 (正数で追加、負数で減算):`,
            ''
        );
        
        if (adjustmentAmount && !isNaN(adjustmentAmount)) {
            const adjustAmount = parseFloat(adjustmentAmount);
            
            // セッションのフィルム残量と容量を調整
            session.filmRemaining += adjustAmount;
            session.filmCapacity += adjustAmount;
            
            // 残量が負にならないように制限
            if (session.filmRemaining < 0) {
                session.filmRemaining = 0;
            }
            if (session.filmCapacity < 0) {
                session.filmCapacity = 0;
            }
            
            this.saveData();
            this.renderJobList();
            this.updateFilmDisplay();
            
            const actionText = adjustAmount >= 0 ? `追加` : `減算`;
            this.showToast(`フィルム残量を ${Math.abs(adjustAmount)}m ${actionText}しました`, 'success');
        }
    }

    // ジョブの生産枚数を編集
    editJobSheets(sessionId, jobId) {
        const session = this.filmSessions.find(s => s.id === sessionId);
        if (!session) return;

        const job = session.jobs.find(j => j.id === jobId);
        if (!job) return;

        const currentSheets = job.sheets;
        const newSheets = prompt(
            `生産枚数を修正してください:\n\n` +
            `現在の枚数: ${currentSheets}枚\n` +
            `新しい枚数を入力:`,
            currentSheets.toString()
        );
        
        if (newSheets && !isNaN(newSheets)) {
            const sheets = parseInt(newSheets);
            if (sheets > 0) {
                // 旧使用量を戻す（完了済みの場合）
                if (job.completed && job.wasFilmUsageApplied) {
                    const oldTotalUsage = currentSheets * job.usageLength;
                    session.filmRemaining += oldTotalUsage;
                    session.filmUsed -= oldTotalUsage;
                }
                
                // ジョブ情報を更新
                job.sheets = sheets;
                const newTotalUsage = sheets * job.usageLength;
                job.processingTime = newTotalUsage / job.processSpeed; // 処理時間も再計算
                
                // 新使用量を適用（完了済みの場合）
                if (job.completed && job.wasFilmUsageApplied) {
                    session.filmRemaining = Math.max(0, session.filmRemaining - newTotalUsage);
                    session.filmUsed += newTotalUsage;
                }
                
                this.saveData();
                this.renderJobList();
                this.updateFinishTime();
                
                this.showToast(`生産枚数を ${currentSheets}枚 → ${sheets}枚 に変更しました`, 'success');
            }
        }
    }

    // フィルムをセッションに追加
    addFilmToSession(sessionId) {
        const session = this.filmSessions.find(s => s.id === sessionId);
        if (!session) return;

        const currentCapacity = session.filmCapacity;
        const additionalFilm = prompt(
            `フィルムを追加してください:\n\n` +
            `現在の容量: ${currentCapacity.toFixed(1)}m\n` +
            `追加するフィルムの長さ (m) を入力:`,
            ''
        );
        
        if (additionalFilm && !isNaN(additionalFilm)) {
            const addAmount = parseFloat(additionalFilm);
            if (addAmount > 0) {
                session.filmCapacity += addAmount;
                session.filmRemaining += addAmount;
                
                this.saveData();
                this.renderJobList();
                this.updateFilmDisplay();
                
                this.showToast(`フィルムを ${addAmount}m 追加しました`, 'success');
            }
        }
    }

    // 終了時刻再計算（完了ジョブを考慮）
    recalculateFinishTime() {
        if (!this.workStarted) return;

        // 未完了ジョブのみの合計時間を計算
        const allJobs = this.filmSessions.flatMap(session => session.jobs);
        const incompleteJobs = allJobs.filter(job => !job.completed);
        const totalProcessingTime = incompleteJobs.reduce((total, job) => total + job.processingTime, 0);
        
        // 完了ジョブの実際の時間消費を考慮（現在時刻基準）
        const now = new Date();
        const elapsedTime = (now - this.workStartTime) / 60000; // 分
        
        // 残り時間 = 未完了ジョブの時間 + 追加時間 + 片付け時間
        const remainingTime = totalProcessingTime + this.extraTime + this.timeSettings.cleanupTime;
        
        // 新しい終了予定時刻 = 現在時刻 + 残り時間
        this.estimatedFinishTime = new Date(now.getTime() + remainingTime * 60000);
        
        return this.estimatedFinishTime;
    }

    // ジョブ削除
    deleteJob(sessionId, jobId) {
        if (!confirm('このジョブを削除しますか？')) return;

        const session = this.filmSessions.find(s => s.id === sessionId);
        if (!session) return;

        const jobIndex = session.jobs.findIndex(j => j.id === jobId);
        if (jobIndex === -1) return;

        const job = session.jobs[jobIndex];
        
        // セッション固有のフィルム使用量を戻す
        if (!job.completed) {
            session.filmRemaining += job.usageLength;
            session.filmUsed = Math.max(0, session.filmUsed - job.usageLength);
        }

        session.jobs.splice(jobIndex, 1);

        // セッションが空になった場合は削除
        if (session.jobs.length === 0) {
            const sessionIndex = this.filmSessions.findIndex(s => s.id === sessionId);
            this.filmSessions.splice(sessionIndex, 1);
            
            // 現在のセッションを更新
            if (this.currentFilmSession && this.currentFilmSession.id === sessionId) {
                this.currentFilmSession = this.filmSessions.find(s => s.status === 'active') || null;
            }
        }

        this.saveData();
        this.renderJobList();
        this.updateFinishTime();
        this.showToast('ジョブを削除しました', 'success');
    }

    // 手動時間追加
    addManualTime() {
        const minutes = prompt('追加する時間を分で入力してください:');
        if (minutes && !isNaN(minutes) && parseInt(minutes) > 0) {
            this.extraTime += parseInt(minutes);
            this.saveData();
            this.updateFinishTime();
            this.showToast(`${minutes}分を追加しました`, 'success');
        }
    }

    // 昼休み追加
    addLunchBreak() {
        this.extraTime += this.timeSettings.lunchBreak;
        this.saveData();
        this.updateFinishTime();
        this.showToast(`昼休み ${this.timeSettings.lunchBreak}分を追加しました`, 'success');
    }

    // 交換時間追加
    addExchangeTime() {
        const exchangeTime = this.timeSettings.diffFilmChange;
        this.extraTime += exchangeTime;
        this.saveData();
        this.updateFinishTime();
        this.showToast(`フィルム交換時間 ${exchangeTime}分を追加しました`, 'success');
    }

    // フィルム残量設定
    setFilmAmount() {
        if (!this.currentFilmSession) {
            this.showToast('先にジョブを追加してフィルムセッションを開始してください', 'warning');
            return;
        }

        const currentRemaining = this.currentFilmSession.filmRemaining;
        const amount = prompt('現在のフィルム残量 (m) を入力してください:', currentRemaining.toString());
        if (amount && !isNaN(amount) && parseFloat(amount) >= 0) {
            this.currentFilmSession.filmRemaining = parseFloat(amount);
            // 使用量も再計算（容量 - 残量 = 使用量）
            this.currentFilmSession.filmUsed = this.currentFilmSession.filmCapacity - parseFloat(amount);
            this.updateFilmDisplay();
            this.saveData();
            this.showToast(`フィルム残量を ${amount}m に設定しました`, 'success');
        }
    }

    // 設定モーダル表示
    showSettings() {
        this.loadSettingsToUI();
        const modal = document.getElementById('settingsModal');
        modal.classList.add('active');
    }

    // 設定モーダル非表示
    hideSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.remove('active');
    }

    // 設定をUIに読み込み
    loadSettingsToUI() {
        document.getElementById('settingWorkStart').value = this.timeSettings.workStart;
        document.getElementById('settingWorkEnd').value = this.timeSettings.workEnd;
        document.getElementById('settingOvertimeEnd').value = this.timeSettings.overtimeEnd;
        document.getElementById('settingLunchBreak').value = this.timeSettings.lunchBreak;
        document.getElementById('settingCleanupTime').value = this.timeSettings.cleanupTime;
        document.getElementById('settingDiffFilmChange').value = this.timeSettings.diffFilmChange;
    }

    // 設定を保存
    saveSettings() {
        const newSettings = {
            workStart: document.getElementById('settingWorkStart').value,
            workEnd: document.getElementById('settingWorkEnd').value,
            overtimeEnd: document.getElementById('settingOvertimeEnd').value,
            lunchBreak: parseInt(document.getElementById('settingLunchBreak').value),
            cleanupTime: parseInt(document.getElementById('settingCleanupTime').value),
            sameFilmChange: this.timeSettings.sameFilmChange, // 維持
            diffFilmChange: parseInt(document.getElementById('settingDiffFilmChange').value)
        };

        // 入力値検証
        if (!newSettings.workStart || !newSettings.workEnd || !newSettings.overtimeEnd ||
            newSettings.lunchBreak < 0 || newSettings.cleanupTime < 0 || newSettings.diffFilmChange < 0) {
            alert('設定値を正しく入力してください');
            return;
        }

        this.timeSettings = newSettings;
        this.saveData();
        this.updateFinishTime(); // 終了時刻を再計算
        this.hideSettings();
        this.showToast('設定を保存しました', 'success');
    }

    // 設定をデフォルトに戻す
    resetSettings() {
        if (confirm('設定をデフォルト値に戻しますか？')) {
            this.timeSettings = {
                workStart: "08:30",
                workEnd: "17:00",
                overtimeEnd: "18:00",
                lunchBreak: 60,
                cleanupTime: 15,
                sameFilmChange: 10,
                diffFilmChange: 15
            };
            this.loadSettingsToUI();
            this.saveData();
            this.updateFinishTime();
            this.showToast('設定をデフォルトに戻しました', 'success');
        }
    }

    // レポート表示
    showReport() {
        // ===== Ver.2.9: XMLドキュメント仕様による計算ロジック完全置換 =====
        
        // 1. 完了済みジョブの抽出
        const completedJobs = [];
        this.filmSessions.forEach(session => {
            session.jobs.forEach(job => {
                if (job.completed) {
                    completedJobs.push(job);
                }
            });
        });

        // 2. 完了済みセッション数の計算
        const completedSessionIds = new Set();
        this.filmSessions.forEach(session => {
            const sessionStatus = this.getSessionStatus(session);
            if (sessionStatus.status === 'completed') {
                completedSessionIds.add(session.id);
            }
        });
        const completedSessionCount = completedSessionIds.size;

        // 3. サマリー計算
        const totalCompletedJobs = completedJobs.length;
        const totalSheets = completedJobs.reduce((sum, job) => sum + job.sheets, 0);
        const totalUsedMeters = completedJobs.reduce((sum, job) => sum + (job.sheets * job.usageLength), 0);
        // 【Ver.2.10修正】完了したジョブの productionTime を正確に合計
        const totalProductionTime = completedJobs.reduce((sum, job) => sum + job.productionTime, 0);
        
        const reportContent = `
            <div class="report-summary">
                <h3>本日のサマリー</h3>
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="summary-label">フィルムセッション数</div>
                        <div class="summary-value" id="report-session-count">${completedSessionCount}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">合計ジョブ数</div>
                        <div class="summary-value" id="report-total-jobs">${totalCompletedJobs}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">完了ジョブ数</div>
                        <div class="summary-value" id="report-completed-jobs">${totalCompletedJobs}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">合計生産枚数</div>
                        <div class="summary-value" id="report-total-sheets">${totalSheets}枚</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">合計使用メーター</div>
                        <div class="summary-value" id="report-total-meters">${totalUsedMeters.toFixed(2)}m</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">生産時間</div>
                        <div class="summary-value" id="report-production-time">${totalProductionTime.toFixed(1)}分</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">手動追加時間</div>
                        <div class="summary-value">${this.extraTime}分</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">現在フィルム残量</div>
                        <div class="summary-value">${this.currentFilmSession ? this.currentFilmSession.filmRemaining.toFixed(1) : '0.0'}m</div>
                    </div>
                </div>
            </div>
            
            <div class="report-history">
                <h3>フィルムセッション履歴</h3>
                <div class="history-list">
                    ${this.filmSessions.map((session, index) => `
                        <div class="history-item">
                            <div class="history-header">
                                <span>フィルム ${index + 1}</span>
                                <span>${session.status === 'completed' ? '完了' : '進行中'}</span>
                            </div>
                            <div class="history-details">
                                ${session.jobs.length}ジョブ / ${session.jobs.reduce((sum, job) => sum + job.usageLength, 0).toFixed(2)}m / ${session.jobs.reduce((sum, job) => sum + job.processingTime, 0).toFixed(1)}分
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.getElementById('reportContent').innerHTML = reportContent;
        document.getElementById('reportModal').classList.add('active');
    }

    // レポート非表示
    hideReport() {
        document.getElementById('reportModal').classList.remove('active');
    }

    // 現在時刻更新
    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('currentTime').textContent = timeString;
    }

    // 終了時刻更新
    updateFinishTime() {
        if (!this.workStarted) {
            document.getElementById('finalFinishTime').textContent = '--:--';
            document.getElementById('finishStatus').textContent = '業務開始前';
            return;
        }

        const allJobs = this.filmSessions.flatMap(session => session.jobs);
        const totalProcessingTime = allJobs.reduce((total, job) => total + job.processingTime, 0);
        const totalTime = totalProcessingTime + this.extraTime + this.timeSettings.cleanupTime;
        
        // 開始時刻から終了時刻を計算
        const finishTime = new Date(this.workStartTime.getTime() + totalTime * 60000);
        
        const finishTimeString = finishTime.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        document.getElementById('finalFinishTime').textContent = finishTimeString;
        
        // ステータス更新
        this.updateFinishStatus(finishTime);
    }

    // 終了ステータス更新
    updateFinishStatus(finishTime) {
        const statusElement = document.getElementById('finishStatus');
        const now = new Date();
        const targetTime = this.parseTime(this.targetEndTime);
        const warningTime = this.parseTime('16:45');
        
        if (finishTime > targetTime) {
            const overMinutes = Math.floor((finishTime - targetTime) / 60000);
            statusElement.textContent = `目標超過 +${overMinutes}分`;
            statusElement.className = 'time-status danger';
        } else if (finishTime > warningTime) {
            const remainingMinutes = Math.floor((targetTime - finishTime) / 60000);
            statusElement.textContent = `目標まで${remainingMinutes}分`;
            statusElement.className = 'time-status warning';
        } else {
            statusElement.textContent = '目標時刻内で終了予定';
            statusElement.className = 'time-status success';
        }
    }

    // フィルム残量表示更新
    updateFilmDisplay() {
        const filmRemaining = this.currentFilmSession ? this.currentFilmSession.filmRemaining : 0;
        const filmRemainingElement = document.getElementById('currentFilmRemaining');
        if (filmRemainingElement) {
            filmRemainingElement.textContent = filmRemaining.toFixed(1);
        }
        // フィルム残量表示要素がない場合は何もしない（エラー回避）
    }

    // 入力フィールドクリア
    clearInputs() {
        document.getElementById('directSheets').value = '';
        document.getElementById('partsCopies').value = '';
        document.getElementById('partsPages').value = '';
        document.getElementById('partsExtra').value = '0';
        document.getElementById('paperLength').value = '';
        document.getElementById('overlapWidth').value = '';
        document.getElementById('processSpeed').value = '';
        document.getElementById('initialFilmRemaining').value = '';
    }

    // 時刻パース
    parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    }

    // 時刻フォーマット
    formatTime(date) {
        return date.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // データ保存
    saveData() {
        const data = {
            date: new Date().toDateString(),
            filmSessions: this.filmSessions,
            currentFilmSessionId: this.currentFilmSession ? this.currentFilmSession.id : null,
            extraTime: this.extraTime,
            workStarted: this.workStarted,
            workStartTime: this.workStartTime,
            targetEndTime: this.targetEndTime,
            timeSettings: this.timeSettings
        };
        
        localStorage.setItem('laminator_dashboard_v3', JSON.stringify(data));
    }

    // データ読み込み
    loadData() {
        try {
            const rawData = localStorage.getItem('laminator_dashboard_v3');
            const data = rawData ? JSON.parse(rawData) : {};
            const today = new Date().toDateString();
            
            if (data.date === today && data.filmSessions) {
                // 既存データの復元（nullを除去）
                this.filmSessions = Array.isArray(data.filmSessions) ? 
                    data.filmSessions.filter(session => session !== null && session !== undefined) : [];
                
                // 日付文字列をDateオブジェクトに変換
                if (data.workStartTime) {
                    data.workStartTime = new Date(data.workStartTime);
                }
                
                // フィルムセッションの日付変換
                this.filmSessions.forEach(session => {
                    if (session.startTime) {
                        session.startTime = new Date(session.startTime);
                    }
                    if (session.endTime) {
                        session.endTime = new Date(session.endTime);
                    }
                    
                    // セッション内のジョブの日付変換
                    if (session.jobs && Array.isArray(session.jobs)) {
                        session.jobs.forEach(job => {
                            if (job.timestamp) {
                                job.timestamp = new Date(job.timestamp);
                            }
                            if (job.completedAt) {
                                job.completedAt = new Date(job.completedAt);
                            }
                            if (job.actualCompletionTime) {
                                job.actualCompletionTime = new Date(job.actualCompletionTime);
                            }
                        });
                    }
                });
                
                this.extraTime = Number(data.extraTime) || 0;
                this.workStarted = Boolean(data.workStarted);
                this.workStartTime = data.workStartTime ? data.workStartTime : null;
                this.targetEndTime = data.targetEndTime || "17:00";
                
                // 設定も復元
                if (data.timeSettings && typeof data.timeSettings === 'object') {
                    this.timeSettings = { ...this.timeSettings, ...data.timeSettings };
                }
                
                // 現在のフィルムセッションを復元
                if (data.currentFilmSessionId && this.filmSessions.length > 0) {
                    this.currentFilmSession = this.filmSessions.find(s => s.id === data.currentFilmSessionId) || null;
                }
                
                console.log('データを正常に復元しました:', this.filmSessions.length + '個のセッション');
            } else {
                // 日付が変わった場合または初回起動時はリセット
                this.initDefaultData();
                
                // 設定のみ引き継ぎ
                if (data.timeSettings && typeof data.timeSettings === 'object') {
                    this.timeSettings = { ...this.timeSettings, ...data.timeSettings };
                }
                
                if (data.date) {
                    this.showToast('新しい日の作業を開始します', 'info');
                } else {
                    console.log('初回起動 - デフォルトデータで開始');
                }
            }
            
            // 初期表示更新
            this.updateFilmDisplay();
            
        } catch (error) {
            console.error('データ読み込みエラー詳細:', error);
            console.error('エラーが発生したlocalStorageデータ:', localStorage.getItem('laminator_dashboard_v3'));
            this.showToast('データの読み込みに失敗しました。初期状態で開始します。', 'error');
            this.initDefaultData();
        }
    }

    // デフォルトデータ初期化
    initDefaultData() {
        this.filmSessions = [];
        this.currentFilmSession = null;
        this.extraTime = 0;
        this.workStarted = false;
        this.workStartTime = null;
    }

    // トースト通知
    showToast(message, type = 'info') {
        // 既存のトーストを削除
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        // トースト要素を作成
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.textContent = message;
        
        // スタイルを設定
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%) translateY(100px)',
            background: this.getToastColor(type),
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: '10000',
            opacity: '0',
            transition: 'all 0.3s ease'
        });

        document.body.appendChild(toast);

        // アニメーションでトーストを表示
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, 50);

        // 3秒後にフェードアウトして削除
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(100px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    getToastColor(type) {
        const colors = {
            success: '#27AE60',
            error: '#E74C3C',
            warning: '#F39C12',
            info: '#3498DB'
        };
        return colors[type] || colors.info;
    }

    // 設定モーダル表示
    showSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            // 現在の設定値を設定フォームに反映
            document.getElementById('settingWorkStart').value = this.timeSettings.workStart;
            document.getElementById('settingWorkEnd').value = this.timeSettings.workEnd;
            document.getElementById('settingOvertimeEnd').value = this.timeSettings.overtimeEnd;
            document.getElementById('settingLunchBreak').value = this.timeSettings.lunchBreak;
            document.getElementById('settingCleanupTime').value = this.timeSettings.cleanupTime;
            document.getElementById('settingDiffFilmChange').value = this.timeSettings.diffFilmChange;
            
            modal.classList.add('active');
        }
    }

    // 設定モーダル非表示
    hideSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // 設定保存
    saveSettings() {
        // 時間設定の更新
        this.timeSettings.workStart = document.getElementById('settingWorkStart').value;
        this.timeSettings.workEnd = document.getElementById('settingWorkEnd').value;
        this.timeSettings.overtimeEnd = document.getElementById('settingOvertimeEnd').value;
        this.timeSettings.lunchBreak = parseInt(document.getElementById('settingLunchBreak').value);
        this.timeSettings.cleanupTime = parseInt(document.getElementById('settingCleanupTime').value);
        this.timeSettings.diffFilmChange = parseInt(document.getElementById('settingDiffFilmChange').value);

        // 設定をローカルストレージに保存
        this.saveData();
        
        this.showToast('設定を保存しました', 'success');
        this.hideSettings();
    }

    // 設定をデフォルトに戻す
    resetSettings() {
        if (confirm('設定をデフォルトに戻しますか？')) {
            this.timeSettings = {
                workStart: "08:30",
                workEnd: "17:00",
                overtimeEnd: "18:00",
                lunchBreak: 60,
                cleanupTime: 15,
                sameFilmChange: 10,
                diffFilmChange: 15
            };

            this.saveData();
            this.showSettings(); // 設定画面を更新表示
            this.showToast('設定をデフォルトに戻しました', 'success');
        }
    }

    // Ver.2.5: 統一ジョブ入力フォーム表示
    showJobInputForm(targetElement, sessionId) {
        // 既存のフォームがあれば削除
        const existingForm = document.querySelector('.inline-job-form');
        if (existingForm) {
            existingForm.remove();
        }

        const formId = `job-form-${Date.now()}`;
        const isNewFilm = sessionId === null;

        const formHTML = `
            <div class="inline-job-form">
                <div class="job-form-container">
                    <h4>${isNewFilm ? '新しいフィルムでジョブを開始' : '既存フィルムにジョブを追加'}</h4>
                    
                    <!-- 入力モード切り替え -->
                    <div class="input-mode-selector">
                        <div class="radio-option">
                            <input type="radio" name="${formId}-mode" id="${formId}-mode-sheets" value="sheets" checked>
                            <label for="${formId}-mode-sheets">生産枚数指定</label>
                        </div>
                        <div class="radio-option">
                            <input type="radio" name="${formId}-mode" id="${formId}-mode-parts" value="parts">
                            <label for="${formId}-mode-parts">部数計算</label>
                        </div>
                    </div>

                    <!-- 生産枚数指定モード -->
                    <div id="${formId}-sheets-mode" class="input-mode active">
                        <div class="form-group">
                            <label>生産枚数</label>
                            <input type="number" id="${formId}-sheets" min="1" step="1" placeholder="枚数" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>用紙長さ (mm)</label>
                                <input type="number" id="${formId}-paperLength" min="1" step="0.1" placeholder="長さ" required>
                            </div>
                            <div class="form-group">
                                <label>重なり幅 (mm)</label>
                                <input type="number" id="${formId}-overlapWidth" min="0" step="0.1" placeholder="重ね幅" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>加工速度 (m/分)</label>
                            <input type="number" id="${formId}-machineSpeed" min="0.1" step="0.1" placeholder="速度" required>
                        </div>
                    </div>

                    <!-- 部数計算モード -->
                    <div id="${formId}-parts-mode" class="input-mode">
                        <div class="form-row">
                            <div class="form-group">
                                <label>部数</label>
                                <input type="number" id="${formId}-parts" min="1" step="1" placeholder="部数">
                            </div>
                            <div class="form-group">
                                <label>印刷面数</label>
                                <input type="number" id="${formId}-surfaces" min="1" step="1" placeholder="面数">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>予備枚数</label>
                            <input type="number" id="${formId}-spares" min="0" step="1" placeholder="予備" value="0">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>用紙長さ (mm)</label>
                                <input type="number" id="${formId}-paperLength2" min="1" step="0.1" placeholder="長さ">
                            </div>
                            <div class="form-group">
                                <label>重なり幅 (mm)</label>
                                <input type="number" id="${formId}-overlapWidth2" min="0" step="0.1" placeholder="重ね幅">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>加工速度 (m/分)</label>
                            <input type="number" id="${formId}-machineSpeed2" min="0.1" step="0.1" placeholder="速度">
                        </div>
                    </div>

                    <!-- アクションボタン -->
                    <div class="form-actions">
                        <button type="button" class="btn btn-primary" onclick="dashboard.handleSaveJob('${formId}', '${sessionId}')">
                            ${isNewFilm ? 'ジョブを新規フィルムで開始' : 'ジョブを追加'}
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="dashboard.hideJobInputForm()">
                            キャンセル
                        </button>
                    </div>
                </div>
            </div>
        `;

        // フォームを挿入
        targetElement.insertAdjacentHTML('afterend', formHTML);

        // モード切り替えイベントリスナーを設定
        const sheetsRadio = document.getElementById(`${formId}-mode-sheets`);
        const partsRadio = document.getElementById(`${formId}-mode-parts`);
        const sheetsMode = document.getElementById(`${formId}-sheets-mode`);
        const partsMode = document.getElementById(`${formId}-parts-mode`);

        sheetsRadio.addEventListener('change', () => {
            if (sheetsRadio.checked) {
                sheetsMode.classList.add('active');
                partsMode.classList.remove('active');
            }
        });

        partsRadio.addEventListener('change', () => {
            if (partsRadio.checked) {
                partsMode.classList.add('active');
                sheetsMode.classList.remove('active');
            }
        });

        console.log('Job input form displayed:', { sessionId, isNewFilm });
    }

    // フォーム非表示
    hideJobInputForm() {
        const existingForm = document.querySelector('.inline-job-form');
        if (existingForm) {
            existingForm.remove();
        }
    }

    // ジョブ保存処理
    handleSaveJob(formId, sessionId) {
        try {
            const jobData = this.collectJobFormData(formId);
            if (!jobData) return;

            if (sessionId === 'null' || sessionId === null) {
                // 新規フィルムでジョブを開始
                this.addJobToNewFilmSession(jobData);
            } else {
                // 既存フィルムにジョブを追加
                this.addJobToExistingSession(sessionId, jobData);
            }

            this.hideJobInputForm();
            this.renderJobList();
            this.updateFinishTime();
            this.showToast('ジョブを追加しました', 'success');

        } catch (error) {
            console.error('Error saving job:', error);
            this.showToast('ジョブの保存中にエラーが発生しました', 'error');
        }
    }

    // フォームデータ収集
    collectJobFormData(formId) {
        const sheetsRadio = document.getElementById(`${formId}-mode-sheets`);
        const isSheetsMode = sheetsRadio && sheetsRadio.checked;

        let sheets, paperLength, overlapWidth, machineSpeed;

        if (isSheetsMode) {
            sheets = parseInt(document.getElementById(`${formId}-sheets`).value);
            paperLength = parseFloat(document.getElementById(`${formId}-paperLength`).value);
            overlapWidth = parseFloat(document.getElementById(`${formId}-overlapWidth`).value);
            machineSpeed = parseFloat(document.getElementById(`${formId}-machineSpeed`).value);
        } else {
            // 部数計算モード
            const parts = parseInt(document.getElementById(`${formId}-parts`).value);
            const surfaces = parseInt(document.getElementById(`${formId}-surfaces`).value);
            const spares = parseInt(document.getElementById(`${formId}-spares`).value) || 0;
            
            sheets = Math.ceil(parts / surfaces) + spares;
            paperLength = parseFloat(document.getElementById(`${formId}-paperLength2`).value);
            overlapWidth = parseFloat(document.getElementById(`${formId}-overlapWidth2`).value);
            machineSpeed = parseFloat(document.getElementById(`${formId}-machineSpeed2`).value);
        }

        // バリデーション
        if (!sheets || !paperLength || isNaN(overlapWidth) || !machineSpeed) {
            alert('すべての必須項目を入力してください');
            return null;
        }

        return this.createJobData({
            inputMode: isSheetsMode ? 'sheets' : 'parts',
            sheets,
            paperLength,
            overlapWidth,
            processSpeed: machineSpeed
        });
    }

    // Ver.2.5: 構造化データからジョブデータを作成
    createJobData(params) {
        const { inputMode, sheets, paperLength, overlapWidth, processSpeed } = params;

        // 計算実行
        const usageLength = (paperLength - overlapWidth) / 1000; // メートル変換
        const processingTime = sheets * usageLength / processSpeed; // 分
        
        // 妥当性チェック
        if (usageLength <= 0) {
            alert('用紙の長さは重なり幅より大きくしてください');
            return null;
        }
        
        if (processingTime > 480) { // 8時間以上の場合警告
            if (!confirm(`計算結果が ${processingTime.toFixed(1)}分（${(processingTime/60).toFixed(1)}時間）です。続行しますか？`)) {
                return null;
            }
        }

        // ジョブデータ作成
        return {
            id: Date.now().toString(),
            timestamp: new Date(),
            sheets: sheets,
            paperLength: paperLength,
            overlapWidth: overlapWidth,
            processSpeed: processSpeed,
            usageLength: usageLength,
            processingTime: processingTime,
            inputMode: inputMode,
            completed: false,
            initialFilmRemaining: null // Ver.2.5では別途設定
        };
    }

    // Ver.2.5: 新規フィルムセッションにジョブを追加
    addJobToNewFilmSession(jobData) {
        // 現在のフィルムセッションを完了
        if (this.currentFilmSession && this.currentFilmSession.jobs.length > 0) {
            this.currentFilmSession.status = 'completed';
            this.currentFilmSession.endTime = new Date();
        }

        // 新しいフィルムセッション作成
        this.currentFilmSession = this.createNewFilmSession();
        this.filmSessions.push(this.currentFilmSession);

        // ジョブを追加してセッション固有の残量を更新
        this.currentFilmSession.jobs.push(jobData);
        this.currentFilmSession.filmRemaining = Math.max(0, this.currentFilmSession.filmRemaining - jobData.usageLength);
        this.currentFilmSession.filmUsed += jobData.usageLength;

        // フィルム交換時間を追加
        this.extraTime += this.timeSettings.diffFilmChange;

        this.saveData();
        console.log('Job added to new film session:', jobData);
    }

    // Ver.2.5: 既存フィルムセッションにジョブを追加
    addJobToExistingSession(sessionId, jobData) {
        const session = this.filmSessions.find(s => s.id === sessionId);
        if (!session) {
            console.error('Session not found:', sessionId);
            throw new Error('指定されたフィルムセッションが見つかりません');
        }

        // ジョブを追加してセッション固有の残量を更新
        session.jobs.push(jobData);
        session.filmRemaining = Math.max(0, session.filmRemaining - jobData.usageLength);
        session.filmUsed += jobData.usageLength;

        this.saveData();
        console.log('Job added to existing session:', { sessionId, jobData });
    }

    // Ver.2.5: フィルム不足状況を判定
    getFilmShortageStatus(session) {
        // Ver.2.6: 正しい計算式を使用 - 残り(m) = 容量(m) - 使用(m)
        const totalUsed = session.jobs.reduce((total, job) => total + (job.sheets * job.usageLength), 0);
        const actualRemaining = session.filmCapacity - totalUsed;
        const remainingRatio = actualRemaining / session.filmCapacity;
        const absoluteRemaining = actualRemaining;

        // 不足判定基準
        if (absoluteRemaining <= 0) {
            return {
                isShortage: true,
                message: 'フィルム切れ',
                cssClass: 'film-empty',
                level: 'critical'
            };
        } else if (remainingRatio <= 0.1 || absoluteRemaining <= 2) {
            return {
                isShortage: true,
                message: '残量わずか',
                cssClass: 'film-critical',
                level: 'critical'
            };
        } else if (remainingRatio <= 0.2 || absoluteRemaining <= 5) {
            return {
                isShortage: true,
                message: '残量少',
                cssClass: 'film-low',
                level: 'warning'
            };
        }

        return {
            isShortage: false,
            message: '',
            cssClass: '',
            level: 'normal'
        };
    }

    // Ver.2.5: フィルム初期残量設定UIの表示
    showFilmCapacityInputUI(sessionId) {
        const session = this.filmSessions.find(s => s.id === sessionId);
        if (!session) return;

        const capacity = prompt(
            'フィルム初期容量 (m) を設定してください:',
            session.filmCapacity.toString()
        );

        if (capacity && !isNaN(capacity) && parseFloat(capacity) > 0) {
            const newCapacity = parseFloat(capacity);
            const currentUsed = session.filmUsed;
            
            // 容量を更新し、残量を再計算
            session.filmCapacity = newCapacity;
            session.filmRemaining = Math.max(0, newCapacity - currentUsed);
            
            this.saveData();
            this.renderJobList();
            this.showToast(`フィルム容量を ${newCapacity}m に設定しました`, 'success');
        }
    }

    // データバックアップ機能
    backupData() {
        try {
            const data = localStorage.getItem('laminator_dashboard_v3');
            if (!data) {
                this.showToast('バックアップするデータがありません', 'warning');
                return;
            }

            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const today = new Date();
            const dateStr = today.getFullYear() + '-' + 
                String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                String(today.getDate()).padStart(2, '0');
            
            const filename = `lami-ope-backup-${dateStr}.json`;
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('バックアップファイルをダウンロードしました', 'success');
        } catch (error) {
            console.error('バックアップエラー:', error);
            this.showToast('バックアップに失敗しました', 'error');
        }
    }

    // 復元ファイル選択をトリガー
    triggerRestore() {
        const fileInput = document.getElementById('restore-file-input');
        fileInput.click();
    }

    // データ復元機能
    restoreData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                JSON.parse(data); // 有効なJSONかチェック
                
                localStorage.setItem('laminator_dashboard_v3', data);
                
                this.showToast('復元が完了しました。ページを更新します。', 'success');
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } catch (error) {
                console.error('復元エラー:', error);
                this.showToast('無効なバックアップファイルです', 'error');
            }
        };
        
        reader.readAsText(file);
        
        // ファイル選択をリセット（同じファイルでも再選択可能にする）
        event.target.value = '';
    }
}

// アプリケーション初期化
let dashboard;

document.addEventListener('DOMContentLoaded', () => {
    dashboard = new LaminatorDashboard();
    
    // ヘッダーボタンのイベントリスナー設定（Ver.2.5 バグ修正）
    const logTrigger = document.getElementById('log-page-trigger-icon');
    if (logTrigger) {
        logTrigger.addEventListener('click', showLogPage);
        console.log('Log page trigger event listener added');
    }
    
    // 設定ボタンのクリックイベントも念のため直接設定
    const settingsBtn = document.querySelector('.header-btn');
    if (settingsBtn && dashboard) {
        settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            dashboard.showSettings();
        });
        console.log('Settings button event listener added');
    }
    
    // PWA対応
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
});