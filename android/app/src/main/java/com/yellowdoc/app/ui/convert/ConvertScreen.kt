package com.yellowdoc.app.ui.convert

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.Crossfade
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.outlined.PictureAsPdf
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarResult
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.yellowdoc.app.core.AppContainer
import com.yellowdoc.app.ui.components.GhostButton
import com.yellowdoc.app.ui.components.LmCard
import com.yellowdoc.app.ui.components.LmTopBar
import com.yellowdoc.app.ui.components.PrimaryButton
import com.yellowdoc.app.ui.components.SectionLabel

@Composable
fun ConvertScreen(
    container: AppContainer,
    onBack: () -> Unit,
) {
    val viewModel: ConvertViewModel = viewModel(
        factory = viewModelFactory {
            initializer { ConvertViewModel(container.repository) }
        },
    )
    val state by viewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }

    val pdfPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument(),
    ) { uri ->
        if (uri != null) {
            viewModel.onFilePicked(context.contentResolver, uri)
        }
    }

    LaunchedEffect(state.message) {
        state.message?.let { message ->
            val result = snackbarHostState.showSnackbar(message)
            if (result == SnackbarResult.Dismissed || result == SnackbarResult.ActionPerformed) {
                viewModel.consumeMessage()
            }
        }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            LmTopBar(title = "PDF → Excel", onBack = onBack, subtitle = "Invoice · Receipt · Tax document")
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp),
        ) {
            Spacer(Modifier.height(12.dp))

            // ── File picker / selected file ──────────────────────────
            Crossfade(
                targetState = state.file,
                label = "filePicker",
            ) { file ->
                if (file == null) {
                    EmptyPickerCard(onClick = { pdfPicker.launch(arrayOf("application/pdf")) })
                } else {
                    SelectedFileCard(
                        fileName = file.name,
                        sizeLabel = file.sizeLabel,
                        onChangeClick = { pdfPicker.launch(arrayOf("application/pdf")) },
                    )
                }
            }

            Spacer(Modifier.height(20.dp))

            // ── Excel name ───────────────────────────────────────────
            SectionLabel(text = "Workbook name")
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = state.excelName,
                onValueChange = viewModel::setExcelName,
                placeholder = { Text("e.g. invoice_march") },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(Modifier.height(24.dp))

            // ── Generate ─────────────────────────────────────────────
            PrimaryButton(
                text = when (state.phase) {
                    ConvertViewModel.Phase.GENERATING -> state.progressLabel
                    else -> "Generate Excel"
                },
                onClick = { viewModel.generate(context.contentResolver) },
                enabled = state.file != null && state.phase != ConvertViewModel.Phase.GENERATING,
                loading = state.phase == ConvertViewModel.Phase.GENERATING,
                modifier = Modifier.fillMaxWidth(),
            )

            if (state.phase == ConvertViewModel.Phase.GENERATING) {
                Spacer(Modifier.height(14.dp))
                LinearProgressIndicator(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(4.dp),
                    color = MaterialTheme.colorScheme.primary,
                    trackColor = MaterialTheme.colorScheme.surfaceVariant,
                )
                Text(
                    text = "This can take a minute for long documents.",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }

            // ── Success card ─────────────────────────────────────────
            AnimatedVisibility(
                visible = state.phase == ConvertViewModel.Phase.SUCCESS && state.result != null,
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically(),
            ) {
                val result = state.result
                if (result != null) {
                    Column {
                        Spacer(Modifier.height(24.dp))
                        LmCard(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(18.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Outlined.CheckCircle,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.primary,
                                    )
                                    Spacer(Modifier.size(10.dp))
                                    Text(
                                        text = "Workbook ready",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = MaterialTheme.colorScheme.onSurface,
                                    )
                                }
                                Spacer(Modifier.height(6.dp))
                                Text(
                                    text = result.file ?: state.excelName,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                                Spacer(Modifier.height(16.dp))
                                PrimaryButton(
                                    text = if (state.downloading) "Downloading…" else "Download Excel",
                                    onClick = { viewModel.download(context) },
                                    loading = state.downloading,
                                    modifier = Modifier.fillMaxWidth(),
                                )
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(28.dp))
        }
    }
}

@Composable
private fun EmptyPickerCard(onClick: () -> Unit) {
    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .fillMaxWidth()
            .height(180.dp)
            .background(
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                shape = RoundedCornerShape(20.dp),
            )
            .border(
                width = 1.dp,
                color = MaterialTheme.colorScheme.outline,
                shape = RoundedCornerShape(20.dp),
            )
            .clickable(onClick = onClick),
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = Icons.Outlined.PictureAsPdf,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(34.dp),
            )
            Spacer(Modifier.height(10.dp))
            Text(
                text = "Tap to choose a PDF",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = "Invoices, receipts, bills, tax papers",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun SelectedFileCard(
    fileName: String,
    sizeLabel: String,
    onChangeClick: () -> Unit,
) {
    LmCard(modifier = Modifier.fillMaxWidth()) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(16.dp),
        ) {
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
            Spacer(Modifier.size(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = fileName,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = sizeLabel,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            GhostButton(text = "Change", onClick = onChangeClick)
        }
    }
}
