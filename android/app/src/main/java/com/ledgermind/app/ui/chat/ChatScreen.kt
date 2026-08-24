package com.ledgermind.app.ui.chat

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.ExpandLess
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material.icons.automirrored.outlined.Send
import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.ledgermind.app.core.AppContainer
import com.ledgermind.app.data.model.ChatMessage
import com.ledgermind.app.data.model.ChatRole
import com.ledgermind.app.data.model.RagAnswer
import com.ledgermind.app.ui.components.LmTopBar
import com.ledgermind.app.ui.components.StatusChip
import com.ledgermind.app.ui.components.TypingIndicator

@Composable
fun ChatScreen(
    container: AppContainer,
    onBack: () -> Unit,
) {
    val viewModel: ChatViewModel = viewModel(
        factory = viewModelFactory {
            initializer { ChatViewModel(container.repository) }
        },
    )
    val messages by viewModel.messages.collectAsStateWithLifecycle()
    val busy by viewModel.busy.collectAsStateWithLifecycle()

    var input by rememberSaveable { mutableStateOf("") }
    val listState = rememberLazyListState()

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(index = messages.size - 1)
        }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            LmTopBar(
                title = "Ask your documents",
                onBack = onBack,
                subtitle = "RAG over your indexed files",
            )
        },
        bottomBar = {
            Surface(color = MaterialTheme.colorScheme.surface) {
                Row(
                    verticalAlignment = Alignment.Bottom,
                    modifier = Modifier
                        .fillMaxWidth()
                        .imePadding()
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                ) {
                    OutlinedTextField(
                        value = input,
                        onValueChange = { input = it },
                        placeholder = { Text("Ask about invoices, totals…") },
                        shape = RoundedCornerShape(24.dp),
                        maxLines = 4,
                        modifier = Modifier.weight(1f),
                    )
                    Spacer(Modifier.size(10.dp))
                    FilledIconButton(
                        onClick = {
                            viewModel.send(input)
                            input = ""
                        },
                        enabled = !busy && input.isNotBlank(),
                        shape = CircleShape,
                        colors = IconButtonDefaults.filledIconButtonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                            contentColor = MaterialTheme.colorScheme.onPrimary,
                        ),
                        modifier = Modifier.size(52.dp),
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Outlined.Send,
                            contentDescription = "Send",
                        )
                    }
                }
            }
        },
    ) { padding ->
        LazyColumn(
            state = listState,
            verticalArrangement = Arrangement.spacedBy(14.dp),
            contentPadding = padding,
            modifier = Modifier.fillMaxSize(),
        ) {
            items(items = messages, key = { it.id }) { message ->
                when (message.role) {
                    ChatRole.USER -> UserBubble(message)
                    ChatRole.ASSISTANT -> AssistantBubble(message)
                }
            }
        }
    }
}

@Composable
private fun UserBubble(message: ChatMessage) {
    Row(
        horizontalArrangement = Arrangement.End,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Surface(
            color = MaterialTheme.colorScheme.primaryContainer,
            shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp, bottomStart = 20.dp, bottomEnd = 6.dp),
            modifier = Modifier.widthIn(max = 300.dp),
        ) {
            Text(
                text = message.text,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
            )
        }
    }
}

@Composable
private fun AssistantBubble(message: ChatMessage) {
    Row(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.widthIn(max = 320.dp)) {
            when {
                message.isPending -> PendingBubble()
                message.isError -> ErrorBubble(text = message.text)
                else -> AnswerCard(answer = message.answer ?: return)
            }
        }
    }
}

@Composable
private fun PendingBubble() {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(topStart = 6.dp, topEnd = 20.dp, bottomStart = 20.dp, bottomEnd = 20.dp),
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.padding(horizontal = 18.dp, vertical = 16.dp),
        ) {
            TypingIndicator()
        }
    }
}

@Composable
private fun ErrorBubble(text: String) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.error.copy(alpha = 0.5f)),
        shape = RoundedCornerShape(topStart = 6.dp, topEnd = 20.dp, bottomStart = 20.dp, bottomEnd = 20.dp),
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.error,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
        )
    }
}

@Composable
private fun AnswerCard(answer: RagAnswer) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(topStart = 6.dp, topEnd = 20.dp, bottomStart = 20.dp, bottomEnd = 20.dp),
    ) {
        Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp)) {

            // Header: identity + confidence.
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(26.dp)
                        .background(MaterialTheme.colorScheme.primaryContainer, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = Icons.Outlined.AutoAwesome,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onPrimaryContainer,
                        modifier = Modifier.size(15.dp),
                    )
                }
                Spacer(Modifier.size(8.dp))
                Text(
                    text = "LedgerMind",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Spacer(Modifier.size(8.dp))
                if (answer.confidence.isNotBlank()) {
                    StatusChip(
                        text = answer.confidence.lowercase(),
                        dotColor = confidenceColor(answer.confidence),
                    )
                }
            }

            Spacer(Modifier.height(10.dp))

            // Main answer.
            Text(
                text = answer.answer,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurface,
            )

            // Summary (when present).
            if (answer.summary.isNotBlank()) {
                Spacer(Modifier.height(10.dp))
                Text(
                    text = answer.summary,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            // Key points as bullet rows.
            if (answer.keyPoints.isNotEmpty()) {
                Spacer(Modifier.height(12.dp))
                answer.keyPoints.forEach { point ->
                    Row(modifier = Modifier.padding(vertical = 3.dp)) {
                        Box(
                            modifier = Modifier
                                .padding(top = 7.dp)
                                .size(5.dp)
                                .background(MaterialTheme.colorScheme.primary, CircleShape),
                        )
                        Spacer(Modifier.size(10.dp))
                        Text(
                            text = point,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                    }
                }
            }

            // Collapsible examples.
            if (answer.examples.isNotEmpty()) {
                var expanded by remember { mutableStateOf(false) }
                Spacer(Modifier.height(4.dp))
                TextButton(onClick = { expanded = !expanded }) {
                    Text(
                        text = if (expanded) "Hide examples" else "Examples (${answer.examples.size})",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                    )
                    Icon(
                        imageVector = if (expanded) Icons.Outlined.ExpandLess else Icons.Outlined.ExpandMore,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(16.dp),
                    )
                }
                AnimatedVisibility(visible = expanded) {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        answer.examples.forEach { example ->
                            Surface(
                                color = MaterialTheme.colorScheme.surfaceVariant,
                                shape = RoundedCornerShape(10.dp),
                            ) {
                                Text(
                                    text = example,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    maxLines = 4,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 12.dp, vertical = 8.dp),
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun confidenceColor(confidence: String): Color {
    val value = confidence.lowercase()
    return when {
        "high" in value || "strong" in value -> MaterialTheme.colorScheme.primary
        "medium" in value || "moderate" in value -> MaterialTheme.colorScheme.secondary
        "low" in value || "weak" in value -> MaterialTheme.colorScheme.error
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }
}
