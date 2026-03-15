package ai.foxclaw.app.ui

import androidx.compose.runtime.Composable
import ai.foxclaw.app.MainViewModel
import ai.foxclaw.app.ui.chat.ChatSheetContent

@Composable
fun ChatSheet(viewModel: MainViewModel) {
  ChatSheetContent(viewModel = viewModel)
}
