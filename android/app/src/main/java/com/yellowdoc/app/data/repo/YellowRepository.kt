package com.yellowdoc.app.data.repo

import android.content.ContentResolver
import android.content.Context
import android.net.Uri
import com.google.gson.JsonParser
import com.yellowdoc.app.core.AppConfig
import com.yellowdoc.app.core.NetworkModule
import com.yellowdoc.app.data.file.ExcelDownloader
import com.yellowdoc.app.data.model.GenerateResponse
import com.yellowdoc.app.data.model.RagAnswer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.net.URLEncoder

/**
 * Single entry point for all server communication.
 * Every call returns a [Result] so callers can surface friendly errors.
 */
class YellowRepository(private val config: AppConfig) {

    private fun api() = NetworkModule.api(config.currentBaseUrl)

    /**
     * Uploads the PDF at [uri] and asks the backend to build an Excel
     * workbook named [excelName].
     */
    suspend fun generateExcel(
        resolver: ContentResolver,
        uri: Uri,
        excelName: String,
    ): Result<GenerateResponse> = withContext(Dispatchers.IO) {
        runCatching {
            val bytes = resolver.openInputStream(uri)?.use { it.readBytes() }
                ?: throw IllegalStateException("Could not read the selected file.")

            val displayName = uri.lastPathSegment?.substringAfterLast('/') ?: "document.pdf"
            val part = MultipartBody.Part.createFormData(
                name = "file",
                filename = displayName,
                body = bytes.toRequestBody("application/pdf".toMediaType()),
            )

            val response = api().generateExcel(part, excelName)
            if (!response.isSuccessful) {
                throw IllegalStateException(httpErrorMessage(response.code(), response))
            }
            response.body() ?: throw IllegalStateException("The server returned an empty response.")
        }
    }

    /** Sends a question to the RAG pipeline. */
    suspend fun ask(query: String): Result<RagAnswer> = withContext(Dispatchers.IO) {
        runCatching {
            val response = api().ask(query)
            if (!response.isSuccessful) {
                throw IllegalStateException(httpErrorMessage(response.code(), response))
            }
            response.body() ?: throw IllegalStateException("The server returned an empty response.")
        }
    }

    /**
     * Downloads the generated workbook [fileName] (without extension) and
     * saves it on device storage, returning a human readable location.
     */
    suspend fun downloadExcel(fileName: String, context: Context): Result<String> =
        withContext(Dispatchers.IO) {
            runCatching {
                val encoded = URLEncoder.encode(fileName, "UTF-8")
                val url = "${config.currentBaseUrl}excel/download/$encoded"
                val response = api().downloadFile(url)
                if (!response.isSuccessful) {
                    throw IllegalStateException(httpErrorMessage(response.code(), response))
                }
                val body = response.body()
                    ?: throw IllegalStateException("The server returned an empty file.")
                ExcelDownloader.save(context, body, fileName)
            }
        }

    /**
     * Prefers the server's own `detail` message (FastAPI error shape) and
     * falls back to a friendly generic per status code.
     */
    private fun httpErrorMessage(code: Int, response: retrofit2.Response<*>): String {
        val detail = runCatching {
            val body = response.errorBody()?.string()
            if (body.isNullOrBlank()) {
                null
            } else {
                val element = JsonParser.parseString(body)
                (element as? com.google.gson.JsonObject)
                    ?.get("detail")
                    ?.takeIf { !it.isJsonNull }
                    ?.asString
            }
        }.getOrNull()

        return detail ?: when (code) {
            404 -> "That file was not found on the server."
            422 -> "The server could not process this request."
            500 -> "The server failed while processing your document."
            else -> "Request failed (HTTP $code)."
        }
    }
}
