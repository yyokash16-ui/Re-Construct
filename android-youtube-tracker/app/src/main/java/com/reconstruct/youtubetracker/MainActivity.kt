package com.reconstruct.youtubetracker

import android.app.Activity
import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.graphics.Typeface
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.widget.*
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.LocalDate
import java.time.ZoneId
import java.util.concurrent.Executors

class MainActivity : Activity() {
    private val prefs by lazy { getSharedPreferences("tracker", Context.MODE_PRIVATE) }
    private val executor = Executors.newSingleThreadExecutor()
    private lateinit var root: LinearLayout
    private lateinit var status: TextView
    private lateinit var totals: TextView
    private lateinit var email: EditText
    private lateinit var password: EditText
    private var youtubeMinutes = 0
    private var shortsMinutes = 0
    private var shortsCount = 0
    private var sessionStart = 0L

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        sessionStart = prefs.getLong("shorts_session_start", 0L)
        shortsCount = prefs.getInt("shorts_count_${LocalDate.now()}", 0)
        shortsMinutes = prefs.getInt("shorts_minutes_${LocalDate.now()}", 0)
        render()
        refreshUsage()
        if (prefs.getString("access_token", null) != null) syncUsage(false)
    }

    private fun render() {
        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(28, 28, 28, 24)
            setBackgroundColor(0xFFF7F6FC.toInt())
        }
        val scroll = ScrollView(this)
        val content = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val title = TextView(this).apply { text = "ReConstruct"; textSize = 25f; setTypeface(null, Typeface.BOLD); setTextColor(0xFF30264F.toInt()) }
        content.addView(title)
        content.addView(TextView(this).apply { text = "YouTube daily usage"; textSize = 17f; setPadding(0, 4, 0, 18); setTextColor(0xFF6F5BE8.toInt()) })
        status = TextView(this).apply { text = "Checking usage access…"; textSize = 13f; setTextColor(0xFF666477.toInt()); setPadding(0, 0, 0, 12) }
        content.addView(status)
        totals = TextView(this).apply { textSize = 16f; setTextColor(0xFF28243D.toInt()); setPadding(0, 12, 0, 20) }
        content.addView(totals)
        content.addView(button("Grant usage access") { startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)) })
        content.addView(TextView(this).apply { text = "Shorts session tracker"; textSize = 18f; setTypeface(null, Typeface.BOLD); setPadding(0, 20, 0, 6); setTextColor(0xFF30264F.toInt()) })
        content.addView(TextView(this).apply { text = "Start this when you enter Shorts, then stop when you leave. The app cannot reliably identify Shorts from Android's standard usage statistics alone."; textSize = 12f; setTextColor(0xFF777487.toInt()); setPadding(0, 0, 0, 10) })
        content.addView(button(if (sessionStart > 0) "Stop Shorts session" else "Start Shorts session") {
            if (sessionStart > 0) {
                shortsMinutes += ((System.currentTimeMillis() - sessionStart) / 60000L).toInt()
                prefs.edit().putInt("shorts_minutes_${LocalDate.now()}", shortsMinutes).remove("shorts_session_start").apply()
                sessionStart = 0L
            } else {
                sessionStart = System.currentTimeMillis()
                prefs.edit().putLong("shorts_session_start", sessionStart).apply()
            }
            render(); refreshUsage()
        })
        content.addView(button("+1 Short watched") {
            shortsCount += 1
            prefs.edit().putInt("shorts_count_${LocalDate.now()}", shortsCount).apply()
            refreshUsage()
        })
        content.addView(TextView(this).apply { text = "Connect to ReConstruct"; textSize = 18f; setTypeface(null, Typeface.BOLD); setPadding(0, 22, 0, 8); setTextColor(0xFF30264F.toInt()) })
        email = EditText(this).apply { hint = "ReConstruct account email"; textSize = 14f; setSingleLine(true); setText(prefs.getString("email", "")) }
        password = EditText(this).apply { hint = "ReConstruct password"; textSize = 14f; inputType = 129; setSingleLine(true) }
        content.addView(email); content.addView(password)
        content.addView(button("Sign in and sync") { signInAndSync() })
        content.addView(button("Sync today's usage") { refreshUsage(); syncUsage(true) })
        content.addView(TextView(this).apply { text = "Privacy: this companion reads app-level usage statistics and the Shorts session you start manually. It does not read your YouTube password, messages, or watch content. Your daily totals sync to your own ReConstruct account."; textSize = 11f; setTextColor(0xFF88869A.toInt()); setPadding(0, 18, 0, 0) })
        scroll.addView(content)
        root.addView(scroll)
        setContentView(root)
    }

    private fun button(label: String, action: () -> Unit) = Button(this).apply {
        text = label; isAllCaps = false; textSize = 13f; setOnClickListener { action() }
    }

    private fun hasUsageAccess(): Boolean {
        val appOps = getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        return appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), packageName) == AppOpsManager.MODE_ALLOWED
    }

    private fun refreshUsage() {
        if (!hasUsageAccess()) {
            status.text = "Usage access is not enabled yet. Grant it in Android Settings."
            totals.text = "YouTube: —\nShorts time: —\nShorts viewed: $shortsCount"
            return
        }
        val start = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
        val end = System.currentTimeMillis()
        val manager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val events = manager.queryEvents(start, end)
        val event = UsageEvents.Event()
        var activeStart = 0L
        var totalMs = 0L
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            if (event.packageName == "com.google.android.youtube") {
                when (event.eventType) {
                    UsageEvents.Event.ACTIVITY_RESUMED, UsageEvents.Event.MOVE_TO_FOREGROUND -> if (activeStart == 0L) activeStart = event.timeStamp
                    UsageEvents.Event.ACTIVITY_PAUSED, UsageEvents.Event.MOVE_TO_BACKGROUND, UsageEvents.Event.ACTIVITY_STOPPED -> if (activeStart > 0L) { totalMs += (event.timeStamp - activeStart).coerceAtLeast(0); activeStart = 0L }
                }
            }
        }
        if (activeStart > 0L) totalMs += (end - activeStart).coerceAtLeast(0)
        youtubeMinutes = (totalMs / 60000L).toInt()
        val liveShorts = if (sessionStart > 0L) ((System.currentTimeMillis() - sessionStart) / 60000L).toInt() else 0
        status.text = "Tracking date: ${LocalDate.now()} · ${if (hasUsageAccess()) "Usage access granted" else "Permission needed"}"
        totals.text = "TOTAL YOUTUBE\n${youtubeMinutes / 60}h ${youtubeMinutes % 60}m\n\nSHORTS SESSION TIME\n${(shortsMinutes + liveShorts) / 60}h ${(shortsMinutes + liveShorts) % 60}m\n\nSHORTS COUNT\n$shortsCount"
    }

    private fun signInAndSync() {
        val mail = email.text.toString().trim()
        val pass = password.text.toString()
        if (mail.isBlank() || pass.isBlank()) { status.text = "Enter your ReConstruct email and password."; return }
        status.text = "Signing in securely…"
        executor.execute {
            try {
                val response = request("POST", "/auth/v1/token?grant_type=password", JSONObject().put("email", mail).put("password", pass), null)
                prefs.edit().putString("access_token", response.getString("access_token")).putString("refresh_token", response.optString("refresh_token")).putString("user_id", response.getJSONObject("user").getString("id")).putLong("expires_at", System.currentTimeMillis() + response.optLong("expires_in", 3600L) * 1000L).putString("email", mail).apply()
                runOnUiThread { password.setText(""); status.text = "Signed in. Syncing daily totals…" }
                refreshUsage()
                syncUsage(true)
            } catch (e: Exception) { runOnUiThread { status.text = "Sign-in failed: ${e.message ?: "check connection"}" } }
        }
    }

    private fun syncUsage(showMessage: Boolean) {
        if (prefs.getString("access_token", null) == null) { if (showMessage) status.text = "Sign in to your ReConstruct account first."; return }
        val userId = prefs.getString("user_id", null) ?: run { if (showMessage) status.text = "Please sign in again to link your account."; return }
        refreshUsage()
        val liveShorts = if (sessionStart > 0L) ((System.currentTimeMillis() - sessionStart) / 60000L).toInt() else 0
        val today = LocalDate.now().toString()
        val payload = JSONObject()
            .put("user_id", userId)
            .put("usage_date", today)
            .put("youtube_minutes", youtubeMinutes)
            .put("shorts_minutes", shortsMinutes + liveShorts)
            .put("shorts_count", shortsCount)
            .put("source", "android_companion")
        executor.execute {
            try {
                request("POST", "/rest/v1/youtube_daily_usage?on_conflict=user_id,usage_date", payload, ensureAccessToken(), "resolution=merge-duplicates,return=minimal")
                runOnUiThread { status.text = if (showMessage) "Synced $today to ReConstruct." else "Today's usage synced to ReConstruct." }
            } catch (e: Exception) { runOnUiThread { status.text = "Sync failed: ${e.message ?: "check connection"}" } }
        }
    }

    private fun ensureAccessToken(): String {
        val token = prefs.getString("access_token", null) ?: throw IllegalStateException("Sign in first")
        val expiresAt = prefs.getLong("expires_at", 0L)
        if (expiresAt > System.currentTimeMillis() + 60000L) return token
        val refresh = prefs.getString("refresh_token", null) ?: throw IllegalStateException("Session expired; sign in again")
        val response = request("POST", "/auth/v1/token?grant_type=refresh_token", JSONObject().put("refresh_token", refresh), null)
        val nextToken = response.getString("access_token")
        prefs.edit().putString("access_token", nextToken).putString("refresh_token", response.optString("refresh_token", refresh)).putLong("expires_at", System.currentTimeMillis() + response.optLong("expires_in", 3600L) * 1000L).apply()
        return nextToken
    }

    private fun request(method: String, path: String, body: JSONObject?, token: String?, prefer: String? = null): JSONObject {
        val conn = (URL("https://kbrdhofrezflnclrsfqv.supabase.co$path").openConnection() as HttpURLConnection)
        conn.requestMethod = method
        conn.connectTimeout = 15000; conn.readTimeout = 15000
        conn.setRequestProperty("apikey", "sb_publishable_n7V6pQDdR-Btg8nzdVDT-A_srYPg5Fz")
        conn.setRequestProperty("Content-Type", "application/json")
        conn.setRequestProperty("Accept", "application/json")
        conn.setRequestProperty("Authorization", "Bearer ${token ?: "sb_publishable_n7V6pQDdR-Btg8nzdVDT-A_srYPg5Fz"}")
        if (prefer != null) conn.setRequestProperty("Prefer", prefer)
        if (body != null) { conn.doOutput = true; conn.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) } }
        val code = conn.responseCode
        val stream = if (code in 200..299) conn.inputStream else conn.errorStream
        val text = stream?.bufferedReader()?.use { it.readText() } ?: ""
        conn.disconnect()
        if (code !in 200..299) throw IllegalStateException("HTTP $code: $text")
        return if (text.isBlank()) JSONObject() else JSONObject(text)
    }
}
