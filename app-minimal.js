// 完全機能版アプリ Ver.6.5
console.log('🚀 完全機能版アプリ開始');

// 拡張ダッシュボードクラス
class SimpleDashboard {
    constructor() {
        console.log('📊 SimpleDashboard初期化');
        this.workStarted = false;
        this.jobs = [];
        this.settings = {
            workStart: '08:30',
            workEnd: '17:00',
            overtimeEnd: '18:00',
            lunchBreak: 60,
            cleanupTime: 15,
            diffFilmChange: 15
        };
        this.loadSettings();
        this.setupEventListeners();
        this.startTimeUpdater();
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

        if (this.jobs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    まだジョブが登録されていません<br>
                    上記のボタンからジョブを追加してください
                </div>
            `;
        } else {
            container.innerHTML = this.jobs.map(job => `
                <div class="job-item">
                    <span class="job-type">${job.type}</span>
                    <span class="job-duration">${job.duration}分</span>
                    <span class="job-time">${job.timestamp}</span>
                </div>
            `).join('');
        }
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
                
                // 開始時刻を復元
                if (data.startTime) {
                    const startTimeElement = document.getElementById('workStartTime');
                    if (startTimeElement) {
                        startTimeElement.textContent = data.startTime;
                    }
                }
                
                // ジョブリストを表示
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
            this.calculateFinishTime();
            this.saveData();
            this.showToast('開始時刻を更新しました', 'success');
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
        alert(message);
    }
}

// DOM読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM読み込み完了 - SimpleDashboard初期化');
    
    // グローバルに設定（HTMLから呼び出し可能）
    window.dashboard = new SimpleDashboard();
    
    console.log('🎯 SimpleDashboard準備完了');
});

console.log('📝 app-minimal.js読み込み完了');