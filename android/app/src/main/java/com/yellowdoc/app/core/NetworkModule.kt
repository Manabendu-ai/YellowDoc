package com.yellowdoc.app.core

import com.yellowdoc.app.data.api.YellowDocApi
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Builds and caches Retrofit/OkHttp instances keyed by base URL so that
 * changing the server address at runtime simply swaps the cached client.
 */
object NetworkModule {

    private const val CONNECT_TIMEOUT_SECONDS = 30L
    private const val READ_TIMEOUT_SECONDS = 300L
    private const val WRITE_TIMEOUT_SECONDS = 120L

    @Volatile
    private var cachedBaseUrl: String? = null

    @Volatile
    private var cachedApi: YellowDocApi? = null

    @Volatile
    private var cachedClient: OkHttpClient? = null

    fun okHttpClient(): OkHttpClient =
        cachedClient ?: synchronized(this) {
            cachedClient ?: OkHttpClient.Builder()
                .connectTimeout(CONNECT_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                .readTimeout(READ_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                .writeTimeout(WRITE_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                .build()
                .also { cachedClient = it }
        }

    fun api(baseUrl: String): YellowDocApi = synchronized(this) {
        val existing = cachedApi
        if (existing != null && baseUrl == cachedBaseUrl) {
            return existing
        }
        val retrofit = Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient())
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        retrofit.create(YellowDocApi::class.java).also {
            cachedBaseUrl = baseUrl
            cachedApi = it
        }
    }
}
