package com.ledgermind.app.core

import android.content.Context
import com.ledgermind.app.data.repo.LedgerRepository

/**
 * Minimal manual dependency container owned by the [Application] instance.
 */
class AppContainer(context: Context) {
    val config = AppConfig(context)
    val repository = LedgerRepository(config)
}
