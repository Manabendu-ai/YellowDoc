package com.yellowdoc.app

import android.app.Application
import com.yellowdoc.app.core.AppContainer

class YellowDocApplication : Application() {

    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
