#!/usr/bin/env python3
"""
シンプルな背景透過処理（Pillowのみ使用）
"""

from PIL import Image
import os

def remove_black_background_simple(input_path, output_path):
    """
    黒い背景を透過処理（Pillowのみ使用）
    """
    try:
        print(f"📂 入力ファイル: {input_path}")
        
        # 画像を開く
        image = Image.open(input_path)
        print(f"📏 元画像サイズ: {image.size}")
        print(f"🎨 元画像モード: {image.mode}")
        
        # RGBAモードに変換
        if image.mode != 'RGBA':
            image = image.convert('RGBA')
            print("🔄 RGBA モードに変換しました")
        
        # ピクセルデータを取得
        pixdata = image.load()
        
        width, height = image.size
        threshold = 50  # 黒判定の閾値
        
        print("🎯 黒い背景を透過処理中...")
        
        # 各ピクセルをチェック
        transparent_count = 0
        for y in range(height):
            for x in range(width):
                r, g, b, a = pixdata[x, y]
                
                # 黒っぽいピクセルを透明に
                if r <= threshold and g <= threshold and b <= threshold:
                    pixdata[x, y] = (r, g, b, 0)  # アルファを0（透明）に
                    transparent_count += 1
        
        print(f"✨ {transparent_count} ピクセルを透明化しました")
        
        # PNG形式で保存
        image.save(output_path, 'PNG')
        print(f"💾 保存完了: {output_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ エラー: {str(e)}")
        return False

def create_icon_sizes(base_path, icon_dir):
    """
    各種アイコンサイズを生成
    """
    sizes = [512, 192, 152, 144, 128, 96, 72]
    
    try:
        base_image = Image.open(base_path)
        
        if not os.path.exists(icon_dir):
            os.makedirs(icon_dir)
            
        for size in sizes:
            resized = base_image.resize((size, size), Image.Resampling.LANCZOS)
            output_path = os.path.join(icon_dir, f"icon-{size}x{size}.png")
            resized.save(output_path, 'PNG')
            print(f"📱 アイコン生成: icon-{size}x{size}.png")
            
        return True
        
    except Exception as e:
        print(f"❌ アイコン生成エラー: {str(e)}")
        return False

if __name__ == "__main__":
    print("🎨 ラミオペ・ダッシュボード - アイコン背景透過処理")
    print("=" * 60)
    
    # ファイルを確認
    possible_files = [
        "uploaded_icon.png", "new_icon.png", "icon.png", 
        "app_icon.png", "laminator_icon.png"
    ]
    
    input_file = None
    for filename in possible_files:
        if os.path.exists(filename):
            input_file = filename
            break
    
    if not input_file:
        print("📋 手動で画像ファイルを保存してください:")
        print("1. 画像をダウンロード")
        print("2. 'new_icon.png' という名前で保存")
        print("3. このスクリプトを再実行")
        exit(1)
    
    # 透過処理実行
    output_file = "icon_transparent.png"
    
    if remove_black_background_simple(input_file, output_file):
        print("\n🎯 アイコンサイズバリエーション生成中...")
        
        if create_icon_sizes(output_file, "icons"):
            print("\n🎉 すべての処理が完了しました！")
            print(f"📄 透過アイコン: {output_file}")
            print("📁 サイズバリエーション: icons/ フォルダ")
            
            # 既存アイコンファイルを更新
            try:
                main_icon = Image.open(output_file)
                main_icon.save("icon-192.png", 'PNG')
                main_icon.save("icon-512.png", 'PNG')
                print("✅ メインアイコンファイルを更新しました")
            except:
                print("ℹ️  メインアイコンファイルの更新をスキップしました")
        else:
            print("⚠️  アイコンサイズ生成で問題が発生しました")
    else:
        print("❌ 背景透過処理に失敗しました")