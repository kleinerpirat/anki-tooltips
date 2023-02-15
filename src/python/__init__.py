# Anki Tooltips
# Copyright (C) 2023 Matthias Metelka
# License: GNU AGPL, version 3 or later; http://www.gnu.org/licenses/agpl.html

from .refresh import init_refresh
from .qt.webview import init_webview
from .qt.editor import init_editor
from .qt.addons import init_config_button
from .qt.models import init_models_button

init_refresh()
init_webview()
init_editor()
init_config_button()
init_models_button()
