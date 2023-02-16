// Anki Tooltips
// Copyright (C) 2023 Matthias Metelka
// License: GNU AGPL, version 3 or later; http://www.gnu.org/licenses/agpl.html

import "./styles/field.scss";

// Our Svelte components
import TooltipButton from "./components/TooltipButton.svelte";
import TooltipAnchor from "./components/TooltipAnchor.svelte";

import { decodeAttribute, addonPackageFromScript, placeCaretAfter } from "./utils";

/**
 * The following imports may seem like regular static ESM imports, but they're not.
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
// @ts-ignore
import * as RichTextInput from "anki/RichTextInput";

/**
 * "@anki" is an alias for the Anki submodule ("../../../../anki/ts/*").
 * It should only be used for types - other imports are likely to fail.
 */
import type { NoteEditorAPI } from "@anki/editor/NoteEditor.svelte";
import type { RichTextInputAPI } from "@anki/editor/rich-text-input";

const addonPackage = addonPackageFromScript(
    document.currentScript as HTMLScriptElement,
);

/**
 * Surrounding logic got reworked for 2.1.55, so we need
 * to handle versions below that separately.
 *
 * pointVersion {int} - Anki minor version exposed in qt/webview.py
 */
const surrounder =
    globalThis.pointVersion <= 54
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
RichTextInput.lifecycle.onMount(async (api: RichTextInputAPI) => {
    const { customStyles, element, preventResubscription } = api;

    if (globalThis.pointVersion <= 54 && !surrounder.richText) {
        surrounder.richText = api;
    }

    /**
     * Insert CSS into shadowRoot via CustomStyles component
     * @see {@link https://github.com/ankitects/anki/pull/1918}
     */
    const { addStyleLink } = await customStyles;
    addStyleLink("tooltipStyles", `./${addonPackage}/web/editor/index.css`);

    const editable = await element;

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
    if (globalThis.pointVersion <= 54) {
        editable.addEventListener("focusin", () => {
            surrounder.richText = api;
            globalThis.tooltipSurrounderDisabled = false;
        });
        editable.addEventListener("focusout", () => {
            surrounder.disable();
            globalThis.tooltipSurrounderDisabled = true;
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

        const anchor = e.target;
        const previousSibling = anchor.previousElementSibling;

        /**
         * Function returned from preventResubscription to enable resubscription again.
         * @see {@link https://forums.ankiweb.net/t/tip-dynamic-html-js-inside-anki-editable/}
         */
        const callback = preventResubscription();

        const svelteAnchor = new TooltipAnchor({
            target: anchor.parentElement ?? editable,
            anchor,
            props: {
                editable,
                anchorContent: anchor.innerHTML,
                tooltipContent: decodeAttribute(anchor.dataset.tippyContent!),
            },
        });

        /**
         * Svelte components can't directly self-destruct, so we listen
         * for a message from TooltipAnchor to destroy it from outside.
         */
        svelteAnchor.$on("destroyComponent", () => {
            svelteAnchor.$destroy();
            setTimeout(() => {
                // Reenable resubscription
                callback();

                // Restore caret position
                const editedAnchor = editable.querySelector(
                    "a[data-tippy-content].edited",
                );
                if (editedAnchor) {
                    placeCaretAfter(editedAnchor);
                    editedAnchor.removeAttribute("class");
                } else if (previousSibling) {
                    placeCaretAfter(previousSibling);
                } else {
                    editable.focus();
                }
            });
        });

        anchor.remove();
    }
});
