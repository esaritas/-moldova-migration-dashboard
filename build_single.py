#!/usr/bin/env python3
"""
build_single.py — assemble the standalone single-file build from the live source.

Inlines styles.css, world-data.js, data.js and app.js into index.html to produce
moldova-migration-dashboard.html (preview/share only). D3 and Google Fonts stay on
their CDNs (they degrade gracefully offline; world-data.js is bundled so the map
works without a network). Run this whenever you change the source so the share
copy never drifts:

    python build_single.py
"""
import io, os

HERE = os.path.dirname(os.path.abspath(__file__))

def read(name):
    with io.open(os.path.join(HERE, name), encoding="utf-8") as f:
        return f.read()

def main():
    html = read("index.html")
    # Guard: inline JS must not contain a literal </script> (it would close early).
    for js in ("world-data.js", "data.js", "app.js"):
        if "</script>" in read(js).lower():
            raise SystemExit(f"{js} contains a literal </script>; cannot safely inline.")

    replacements = {
        '<link rel="stylesheet" href="styles.css" />':
            "<style>\n" + read("styles.css") + "\n</style>",
        '<script src="world-data.js"></script>':
            "<script>\n" + read("world-data.js") + "\n</script>",
        '<script src="data.js"></script>':
            "<script>\n" + read("data.js") + "\n</script>",
        '<script src="app.js"></script>':
            "<script>\n" + read("app.js") + "\n</script>",
    }
    for find, repl in replacements.items():
        if find not in html:
            raise SystemExit(f"Expected tag not found in index.html: {find}")
        html = html.replace(find, repl)

    banner = ("<!-- AUTO-GENERATED single-file build by build_single.py — do not edit by hand.\n"
              "     Edit index.html / styles.css / data.js / app.js, then re-run build_single.py. -->\n")
    html = banner + html

    out = os.path.join(HERE, "moldova-migration-dashboard.html")
    with io.open(out, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Wrote {out}  ({len(html):,} bytes)")

if __name__ == "__main__":
    main()
