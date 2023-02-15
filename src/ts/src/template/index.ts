// Anki Tooltips
// Copyright (C) 2023 Matthias Metelka
// License: GNU AGPL, version 3 or later; http://www.gnu.org/licenses/agpl.html

import "./styles/tippy.scss";
import tippy from "tippy.js";
import { Shortcut, TooltipAnchor } from "./types";

const currentScript = document.currentScript as HTMLScriptElement;

const nextShortcut = new Shortcut(
    currentScript.getAttribute("data-next-shortcut") || "Tab",
);
const prevShortcut = new Shortcut(
    currentScript.getAttribute("data-prev-shortcut") || "Shift+Tab",
);

(function addTippyStyleLink() {
    if (document.getElementById("tooltipStyles")) {
        return;
    }
    const link = document.createElement("link");
    link.id = "tooltipStyles";
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = `${
        globalThis.ankiPlatform === "desktop"
            ? ""
            : globalThis.AnkiDroidJS
            ? "https://appassets.androidplatform.net"
            : "."
    }/${"_tippy.css"}`;

    document.head.appendChild(link);
})();

(function initTooltipAnchors() {
    tippy("[data-tippy-content]", {
        trigger: "mouseenter click",
        interactive: true,
        allowHTML: true,
        appendTo: document.body,
        placement: "bottom",
        theme: "user-theme",
        animation: "scale",
        onMount(instance) {
            globalThis.MathJax?.typesetPromise([instance.reference]);
        },
    });
})();

(function setTippyShortcuts() {
    const onKeyDown = (event: KeyboardEvent) => {
        const next = nextShortcut.isPressed(event);
        const prev = prevShortcut.isPressed(event);
        if (!(next || prev)) {
            return;
        }

        event.preventDefault();

        const anchors = [
            ...document.querySelectorAll("[data-tippy-content]"),
        ] as TooltipAnchor[];

        if (!anchors) {
            return;
        }

        const currentIndex = anchors.findIndex((anchor) => anchor._tippy.state.isShown);

        if (currentIndex == -1) {
            anchors[0]._tippy.show();
            return;
        }

        const nextIndex = cycleIndex(anchors, currentIndex, prev, next);

        anchors[currentIndex]._tippy.hide();
        anchors[nextIndex]._tippy.show();
    };

    // Make sure there's only one EventListener
    document.removeEventListener("keydown", onKeyDown);
    document.addEventListener("keydown", onKeyDown);
})();

function cycleIndex(
    arr: any[],
    currentIndex: number,
    prev: boolean,
    next: boolean,
): number {
    const increment = prev ? -1 : next ? 1 : 0;
    return (currentIndex + increment + arr.length) % arr.length;
}
