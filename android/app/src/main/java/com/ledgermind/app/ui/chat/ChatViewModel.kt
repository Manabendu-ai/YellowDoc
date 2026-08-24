package com.ledgermind.app.ui.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ledgermind.app.data.model.ChatMessage
import com.ledgermind.app.data.model.ChatRole
import com.ledgermind.app.data.repo.LedgerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ChatViewModel(private val repository: LedgerRepository) : ViewModel() {

    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()

    private val _busy = MutableStateFlow(false)
    val busy: StateFlow<Boolean> = _busy.asStateFlow()

    private var nextId = 0L

    init {
        // A quiet welcome card so the screen never opens empty.
        _messages.value = listOf(
            ChatMessage(
                id = nextId++,
                role = ChatRole.ASSISTANT,
                text = "",
                answer = com.ledgermind.app.data.model.RagAnswer(
                    answer = "Hi! Ask me anything about your invoices, receipts and tax documents — totals, vendors, dates, line items.",
                ),
            ),
        )
    }

    fun send(rawQuery: String) {
        val query = rawQuery.trim()
        if (query.isEmpty() || _busy.value) return

        val userMessage = ChatMessage(id = nextId++, role = ChatRole.USER, text = query)
        val pendingId = nextId
        nextId++
        val pendingMessage = ChatMessage(
            id = pendingId,
            role = ChatRole.ASSISTANT,
            isPending = true,
        )

        _messages.value = _messages.value + userMessage + pendingMessage
        _busy.value = true

        viewModelScope.launch {
            val outcome = repository.ask(query)
            _messages.value = _messages.value.map { message ->
                if (message.id == pendingId) {
                    outcome.fold(
                        onSuccess = { answer ->
                            message.copy(isPending = false, answer = answer)
                        },
                        onFailure = { error ->
                            message.copy(
                                isPending = false,
                                isError = true,
                                text = error.message ?: "Something went wrong.",
                            )
                        },
                    )
                } else {
                    message
                }
            }
            _busy.value = false
        }
    }
}
