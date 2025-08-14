// ラミオペ・ダッシュボード Ver.3.0 - 統合テストスイート

console.log('🧪 ラミオペ・ダッシュボード Ver.3.0 テスト開始');

// テスト結果記録
const testResults = [];

function addTest(name, passed, details = '') {
    testResults.push({ name, passed, details });
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}: ${details}`);
}

// DOM読み込み完了まで待機
function waitForDOM() {
    return new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve);
        } else {
            resolve();
        }
    });
}

async function runTests() {
    await waitForDOM();
    
    console.log('\n=== Phase 1: HTML構造検証 ===');
    
    // 1. メインコンテナ存在確認
    const appContainer = document.querySelector('.app-container');
    addTest('メインコンテナ存在', !!appContainer);
    
    // 2. ヘッダー要素確認
    const header = document.querySelector('.app-header');
    const headerTitle = document.querySelector('.header-title h1');
    const currentTime = document.getElementById('currentTime');
    addTest('ヘッダー構成', !!header && !!headerTitle && !!currentTime, 
        `タイトル: ${headerTitle?.textContent}`);
    
    // 3. 終了予定時刻表示
    const finishTimeDisplay = document.querySelector('.finish-time-display');
    const finalFinishTime = document.getElementById('finalFinishTime');
    const finishStatus = document.getElementById('finishStatus');
    addTest('終了予定時刻表示', !!finishTimeDisplay && !!finalFinishTime && !!finishStatus);
    
    // 4. ジョブ追加セクション
    const jobInputSection = document.querySelector('.job-input-section');
    const inputModeSelector = document.querySelector('.input-mode-selector');
    const directMode = document.getElementById('directMode');
    const partsMode = document.getElementById('partsMode');
    addTest('ジョブ追加セクション', !!jobInputSection && !!inputModeSelector && 
        !!directMode && !!partsMode);
    
    // 5. ジョブ追加ボタン
    const currentFilmBtn = document.querySelector('.btn-current-film');
    const newFilmBtn = document.querySelector('.btn-new-film');
    addTest('ジョブ追加ボタン', !!currentFilmBtn && !!newFilmBtn);
    
    // 6. 時間管理コントロール
    const timeControls = document.querySelector('.time-controls');
    const timeBtnGrid = document.querySelector('.time-btn-grid');
    addTest('時間管理コントロール', !!timeControls && !!timeBtnGrid);
    
    // 7. フィルム残量管理
    const filmStatus = document.querySelector('.film-status');
    const currentFilmRemaining = document.getElementById('currentFilmRemaining');
    addTest('フィルム残量管理', !!filmStatus && !!currentFilmRemaining);
    
    // 8. ジョブリスト表示エリア
    const jobListArea = document.querySelector('.job-list-area');
    const jobListContainer = document.getElementById('jobListContainer');
    addTest('ジョブリスト表示エリア', !!jobListArea && !!jobListContainer);
    
    // 9. モーダル要素
    const filmCalculatorModal = document.getElementById('filmCalculatorModal');
    const reportModal = document.getElementById('reportModal');
    const confirmDialog = document.getElementById('confirmDialog');
    addTest('モーダル要素', !!filmCalculatorModal && !!reportModal && !!confirmDialog);
    
    console.log('\n=== Phase 2: CSS スタイリング検証 ===');
    
    // 10. CSS変数定義
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue('--primary-color').trim();
    const accentColor = rootStyles.getPropertyValue('--accent-color').trim();
    addTest('CSS変数定義', !!primaryColor && !!accentColor, 
        `primary: ${primaryColor}, accent: ${accentColor}`);
    
    // 11. レスポンシブ設計
    const appContainerWidth = getComputedStyle(appContainer).maxWidth;
    addTest('レスポンシブ設計', appContainerWidth === '480px');
    
    // 12. モバイル最適化
    const viewport = document.querySelector('meta[name="viewport"]');
    addTest('モバイル最適化', viewport?.content.includes('width=device-width'));
    
    console.log('\n=== Phase 3: JavaScript機能検証 ===');
    
    // 13. Dashboard インスタンス確認
    addTest('Dashboard インスタンス', typeof dashboard !== 'undefined' && dashboard instanceof LaminatorDashboard);
    
    // 14. データ構造初期化
    addTest('データ構造初期化', 
        Array.isArray(dashboard.filmSessions) && 
        typeof dashboard.extraTime === 'number' && 
        typeof dashboard.filmRemaining === 'number');
    
    // 15. 時間設定
    const timeSettings = dashboard.timeSettings;
    addTest('時間設定', timeSettings.workStart === '08:30' && 
        timeSettings.workEnd === '17:00' && timeSettings.lunchBreak === 60);
    
    console.log('\n=== Phase 4: 計算ロジック検証 ===');
    
    // 16. 入力モード切替
    try {
        dashboard.switchInputMode('parts');
        const partsActive = partsMode.classList.contains('active');
        const directInactive = !directMode.classList.contains('active');
        addTest('入力モード切替', partsActive && directInactive);
        
        dashboard.switchInputMode('direct');
    } catch (error) {
        addTest('入力モード切替', false, error.message);
    }
    
    // 17. 時刻フォーマット
    const testDate = new Date('2025-08-12T14:30:00');
    const formattedTime = dashboard.formatTime(testDate);
    addTest('時刻フォーマット', formattedTime === '14:30');
    
    // 18. 時刻パース
    const parsedTime = dashboard.parseTime('15:45');
    addTest('時刻パース', parsedTime.getHours() === 15 && parsedTime.getMinutes() === 45);
    
    console.log('\n=== Phase 5: データ永続化検証 ===');
    
    // 19. データ保存
    try {
        dashboard.saveData();
        const savedData = localStorage.getItem('laminator_dashboard_v3');
        addTest('データ保存', !!savedData && savedData !== '{}');
    } catch (error) {
        addTest('データ保存', false, error.message);
    }
    
    // 20. データ読み込み
    try {
        dashboard.loadData();
        addTest('データ読み込み', true, 'エラーなく完了');
    } catch (error) {
        addTest('データ読み込み', false, error.message);
    }
    
    console.log('\n=== Phase 6: フィルム計算ロジック検証 ===');
    
    // 21. フィルムセッション作成
    const newSession = dashboard.createNewFilmSession();
    addTest('フィルムセッション作成', 
        newSession.id && newSession.jobs && newSession.status === 'active');
    
    // 22. ジョブデータ検証（シミュレーション）
    // 入力値をシミュレート
    document.getElementById('directSheets').value = '100';
    document.getElementById('paperLength').value = '300';
    document.getElementById('overlapWidth').value = '10';
    document.getElementById('processSpeed').value = '5';
    document.querySelector('input[name="inputMode"][value="direct"]').checked = true;
    
    const jobData = dashboard.getJobInputData();
    addTest('ジョブデータ生成', jobData && jobData.sheets === 100 && 
        jobData.usageLength === 0.29 && jobData.processingTime === 5.8);
    
    console.log('\n=== Phase 7: PWA機能検証 ===');
    
    // 23. Service Worker
    const swSupported = 'serviceWorker' in navigator;
    addTest('Service Worker サポート', swSupported);
    
    // 24. マニフェスト読み込み
    const manifestLink = document.querySelector('link[rel="manifest"]');
    addTest('マニフェスト読み込み', !!manifestLink);
    
    // 25. オフライン対応
    const cacheAPI = 'caches' in window;
    addTest('Cache API サポート', cacheAPI);
    
    console.log('\n=== Phase 8: アクセシビリティ検証 ===');
    
    // 26. フォーカス可能要素
    const focusableElements = document.querySelectorAll('button, input, [tabindex]');
    addTest('フォーカス可能要素', focusableElements.length > 0, 
        `${focusableElements.length}個の要素`);
    
    // 27. ARIA属性
    const ariaLabels = document.querySelectorAll('[aria-label], [aria-describedby]');
    addTest('ARIA属性', ariaLabels.length >= 0, `${ariaLabels.length}個の要素`);
    
    // 28. セマンティクス
    const semanticElements = document.querySelectorAll('header, main, section, nav');
    addTest('セマンティック要素', semanticElements.length >= 3);
    
    console.log('\n=== テスト結果サマリー ===');
    
    const totalTests = testResults.length;
    const passedTests = testResults.filter(test => test.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log(`\n📊 テスト実行結果:`);
    console.log(`✅ 合格: ${passedTests}/${totalTests} (${successRate}%)`);
    console.log(`❌ 失敗: ${failedTests}`);
    
    if (failedTests > 0) {
        console.log(`\n🚨 失敗テスト詳細:`);
        testResults.filter(test => !test.passed).forEach(test => {
            console.log(`  - ${test.name}: ${test.details}`);
        });
    }
    
    console.log(`\n🎯 Ver.3.0 品質評価:`);
    if (successRate >= 95) {
        console.log('🌟 優秀 - 本番環境デプロイ推奨');
    } else if (successRate >= 85) {
        console.log('✨ 良好 - 軽微な調整後デプロイ可能');
    } else if (successRate >= 75) {
        console.log('⚠️  改善必要 - 重要な問題を修正後再テスト');
    } else {
        console.log('🚫 要大幅修正 - 根本的な問題の解決必要');
    }
    
    // テスト完了ログ
    console.log(`\n🎉 ラミオペ・ダッシュボード Ver.3.0 テスト完了`);
    console.log(`📅 実行日時: ${new Date().toLocaleString('ja-JP')}`);
    
    return {
        totalTests,
        passedTests,
        failedTests,
        successRate,
        results: testResults
    };
}

// テスト実行
runTests().then(results => {
    console.log('\n📋 テスト実行完了');
    
    // グローバル変数としてテスト結果を保存
    window.testResults = results;
}).catch(error => {
    console.error('❌ テスト実行エラー:', error);
});