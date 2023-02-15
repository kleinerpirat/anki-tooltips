// Anki Tooltips
// Copyright (C) 2023 Matthias Metelka
// License: GNU AGPL, version 3 or later; http://www.gnu.org/licenses/agpl.html

import type { Instance } from "tippy.js";

export interface TooltipAnchor extends HTMLElement {
    "data-tippy-content": string;
    _tippy: Instance;
}

/**
 * Represents a keyboard shortcut, consisting of a key and optional modifier keys.
 *
 * @param {string} shortcutString - String representation of the shortcut, e.g. 'Shift+Tab' or 'Ctrl+Alt+A'.
 * @property {string} key - Key for the shortcut, such as "Tab" or "Enter".
 * @property {boolean} ctrlKey - Whether the Ctrl key is part of the shortcut.
 * @property {boolean} shiftKey - Whether the Shift key is part of the shortcut.
 * @property {boolean} altKey - Whether the Alt key is part of the shortcut.
 */
export class Shortcut {
    key: string;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;

    constructor(key: string) {
        this.key = key;
        this.ctrlKey = false;
        this.shiftKey = false;
        this.altKey = false;

        const keyModifiers = key.split("+");
        for (const modifier of keyModifiers) {
            switch (modifier.toLowerCase().trim()) {
                case "ctrl":
                case "control":
                    this.ctrlKey = true;
                    break;
                case "shift":
                    this.shiftKey = true;
                    break;
                case "alt":
                    this.altKey = true;
                    break;
                default:
                    this.key = modifier.trim();
            }
        }
    }

    isPressed(event: KeyboardEvent) {
        /**
         * Determines if a keyboard event matches this shortcut.
         * @param {KeyboardEvent} event - The event to check.
         * @returns {boolean} Whether the event matches this shortcut.
         */
        return (
            event.code === this.key &&
            event.ctrlKey === this.ctrlKey &&
            event.shiftKey === this.shiftKey &&
            event.altKey === this.altKey
        );
    }
}
