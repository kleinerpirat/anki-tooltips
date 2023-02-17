// Anki Tooltips
// Copyright (C) 2023 Matthias Metelka
// License: GNU AGPL, version 3 or later; http://www.gnu.org/licenses/agpl.html

const { build } = require("esbuild");
const sveltePreprocess = require("svelte-preprocess");
const sveltePlugin = require("esbuild-svelte");
const sassPlugin = require("esbuild-sass-plugin").default;

const production = process.env.NODE_ENV === "production";
const development = process.env.NODE_ENV === "development";

const watch = development
    ? {
        onRebuild(error) {
            console.timeLog;

            if (error) {
                console.error(
                    new Date(),
                    "esbuild: build failed:",
                    error.getMessage(),
                );
            } else {
                console.log(new Date(), "esbuild: build succeeded");
            }
        },
    }
    : false;

const entryPoints = ["src/editor/index.ts", "src/template/index.ts"];

const options = {
    entryPoints,
    outdir: "../../dist/web",
    format: "iife",
    target: "es2018",
    bundle: true,
    minify: production,
    treeShaking: production,
    sourcemap: !production,
    pure: production ? ["console.log", "console.time", "console.timeEnd"] : [],
    watch,
    external: ["svelte", "anki"],
    plugins: [
        sveltePlugin({
            preprocess: sveltePreprocess({
                scss: {
                    includePaths: ["anki/sass"],
                },
            }),
        }),
        sassPlugin(),
    ],
    loader: {
        ".png": "dataurl",
        ".svg": "text",
    },
};

build(options).catch((err) => {
    console.error(err);
    process.exit(1);
});

if (watch) {
    console.log("Watching for changes...");
}
