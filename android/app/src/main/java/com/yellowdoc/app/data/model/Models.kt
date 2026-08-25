package com.yellowdoc.app.data.model

import com.google.gson.annotations.SerializedName

/**
 * Response of POST /excel/generate.
 */
data class GenerateResponse(
    @SerializedName("status") val status: String? = null,
    @SerializedName("file") val file: String? = null,
    @SerializedName("saved_at") val savedAt: String? = null,
)

/**
 * Structured answer of POST /query, mirroring RAGResponse on the backend.
 */
data class RagAnswer(
    @SerializedName("query") val query: String = "",
    @SerializedName("answer") val answer: String = "",
    @SerializedName("summary") val summary: String = "",
    @SerializedName("confidence") val confidence: String = "",
    @SerializedName("key_points") val keyPoints: List<String> = emptyList(),
    @SerializedName("examples") val examples: List<String> = emptyList(),
)

/** Role of a chat participant. */
enum class ChatRole { USER, ASSISTANT }

/**
 * A single entry in the chat transcript shown on screen.
 */
data class ChatMessage(
    val id: Long,
    val role: ChatRole,
    /** User prompt text, or the error text when [isError] is true. */
    val text: String = "",
    /** Structured assistant payload; null for user messages. */
    val answer: RagAnswer? = null,
    val isError: Boolean = false,
    /** True while the assistant response is still being fetched. */
    val isPending: Boolean = false,
)
