# ReConstruct YouTube Usage Tracker (Android companion)

This companion app is designed for your Android phone. It adds a daily YouTube usage record to your existing ReConstruct Supabase account without changing the existing six modules.

## What it measures
- **Total YouTube app foreground time** from Android Usage Access events for `com.google.android.youtube`.
- **Shorts session time** using the explicit Start/Stop Shorts Session control. Start when you enter Shorts and stop when you leave; the timer remains recoverable if you leave the tracker screen.
- **Shorts count** using the +1 Short watched control. This is intentionally manual because Android's standard app-usage APIs cannot reliably tell Shorts from regular videos.
- Daily sync into `public.youtube_daily_usage`; the web dashboard reads the same account-scoped rows.

## Install
1. Build the debug APK from this repository using the GitHub Actions workflow **Build Android YouTube Tracker** (the workflow publishes the APK as an artifact), or open this folder in Android Studio.
2. Install the APK on your phone.
3. Open it and grant **Usage access** to ReConstruct YouTube Tracker in Android Settings.
4. Sign in with the same email/password you use for ReConstruct. This is the ReConstruct account, not a YouTube password.
5. Start/stop the Shorts timer while browsing Shorts and tap +1 for each Short you watch. Tap Sync today's usage at the end of the day. Signing in syncs today's usage as well.

## Accuracy and limitations
- This is not a Google/YouTube account integration and does not use the YouTube password.
- Android reports app foreground usage, not playback state. YouTube left open but idle may be included; event gaps or OEM battery policies can affect totals.
- Shorts time/count are manual session measurements, not automatically inferred from YouTube's internal interface.
- Sync is user-triggered or on tracker launch, not guaranteed to run at 9 PM while the app is closed. This first version deliberately avoids an Accessibility Service: Android documents that API for accessibility purposes, and it can expose sensitive on-screen information.
- The app syncs to the signed-in ReConstruct user's row under Supabase RLS. The Supabase publishable key is not a secret; no service-role key is included.
