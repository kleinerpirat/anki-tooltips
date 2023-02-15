# Anki Tooltips
# Copyright (C) 2023 Matthias Metelka
# License: GNU AGPL, version 3 or later; http://www.gnu.org/licenses/agpl.html

import re
import os
from glob import glob
from os import remove
from os.path import basename, dirname, realpath
from pathlib import Path

from typing import Callable

from aqt import mw
from aqt.gui_hooks import profile_did_open


def get_source(source_name: str) -> Callable[[], str]:
    """
    Returns compiled template js and css from add-on folder.
    """
    filepath = Path(dirname(realpath(__file__)), "web", source_name)

    with open(filepath, mode="r", encoding="utf-8") as file:
        return file.read().strip()


template_js = get_source("template/index.js")
template_css = get_source("template/index.css")


def refresh_media(*args) -> None:
    """
    Overwrites script files in collection.media with current version.
    This ensures the files get synced to AnkiWeb at all times.
    Executing this at startup should suffice for most development workflows.
    """
    if not (basepath := mw.col.media.dir()):
        return

    js_file = Path(basepath, "_anki-tooltips.js")
    css_file = Path(basepath, "_anki-tooltips.css")

    # Don't use Anki deletion API, otherwise files end up in Anki trash
    if os.path.exists(js_file):
        remove(js_file)

    if os.path.exists(css_file):
        remove(css_file)

    # Using redundant f-string to circumvent a bug that prevents filenames starting with a single low dash
    mw.col.media.write_data(f"_anki-tooltips.js", template_js.encode())
    mw.col.media.write_data(f"_anki-tooltips.css", template_css.encode())


def init_refresh():
    profile_did_open.append(refresh_media)
