# Anki Tooltips
# Copyright (C) 2023 Matthias Metelka
# License: GNU AGPL, version 3 or later; http://www.gnu.org/licenses/agpl.html

from aqt import QDialog, QLayout, QKeySequence, qtmajor
from ...version import version

if qtmajor < 6:
    from ..forms.qt5.settings_ui import Ui_Settings
else:
    from ..forms.qt6.settings_ui import Ui_Settings


class Settings(QDialog):
    """
    Dialog shown when clicking on "Config" in the Add-ons window.
    """

    def __init__(self, parent, callback):
        super().__init__(parent=parent)

        self.ui = Ui_Settings()
        self.ui.setupUi(self)
        self.cb = callback
        self.layout().setSizeConstraint(QLayout.SizeConstraint.SetFixedSize)

    def setupUi(self, tooltip_shortcut: str) -> None:
        self.ui.tippyShortcut.setKeySequence(QKeySequence(tooltip_shortcut))
        self.ui.versionInfo.setText(f"Version: {version}")

    def accept(self):
        tooltip_shortcut = self.ui.tippyShortcut.keySequence().toString()
        self.cb(tooltip_shortcut)
        super().accept()
