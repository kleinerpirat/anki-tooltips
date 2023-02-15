# Anki Tooltips
# Copyright (C) 2023 Matthias Metelka
# License: GNU AGPL, version 3 or later; http://www.gnu.org/licenses/agpl.html

from aqt import QDialog, QLayout, QKeySequence, qtmajor
from ...version import version

if qtmajor < 6:
    from ..forms.qt5.model_settings_ui import Ui_Settings
else:
    from ..forms.qt6.model_settings_ui import Ui_Settings


class ModelSettings(QDialog):
    """
    Dialog shown when clicking on "Tooltips..." in Manage Notetypes.
    """

    def __init__(self, mw, mid, callback):
        super().__init__(parent=mw)
        self.mw = mw
        self.mid = mid
        self.ui = Ui_Settings()
        self.ui.setupUi(self)
        self.callback = callback
        self.ui.tippyEnabled.stateChanged.connect(self.ui.generalGroup.setEnabled)
        self.ui.tippyEnabled.stateChanged.connect(self.ui.shortcutGroup.setEnabled)
        self.ui.saveButton.clicked.connect(self.accept)
        self.ui.cancelButton.clicked.connect(self.reject)
        self.layout().setSizeConstraint(QLayout.SizeConstraint.SetFixedSize)

    def setupUi(
        self,
        tooltips_enabled: bool,
        show_on_front: bool,
        prev_shortcut: str,
        next_shortcut: str,
    ):
        self.ui.tippyEnabled.setChecked(tooltips_enabled)
        self.ui.generalGroup.setEnabled(tooltips_enabled)
        self.ui.shortcutGroup.setEnabled(tooltips_enabled)
        self.ui.showFrontCheckBox.setChecked(show_on_front)
        self.ui.prevShortcut.setKeySequence(QKeySequence(prev_shortcut))
        self.ui.nextShortcut.setKeySequence(QKeySequence(next_shortcut))
        self.ui.versionLabel.setText(f"Version: {version}")

    def accept(self):
        self.callback(
            self.ui.tippyEnabled.isChecked(),
            self.ui.showFrontCheckBox.isChecked(),
            self.ui.prevShortcut.keySequence().toString(),
            self.ui.nextShortcut.keySequence().toString(),
            self.mid,
        )

        super().accept()
