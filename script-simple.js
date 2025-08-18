// ===== Ver.7 Simplified Data Storage System =====
// localStorage-first approach with minimal Capacitor dependency
// Based on RecipeBox proven methodology

class SimpleLaminatorDashboard {
    constructor() {
        // Core data structures
        this.filmRolls = [];
        this.currentFilmRoll = null;
        this.filmSessions = [];
        this.jobs = [];
        this.settings = {
            defaultProcessingTimePerSheet: 2,
            workdayStartTime: '09:00',
            workdayEndTime: '18:00',
            autoSave: true,
            theme: 'light'
        };
        
        // Initialize data loading
        this.loadData();
        
        // Auto-save every 30 seconds if enabled
        if (this.settings.autoSave) {
            setInterval(() => this.saveData(), 30000);
        }
    }
    
    // ===== Simple Data Storage (localStorage-first) =====
    
    saveData() {
        try {
            const data = {
                filmRolls: this.filmRolls,
                currentFilmRoll: this.currentFilmRoll,
                filmSessions: this.filmSessions,
                jobs: this.jobs,
                settings: this.settings,
                lastSaved: new Date().toISOString()
            };
            
            localStorage.setItem('laminatorData', JSON.stringify(data));
            console.log('✅ Data saved successfully');
            this.showToast('データを保存しました', 'success');
            return true;
        } catch (error) {
            console.error('❌ Save error:', error);
            this.showToast('保存エラーが発生しました', 'error');
            return false;
        }
    }
    
    loadData() {
        try {
            const saved = localStorage.getItem('laminatorData');
            if (saved) {
                const data = JSON.parse(saved);
                
                this.filmRolls = data.filmRolls || [];
                this.currentFilmRoll = data.currentFilmRoll || null;
                this.filmSessions = data.filmSessions || [];
                this.jobs = data.jobs || [];
                this.settings = { ...this.settings, ...data.settings };
                
                console.log('✅ Data loaded successfully');
                console.log(`Last saved: ${data.lastSaved}`);
                this.showToast('データを読み込みました', 'success');
            } else {
                console.log('🔧 No saved data found, using defaults');
                this.initializeDefaultData();
            }
        } catch (error) {
            console.error('❌ Load error:', error);
            this.showToast('読み込みエラー - デフォルト設定を使用', 'warning');
            this.initializeDefaultData();
        }
    }
    
    initializeDefaultData() {
        // Create default film roll if none exists
        if (this.filmRolls.length === 0) {
            this.addFilmRoll('デフォルトフィルム', 100, '330mm');
        }
    }
    
    // ===== Backup & Restore (Simple File Download) =====
    
    exportBackup() {
        try {
            const data = {
                filmRolls: this.filmRolls,
                currentFilmRoll: this.currentFilmRoll,
                filmSessions: this.filmSessions,
                jobs: this.jobs,
                settings: this.settings,
                exportDate: new Date().toISOString(),
                version: '7.0'
            };
            
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `laminator-backup-${timestamp}.json`;
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            
            // Termux-compatible download process
            setTimeout(() => {
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
            }, 100);
            
            this.showToast(`バックアップ完了: ${filename}`, 'success');
            console.log('✅ Backup exported successfully');
        } catch (error) {
            console.error('❌ Export error:', error);
            this.showToast('バックアップエラーが発生しました', 'error');
        }
    }
    
    importBackup(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate data structure
                if (data.filmRolls && data.settings) {
                    this.filmRolls = data.filmRolls;
                    this.currentFilmRoll = data.currentFilmRoll;
                    this.filmSessions = data.filmSessions || [];
                    this.jobs = data.jobs || [];
                    this.settings = { ...this.settings, ...data.settings };
                    
                    this.saveData();
                    this.updateUI();
                    this.showToast('バックアップを復元しました', 'success');
                    console.log('✅ Backup imported successfully');
                } else {
                    throw new Error('Invalid backup file format');
                }
            } catch (error) {
                console.error('❌ Import error:', error);
                this.showToast('無効なバックアップファイルです', 'error');
            }
        };
        reader.readAsText(file);
    }
    
    // ===== Film Roll Management =====
    
    addFilmRoll(name, remainingMeters, width) {
        const filmRoll = {
            id: Date.now().toString(),
            name: name,
            remainingMeters: parseFloat(remainingMeters),
            originalMeters: parseFloat(remainingMeters),
            width: width,
            addedDate: new Date().toISOString(),
            isActive: true
        };
        
        this.filmRolls.push(filmRoll);
        
        // Set as current if it's the first active roll
        if (!this.currentFilmRoll) {
            this.currentFilmRoll = filmRoll;
        }
        
        this.saveData();
        this.updateUI();
        this.showToast(`フィルムロール「${name}」を追加しました`, 'success');
    }
    
    selectFilmRoll(filmRollId) {
        const filmRoll = this.filmRolls.find(roll => roll.id === filmRollId);
        if (filmRoll && filmRoll.isActive) {
            this.currentFilmRoll = filmRoll;
            this.saveData();
            this.updateUI();
            this.showToast(`フィルムロール「${filmRoll.name}」を選択しました`, 'info');
        }
    }
    
    // ===== Job Management =====
    
    addJob(name, sheets, size, priority = 'normal') {
        if (!this.currentFilmRoll) {
            this.showToast('フィルムロールを選択してください', 'warning');
            return false;
        }
        
        // Calculate film usage based on size
        const dimensions = this.getPaperDimensions(size);
        const maxDimension = Math.max(dimensions.width, dimensions.height);
        const filmUsagePerSheet = (maxDimension + 10) / 1000; // Add 10mm margin, convert to meters
        const totalFilmUsage = filmUsagePerSheet * sheets;
        
        // Check if enough film available
        if (totalFilmUsage > this.currentFilmRoll.remainingMeters) {
            this.showToast('フィルムが不足しています', 'error');
            return false;
        }
        
        const job = {
            id: Date.now().toString(),
            name: name,
            sheets: parseInt(sheets),
            size: size,
            priority: priority,
            filmUsagePerSheet: filmUsagePerSheet,
            totalFilmUsage: totalFilmUsage,
            processingTime: this.calculateProcessingTime(sheets),
            addedAt: new Date().toISOString(),
            completed: false,
            completedAt: null,
            filmRollId: this.currentFilmRoll.id
        };
        
        this.jobs.push(job);
        this.saveData();
        this.updateUI();
        this.showToast(`ジョブ「${name}」を追加しました`, 'success');
        return true;
    }
    
    completeJob(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (job && !job.completed) {
            job.completed = true;
            job.completedAt = new Date().toISOString();
            
            // Reduce film roll
            if (this.currentFilmRoll && this.currentFilmRoll.id === job.filmRollId) {
                this.currentFilmRoll.remainingMeters -= job.totalFilmUsage;
                this.currentFilmRoll.remainingMeters = Math.max(0, this.currentFilmRoll.remainingMeters);
            }
            
            this.saveData();
            this.updateUI();
            this.showToast(`ジョブ「${job.name}」が完了しました`, 'success');
        }
    }
    
    // ===== Utility Functions =====
    
    getPaperDimensions(size) {
        const dimensions = {
            'A4': { width: 210, height: 297 },
            'A3': { width: 297, height: 420 },
            'B4': { width: 257, height: 364 },
            'B5': { width: 182, height: 257 },
            'Letter': { width: 216, height: 279 },
            'Legal': { width: 216, height: 356 }
        };
        return dimensions[size] || { width: 210, height: 297 }; // Default to A4
    }
    
    calculateProcessingTime(sheets) {
        return sheets * this.settings.defaultProcessingTimePerSheet; // minutes
    }
    
    showToast(message, type = 'info') {
        // Simple toast notification system
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            z-index: 10000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 3000);
    }
    
    updateUI() {
        // Update all UI elements
        this.updateFilmRollSelector();
        this.updateJobList();
        this.updateStats();
        this.updateCurrentFilmRollDisplay();
    }
    
    updateFilmRollSelector() {
        const selector = document.getElementById('film-roll-selector');
        if (selector) {
            selector.innerHTML = '<option value="">フィルムロールを選択</option>';
            this.filmRolls.filter(roll => roll.isActive).forEach(roll => {
                const option = document.createElement('option');
                option.value = roll.id;
                option.textContent = `${roll.name} (${roll.remainingMeters.toFixed(1)}m)`;
                option.selected = this.currentFilmRoll && this.currentFilmRoll.id === roll.id;
                selector.appendChild(option);
            });
        }
    }
    
    updateJobList() {
        const container = document.getElementById('jobs-container');
        if (container) {
            const pendingJobs = this.jobs.filter(job => !job.completed);
            container.innerHTML = pendingJobs.map(job => `
                <div class="job-item priority-${job.priority}">
                    <div class="job-header">
                        <h4>${job.name}</h4>
                        <span class="priority-badge priority-${job.priority}">${this.getPriorityLabel(job.priority)}</span>
                    </div>
                    <div class="job-details">
                        <p>📄 ${job.sheets}枚 (${job.size}) | 🎞️ ${job.totalFilmUsage.toFixed(2)}m | ⏱️ ${job.processingTime}分</p>
                    </div>
                    <button onclick="dashboard.completeJob('${job.id}')" class="btn-complete">完了</button>
                </div>
            `).join('');
        }
    }
    
    updateStats() {
        const pendingJobs = this.jobs.filter(job => !job.completed);
        const totalSheets = pendingJobs.reduce((sum, job) => sum + job.sheets, 0);
        const totalTime = pendingJobs.reduce((sum, job) => sum + job.processingTime, 0);
        const totalFilmUsage = pendingJobs.reduce((sum, job) => sum + job.totalFilmUsage, 0);
        
        document.getElementById('total-jobs').textContent = pendingJobs.length;
        document.getElementById('total-sheets').textContent = totalSheets;
        document.getElementById('total-time').textContent = totalTime;
        document.getElementById('total-film-usage').textContent = totalFilmUsage.toFixed(2);
    }
    
    updateCurrentFilmRollDisplay() {
        const display = document.getElementById('current-film-roll');
        if (display && this.currentFilmRoll) {
            const usagePercent = ((this.currentFilmRoll.originalMeters - this.currentFilmRoll.remainingMeters) / this.currentFilmRoll.originalMeters * 100);
            display.innerHTML = `
                <strong>${this.currentFilmRoll.name}</strong><br>
                残り: ${this.currentFilmRoll.remainingMeters.toFixed(1)}m / ${this.currentFilmRoll.originalMeters}m<br>
                使用率: ${usagePercent.toFixed(1)}%
            `;
        }
    }
    
    getPriorityLabel(priority) {
        const labels = {
            'low': '通常',
            'normal': '標準',
            'high': '高',
            'urgent': '緊急'
        };
        return labels[priority] || '標準';
    }
}

// ===== Initialize Dashboard =====
let dashboard;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Starting Ver.7 Simplified Laminator Dashboard...');
    dashboard = new SimpleLaminatorDashboard();
    
    // Make dashboard globally accessible for HTML onclick events
    window.dashboard = dashboard;
    
    console.log('✅ Dashboard initialized successfully');
});

// ===== Export for testing =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleLaminatorDashboard;
}