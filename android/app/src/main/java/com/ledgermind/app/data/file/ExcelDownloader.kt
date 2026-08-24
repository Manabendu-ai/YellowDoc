package com.ledgermind.app.data.file

import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import okhttp3.ResponseBody
import java.io.File

/**
 * Persists a downloaded workbook on device storage.
 *
 * - Android 10+ (API 29): written into the public Downloads collection via
 *   MediaStore, which needs no runtime permission.
 * - Older devices: written into the app's external documents directory.
 */
object ExcelDownloader {

    private const val XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    /**
     * Streams [body] to disk and returns a human readable location,
     * e.g. "Downloads/invoice.xlsx".
     */
    suspend fun save(context: Context, body: ResponseBody, fileName: String): String =
        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
            val safeName = if (fileName.endsWith(".xlsx")) fileName else "$fileName.xlsx"
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                saveToMediaStore(context, body, safeName)
            } else {
                saveToAppDocuments(context, body, safeName)
            }
        }

    private fun saveToMediaStore(context: Context, body: ResponseBody, fileName: String): String {
        val resolver = context.contentResolver
        val values = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
            put(MediaStore.MediaColumns.MIME_TYPE, XLSX_MIME)
            put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
        }

        val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
            ?: throw IllegalStateException("Could not create the download entry.")

        resolver.openOutputStream(uri)?.use { output ->
            body.byteStream().use { input -> input.copyTo(output) }
        } ?: throw IllegalStateException("Could not open the download stream.")

        return "${Environment.DIRECTORY_DOWNLOADS}/$fileName"
    }

    private fun saveToAppDocuments(context: Context, body: ResponseBody, fileName: String): String {
        val dir = context.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS)
            ?: context.filesDir
        val target = File(dir, fileName)
        target.outputStream().use { output ->
            body.byteStream().use { input -> input.copyTo(output) }
        }
        return target.absolutePath
    }
}
