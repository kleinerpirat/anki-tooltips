# Anki Tooltips
# Copyright (C) 2023 Matthias Metelka
# License: GNU AGPL, version 3 or later; http://www.gnu.org/licenses/agpl.html

from typing import Union, Optional

from aqt import mw, QDialog, QLayout, QKeySequence, qtmajor
from aqt.addons import AddonsDialog
from aqt.gui_hooks import addons_dialog_will_show

from ..gui.dialogs.settings import Settings
from ..config import tooltip_shortcut
from ..version import version


def set_settings(shortcut: str) -> None:
    tooltip_shortcut.value = shortcut


addons_current: Optional[AddonsDialog] = None


def save_addons_window(addons) -> None:
    global addons_current
    addons_current = addons


def show_settings() -> None:
    dialog = Settings(addons_current, set_settings)

    dialog.setupUi(
        tooltip_shortcut.value,
    )
    return dialog.open()


def init_config_button() -> None:
    addons_dialog_will_show.append(save_addons_window)
    mw.addonManager.setConfigAction(__name__, show_settings)
