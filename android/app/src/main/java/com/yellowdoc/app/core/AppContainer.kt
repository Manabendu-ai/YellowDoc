package com.yellowdoc.app.core

import android.content.Context
import com.yellowdoc.app.data.repo.YellowRepository

/**
 * Minimal manual dependency container owned by the [Application] instance.
 */
class AppContainer(context: Context) {
    val config = AppConfig(context)
    val repository = YellowRepository(config)
}
