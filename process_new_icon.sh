#!/bin/bash

echo "🎨 新しいアイコン処理スクリプト"
echo "================================"

# 新しいアイコンファイルの確認
if [ -f "new_icon.png" ]; then
    echo "📂 new_icon.png を確認しました"
    
    # ファイルサイズ確認
    size=$(stat -c%s "new_icon.png")
    echo "📏 ファイルサイズ: ${size} bytes"
    
    # 画像ファイル形式確認
    file_type=$(file new_icon.png)
    echo "📋 ファイル形式: $file_type"
    
    # 背景透過処理実行
    echo "🎯 背景透過処理を開始..."
    python simple_bg_removal.py
    
    if [ $? -eq 0 ]; then
        echo "✅ 背景透過処理完了"
        
        # 結果確認
        echo "📁 生成されたファイル:"
        ls -la icon_transparent.png icons/icon-*.png 2>/dev/null
        
        echo "🎉 アイコン処理が完了しました！"
    else
        echo "❌ 背景透過処理でエラーが発生しました"
    fi
else
    echo "❌ new_icon.png が見つかりません"
    echo "📋 手順:"
    echo "1. 送信された画像をダウンロード"
    echo "2. 'new_icon.png' として保存"
    echo "3. このスクリプトを再実行"
fi