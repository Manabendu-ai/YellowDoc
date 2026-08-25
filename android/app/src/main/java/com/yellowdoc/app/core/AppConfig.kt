package com.yellowdoc.app.core

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

private val Context.settingsDataStore by preferencesDataStore(name = "yellowdoc_settings")

/**
 * Holds the app-wide configuration, most importantly the base URL of the
 * YellowDoc FastAPI server. The value is persisted in DataStore so the
 * user only has to configure it once.
 */
class AppConfig(context: Context) {

    private val appContext = context.applicationContext
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val _baseUrl = MutableStateFlow(DEFAULT_BASE_URL)
    val baseUrl: StateFlow<String> = _baseUrl

    init {
        scope.launch { restore() }
    }

    /** Current value, safe to read synchronously for building requests. */
    val currentBaseUrl: String
        get() = _baseUrl.value

    suspend fun setBaseUrl(rawUrl: String) {
        val normalized = normalize(rawUrl)
        appContext.settingsDataStore.edit { prefs ->
            prefs[KEY_BASE_URL] = normalized
        }
        _baseUrl.value = normalized
    }

    private suspend fun restore() {
        val stored = appContext.settingsDataStore.data.first()[KEY_BASE_URL]
        if (!stored.isNullOrBlank()) {
            _baseUrl.value = normalize(stored)
        }
    }

    companion object {
        const val DEFAULT_BASE_URL = "http://10.0.2.2:8000/"
        private val KEY_BASE_URL = stringPreferencesKey("base_url")

        /**
         * Normalizes user input into a URL Retrofit accepts:
         * adds a scheme when missing and guarantees a trailing slash.
         */
        fun normalize(rawUrl: String): String {
            var url = rawUrl.trim()
            if (url.isEmpty()) return DEFAULT_BASE_URL
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                url = "http://$url"
            }
            if (!url.endsWith("/")) url = "$url/"
            return url
        }
    }
}
