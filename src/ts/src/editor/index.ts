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
import type { Callback } from "@anki/lib/typing";

const addonPackage = addonPackageFromScript(
    document.currentScript as HTMLScriptElement,
);

/**
 * Anki minor version exposed by the add-on in qt/webview.py
 * On lower versions it might not be initialized at the time of this assignment.
 */
const pointVersion: number | undefined = globalThis.pointVersion;
const legacy = pointVersion == undefined || pointVersion <= 54;

/**
 * The Surrounder class got reworked for 2.1.55, so this is either
 * - the Surrounder of RichTextInput (2.1.55+)
 * - or a newly created Surrounder instance (2.1.50 - 2.1.54)
 */
const surrounder = legacy
    ? require("anki/surround").Surrounder.make()
    : require("anki/RichTextInput").surrounder;

NoteEditor.lifecycle.onMount(({ toolbar }: NoteEditorAPI): Callback => {
    /**
     * DefaultSlotInterface.append returns a callback to destroy the added component,
     * which we use as our return value for lifecycle.onMount here:
     */
    const callback = toolbar.templateButtons.append({
        component: TooltipButton,
        // profile-specific shortcut set in qt/webview.py
        props: { surrounder, keyCombination: globalThis.tooltipShortcut },
        id: "tooltipButton",
    });

    /**
     * The return value must be a synchronous callback, but the destroy callback from
     * append needs to be awaited. An async IIFE solves this:
     */
    return () => {
        (async () => {
            (await callback).destroy();
        })();
    };
});

/**
 * The callback passed to lifecycle.onMount is called when the respective component is mounted to the DOM.
 * We can use this to add CSS and EventListeners to <anki-editable>.
 *
 * @see {@link https://github.com/ankitects/anki/blob/main/ts/editor/rich-text-input/RichTextInput.svelte}
 * for all available API properties.
 *
 * The callback must return a cleanup function.
 */
if (pointVersion && pointVersion >= 54) {
    // richTextInput is available since 2.1.54
    require("anki/RichTextInput").lifecycle.onMount(setupRichTextInput);
} else {
    /**
     * Workaround for older Anki versions. Since we want to attach styles and
     * EventListeners to newly added fields (e.g. when the notetype changes),
     * it's easiest to use a MutationObserver on the parent element of
     * the fields (`<div class=".fields">`) and iterate over
     * `NoteEditor.instances[0].fields` whenever an element is added/removed.
     */
    NoteEditor.lifecycle.onMount((noteEditor: NoteEditorAPI): Callback => {
        const observer = new MutationObserver(() => {
            noteEditor.fields.forEach(async (field: EditorFieldAPI): Promise<void> => {
                const inputs = get(field.editingArea.editingInputs) as [
                    RichTextInputAPI,
                    PlainTextInputAPI,
                ];
                const richText = inputs[0];
                const editable = await richText.element;
                if (editable.hasAttribute("tooltipsInitialized")) {
                    return;
                }
                setupRichTextInput(richText);
                editable.setAttribute("tooltipsInitialized", "");
            });
        });
        observer.observe(document.querySelector(".fields")!, { childList: true });

        return function cleanup() {
            observer.disconnect();
        };
    });
}

/**
 * Add styles and EventListeners to <anki-editable>
 */
function setupRichTextInput(api: RichTextInputAPI) : Callback {
    const { customStyles, element, preventResubscription } = api;

    const callback = (async () => {
        // <anki-editable>
        const editable = await element;

        if (legacy && !surrounder.richText) {
            surrounder.richText = api;
        }

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

        return () => {
            editable.removeEventListener("click", onTrigger);
            editable.removeEventListener("newTooltip", onTrigger);
        };
    })();

    return () => {
        (async () => {
            (await callback)();
        })
    }
}
