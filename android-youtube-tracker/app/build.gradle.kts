plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "com.reconstruct.youtubetracker"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.reconstruct.youtubetracker"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }
}
