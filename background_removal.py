#!/usr/bin/env python3
"""
背景透過処理スクリプト
黒い背景を透明に変換してPNG形式で保存
"""

from PIL import Image
import numpy as np
import sys
import os

def remove_black_background(input_path, output_path, threshold=30):
    """
    黒い背景を透過処理する
    
    Args:
        input_path: 入力画像パス
        output_path: 出力画像パス  
        threshold: 黒判定の閾値（0-255）
    """
    try:
        # 画像を開く
        image = Image.open(input_path)
        print(f"元画像サイズ: {image.size}")
        print(f"元画像モード: {image.mode}")
        
        # RGBAモードに変換
        if image.mode != 'RGBA':
            image = image.convert('RGBA')
        
        # NumPy配列に変換
        data = np.array(image)
        
        # 黒い背景の検出と透過処理
        # RGBチャンネルがすべて閾値以下の場合を黒と判定
        black_mask = (data[:,:,0] <= threshold) & (data[:,:,1] <= threshold) & (data[:,:,2] <= threshold)
        
        # アルファチャンネルを設定（黒い部分を透明に）
        data[black_mask, 3] = 0  # アルファ値を0（完全透明）に設定
        
        # 画像に戻す
        result_image = Image.fromarray(data, 'RGBA')
        
        # 保存
        result_image.save(output_path, 'PNG')
        
        print(f"✅ 背景透過処理完了: {output_path}")
        print(f"出力画像サイズ: {result_image.size}")
        
        return True
        
    except Exception as e:
        print(f"❌ エラー: {str(e)}")
        return False

def create_icon_variants(base_image_path, output_dir):
    """
    アイコン用の各種サイズを生成
    """
    sizes = [192, 512, 144, 152, 72, 96, 128, 384]
    
    try:
        base_image = Image.open(base_image_path)
        
        for size in sizes:
            # リサイズ
            resized = base_image.resize((size, size), Image.Resampling.LANCZOS)
            
            # 保存
            output_path = os.path.join(output_dir, f"icon-{size}x{size}.png")
            resized.save(output_path, 'PNG')
            print(f"✅ アイコン生成: {output_path}")
            
        return True
        
    except Exception as e:
        print(f"❌ アイコン生成エラー: {str(e)}")
        return False

if __name__ == "__main__":
    # 入力画像ファイル名（仮）
    input_file = "uploaded_icon.png"
    output_file = "icon_transparent.png"
    
    print("🎨 ラミオペ・ダッシュボード アイコン背景透過処理")
    print("=" * 50)
    
    if os.path.exists(input_file):
        # 背景透過処理
        if remove_black_background(input_file, output_file):
            print("\n📱 アイコンサイズバリエーション生成中...")
            
            # アイコンディレクトリ確認
            icon_dir = "icons"
            if not os.path.exists(icon_dir):
                os.makedirs(icon_dir)
            
            # 各種サイズのアイコン生成
            create_icon_variants(output_file, icon_dir)
            
            print("\n🎉 処理完了！")
            print(f"メインアイコン: {output_file}")
            print(f"サイズバリエーション: {icon_dir}/")
        else:
            print("❌ 背景透過処理に失敗しました")
    else:
        print(f"❌ 入力ファイルが見つかりません: {input_file}")
        print("画像ファイルを 'uploaded_icon.png' として保存してから実行してください")