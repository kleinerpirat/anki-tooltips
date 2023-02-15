# Anki Tooltips
# Copyright (C) 2023 Matthias Metelka
# License: GNU AGPL, version 3 or later; http://www.gnu.org/licenses/agpl.html

import re
import html
from bs4 import BeautifulSoup
import warnings

from aqt.editor import Editor
from aqt.gui_hooks import editor_will_munge_html

# BeautifulSoup occasionally throws errors, e.g. when the content looks like a filename
warnings.filterwarnings("ignore", category=UserWarning, module="bs4")


def on_editor_will_munge_html(txt: str, editor: Editor) -> str:
    """
    Filter out unwanted HTML before it is stored to the database.

    We don't want to save the extra HTML that's inside <anki-editable>
    when the TooltipEditor is active or Anki crashes during editing.
    """

    soup = BeautifulSoup(txt, "html.parser")

    # delete tippy.js HTML and elements marked with class "transient"
    for element in soup.select("[data-tippy-root], .transient"):
        element.decompose()

    # remove trailing whitespace
    return re.sub(r"\s*(<br\/?>)+\s*$", "", html.unescape(str(soup)))


def init_editor() -> None:
    editor_will_munge_html.append(on_editor_will_munge_html)
