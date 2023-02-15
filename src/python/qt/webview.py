# Anki Tooltips
# Copyright (C) 2023 Matthias Metelka
# License: GNU AGPL, version 3 or later; http://www.gnu.org/licenses/agpl.html

from aqt import mw

from aqt.gui_hooks import webview_will_set_content
from aqt.editor import Editor
from aqt.webview import WebContent
from ..config import tooltip_shortcut
from typing import Any

# This is required if you want to load any external resources into Anki's webviews
mw.addonManager.setWebExports(__name__, r"gui/icons|web/editor.*\.(js|css|svg)")


def on_webview_will_set_content(web_content: WebContent, context: Any):
    """
    Load JS and CSS files into Editor
    """
    if isinstance(context, Editor):
        addon_package = context.mw.addonManager.addonFromModule(__name__)
        base_path = f"/_addons/{addon_package}/web/editor"

        web_content.js.append(f"{base_path}/index.js")
        web_content.css.append(f"{base_path}/index.css")

        web_content.head += f"""<script>globalThis.tooltipShortcut = "{
            tooltip_shortcut.value.replace("Ctrl", "Control")
        }";</script>"""


def init_webview():
    webview_will_set_content.append(on_webview_will_set_content)
