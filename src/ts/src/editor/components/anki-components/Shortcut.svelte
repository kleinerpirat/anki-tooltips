<!--
Copyright: Ankitects Pty Ltd and contributors
License: GNU AGPL, version 3 or later; http://www.gnu.org/licenses/agpl.html
-->

<script lang="ts">
    // @ts-ignore
    import { registerShortcut } from "anki/shortcuts";
    import { createEventDispatcher, onMount } from "svelte/internal";

    export let keyCombination: string;
    export let event: "keydown" | "keyup" | undefined = undefined;

    const dispatch = createEventDispatcher();

    onMount(() =>
        registerShortcut(
            (event: KeyboardEvent) => {
                event.preventDefault();
                dispatch("action", { originalEvent: event });
            },
            keyCombination,
            { event },
        ),
    );
</script>
