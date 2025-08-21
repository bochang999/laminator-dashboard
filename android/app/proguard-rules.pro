# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Capacitor Core Rules
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * {
    @com.getcapacitor.annotation.CapacitorMethod <methods>;
}

# Keep WebView JavaScript Interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Capacitor Bridge and Plugin Classes
-keep class * implements com.getcapacitor.Plugin { *; }
-keep class * extends com.getcapacitor.Plugin { *; }

# WebView Bridge Protection
-keepattributes JavascriptInterface
-keepattributes *Annotation*

# Preserve debugging information for error tracking
-keepattributes SourceFile,LineNumberTable

# Hide original source file name
-renamesourcefileattribute SourceFile

# Keep Cordova Plugin Classes (if using Cordova plugins)
-keep class org.apache.cordova.** { *; }

# Keep Android Support/AndroidX classes
-dontwarn android.support.**
-dontwarn androidx.**
