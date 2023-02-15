// Anki Tooltips
// Copyright (C) 2023 Matthias Metelka
// License: GNU AGPL, version 3 or later; http://www.gnu.org/licenses/agpl.html

import { get } from "svelte/store";
import type { RichTextInputAPI } from "@anki/editor/rich-text-input";
// @ts-ignore
import * as NoteEditor from "anki/NoteEditor";
import { bubbleSymbol } from "./lib";

/**
 * Simple method to get the add-on path from the JS side,
 * which we need to link our CSS file into the fields.
 *
 * @example
 * If the script is appended to the document body like this:
 * ```html
 * <script src="http://127.0.0.1:40000/_addons/123456789/web/editor/editor.js"></script>
 * ```
 * then `addonPackageFromScript(document.currentScript)` will return
 * ```js
 * "_addons/123456789"
 * ```
 * @param script - The script from which to obtain the add-on path.
 * @returns The base path you can use to import files from your add-on.
 */
export function addonPackageFromScript(script: HTMLScriptElement): string {
    return script.getAttribute("src")!.match(/(_addons\/.+?)\//)![1];
}

export function selectionIsEmpty(selection: Selection): boolean {
    const fragment = selection.getRangeAt(0).cloneContents();
    return !fragment.hasChildNodes() || fragment.textContent?.trim() == "";
}

export async function getCurrentSelection(): Promise<Selection | null> {
    const focusedInput = get(NoteEditor.instances[0].focusedInput) as RichTextInputAPI;
    const editable = await focusedInput.element;

    return editable.getRootNode()?.getSelection();
}

function getSelection(element: Node): Selection | null {
    const root = element.getRootNode();

    if (root.getSelection) {
        return root.getSelection();
    }

    return document.getSelection();
}

function placeCaret(node: Node, range: Range): void {
    const selection = getSelection(node)!;
    selection.removeAllRanges();
    selection.addRange(range);
}

export function placeCaretAfter(node: Node): void {
    const range = new Range();
    range.setStartAfter(node);
    range.collapse(true);

    placeCaret(node, range);
}

export function moveCaretToEnd(el: HTMLElement) {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const selection = el.getRootNode().getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
}

export function encodeAttribute(html: string) {
    return html.replace(/["&<>]/g, (m) => {
        return {
            '"': "&quot;",
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
        }[m]!;
    });
}

export function decodeAttribute(html: string) {
    return html.replace(/&quot;|&amp;|&lt;|&gt;/g, (m) => {
        return {
            "&quot;": '"',
            "&amp;": "&",
            "&lt;": "<",
            "&gt;": ">",
        }[m]!;
    });
}

export function createTooltipAnchor(content = ""): HTMLAnchorElement {
    const anchor = document.createElement("a");
    anchor.className = "new";
    anchor.setAttribute("data-tippy-content", "");
    anchor.innerHTML = content;

    return anchor;
}

/**
 * If the caret is inside a word, surround it with a tooltip anchor.
 * 
 * Should only be called when the selection is empty.
 *
 * @param selection The Selection object to scan
 * @returns {boolean} Whether the operation was successful
 */
export function wrapWordFromSelection(selection: Selection): boolean {
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const text = container.textContent;
    if (!text) {
        return false;
    }
    const startIndex = range.startOffset;
    const endIndex = range.endOffset;

    // traverse to the left until non-word char is matched or zero-index reached
    let left = startIndex;
    while (left > 0 && isWordChar(text[left - 1])) {
        left--;
    }
    // traverse to the right until non-word char is matched or max-index reached
    let right = endIndex;
    while (right < text.length && isWordChar(text[right])) {
        right++;
    }
    // no word char to either side of the caret
    if (left === right) {
        return false;
    }

    range.setStart(container, left);
    range.setEnd(container, right);

    const anchor = createTooltipAnchor(bubbleSymbol);
    range.surroundContents(anchor);
    anchor.dispatchEvent(new Event("newTooltip", { bubbles: true }));

    return true;
}

function isWordChar(char: string) {
    return /\w/.test(char);
}
