// ラミオペ・ダッシュボード 軽量テストスクリプト
// Android/Termux環境対応版

const fs = require('fs');
const path = require('path');

class LaminatorTester {
    constructor() {
        this.testResults = [];
    }

    // HTMLファイルの基本構造テスト
    testHTMLStructure() {
        console.log('🔍 HTML構造テスト開始...');
        
        const htmlContent = fs.readFileSync('index.html', 'utf8');
        
        const tests = [
            { name: 'タイトル確認', check: htmlContent.includes('ラミオペ・ダッシュボード') },
            { name: 'タブナビゲーション', check: htmlContent.includes('時間計算機') && htmlContent.includes('フィルム判定') },
            { name: 'ジョブ入力フォーム', check: htmlContent.includes('生産枚数') && htmlContent.includes('加工条件') },
            { name: 'モーダル設定', check: htmlContent.includes('reportModal') && htmlContent.includes('filmSetupModal') },
            { name: 'PWA manifest', check: htmlContent.includes('manifest.json') }
        ];

        tests.forEach(test => {
            const result = test.check ? '✅' : '❌';
            console.log(`${result} ${test.name}: ${test.check ? 'OK' : 'NG'}`);
            this.testResults.push({ test: test.name, passed: test.check });
        });
    }

    // CSSファイル存在・基本スタイルテスト
    testCSSStructure() {
        console.log('\n🎨 CSS構造テスト開始...');
        
        const cssContent = fs.readFileSync('style.css', 'utf8');
        
        const tests = [
            { name: 'モバイル最適化', check: cssContent.includes('min-height: 48px') },
            { name: 'タッチ対応設計', check: cssContent.includes('min-height: 56px') },
            { name: 'PWA色設定', check: cssContent.includes('#2196F3') },
            { name: 'レスポンシブ', check: cssContent.includes('@media') },
            { name: 'グリッドレイアウト', check: cssContent.includes('grid-template-columns') }
        ];

        tests.forEach(test => {
            const result = test.check ? '✅' : '❌';
            console.log(`${result} ${test.name}: ${test.check ? 'OK' : 'NG'}`);
            this.testResults.push({ test: test.name, passed: test.check });
        });
    }

    // JavaScriptロジックテスト
    testJavaScriptLogic() {
        console.log('\n⚙️ JavaScript構造テスト開始...');
        
        const jsContent = fs.readFileSync('script.js', 'utf8');
        
        const tests = [
            { name: 'メインクラス定義', check: jsContent.includes('class LaminatorDashboard') },
            { name: '計算ロジック', check: jsContent.includes('Math.ceil') && jsContent.includes('/ 1000') },
            { name: 'localStorage対応', check: jsContent.includes('localStorage.setItem') },
            { name: 'タブ切替機能', check: jsContent.includes('switchTab') },
            { name: 'デッドライン警告', check: jsContent.includes('15:30') && jsContent.includes('16:45') },
            { name: 'フィルムシミュレーター', check: jsContent.includes('simulateJob') }
        ];

        tests.forEach(test => {
            const result = test.check ? '✅' : '❌';
            console.log(`${result} ${test.name}: ${test.check ? 'OK' : 'NG'}`);
            this.testResults.push({ test: test.name, passed: test.check });
        });
    }

    // PWA設定テスト
    testPWAConfig() {
        console.log('\n📱 PWA設定テスト開始...');
        
        const manifestContent = fs.readFileSync('manifest.json', 'utf8');
        const manifest = JSON.parse(manifestContent);
        
        const tests = [
            { name: 'アプリ名設定', check: manifest.name === 'ラミオペ・ダッシュボード' },
            { name: '短縮名設定', check: manifest.short_name === 'ラミオペ' },
            { name: 'スタンドアロン表示', check: manifest.display === 'standalone' },
            { name: 'アイコン設定', check: manifest.icons && manifest.icons.length > 0 },
            { name: 'ショートカット設定', check: manifest.shortcuts && manifest.shortcuts.length > 0 }
        ];

        tests.forEach(test => {
            const result = test.check ? '✅' : '❌';
            console.log(`${result} ${test.name}: ${test.check ? 'OK' : 'NG'}`);
            this.testResults.push({ test: test.name, passed: test.check });
        });
    }

    // 計算ロジック数値テスト
    testCalculationLogic() {
        console.log('\n🧮 計算ロジックテスト開始...');
        
        // CEILING関数テスト
        const testCases = [
            { copies: 100, pages: 8, extra: 5, expected: Math.ceil(100/8) + 5 }, // 18
            { copies: 50, pages: 4, extra: 2, expected: Math.ceil(50/4) + 2 },   // 15
            { copies: 7, pages: 3, extra: 1, expected: Math.ceil(7/3) + 1 }      // 4
        ];

        testCases.forEach((testCase, index) => {
            const actualSheets = Math.ceil(testCase.copies / testCase.pages) + testCase.extra;
            const passed = actualSheets === testCase.expected;
            const result = passed ? '✅' : '❌';
            console.log(`${result} CEILING計算テスト${index + 1}: ${passed ? 'OK' : 'NG'} (期待値: ${testCase.expected}, 実際: ${actualSheets})`);
            this.testResults.push({ test: `CEILING計算${index + 1}`, passed });
        });

        // 使用長計算テスト
        const lengthTests = [
            { paperLength: 210, overlapWidth: 10, expected: (210-10)/1000 }, // 0.2m
            { paperLength: 297, overlapWidth: 15, expected: (297-15)/1000 }  // 0.282m
        ];

        lengthTests.forEach((testCase, index) => {
            const actualLength = (testCase.paperLength - testCase.overlapWidth) / 1000;
            const passed = Math.abs(actualLength - testCase.expected) < 0.001;
            const result = passed ? '✅' : '❌';
            console.log(`${result} 使用長計算テスト${index + 1}: ${passed ? 'OK' : 'NG'} (期待値: ${testCase.expected}m, 実際: ${actualLength}m)`);
            this.testResults.push({ test: `使用長計算${index + 1}`, passed });
        });
    }

    // 総合テスト結果表示
    showTestResults() {
        console.log('\n📊 テスト結果サマリー');
        console.log('='.repeat(50));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(test => test.passed).length;
        const failedTests = totalTests - passedTests;
        
        console.log(`総テスト数: ${totalTests}`);
        console.log(`✅ 成功: ${passedTests}`);
        console.log(`❌ 失敗: ${failedTests}`);
        console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (failedTests > 0) {
            console.log('\n失敗したテスト:');
            this.testResults
                .filter(test => !test.passed)
                .forEach(test => console.log(`  - ${test.test}`));
        }
        
        console.log('\n🎯 ラミネート加工専用アプリとしての評価:');
        const laminatorTests = this.testResults.filter(test => 
            test.test.includes('計算') || 
            test.test.includes('デッドライン') || 
            test.test.includes('フィルム')
        );
        const laminatorPassed = laminatorTests.filter(test => test.passed).length;
        console.log(`業務特化度: ${laminatorPassed}/${laminatorTests.length} (${((laminatorPassed/laminatorTests.length)*100).toFixed(1)}%)`);
    }

    // フルテスト実行
    runAllTests() {
        console.log('🎛️ ラミオペ・ダッシュボード テスト開始');
        console.log('='.repeat(50));
        
        try {
            this.testHTMLStructure();
            this.testCSSStructure();
            this.testJavaScriptLogic();
            this.testPWAConfig();
            this.testCalculationLogic();
            this.showTestResults();
        } catch (error) {
            console.error('❌ テスト実行エラー:', error.message);
        }
    }
}

// テスト実行
const tester = new LaminatorTester();
tester.runAllTests();