// ラミネーター・ダッシュボード Ver.6.10 - 完全機能復旧版
console.log('🚀 Ver.6.10 ラミネーター・ダッシュボード完全機能復旧版開始');

// ラミネート作業計算ダッシュボードクラス
class LaminatorDashboard {
    constructor() {
        console.log('📊 LaminatorDashboard初期化');
        this.workStarted = false;
        this.jobs = [];
        this.filmRolls = [];
        this.currentFilmRoll = null;
        this.filmSessions = [];
        this.settings = {
            workStart: '08:30',
            workEnd: '17:00',
            overtimeEnd: '18:00',
            lunchBreak: 60,
            cleanupTime: 15,
            diffFilmChange: 15
        };
        
        // ペーパーサイズ定義 (mm)
        this.paperSizes = {
            A4: { width: 210, height: 297 },
            A3: { width: 297, height: 420 },
            B4: { width: 257, height: 364 },
            B5: { width: 182, height: 257 }
        };
        
        this.loadSettings();
        this.setupEventListeners();
        this.startTimeUpdater();
        this.initializeFilmRolls();
    }

    setupEventListeners() {
        console.log('🔗 イベントリスナー設定');
        
        // 設定ボタン
        const settingsBtn = document.querySelector('.header-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('⚙️ 設定ボタンクリック');
                this.showSettings();
            });
        }

        // 業務開始ボタン
        const workStartBtn = document.querySelector('button[onclick*="startWork"]');
        if (workStartBtn) {
            workStartBtn.onclick = () => {
                console.log('🏃 業務開始ボタンクリック');
                this.startWork();
            };
        }

        // 昼休みボタン
        const lunchBtn = document.querySelector('button[onclick*="addLunchBreak"]');
        if (lunchBtn) {
            lunchBtn.onclick = () => {
                console.log('🍽️ 昼休みボタンクリック');
                this.addLunchBreak();
            };
        }

        // 手動時間追加ボタン
        const manualTimeBtn = document.querySelector('button[onclick*="addManualTime"]');
        if (manualTimeBtn) {
            manualTimeBtn.onclick = () => {
                console.log('⏰ 手動時間追加ボタンクリック');
                this.addManualTime();
            };
        }

        // 交換時間追加ボタン
        const exchangeTimeBtn = document.querySelector('button[onclick*="addExchangeTime"]');
        if (exchangeTimeBtn) {
            exchangeTimeBtn.onclick = () => {
                console.log('🔄 交換時間追加ボタンクリック');
                this.addExchangeTime();
            };
        }

        // レポートボタン
        const reportBtn = document.querySelector('button[onclick*="showReport"]');
        if (reportBtn) {
            reportBtn.onclick = () => {
                console.log('📊 レポートボタンクリック');
                this.showReport();
            };
        }

        // 開始時刻編集
        const startTimeElement = document.getElementById('workStartTime');
        if (startTimeElement) {
            startTimeElement.onclick = () => this.editStartTime();
        }

        // 目標時刻編集
        const targetTimeElement = document.getElementById('targetEndTime');
        if (targetTimeElement) {
            targetTimeElement.onclick = () => this.editTargetTime();
        }

        // ジョブサイズ変更時のカスタムサイズ表示制御
        const jobSizeSelect = document.getElementById('jobSize');
        if (jobSizeSelect) {
            jobSizeSelect.onchange = () => this.toggleCustomSize();
        }
    }

    startWork() {
        console.log('✅ 業務開始処理');
        this.workStarted = true;
        
        const startTimeElement = document.getElementById('workStartTime');
        const finishStatusElement = document.getElementById('finishStatus');
        
        if (startTimeElement) {
            const now = new Date();
            const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                           now.getMinutes().toString().padStart(2, '0');
            startTimeElement.textContent = timeStr;
            
            // 初期の終了予定時刻を計算
            this.calculateFinishTime();
            
            if (finishStatusElement) {
                finishStatusElement.textContent = '業務進行中';
            }
        }
        
        // データ保存
        this.saveData();
        this.showToast('業務を開始しました！時間管理を開始します。', 'success');
    }

    addLunchBreak() {
        console.log('✅ 昼休み追加処理');
        this.addTime('昼休み', this.settings.lunchBreak);
        this.calculateFinishTime();
        this.showToast('昼休み時間を追加しました！', 'success');
    }

    addManualTime() {
        console.log('✅ 手動時間追加処理');
        const minutes = prompt('追加する時間を分で入力してください：', '30');
        if (minutes && !isNaN(minutes)) {
            this.addTime('手動追加', parseInt(minutes));
            this.calculateFinishTime();
            this.showToast(`${minutes}分を追加しました！`, 'success');
        }
    }

    addExchangeTime() {
        console.log('✅ 交換時間追加処理');
        this.addTime('フィルム交換', this.settings.diffFilmChange);
        this.calculateFinishTime();
        this.showToast('フィルム交換時間を追加しました！', 'success');
    }

    addTime(type, minutes) {
        const job = {
            id: Date.now(),
            type: type,
            duration: minutes,
            timestamp: new Date().toLocaleTimeString()
        };
        this.jobs.push(job);
        this.saveData();
        this.updateJobList();
    }

    // ★ ラミネート作業専用機能群 ★

    initializeFilmRolls() {
        console.log('🎞️ フィルムロール初期化');
        if (this.filmRolls.length === 0) {
            // デフォルトフィルムロール追加
            this.filmRolls = [
                {
                    id: 'roll1',
                    name: 'A4グロスフィルム',
                    type: 'gloss',
                    maxLength: 100, // メートル
                    remainingLength: 100,
                    width: 305, // mm (A4+余白)
                    isActive: true
                }
            ];
            this.currentFilmRoll = this.filmRolls[0];
        }
        this.updateFilmRollSelect();
    }

    updateFilmRollSelect() {
        const select = document.getElementById('currentFilmRoll');
        if (!select) return;

        select.innerHTML = '<option value="">フィルムロールを選択</option>';
        this.filmRolls.forEach(roll => {
            const option = document.createElement('option');
            option.value = roll.id;
            option.textContent = `${roll.name} (残り: ${roll.remainingLength}m)`;
            if (this.currentFilmRoll && this.currentFilmRoll.id === roll.id) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    selectFilmRoll() {
        const select = document.getElementById('currentFilmRoll');
        const selectedId = select.value;
        
        if (selectedId) {
            this.currentFilmRoll = this.filmRolls.find(r => r.id === selectedId);
            this.updateFilmInfo();
        } else {
            this.currentFilmRoll = null;
            this.hideFilmInfo();
        }
    }

    updateFilmInfo() {
        const filmInfo = document.getElementById('filmInfo');
        const remaining = document.getElementById('filmRemaining');
        const filmType = document.getElementById('filmType');
        
        if (this.currentFilmRoll && filmInfo) {
            remaining.textContent = `残り: ${this.currentFilmRoll.remainingLength}m`;
            filmType.textContent = `タイプ: ${this.currentFilmRoll.type}`;
            filmInfo.style.display = 'block';
        }
    }

    hideFilmInfo() {
        const filmInfo = document.getElementById('filmInfo');
        if (filmInfo) {
            filmInfo.style.display = 'none';
        }
    }

    addNewFilmRoll() {
        // フィルム種類テンプレートの選択
        const templates = {
            'A4グロス': { name: 'A4グロスフィルム', length: 100, width: 305, type: 'gloss' },
            'A3グロス': { name: 'A3グロスフィルム', length: 100, width: 450, type: 'gloss' },
            'A4マット': { name: 'A4マットフィルム', length: 100, width: 305, type: 'matt' },
            'A3マット': { name: 'A3マットフィルム', length: 100, width: 450, type: 'matt' },
            'カスタム': { name: 'カスタムフィルム', length: 100, width: 305, type: 'custom' }
        };
        
        // テンプレート選択プロンプト
        const templateChoice = prompt(
            'フィルムテンプレートを選択してください:\n' +
            '1: A4グロス (305mm幅)\n' +
            '2: A3グロス (450mm幅)\n' +
            '3: A4マット (305mm幅)\n' +
            '4: A3マット (450mm幅)\n' +
            '5: カスタム\n' +
            '番号を入力してください (1-5):',
            '1'
        );
        
        if (!templateChoice) return;
        
        let template;
        switch(templateChoice) {
            case '1': template = templates['A4グロス']; break;
            case '2': template = templates['A3グロス']; break;
            case '3': template = templates['A4マット']; break;
            case '4': template = templates['A3マット']; break;
            case '5': template = templates['カスタム']; break;
            default:
                this.showToast('無効な選択です', 'error');
                return;
        }
        
        const name = prompt('フィルムロール名を入力してください:', template.name);
        if (!name) return;

        const length = prompt('フィルム長さ（メートル）を入力してください:', template.length.toString());
        if (!length || isNaN(length)) {
            this.showToast('有効な数値を入力してください', 'error');
            return;
        }

        const width = prompt('フィルム幅（mm）を入力してください:', template.width.toString());
        if (!width || isNaN(width)) {
            this.showToast('有効な数値を入力してください', 'error');
            return;
        }

        const newRoll = {
            id: 'roll' + Date.now(),
            name: name,
            type: template.type,
            maxLength: parseFloat(length),
            remainingLength: parseFloat(length),
            width: parseFloat(width),
            isActive: true,
            createdAt: new Date().toISOString()
        };

        this.filmRolls.push(newRoll);
        this.currentFilmRoll = newRoll;
        this.updateFilmRollSelect();
        this.updateFilmInfo();
        this.saveData();
        this.showToast(`新しいフィルムロール「${name}」を追加しました`, 'success');
    }

    toggleCustomSize() {
        const jobSize = document.getElementById('jobSize').value;
        const customGroup = document.getElementById('customSizeGroup');
        
        if (customGroup) {
            customGroup.style.display = jobSize === 'custom' ? 'block' : 'none';
        }
    }

    addJob() {
        console.log('📋 ラミネートジョブ追加処理');
        
        // 入力値取得
        const jobName = document.getElementById('jobName').value.trim();
        const jobSheets = parseInt(document.getElementById('jobSheets').value);
        const jobSize = document.getElementById('jobSize').value;
        const timePerSheet = parseInt(document.getElementById('timePerSheet').value);
        const priority = document.getElementById('jobPriority').value;

        // バリデーション
        if (!jobName) {
            this.showToast('ジョブ名を入力してください', 'error');
            return;
        }
        if (!jobSheets || jobSheets < 1) {
            this.showToast('有効な枚数を入力してください', 'error');
            return;
        }
        if (!this.currentFilmRoll) {
            this.showToast('フィルムロールを選択してください', 'error');
            return;
        }

        // サイズ計算
        let paperDimensions;
        if (jobSize === 'custom') {
            const width = parseInt(document.getElementById('customWidth').value);
            const height = parseInt(document.getElementById('customHeight').value);
            if (!width || !height) {
                this.showToast('カスタムサイズを正しく入力してください', 'error');
                return;
            }
            paperDimensions = { width, height };
        } else {
            paperDimensions = this.paperSizes[jobSize];
        }

        // フィルム消費量計算（長い辺+余白）
        const maxDimension = Math.max(paperDimensions.width, paperDimensions.height);
        const filmUsagePerSheet = (maxDimension + 10) / 1000; // メートルに変換+余白
        const totalFilmUsage = filmUsagePerSheet * jobSheets;

        // フィルム残量チェック
        if (totalFilmUsage > this.currentFilmRoll.remainingLength) {
            this.showToast(`フィルムが不足しています（必要: ${totalFilmUsage.toFixed(2)}m, 残り: ${this.currentFilmRoll.remainingLength}m）`, 'error');
            return;
        }

        // ジョブオブジェクト作成
        const job = {
            id: Date.now(),
            name: jobName,
            sheets: jobSheets,
            size: jobSize,
            dimensions: paperDimensions,
            timePerSheet: timePerSheet,
            totalTime: Math.ceil(timePerSheet * jobSheets / 60), // 分に変換
            filmUsage: totalFilmUsage,
            priority: priority,
            completed: false,
            filmRollId: this.currentFilmRoll.id,
            createdAt: new Date().toISOString(),
            type: 'laminate' // ラミネートジョブとして識別
        };

        // フィルム消費量を引く
        this.currentFilmRoll.remainingLength -= totalFilmUsage;
        this.currentFilmRoll.remainingLength = Math.max(0, this.currentFilmRoll.remainingLength);

        this.jobs.push(job);
        this.clearJobForm();
        this.updateJobList();
        this.updateFilmRollSelect();
        this.updateFilmInfo();
        this.calculateFinishTime();
        this.saveData();

        this.showToast(`ジョブ「${jobName}」を追加しました（${totalFilmUsage.toFixed(2)}m使用）`, 'success');
    }

    clearJobForm() {
        document.getElementById('jobName').value = '';
        document.getElementById('jobSheets').value = '';
        document.getElementById('jobSize').value = 'A4';
        document.getElementById('timePerSheet').value = '30';
        document.getElementById('jobPriority').value = 'normal';
        document.getElementById('customWidth').value = '';
        document.getElementById('customHeight').value = '';
        this.toggleCustomSize();
    }

    // ジョブテンプレート機能
    loadJobTemplate() {
        const templates = {
            'チラシA4': { name: 'A4チラシ印刷', size: 'A4', timePerSheet: 30, priority: 'normal' },
            'ポスターA3': { name: 'A3ポスター', size: 'A3', timePerSheet: 45, priority: 'normal' },
            'メニューA4': { name: 'メニュー表', size: 'A4', timePerSheet: 35, priority: 'normal' },
            '名刺': { name: '名刺', size: 'custom', width: 91, height: 55, timePerSheet: 20, priority: 'normal' },
            '証明書A4': { name: '証明書', size: 'A4', timePerSheet: 40, priority: 'high' },
            '緊急資料': { name: '緊急資料', size: 'A4', timePerSheet: 25, priority: 'urgent' }
        };

        const templateChoice = prompt(
            'ジョブテンプレートを選択してください:\n' +
            '1: チラシA4 (30秒/枚)\n' +
            '2: ポスターA3 (45秒/枚)\n' +
            '3: メニューA4 (35秒/枚)\n' +
            '4: 名刺 (20秒/枚)\n' +
            '5: 証明書A4 (40秒/枚, 高優先度)\n' +
            '6: 緊急資料 (25秒/枚, 緊急)\n' +
            '番号を入力してください (1-6):',
            '1'
        );

        if (!templateChoice) return;

        let template;
        switch(templateChoice) {
            case '1': template = templates['チラシA4']; break;
            case '2': template = templates['ポスターA3']; break;
            case '3': template = templates['メニューA4']; break;
            case '4': template = templates['名刺']; break;
            case '5': template = templates['証明書A4']; break;
            case '6': template = templates['緊急資料']; break;
            default:
                this.showToast('無効な選択です', 'error');
                return;
        }

        // フォームに値を設定
        document.getElementById('jobName').value = template.name;
        document.getElementById('jobSize').value = template.size;
        document.getElementById('timePerSheet').value = template.timePerSheet;
        document.getElementById('jobPriority').value = template.priority;

        // カスタムサイズの場合
        if (template.size === 'custom' && template.width && template.height) {
            this.toggleCustomSize();
            document.getElementById('customWidth').value = template.width;
            document.getElementById('customHeight').value = template.height;
        }

        this.showToast(`テンプレート「${template.name}」を読み込みました`, 'success');
    }

    calculateFinishTime() {
        if (!this.workStarted) return;
        
        const startTime = document.getElementById('workStartTime').textContent;
        const targetTime = document.getElementById('targetEndTime').textContent;
        
        if (startTime && startTime !== '--:--' && targetTime) {
            // 開始時刻をDateオブジェクトに変換
            const [startHours, startMins] = startTime.split(':').map(Number);
            const startDate = new Date();
            startDate.setHours(startHours, startMins, 0, 0);
            
            // 目標時刻をDateオブジェクトに変換
            const [targetHours, targetMins] = targetTime.split(':').map(Number);
            const targetDate = new Date();
            targetDate.setHours(targetHours, targetMins, 0, 0);
            
            // 基本労働時間を計算
            const baseWorkMinutes = (targetDate - startDate) / (1000 * 60);
            
            // 追加時間（昼休み、交換時間など）を計算
            const totalAddedMinutes = this.jobs.reduce((sum, job) => sum + job.duration, 0);
            
            // 最終終了予定時刻を計算
            const finalFinishDate = new Date(targetDate);
            finalFinishDate.setMinutes(finalFinishDate.getMinutes() + totalAddedMinutes);
            
            const finishStr = finalFinishDate.getHours().toString().padStart(2, '0') + ':' + 
                             finalFinishDate.getMinutes().toString().padStart(2, '0');
            
            document.getElementById('finalFinishTime').textContent = finishStr;
            
            // ステータス更新
            const finishStatusElement = document.getElementById('finishStatus');
            if (finishStatusElement) {
                const now = new Date();
                if (finalFinishDate <= now) {
                    finishStatusElement.textContent = '終了可能';
                    finishStatusElement.style.color = '#27ae60';
                } else {
                    const remainingMinutes = Math.ceil((finalFinishDate - now) / (1000 * 60));
                    finishStatusElement.textContent = `残り${remainingMinutes}分`;
                    finishStatusElement.style.color = '#3498db';
                }
            }
        }
    }

    updateJobList() {
        const container = document.getElementById('jobListContainer');
        if (!container) return;

        // ラミネートジョブのみフィルタリング
        const laminateJobs = this.jobs.filter(job => job.type === 'laminate');

        if (laminateJobs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    まだラミネートジョブが登録されていません<br>
                    上記のフォームからジョブを追加してください
                </div>
            `;
        } else {
            container.innerHTML = laminateJobs.map(job => `
                <div class="job-item ${job.completed ? 'completed' : ''} priority-${job.priority}">
                    <div class="job-header">
                        <div class="job-name">
                            <span class="job-title">${job.name}</span>
                            <span class="job-badge">${job.size}</span>
                            ${job.priority === 'urgent' ? '<span class="priority-badge urgent">緊急</span>' : ''}
                            ${job.priority === 'high' ? '<span class="priority-badge high">高</span>' : ''}
                        </div>
                        <div class="job-actions">
                            <button class="btn-small ${job.completed ? 'btn-undo' : 'btn-complete'}" 
                                    onclick="dashboard.toggleJobCompletion(${job.id})">
                                ${job.completed ? '↶ 戻す' : '✓ 完了'}
                            </button>
                            <button class="btn-small btn-danger" onclick="dashboard.deleteJob(${job.id})">
                                🗑️
                            </button>
                        </div>
                    </div>
                    <div class="job-details">
                        <span class="job-stat">📄 ${job.sheets}枚</span>
                        <span class="job-stat">⏱️ ${job.totalTime}分</span>
                        <span class="job-stat">🎞️ ${job.filmUsage.toFixed(2)}m</span>
                        <span class="job-stat">📐 ${job.dimensions.width}×${job.dimensions.height}mm</span>
                    </div>
                    ${job.completed ? `<div class="job-completed-info">完了時刻: ${new Date(job.completedAt).toLocaleTimeString()}</div>` : ''}
                </div>
            `).join('');
        }

        // 他の時間追加ジョブも表示
        const timeJobs = this.jobs.filter(job => job.type !== 'laminate');
        if (timeJobs.length > 0) {
            const timeJobsHtml = timeJobs.map(job => `
                <div class="time-job-item">
                    <span class="job-type">${job.type}</span>
                    <span class="job-duration">${job.duration}分</span>
                    <span class="job-time">${job.timestamp}</span>
                </div>
            `).join('');
            
            container.innerHTML += `
                <div class="time-jobs-section">
                    <h5>時間調整項目</h5>
                    ${timeJobsHtml}
                </div>
            `;
        }
    }

    toggleJobCompletion(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        job.completed = !job.completed;
        if (job.completed) {
            job.completedAt = new Date().toISOString();
        } else {
            delete job.completedAt;
        }

        this.updateJobList();
        this.calculateFinishTime();
        this.saveData();
        
        const action = job.completed ? '完了' : '未完了に戻し';
        this.showToast(`ジョブ「${job.name}」を${action}ました`, 'success');
    }

    deleteJob(jobId) {
        if (!confirm('このジョブを削除しますか？')) return;

        const job = this.jobs.find(j => j.id === jobId);
        if (job && job.type === 'laminate') {
            // フィルム使用量を戻す
            const filmRoll = this.filmRolls.find(r => r.id === job.filmRollId);
            if (filmRoll) {
                filmRoll.remainingLength += job.filmUsage;
                this.updateFilmRollSelect();
                this.updateFilmInfo();
            }
        }

        this.jobs = this.jobs.filter(j => j.id !== jobId);
        this.updateJobList();
        this.calculateFinishTime();
        this.saveData();
        
        this.showToast('ジョブを削除しました', 'success');
    }

    showSettings() {
        console.log('⚙️ 設定画面表示');
        const modal = document.getElementById('settingsModal');
        if (modal) {
            // 設定値をフォームに反映
            document.getElementById('settingWorkStart').value = this.settings.workStart;
            document.getElementById('settingWorkEnd').value = this.settings.workEnd;
            document.getElementById('settingOvertimeEnd').value = this.settings.overtimeEnd;
            document.getElementById('settingLunchBreak').value = this.settings.lunchBreak;
            document.getElementById('settingCleanupTime').value = this.settings.cleanupTime;
            document.getElementById('settingDiffFilmChange').value = this.settings.diffFilmChange;
            
            modal.style.display = 'block';
            
            // 設定保存ボタン
            const saveBtn = document.querySelector('button[onclick*="saveSettings"]');
            if (saveBtn) {
                saveBtn.onclick = () => this.saveSettings();
            }
            
            // 閉じるボタン
            const closeBtn = document.querySelector('button[onclick*="hideSettings"]');
            if (closeBtn) {
                closeBtn.onclick = () => this.hideSettings();
            }
        }
    }

    hideSettings() {
        console.log('⚙️ 設定画面非表示');
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    saveSettings() {
        console.log('💾 設定保存処理');
        this.settings.workStart = document.getElementById('settingWorkStart').value;
        this.settings.workEnd = document.getElementById('settingWorkEnd').value;
        this.settings.overtimeEnd = document.getElementById('settingOvertimeEnd').value;
        this.settings.lunchBreak = parseInt(document.getElementById('settingLunchBreak').value);
        this.settings.cleanupTime = parseInt(document.getElementById('settingCleanupTime').value);
        this.settings.diffFilmChange = parseInt(document.getElementById('settingDiffFilmChange').value);
        
        this.saveData();
        this.hideSettings();
        this.showToast('設定を保存しました！', 'success');
    }

    showReport() {
        console.log('📊 レポート表示');
        const modal = document.getElementById('reportModal');
        if (modal) {
            const startTime = document.getElementById('workStartTime').textContent;
            const targetTime = document.getElementById('targetEndTime').textContent;
            
            document.getElementById('reportStartTime').textContent = startTime;
            document.getElementById('reportTargetTime').textContent = targetTime;
            
            modal.style.display = 'block';
            
            // 閉じるボタン
            const closeBtn = document.querySelector('button[onclick*="hideReport"]');
            if (closeBtn) {
                closeBtn.onclick = () => this.hideReport();
            }
        }
    }

    hideReport() {
        console.log('📊 レポート非表示');
        const modal = document.getElementById('reportModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    loadSettings() {
        console.log('📂 設定読み込み');
        try {
            const saved = localStorage.getItem('laminatorSettings');
            if (saved) {
                const data = JSON.parse(saved);
                this.settings = { ...this.settings, ...data.settings };
                this.jobs = data.jobs || [];
                this.workStarted = data.workStarted || false;
                
                // フィルムロール情報の復元
                if (data.filmRolls && data.filmRolls.length > 0) {
                    this.filmRolls = data.filmRolls;
                }
                if (data.currentFilmRoll) {
                    this.currentFilmRoll = data.currentFilmRoll;
                }
                
                // 開始時刻を復元
                if (data.startTime) {
                    const startTimeElement = document.getElementById('workStartTime');
                    if (startTimeElement) {
                        startTimeElement.textContent = data.startTime;
                    }
                }
                
                // UI更新
                this.updateFilmRollSelect();
                this.updateFilmInfo();
                this.updateJobList();
                
                // 業務開始済みの場合は終了時刻を計算
                if (this.workStarted) {
                    this.calculateFinishTime();
                }
                
                console.log('✅ 設定読み込み成功');
            }
        } catch (error) {
            console.log('⚠️ 設定読み込みエラー:', error);
        }
    }

    saveData() {
        console.log('💾 データ保存');
        try {
            const startTimeElement = document.getElementById('workStartTime');
            const data = {
                settings: this.settings,
                jobs: this.jobs,
                workStarted: this.workStarted,
                startTime: startTimeElement ? startTimeElement.textContent : '--:--',
                filmRolls: this.filmRolls,
                currentFilmRoll: this.currentFilmRoll,
                filmSessions: this.filmSessions,
                lastUpdate: new Date().toISOString()
            };
            localStorage.setItem('laminatorSettings', JSON.stringify(data));
            console.log('✅ データ保存成功');
        } catch (error) {
            console.log('⚠️ データ保存エラー:', error);
        }
    }

    editStartTime() {
        console.log('⏰ 開始時刻編集');
        const currentTime = document.getElementById('workStartTime').textContent;
        const newTime = prompt('開始時刻を入力してください (HH:MM):', currentTime !== '--:--' ? currentTime : '08:30');
        
        if (newTime && this.isValidTime(newTime)) {
            document.getElementById('workStartTime').textContent = newTime;
            // 🔧 修正: workStarted を確実に true に設定
            this.workStarted = true;
            
            // ステータス表示を更新
            const finishStatusElement = document.getElementById('finishStatus');
            if (finishStatusElement && finishStatusElement.textContent === '業務開始前') {
                finishStatusElement.textContent = '業務進行中';
            }
            
            this.calculateFinishTime();
            this.saveData();
            this.showToast(`開始時刻を${newTime}に設定しました（業務開始済み）`, 'success');
        } else if (newTime && !this.isValidTime(newTime)) {
            this.showToast('正しい時刻形式で入力してください (例: 08:30)', 'error');
        }
    }

    editTargetTime() {
        console.log('🎯 目標時刻編集');
        const currentTime = document.getElementById('targetEndTime').textContent;
        const newTime = prompt('目標終了時刻を入力してください (HH:MM):', currentTime || '17:00');
        
        if (newTime && this.isValidTime(newTime)) {
            document.getElementById('targetEndTime').textContent = newTime;
            this.calculateFinishTime();
            this.saveData();
            this.showToast('目標時刻を更新しました', 'success');
        }
    }

    isValidTime(timeStr) {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        return timeRegex.test(timeStr);
    }

    startTimeUpdater() {
        console.log('⏲️ 時間更新タイマー開始');
        
        // 現在時刻の表示更新
        setInterval(() => {
            const now = new Date();
            const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                           now.getMinutes().toString().padStart(2, '0');
            
            const currentTimeElement = document.getElementById('currentTime');
            if (currentTimeElement) {
                currentTimeElement.textContent = timeStr;
            }
            
            // 終了予定時刻の再計算（1分毎）
            if (this.workStarted) {
                this.calculateFinishTime();
            }
        }, 60000); // 1分毎

        // 初回実行
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');
        const currentTimeElement = document.getElementById('currentTime');
        if (currentTimeElement) {
            currentTimeElement.textContent = timeStr;
        }
    }

    showToast(message, type) {
        console.log(`📢 Toast: ${message} (${type})`);
        
        // シンプルなトースト表示（改善版）
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#E74C3C' : type === 'success' ? '#27AE60' : '#3498DB'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 400px;
            text-align: center;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 3秒後に自動削除
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 3000);
    }

    // バックアップ・復元機能
    backupData() {
        console.log('📤 データバックアップ開始');
        try {
            const backupData = {
                version: '6.10',
                timestamp: new Date().toISOString(),
                settings: this.settings,
                jobs: this.jobs,
                filmRolls: this.filmRolls,
                currentFilmRoll: this.currentFilmRoll,
                filmSessions: this.filmSessions,
                workStarted: this.workStarted
            };

            const dataStr = JSON.stringify(backupData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10);
            const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
            const filename = `laminator-backup-${dateStr}-${timeStr}.json`;

            const a = document.createElement('a');
            a.href = URL.createObjectURL(dataBlob);
            a.download = filename;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            setTimeout(() => {
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(a.href);
                }, 100);
            }, 100);

            this.showToast('バックアップファイルを保存しました', 'success');
        } catch (error) {
            console.error('バックアップエラー:', error);
            this.showToast('バックアップに失敗しました', 'error');
        }
    }

    triggerRestore() {
        console.log('📥 復元ファイル選択');
        const fileInput = document.getElementById('restore-file-input');
        if (fileInput) {
            fileInput.click();
        }
    }

    restoreData(event) {
        console.log('📥 データ復元開始');
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backupData = JSON.parse(e.target.result);
                
                // データ検証
                if (!backupData.version || !backupData.settings) {
                    throw new Error('無効なバックアップファイルです');
                }

                // 復元確認
                if (!confirm('現在のデータは失われます。復元を実行しますか？')) {
                    return;
                }

                // データ復元
                this.settings = backupData.settings || this.settings;
                this.jobs = backupData.jobs || [];
                this.filmRolls = backupData.filmRolls || [];
                this.currentFilmRoll = backupData.currentFilmRoll || null;
                this.filmSessions = backupData.filmSessions || [];
                this.workStarted = backupData.workStarted || false;

                // UI更新
                this.updateFilmRollSelect();
                this.updateFilmInfo();
                this.updateJobList();
                
                // データ保存
                this.saveData();
                
                this.showToast('データを復元しました', 'success');
                
                // ページリロード
                setTimeout(() => {
                    location.reload();
                }, 1000);

            } catch (error) {
                console.error('復元エラー:', error);
                this.showToast('復元に失敗しました: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
        
        // ファイル入力をリセット
        event.target.value = '';
    }

    resetSettings() {
        if (!confirm('すべての設定とデータがリセットされます。実行しますか？')) {
            return;
        }
        
        localStorage.removeItem('laminatorSettings');
        location.reload();
    }
}

// DOM読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM読み込み完了 - LaminatorDashboard初期化');
    
    // グローバルに設定（HTMLから呼び出し可能）
    window.dashboard = new LaminatorDashboard();
    
    console.log('🎯 LaminatorDashboard準備完了');
});

console.log('📝 app-minimal.js読み込み完了');