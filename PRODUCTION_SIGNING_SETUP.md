# 🔐 Laminator Dashboard - Production APK Signing Setup

## ステップA: プロダクション用キーストア生成

### A-1. キーストア生成コマンド
```bash
# Termux環境でキーストア生成
cd /data/data/com.termux/files/home/laminator-dashboard

# プロダクション用キーストア作成
keytool -genkey -v -keystore laminator-release.keystore \
  -alias laminator-key \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Laminator Dashboard,OU=Production,O=BochangDev,L=Tokyo,ST=Tokyo,C=JP" \
  -storepass laminator2025 -keypass laminator2025

echo "✅ キーストア生成完了: laminator-release.keystore"
```

### A-2. Base64エンコード
```bash
# GitHub Secrets用にBase64エンコード
base64 laminator-release.keystore > laminator-keystore-base64.txt

echo "🔑 以下をGitHub Secretsにコピーしてください:"
echo "===========================================" 
cat laminator-keystore-base64.txt
echo "==========================================="
echo ""
echo "⚠️ 重要: このBase64文字列をGitHub Secretsに保存してください"
```

## ステップB: GitHub Secrets設定

### B-1. GitHub Secretsに以下を追加:

1. **リポジトリ設定** → **Secrets and variables** → **Actions** → **New repository secret**

2. **設定する4つのSecret:**

| Secret名 | 値 |
|----------|-----|
| `KEYSTORE_BASE64` | laminator-keystore-base64.txtの内容全体 |
| `KEYSTORE_PASSWORD` | `laminator2025` |
| `KEY_ALIAS` | `laminator-key` |
| `KEY_PASSWORD` | `laminator2025` |

### B-2. セキュリティ確認
```bash
# ローカルファイルの安全な削除
rm laminator-keystore-base64.txt
echo "🗑️ 一時ファイル削除完了"

# キーストアファイルのバックアップ推奨
cp laminator-release.keystore laminator-release.keystore.backup
echo "💾 キーストアバックアップ作成完了"
```

## ステップC: CI/CD動作確認

### C-1. プロダクション署名テスト
```bash
# ワークフロー更新をコミット&プッシュ
git add .github/workflows/build-apk.yml
git commit -m "🔐 Implement production APK signing system

- Add keystore-based signing support
- Enable seamless app updates  
- Production-ready deployment
- Complete signature consistency"

git push
```

### C-2. ビルド結果確認

GitHub Actionsで以下を確認:
- ✅ `🔑 Setting up production keystore for signed release...`
- ✅ `🔐 Applying production signature to APK...`
- ✅ `✅ Found signed APK: app-release.apk`
- ✅ APKファイル名: `LaminatorDashboard-v2.16-signed-production.apk`

## 期待される効果

### 🎯 署名システムの完全実装
- **プロダクション署名**: 一貫したキーストアによる本格署名
- **シームレス更新**: アプリを削除せずに上書き更新可能
- **プロフェッショナル品質**: ストア配布レベルの署名品質

### 🔄 継続的な利点
- **永続的解決**: 今後のすべてのリリースで署名問題なし
- **ユーザビリティ**: インストール時の摩擦を完全排除
- **開発効率**: 署名を意識せずに開発に集中可能

---

## 🚀 次回リリース時

設定完了後は、通常のgit pushだけで自動的に:
1. Capacitorビルド実行
2. プロダクション署名適用  
3. 署名済みAPKの自動リリース
4. ユーザーは削除不要で直接更新

**これで、Laminator DashboardのAPK署名問題は完全解決です！**