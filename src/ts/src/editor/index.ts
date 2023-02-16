// Anki Tooltips
// Copyright (C) 2023 Matthias Metelka
// License: GNU AGPL, version 3 or later; http://www.gnu.org/licenses/agpl.html

import "./styles/field.scss";
import { get } from "svelte/store";

// Our Svelte components
import TooltipButton from "./components/TooltipButton.svelte";
import TooltipAnchor from "./components/TooltipAnchor.svelte";

import {
    decodeAttribute,
    addonPackageFromScript,
    insertStyles,
    restoreCaretPosition,
} from "./utils";

/**
 * The following import may seem like regular static ESM import, but it's not.
 *
 * @example
 * ```ts
 * import * as NoteEditor from "anki/NoteEditor";
 * ```
 * is compiled by esbuild to:
 * ```js
 * const NoteEditor = require("anki/NoteEditor");
 * ```
 *
 * So we're dynamically importing Anki packages at runtime.
 * The TS error "Cannot find module 'X' or its corresponding typ declarations." can be ignored.
 *
 * @see {@link https://github.com/ankitects/anki/blob/main/ts/lib/runtime-require.ts}
 * for all available packages.
 *
 * Info from {@link https://github.com/hgiesel/anki_new_format_pack/blob/master/ts/src/editor.ts}
 */
// @ts-ignore
import * as NoteEditor from "anki/NoteEditor";
/**
 * "@anki" is an alias for the Anki submodule ("../../../../anki/ts/*").
 * It should only be used for types - other imports are likely to fail.
 */
import type { NoteEditorAPI } from "@anki/editor/NoteEditor.svelte";
import type { EditorFieldAPI } from "@anki/editor/EditorField.svelte";
import type { RichTextInputAPI } from "@anki/editor/rich-text-input";
import type { PlainTextInputAPI } from "@anki/editor/plain-text-input";

const addonPackage = addonPackageFromScript(
    document.currentScript as HTMLScriptElement,
);

/**
 * Anki minor version exposed in qt/webview.py
 * On lower versions it might not be initialized at the time of this assignment.
 */
const pointVersion: number | undefined = globalThis.pointVersion;
const legacy = pointVersion == undefined || pointVersion <= 54;

/**
 * Surrounding logic got reworked for 2.1.55, so this is either the
 * surrounder from RichTextInput (2.1.55+)
 * or a newly created Surrounder instance.
 */
const surrounder = legacy
    ? require("anki/surround").Surrounder.make()
    : require("anki/RichTextInput").surrounder;

NoteEditor.lifecycle.onMount(({ toolbar }: NoteEditorAPI): void => {
    toolbar.templateButtons.append({
        component: TooltipButton,
        // profile-specific shortcut set in qt/webview.py
        props: { surrounder, keyCombination: globalThis.tooltipShortcut },
        id: "tooltipButton",
    });
});

/**
 * lifecycle.onMount is called when the respective component is mounted to the DOM.
 * We can use this to add CSS and EventListeners to <anki-editable>.
 *
 * @see {@link https://github.com/ankitects/anki/blob/main/ts/editor/rich-text-input/RichTextInput.svelte}
 * for all available API properties.
 */
if (pointVersion && pointVersion >= 54) {
    // richTextInput got exposed in 2.1.54
    require("anki/RichTextInput").lifecycle.onMount(setupRichTextInput);
} else {
    /**
     * Workaround for older Anki versions.
     * Unfortunately the inputs are not yet mounted when
     * NoteEditor.lifecycle.onMount fires, so we need that while loop.
     */
    NoteEditor.lifecycle.onMount(async (noteEditor: NoteEditorAPI) => {
        while (!noteEditor.fields?.length) {
            await new Promise(requestAnimationFrame);
        }
        noteEditor.fields.forEach((field: EditorFieldAPI) => {
            const inputs = get(field.editingArea.editingInputs) as [
                RichTextInputAPI,
                PlainTextInputAPI,
            ];
            setupRichTextInput(inputs[0]);
        });
    });
}

/**
 * Add styles and EventListeners to <anki-editable>
 */
async function setupRichTextInput(api: RichTextInputAPI) {
    const { customStyles, element, preventResubscription } = api;

    if (legacy && !surrounder.richText) {
        surrounder.richText = api;
    }

    const editable = await element;

    insertStyles(
        customStyles,
        editable,
        `./${addonPackage}/web/editor/index.css`,
        "tooltipStyles",
    );

    /**
     *  Event delegation to <anki-editable> works, but
     *  EventListeners added to elements inside <anki-editable> will not (!)
     *
     *  That's because the resubscription process between PlainTextInput and RichTextInput
     *  sets the innerHTML of <anki-editable>, i.e. destroys all elements and creates new ones.
     *
     *  @see {@link https://forums.ankiweb.net/t/tip-dynamic-html-js-inside-anki-editable/}
     */
    editable.addEventListener("click", onTrigger);

    /**
     * Instead of querying the API via require("anki/NoteEditor").instances[0].fields etc. at runtime,
     * it's best to keep the resubscription logic inside RichTextInput.lifecycle.onMount.
     *
     * We do so by attaching an EventListener for a custom event "newTooltip":
     */
    editable.addEventListener("newTooltip", onTrigger);

    /**
     * @deprecated Required for versions below 2.1.55
     */
    if (legacy) {
        editable.addEventListener("focusin", () => {
            surrounder.richText = api;
        });
        editable.addEventListener("focusout", () => {
            surrounder.disable();
        });
    }

    /**
     * Replace "dumb" `<a>` tag with dynamic Svelte component
     */
    function onTrigger(e: Event) {
        if (
            !e.target ||
            !(e.target instanceof HTMLAnchorElement) ||
            !e.target.hasAttribute("data-tippy-content") ||
            e.target.classList.contains("active")
        ) {
            return;
        }

        /**
         * Function returned from preventResubscription to enable resubscription again.
         * @see {@link https://forums.ankiweb.net/t/tip-dynamic-html-js-inside-anki-editable/}
         */
        const callback = preventResubscription();

        const anchor = e.target;
        const previousSibling = anchor.previousElementSibling;

        const svelteAnchor = new TooltipAnchor({
            target: anchor.parentElement ?? editable,
            anchor,
            props: {
                editable,
                anchorContent: anchor.innerHTML,
                tooltipContent: decodeAttribute(anchor.dataset.tippyContent!),
            },
        });

        anchor.remove();

        /**
         * Svelte components can't directly self-destruct, so we listen
         * for a message from TooltipAnchor to destroy it from outside.
         */
        svelteAnchor.$on("destroyComponent", () => {
            svelteAnchor.$destroy();
            setTimeout(() => {
                // Reenable resubscription
                callback();
                restoreCaretPosition(editable, previousSibling);
            });
        });
    }
}
