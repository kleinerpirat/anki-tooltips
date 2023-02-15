# Anki Tooltips
# Copyright (C) 2023 Matthias Metelka
# License: GNU AGPL, version 3 or later; http://www.gnu.org/licenses/agpl.html

# ProfileConfig and ModelConfig from Closet add-on for Anki
# Copyright (C) 2021 Henrik Giesel
# License: GNU General Public License v3.0; https://www.gnu.org/licenses/gpl-3.0-standalone.html

from aqt import mw
from typing import Any, Optional, Literal


class ProfileConfig:
    """
    Used for profile-specific settings.
    """

    def __init__(self, keyword: str, default: Any):
        self.keyword = keyword
        self.default = default

    @property
    def value(self) -> Any:
        return mw.pm.profile.get(self.keyword, self.default)

    @value.setter
    def value(self, new_value: Any):
        mw.pm.profile[self.keyword] = new_value

    def remove(self):
        try:
            del mw.pm.profile[self.keyword]
        except KeyError:
            # same behavior as Collection.remove_config
            pass


# shortcut in editor
tooltip_shortcut = ProfileConfig("tooltipShortcut", "Ctrl+T")


class ModelConfig:
    """
    Used for model-specific settings.
    """

    def __init__(self, keyword: str, default: Any):
        self.keyword = keyword
        self.default = default

    @property
    def model_id(self) -> int:
        return self.model["id"]

    @model_id.setter
    def model_id(self, model_id: int):
        self.model = mw.col.models.get(model_id)

    @property
    def model_name(self) -> str:
        return self.model["name"]

    @model_name.setter
    def model_name(self, model_name: str):
        model_id = mw.col.models.id_for_name(model_name)
        self.model = mw.col.models.get(model_id)

    @property
    def value(self) -> Any:
        return self.model[self.keyword] if self.keyword in self.model else self.default

    @value.setter
    def value(self, new_value: Any):
        self.model[self.keyword] = new_value

    def remove(self):
        try:
            del self.model[self.keyword]
        except KeyError:
            # same behavior as Collection.remove_config
            pass


# whether to insert tooltip script at all into notetype
tooltips_enabled = ModelConfig("tooltipsEnabled", False)

# whether to insert tooltip script on the front template of a card
show_on_front = ModelConfig("showOnFront", False)

# shortcuts to cycle between tooltips during review
prev_shortcut = ModelConfig("tooltipsPrevShortcut", "Shift+Tab")
next_shortcut = ModelConfig("tooltipsNextShortcut", "Tab")
