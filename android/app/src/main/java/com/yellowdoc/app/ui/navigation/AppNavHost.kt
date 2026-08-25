package com.yellowdoc.app.ui.navigation

import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.yellowdoc.app.core.AppContainer
import com.yellowdoc.app.ui.chat.ChatScreen
import com.yellowdoc.app.ui.convert.ConvertScreen
import com.yellowdoc.app.ui.home.HomeScreen

object Routes {
    const val HOME = "home"
    const val CONVERT = "convert"
    const val CHAT = "chat"
}

@Composable
fun AppNavHost(container: AppContainer) {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Routes.HOME,
        enterTransition = {
            fadeIn(tween(240)) + slideInHorizontally(tween(280)) { it / 10 }
        },
        exitTransition = {
            fadeOut(tween(180))
        },
        popEnterTransition = {
            fadeIn(tween(240))
        },
        popExitTransition = {
            fadeOut(tween(180)) + slideOutHorizontally(tween(280)) { it / 10 }
        },
    ) {
        composable(Routes.HOME) {
            HomeScreen(
                container = container,
                onOpenConvert = { navController.navigate(Routes.CONVERT) },
                onOpenChat = { navController.navigate(Routes.CHAT) },
            )
        }
        composable(Routes.CONVERT) {
            ConvertScreen(
                container = container,
                onBack = { navController.popBackStack() },
            )
        }
        composable(Routes.CHAT) {
            ChatScreen(
                container = container,
                onBack = { navController.popBackStack() },
            )
        }
    }
}
