# PWA-to-APK 自動ビルド成功のレシピ (Ephemeral Capacitor方式)

## 1. 基本戦略：Ephemeral Capacitor

このビルドプロセスの核心は「Ephemeral（一時的な）Capacitor」という考え方です。

過去のビルド失敗の多くは、古い設定やファイルがCI環境に残存することで発生する「設定の競合」が原因でした。Ephemeral方式では、ワークフロー実行のたびに**まっさらな状態からCapacitorプロジェクトを初期化**し、ビルド完了後には破棄します。

これにより、ビルドの再現性が100%保証され、ゴミファイルによる予期せぬエラーを完全に排除します。

## 2. 成功した技術スタック

このレシピが成功した際の、主要な技術とバージョンは以下の通りです。

- **Capacitor:** v7
- **Java:** JDK 21
- **Android SDK:** API 35
- **Android Gradle Plugin (AGP):** v8.5.2
- **Node.js:** v20

## 3. 事前準備

このワークフローを正しく動作させるためには、リポジトリのルートディレクトリに以下の準備が必要です。

- `assets/` フォルダを作成
- `assets/` フォルダ内に、アプリアイコンの元となる `icon.png` (1024x1024px推奨) と、スプラッシュスクリーン用の `splash.png` を配置する。

## 4. ワークフロー (`build-apk.yml`) の主要ステップ解説

1.  **環境設定**: Node.js v20 と Java (Temurin) JDK 21 をセットアップします。
2.  **依存関係の導入**: `npm install` を実行し、`package.json` に基づいて必要なライブラリ（`@capacitor/cli`, `@capacitor/android`, `capacitor-assets` など）をインストールします。
3.  **アプリアイコンの自動生成**: `npx capacitor-assets generate` を実行し、`assets` フォルダの画像から各解像度のアイコンとスプラッシュスクリーンを自動生成してAndroidプロジェクト内に配置します。
4.  **Web資産の準備**: `npm run build` を実行してPWAをビルドし、生成された静的ファイル（HTML, CSS, JS）を `www/` ディレクトリにコピーします。
5.  **Capacitorのクリーン初期化**:
    - `rm -rf` コマンドで、前回の実行で生成された可能性のある `android/` フォルダや設定ファイルを完全に削除します。
    - `npx cap init` で `capacitor.config.json` を生成します。
    - `npx cap add android` で、最新のAndroidネイティブプロジェクトを生成します。
6.  **Androidプロジェクトの動的設定**:
    - `variables.gradle` の内容を、API 35に対応した設定で完全に上書きします。
    - `build.gradle` の `versionCode` と `versionName` を、GitHub Actionsの実行番号やGitタグから動的に設定します。
7.  **ビルドとリリース**:
    - `./gradlew assembleRelease` でAPKをビルドし、署名します。
    - 成功したAPKをリネームし、バージョンタグを付けてGitHubリリースを自動で作成・アップロードします。

## 5. VANILLA_ICE_CREAM問題の解決詳細

### 問題の背景
VANILLA_ICE_CREAM問題とは、CI環境でのAndroid SDK競合により発生していた一連のビルドエラーの総称です。主な症状：
- SDK Manager の設定競合
- 古いツール設定の残存による初期化失敗
- 依存関係の解決エラー

### 解決のキーポイント
1. **完全な環境のリセット**: 毎回まっさらな状態から開始
2. **明示的な設定上書き**: 古い設定に依存しない強制的な構成
3. **最新バージョンの統一使用**: 枯れた技術の組み合わせ回避

## 6. 他プロジェクトへの適用方法

### 必要なファイル構成
```
プロジェクトルート/
├── package.json (Capacitor依存関係を含む)
├── assets/
│   ├── icon.png (1024x1024px)
│   └── splash.png
├── src/ (PWAソースコード)
└── .github/workflows/
    └── build-apk.yml (本レシピのワークフロー)
```

### package.json の必須依存関係
```json
{
  "devDependencies": {
    "@capacitor/cli": "^7.0.0",
    "@capacitor/android": "^7.0.0", 
    "capacitor-assets": "^1.0.1"
  }
}
```

### 成功パターンの再現手順
1. 本レシピの技術スタック構成を維持
2. Ephemeral方式のワークフローをコピー
3. プロジェクト固有の設定（アプリ名、パッケージ名等）を調整
4. assetsフォルダとアイコンファイルを準備
5. GitHub Actionsで実行

## 7. まとめ

このEphemeral Capacitor方式は、複雑な設定の不整合問題を根本から解決し、誰がいつ実行しても同じ結果が得られる、堅牢で信頼性の高い自動ビルドパイプラインを実現しました。

**主要な成果:**
- ✅ 100%の再現性確保
- ✅ VANILLA_ICE_CREAM問題の完全解決
- ✅ 3分59秒での高速ビルド実現
- ✅ 他プロジェクトへの応用可能性

このレシピは、PWAからAPKへの変換における新しい標準手法として、今後の開発プロジェクトで活用できます。