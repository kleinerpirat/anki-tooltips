<p align="center">
    <a href="https://ankiweb.net/shared/info/1840818335">
        <img src="website/assets/logo.svg" width=140 height=140>
    </a>
</p>

<h1 align="center">Anki Tooltips</h1>

<p align="center">
    Add tooltips to your Anki cards with <a href="https://github.com/atomiks/tippyjs">Tippy.js</a>
    <br>
</p>

<p align="center">
    Get on <a href="https://ankiweb.net/shared/info/1840818335">AnkiWeb</a> |
    <a href="https://forums.ankiweb.net/t/tippy-tooltips-official-support/11844">Support</a>
</p>
<br>

> ⚠️ For bug reports and feature requests, please use the [Anki Forum thread](https://forums.ankiweb.net/t/tippy-tooltips-official-support/11844).

---

<br>

## A Reference for Add-on Developers

This repository was made public to serve as a reference for Anki add-on development. When I stumble upon a problem,
I usually first try to think of some quality add-ons that solve similar issues and then read through their source code.
Anki Tooltips aims to be **that add-on** for you.

I made sure to touch as many areas of interest as reasonably achievable without compromising the add-on's
original purpose. The code is typed and documented at a novice level.

Anki Tooltips deals with:

- Anki's JavaScript API
- Custom and native Svelte components
- JS and CSS insertion into editor and reviewer
- Profile- and notetype-specific settings via GUI
- Programmatic card template edits
- HTML-filtering with BeautifulSoup 4

... and much more.

<br>

If you're planning a bigger project, it is worth taking a look at the structure of the repository
and its build scripts, which are based on [New Format Pack](https://github.com/hgiesel/anki_new_format_pack).

> 🛈 Major credit goes to Henrik Giesel ([hgiesel](https://github.com/hgiesel)),
> whose add-ons have been my gold standard for development questions ever since I got involved with this community.
> Henrik's generosity to provide insights into his work inspired me to publish this project - to honor
> his contributions to the Anki ecosystem and make them accessible to a wider audience.

<br>

## Building

Navigate to `/tools` and make the bash scripts executable.

For development builds use:

```shell
tools/dev.sh
```

Console logs are preserved in this mode and code is not minified. To see the effect of `/ts` changes,
just reopen the webview. Changes to `/python` require a fresh build.

Symlink the output folder `/dist` to `Anki2/addons21` to test the add-on in Anki.

---

<br>

### <b>Important Note</b>

This is not a project template. It is **not** recommended to clone the repository and morph it to fit
your needs. The project is quite complex and you would have to comply with multiple conditions of the
GNU AGPL v3 license, such as disclosing your own source files and keeping copyright headers.
If you want to start with ready-to-compile project template, head over to
[New Format Pack](https://github.com/hgiesel/anki_new_format_pack) (licensed under MIT)
and click "Use this template".

<br>

#### <b>What is it, then?</b>

This repository is a **reference** to look up answers to specific questions you might run into
during add-on development, such as:

- "How can I use Svelte components for my Anki add-on?"
- "How to use the Editor API to avoid fiddling around with the DOM, which keeps changing with every new Anki version?"
- "How can I force Anki to sync a file from collection.media to AnkiWeb after I applied changes to it?"
- "What is the current best practice to insert CSS into editor fields?"

---

> 🛈 If you want to let me in on a more idiomatic way for something I declared "best practice",
> or wish to discuss some other development-focused topic, feel free to open an issue or PR here.
