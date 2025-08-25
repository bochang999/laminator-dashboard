// 最小限のテスト用JavaScript
console.log('🔍 テストスクリプト開始');

// 基本的なテスト
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM読み込み完了');
    
    // 簡単なボタンテスト
    const testButton = document.createElement('button');
    testButton.textContent = 'テストボタン';
    testButton.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; background: red; color: white; padding: 10px;';
    testButton.onclick = () => {
        alert('ボタンが動作しました！');
        console.log('✅ ボタンクリック成功');
    };
    
    document.body.appendChild(testButton);
    console.log('✅ テストボタン追加完了');
});

console.log('📝 テストスクリプト読み込み完了');