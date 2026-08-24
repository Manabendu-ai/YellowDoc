package com.ledgermind.app.ui.home

import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Bolt
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.Forum
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.Storage
import androidx.compose.material.icons.outlined.TableChart
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ledgermind.app.core.AppContainer
import com.ledgermind.app.ui.components.ActionCard
import com.ledgermind.app.ui.components.LmCard
import com.ledgermind.app.ui.components.SectionLabel
import com.ledgermind.app.ui.settings.ServerSettingsSheet

@Composable
fun HomeScreen(
    container: AppContainer,
    onOpenConvert: () -> Unit,
    onOpenChat: () -> Unit,
) {
    var showSettings by remember { mutableStateOf(false) }
    val baseUrl by container.config.baseUrl.collectAsStateWithLifecycle()
    val host = remember(baseUrl) { Uri.parse(baseUrl).host ?: baseUrl }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp),
        ) {
            Spacer(Modifier.height(24.dp))

            // ── Brand row ────────────────────────────────────────────
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .background(MaterialTheme.colorScheme.primaryContainer, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Description,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onPrimaryContainer,
                        modifier = Modifier.size(22.dp),
                    )
                }
                Spacer(Modifier.size(12.dp))
                Column {
                    Text(
                        text = "LedgerMind.ai",
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                    Text(
                        text = "Document intelligence",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Spacer(Modifier.weight(1f))
                IconButton(onClick = { showSettings = true }) {
                    Icon(
                        imageVector = Icons.Outlined.Settings,
                        contentDescription = "Server settings",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            Spacer(Modifier.height(40.dp))

            // ── Hero ─────────────────────────────────────────────────
            SectionLabel(text = "Overview")
            Spacer(Modifier.height(10.dp))
            Text(
                text = "Turn financial documents into structured intelligence.",
                style = MaterialTheme.typography.displaySmall,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Spacer(Modifier.height(12.dp))
            Text(
                text = "Upload invoices, receipts and tax papers — get clean Excel workbooks back, or ask the AI anything about them.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(Modifier.height(32.dp))

            // ── Actions ──────────────────────────────────────────────
            ActionCard(
                icon = Icons.Outlined.TableChart,
                title = "Convert to Excel",
                subtitle = "PDF → structured workbook in one tap.",
                onClick = onOpenConvert,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(14.dp))
            ActionCard(
                icon = Icons.Outlined.Forum,
                title = "Ask your documents",
                subtitle = "Instant answers from the RAG index.",
                onClick = onOpenChat,
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(Modifier.height(36.dp))

            // ── Pipeline (editorial numbered rows) ───────────────────
            SectionLabel(text = "Pipeline")
            Spacer(Modifier.height(6.dp))
            PipelineRow(index = "01", icon = Icons.Outlined.AutoAwesome, label = "Docling OCR parsing")
            PipelineRow(index = "02", icon = Icons.Outlined.Bolt, label = "Groq-powered structuring")
            PipelineRow(index = "03", icon = Icons.Outlined.Storage, label = "FAISS retrieval & answers")

            Spacer(Modifier.height(28.dp))

            // ── Server status ────────────────────────────────────────
            LmCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                ) {
                    Box(
                        modifier = Modifier.size(8.dp),
                    ) {
                        // Soft glow behind the status dot.
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.25f), CircleShape),
                        )
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(MaterialTheme.colorScheme.primary, CircleShape),
                        )
                    }
                    Spacer(Modifier.size(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Connected to",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Text(
                            text = host,
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.onSurface,
                            maxLines = 1,
                        )
                    }
                    IconButton(onClick = { showSettings = true }) {
                        Icon(
                            imageVector = Icons.Outlined.Edit,
                            contentDescription = "Edit server address",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(18.dp),
                        )
                    }
                }
            }

            Spacer(Modifier.height(32.dp))
        }
    }

    if (showSettings) {
        ServerSettingsSheet(
            config = container.config,
            onDismiss = { showSettings = false },
        )
    }
}

@Composable
private fun PipelineRow(index: String, icon: androidx.compose.ui.graphics.vector.ImageVector, label: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 10.dp),
    ) {
        Text(
            text = index,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.primary,
        )
        Spacer(Modifier.size(14.dp))
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(18.dp),
        )
        Spacer(Modifier.size(14.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface,
            textAlign = TextAlign.Start,
            modifier = Modifier.weight(1f),
        )
    }
}
