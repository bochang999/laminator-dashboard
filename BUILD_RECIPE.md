# PWA → 署名付きAPK 最短リリースレシピ

## 🎯 最短ルート概要

PWAプロジェクトをGitHubにプッシュするだけで、自動的に署名付きAPKがGitHub Releasesに配布される完全自動化システム。

**所要時間**: 初回設定15分 + 以降は git push のみ（約4分で自動APK生成）

## 📁 必須ファイル構成

```
プロジェクトルート/
├── assets/
│   ├── icon.png (1024x1024px アプリアイコン)
│   └── splash.png (スプラッシュ画像)
├── package.json (Capacitor依存関係含む)
├── src/ または dist/ (PWAビルド出力先)
├── .github/
│   ├── workflows/
│   │   └── build-apk.yml (自動ビルドワークフロー)
│   └── templates/
│       └── build.gradle.template (署名設定テンプレート)
└── index.html, style.css, script.js (PWA本体)
```

## ⚙️ 1. package.json 設定

```json
{
  "devDependencies": {
    "@capacitor/cli": "^7.0.0",
    "@capacitor/android": "^7.0.0",
    "@capacitor/assets": "^2.0.0"
  },
  "scripts": {
    "build": "echo 'Build completed' && mkdir -p www && cp -r src/* www/ || cp -r dist/* www/ || cp *.html *.css *.js www/"
  }
}
```

## 🔑 2. 署名キー生成・GitHub Secrets設定

### キーストア生成
```bash
# プロジェクトルートで実行
keytool -genkey -v -keystore release.jks -alias release \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass your_password -keypass your_password \
  -dname "CN=YourApp,O=YourOrg,C=JP"

# Base64エンコード
base64 -i release.jks | tr -d '\n' > keystore_base64.txt
```

### GitHub Secrets設定
リポジトリの Settings → Secrets and variables → Actions で以下を設定：

- `KEYSTORE_FILE`: keystore_base64.txt の内容
- `KEYSTORE_PASSWORD`: your_password
- `KEY_ALIAS`: release
- `KEY_PASSWORD`: your_password

## 📄 3. build.gradle.template 作成

`.github/templates/build.gradle.template` ファイルを作成：

```gradle
plugins {
    id 'com.android.application'
}

android {
    namespace 'com.yourcompany.yourapp'
    compileSdk 35

    defaultConfig {
        applicationId "com.yourcompany.yourapp"
        minSdk 24
        targetSdk 35
        versionCode DYNAMIC_VERSION_CODE
        versionName "DYNAMIC_VERSION_NAME"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        release {
            if (System.getenv("KEYSTORE_BASE64")) {
                def keystoreFile = new File(project.rootDir, "release.jks")
                def decodedKeystore = System.getenv("KEYSTORE_BASE64").decodeBase64()
                keystoreFile.bytes = decodedKeystore
                
                storeFile keystoreFile
                storePassword System.getenv("KEYSTORE_PASSWORD")
                keyAlias System.getenv("KEY_ALIAS") 
                keyPassword System.getenv("KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.coordinatorlayout:coordinatorlayout:1.2.0'
    implementation 'androidx.core:core-splashscreen:1.0.1'
}

apply from: 'capacitor.build.gradle'
```

## 🔄 4. GitHub Actions ワークフロー

`.github/workflows/build-apk.yml` ファイルを作成：

```yaml
name: Build APK

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'
          
      - name: Set Version Information
        run: |
          VERSION_MAJOR="1"
          VERSION_MINOR="0" 
          VERSION_PATCH="${{ github.run_number }}"
          VERSION_TAG="$VERSION_MAJOR.$VERSION_MINOR.$VERSION_PATCH"
          echo "VERSION_TAG=$VERSION_TAG" >> $GITHUB_ENV
          
      - name: Install dependencies
        run: npm install
        
      - name: Build Web App
        run: npm run build
        
      - name: Generate App Icons
        run: npx capacitor-assets generate --android
        
      - name: Initialize Capacitor
        run: |
          npx cap init YourAppName com.yourcompany.yourapp --web-dir www
          npx cap add android
          
      - name: Apply Build Template
        run: |
          cp .github/templates/build.gradle.template android/app/build.gradle
          sed -i "s/DYNAMIC_VERSION_CODE/${{ github.run_number }}/g" android/app/build.gradle
          sed -i "s/DYNAMIC_VERSION_NAME/${{ env.VERSION_TAG }}/g" android/app/build.gradle
          
      - name: Sync Capacitor
        run: npx cap sync android
        
      - name: Update Android SDK to API 35
        run: |
          echo "y" | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --install "platforms;android-35" "build-tools;35.0.0"
          
      - name: Accept Android SDK Licenses
        run: yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses
        
      - name: Build APK
        working-directory: android
        run: ./gradlew assembleRelease --no-daemon --stacktrace
        env:
          KEYSTORE_BASE64: ${{ secrets.KEYSTORE_FILE }}
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
          
      - name: Rename APK
        run: |
          APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
          NEW_NAME="yourapp_${{ env.VERSION_TAG }}-signed.apk"
          mv "$APK_PATH" "$NEW_NAME"
          echo "APK_NAME=$NEW_NAME" >> $GITHUB_ENV
          
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: "v${{ env.VERSION_TAG }}"
          name: "YourApp ${{ env.VERSION_TAG }}"
          files: ${{ env.APK_NAME }}
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 🚀 5. 実行手順

### 初回セットアップ
1. ファイル構成を準備
2. package.json に依存関係を追加
3. assets/ フォルダにアイコン画像を配置
4. 署名キーを生成してGitHub Secretsに設定
5. build.gradle.template とワークフローファイルを作成

### 継続的リリース
```bash
git add .
git commit -m "Release v1.0.X"
git push
```

**結果**: 約4分後にGitHub Releasesに署名付きAPKが自動配布

## ✅ 成功のポイント

- **Ephemeral Capacitor**: 毎回クリーンな環境で初期化
- **Golden Template**: 事前定義されたbuild.gradleで設定競合回避
- **自動バージョニング**: GitHub run_number による自動採番
- **完全署名**: RecipeBox実証済みの署名システム

このレシピにより、PWAから署名付きAPKまでの完全自動化が実現します。