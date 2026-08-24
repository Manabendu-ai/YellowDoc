package com.ledgermind.app

import android.app.Application
import com.ledgermind.app.core.AppContainer

class LedgerMindApplication : Application() {

    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
