// 最小限のアプリ機能 Ver.6.3
console.log('🚀 最小限アプリ機能開始');

// シンプルなダッシュボードクラス
class SimpleDashboard {
    constructor() {
        console.log('📊 SimpleDashboard初期化');
        this.workStarted = false;
        this.jobs = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        console.log('🔗 イベントリスナー設定');
        
        // 設定ボタン
        const settingsBtn = document.querySelector('.header-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('⚙️ 設定ボタンクリック');
                alert('設定ボタンが動作しました！');
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
    }

    startWork() {
        console.log('✅ 業務開始処理');
        this.workStarted = true;
        const startTimeElement = document.getElementById('workStartTime');
        if (startTimeElement) {
            const now = new Date();
            const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                           now.getMinutes().toString().padStart(2, '0');
            startTimeElement.textContent = timeStr;
        }
        alert('業務を開始しました！');
    }

    addLunchBreak() {
        console.log('✅ 昼休み追加処理');
        alert('昼休み時間を追加しました！');
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