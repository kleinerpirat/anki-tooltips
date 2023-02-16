<!--
Anki Tooltips
Copyright (C) 2023 Matthias Metelka
License: GNU AGPL, version 3 or later; http://www.gnu.org/licenses/agpl.html

@component
A simple `<div contenteditable>` to edit the data-tippy-content attribute of TooltipAnchor.
-->
<script context="module" lang="ts">
    export enum EditorButton {
        RECYCLE,
        SCRAP,
        ACCEPT,
        NONE,
    }
</script>

<script lang="ts">
    import { acceptIcon, scrapIcon, recycleIcon } from "../assets/icons";
    import { createEventDispatcher, onMount } from "svelte/internal";
    import { TooltipState } from "./TooltipAnchor.svelte";
    import { moveCaretToEnd } from "../utils";

    export let content: string;

    let input: HTMLDivElement;
    export function focusInput() {
        moveCaretToEnd(input);
    }

    const dispatch = createEventDispatcher();

    function onKeypress(e: KeyboardEvent) {
        switch (e.key) {
            case "Enter":
                if (e.altKey) {
                    e.preventDefault();
                    dispatch("action", { state: TooltipState.ACCEPT });
                }
                break;
        }
    }

    let hoveredButton: EditorButton;
    $: dispatch("hoveredButton", { hoveredButton });

    let height = 0;
    $: dispatch("height", { height });

    /**
     * Required on older Anki versions for some reason
     */
    onMount(() => {
        setTimeout(() => {
            dispatch("height", { height: 60 });
        });
    });
</script>

<div class="tippy-content" bind:clientHeight={height}>
    <div
        bind:this={input}
        contenteditable
        class="tippy-input"
        class:scrap-hovered={hoveredButton == EditorButton.SCRAP}
        class:recycle-preview={hoveredButton == EditorButton.RECYCLE}
        placeholder="Enter Tooltip here"
        on:input={(e) => {
            dispatch("input", {
                content: e.currentTarget.innerHTML,
            });
        }}
        on:keypress={onKeypress}
    >
        {@html decodeURIComponent(content)}
    </div>
    <div
        class="recycle-btn"
        title="Restore"
        on:click={() => dispatch("action", { state: TooltipState.RECYCLE })}
        on:mouseenter={() => (hoveredButton = EditorButton.RECYCLE)}
        on:mouseleave={() => (hoveredButton = EditorButton.NONE)}
        on:keydown
    >
        {@html recycleIcon}
    </div>
    <div
        class="scrap-btn"
        title="Scrap"
        on:click={() => dispatch("action", { state: TooltipState.SCRAP })}
        on:mouseenter={() => (hoveredButton = EditorButton.SCRAP)}
        on:mouseleave={() => (hoveredButton = EditorButton.NONE)}
        on:keydown
    >
        {@html scrapIcon}
    </div>

    <div
        class="accept-btn"
        title="Accept"
        on:click={() => dispatch("action", { state: TooltipState.ACCEPT })}
        on:mouseenter={() => (hoveredButton = EditorButton.ACCEPT)}
        on:mouseleave={() => (hoveredButton = EditorButton.NONE)}
        on:keydown
    >
        {@html acceptIcon}
    </div>
    <div class="tippy-outline" />
</div>

<style lang="scss">
    .tippy-input {
        min-width: 240px;
        padding: 0.5rem 0.75rem;
        font-size: 18px;
        cursor: text;
        color: var(--fg);
        background: var(--canvas-elevated, var(--frame-bg));
        border-radius: var(--border-radius, 5px);
        border: none;
        outline: none;
        overflow: hidden;

        &:focus ~ .tippy-outline {
            box-shadow: 0 0 1px 2px var(--border-focus, var(--focus-border));
        }
        &:empty:focus ~ .tippy-outline {
            box-shadow: 0 0 1px 2px var(--accent-danger, var(--flag1-bg));
        }

        &[placeholder]:empty {
            &::before {
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                text-align: center;
                content: attr(placeholder);
                color: var(--fg-disabled, var(--slightly-grey-text));
            }
        }

        &.scrap-hovered {
            color: var(--fg-disabled, var(--slightly-grey-text));
            text-decoration: line-through;
        }
        &.recycle-preview {
            color: transparent;
            max-width: 240px;
            max-height: 2.8rem;
        }
    }
    .tippy-outline {
        position: absolute;
        border-radius: var(--border-radius, 5px);
        top: 5px;
        left: 5px;
        width: calc(100% - 10px);
        height: calc(100% - 10px);
        transition: 0.2s;
        pointer-events: none;
    }
    .accept-btn,
    .scrap-btn,
    .recycle-btn {
        z-index: 1;
        position: absolute;
        cursor: pointer;
        width: 16px;
        height: 16px;
        line-height: 14px;
        text-align: center;
        border-radius: 10px;
        filter: grayscale(50%);
        transition: all 0.05s ease-out;

        &:hover {
            filter: unset;
            transform: scale(1.5);
        }
        & > :global(svg) {
            width: 88%;
            fill: currentColor;
        }
    }

    .recycle-btn {
        background: rgb(54, 54, 240);
        top: -6px;
        left: -6px;

        .tippy-input:empty ~ & {
            display: none;
        }
        &:hover,
        &:empty:hover {
            & ~ .tippy-outline {
                box-shadow: 0 0 2px 2px var(--accent-card, var(--flag4-bg));
            }
        }
    }

    .scrap-btn {
        background: #ec4134;
        top: -6px;
        right: -6px;

        &:hover,
        &:empty:hover {
            & ~ .tippy-outline {
                box-shadow: 0 0 2px 2px var(--accent-danger, var(--flag1-bg));
            }
        }
    }
    .accept-btn {
        background: #2fc043;
        bottom: -6px;
        right: -6px;

        .tippy-input:empty ~ & {
            display: none;
        }
        &:hover ~ .tippy-outline {
            box-shadow: 0 0 2px 2px var(--accent-note, var(--flag3-bg));
        }
    }
</style>
