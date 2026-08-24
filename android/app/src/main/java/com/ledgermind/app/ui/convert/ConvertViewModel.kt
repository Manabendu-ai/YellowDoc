package com.ledgermind.app.ui.convert

import android.content.ContentResolver
import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ledgermind.app.data.model.GenerateResponse
import com.ledgermind.app.data.repo.LedgerRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.Locale

/** One cycle step of the animated progress label shown while generating. */
private val PROGRESS_LABELS = listOf(
    "Parsing your document…",
    "Structuring content with AI…",
    "Building the workbook…",
)

class ConvertViewModel(private val repository: LedgerRepository) : ViewModel() {

    enum class Phase { IDLE, GENERATING, SUCCESS, ERROR }

    data class PickedFile(
        val uri: Uri,
        val name: String,
        val sizeLabel: String,
    )

    data class UiState(
        val file: PickedFile? = null,
        val excelName: String = "",
        val phase: Phase = Phase.IDLE,
        val progressLabel: String = PROGRESS_LABELS.first(),
        val result: GenerateResponse? = null,
        val downloading: Boolean = false,
        /** One-shot snackbar message; null when nothing to show. */
        val message: String? = null,
        val messageIsError: Boolean = false,
    )

    private val _state = MutableStateFlow(UiState())
    val state: StateFlow<UiState> = _state.asStateFlow()

    private var progressJob: Job? = null

    fun onFilePicked(resolver: ContentResolver, uri: Uri) {
        val name = queryDisplayName(resolver, uri) ?: "document.pdf"
        val sizeLabel = formatBytes(querySize(resolver, uri))
        _state.update {
            it.copy(
                file = PickedFile(uri, name, sizeLabel),
                excelName = it.excelName.ifBlank {
                    name.removeSuffix(".pdf").removeSuffix(".PDF").ifBlank { "ledger_export" }
                },
                phase = Phase.IDLE,
                result = null,
            )
        }
    }

    fun setExcelName(value: String) {
        _state.update { it.copy(excelName = value) }
    }

    fun generate(resolver: ContentResolver) {
        val current = _state.value
        val file = current.file ?: return
        if (current.phase == Phase.GENERATING) return
        val excelName = current.excelName.trim().ifBlank { "ledger_export" }

        startProgressCycle()
        viewModelScope.launch {
            _state.update { it.copy(phase = Phase.GENERATING) }
            val outcome = repository.generateExcel(resolver, file.uri, excelName)
            stopProgressCycle()
            outcome.fold(
                onSuccess = { response ->
                    _state.update {
                        it.copy(phase = Phase.SUCCESS, result = response)
                    }
                },
                onFailure = { error ->
                    _state.update {
                        it.copy(
                            phase = Phase.ERROR,
                            message = error.message ?: "Something went wrong.",
                            messageIsError = true,
                        )
                    }
                },
            )
        }
    }

    fun download(context: Context) {
        val fileName = _state.value.result?.file ?: return
        if (_state.value.downloading) return
        viewModelScope.launch {
            _state.update { it.copy(downloading = true) }
            val outcome = repository.downloadExcel(fileName, context)
            _state.update { state ->
                state.copy(downloading = false).let { s ->
                    outcome.fold(
                        onSuccess = { location ->
                            s.copy(message = "Saved to $location", messageIsError = false)
                        },
                        onFailure = { error ->
                            s.copy(
                                message = error.message ?: "Download failed.",
                                messageIsError = true,
                            )
                        },
                    )
                }
            }
        }
    }

    fun consumeMessage() {
        _state.update { it.copy(message = null) }
    }

    fun reset() {
        stopProgressCycle()
        _state.value = UiState()
    }

    private fun startProgressCycle() {
        progressJob?.cancel()
        progressJob = viewModelScope.launch {
            var index = 0
            while (isActive) {
                _state.update { it.copy(progressLabel = PROGRESS_LABELS[index % PROGRESS_LABELS.size]) }
                delay(2600)
                index++
            }
        }
    }

    private fun stopProgressCycle() {
        progressJob?.cancel()
        progressJob = null
    }

    private fun queryDisplayName(resolver: ContentResolver, uri: Uri): String? =
        queryMetadata(resolver, uri)?.first

    private fun querySize(resolver: ContentResolver, uri: Uri): Long =
        queryMetadata(resolver, uri)?.second ?: 0L

    private fun queryMetadata(resolver: ContentResolver, uri: Uri): Pair<String?, Long>? {
        return resolver.query(uri, null, null, null, null)?.use { cursor ->
            val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
            if (cursor.moveToFirst()) {
                val name = if (nameIndex >= 0) cursor.getString(nameIndex) else null
                val size = if (sizeIndex >= 0 && !cursor.isNull(sizeIndex)) {
                    cursor.getLong(sizeIndex)
                } else {
                    0L
                }
                name to size
            } else {
                null
            }
        }
    }

    private fun formatBytes(bytes: Long): String = when {
        bytes >= 1_000_000 -> String.format(Locale.US, "%.1f MB", bytes / 1_000_000f)
        bytes >= 1_000 -> String.format(Locale.US, "%.0f KB", bytes / 1_000f)
        else -> "$bytes B"
    }
}
