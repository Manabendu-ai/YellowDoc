package com.yellowdoc.app.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

private val YellowDocColors = darkColorScheme(
    primary = MintPrimary,
    onPrimary = OnMint,
    primaryContainer = MintContainer,
    onPrimaryContainer = OnMintContainer,
    secondary = AmberAccent,
    onSecondary = Color(0xFF2A2005),
    background = InkBackground,
    onBackground = TextPrimary,
    surface = InkSurface,
    onSurface = TextPrimary,
    surfaceVariant = InkSurfaceHigh,
    onSurfaceVariant = TextSecondary,
    outline = InkOutline,
    outlineVariant = InkOutline,
    error = RedError,
)

private val YellowDocShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(20.dp),
    extraLarge = RoundedCornerShape(28.dp),
)

/**
 * The app is intentionally always-dark: a premium fintech look with an
 * emerald accent on near-black surfaces.
 */
@Composable
fun YellowDocTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = YellowDocColors,
        typography = AppTypography,
        shapes = YellowDocShapes,
        content = content,
    )
}
