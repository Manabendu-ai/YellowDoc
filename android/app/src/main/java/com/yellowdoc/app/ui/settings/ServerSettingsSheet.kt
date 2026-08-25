package com.yellowdoc.app.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.yellowdoc.app.core.AppConfig
import com.yellowdoc.app.ui.components.PrimaryButton
import com.yellowdoc.app.ui.components.SectionLabel
import kotlinx.coroutines.launch

/**
 * Bottom sheet for pointing the app at the FastAPI server.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServerSettingsSheet(
    config: AppConfig,
    onDismiss: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    var value by remember { mutableStateOf(config.currentBaseUrl) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp),
        ) {
            SectionLabel(text = "Settings")
            Spacer(Modifier.height(8.dp))
            Text(
                text = "Server address",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = "Point the app at your YellowDoc FastAPI server. On a physical device, use your computer's LAN IP.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(Modifier.height(20.dp))

            OutlinedTextField(
                value = value,
                onValueChange = { value = it },
                label = { Text("Base URL") },
                supportingText = { Text("Example: http://192.168.1.20:8000") },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(Modifier.height(12.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = false,
                    onClick = { value = AppConfig.DEFAULT_BASE_URL },
                    label = { Text("Emulator") },
                )
                FilterChip(
                    selected = false,
                    onClick = { value = "http://localhost:8000" },
                    label = { Text("Localhost") },
                )
            }

            Spacer(Modifier.height(20.dp))

            PrimaryButton(
                text = "Save address",
                onClick = {
                    scope.launch {
                        config.setBaseUrl(value)
                        onDismiss()
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(Modifier.height(28.dp))
        }
    }
}
