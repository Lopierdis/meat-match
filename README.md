# נתח

A Hebrew, right-to-left beef cut finder and browsable glossary. Nine questions produce up to three explained recommendations. Includes the 19 numbered Israeli cuts, six specialty cuts, and a glossary of cooking terms.

Static HTML, CSS and JavaScript modules. No install step, backend, analytics or API keys. Fonts and images are served locally. Answers stay in the visitor's local storage.

## Run and check

```sh
npm start
npm test
```

Open http://localhost:4173. The tests cover ranking examples, all 1,152 combinations of dish/method/time/doneness, conflicting inputs, catalog integrity and input validation.

Browser smoke checks are in `tests/browser.py`. They use Python Playwright and `/usr/bin/google-chrome`, both already available on Bulbasaur:

```sh
/home/bulbasaur/cos/.venv/bin/python tests/browser.py
```

The script starts and stops its own temporary localhost server. Screenshots go into ignored `.preview/`.

## Files

- `docs/data.mjs`: Hebrew questions, cut profiles and glossary terms.
- `docs/match.mjs`: cooking constraints and preference ranking.
- `docs/app.mjs`: questionnaire, results, glossary and browser-local state.
- `docs/style.css`: responsive layout and RTL styling.
- `research/cuts.md`: sources and distinctions between Israeli whole cuts and specialty cuts.

The engine first filters by dish, cooking method, time and slow/quick doneness. It then ranks by taste, texture, fat, experience and relative budget. Incompatible combinations return an explanation. Preference mismatches appear on each result. The attributes and time estimates are editorial guidance, not measured guarantees or recipes.

## Publishing

GitHub repository: https://github.com/Lopierdis/meat-match

GitHub Pages: https://lopierdis.github.io/meat-match/

GitHub Pages publishes the `docs/` directory from `main` using its built-in branch publishing. Run `npm test` before pushing. No custom Actions workflow or workflow-scoped token is needed. Relative asset paths work with both the repository URL and a custom domain. `docs/CNAME` assigns `meat-match.com`. The GitHub URL redirects to that domain once configured. Namecheap DNS must be updated using [the domain setup notes](research/domain-setup.md), then HTTPS can be enforced after GitHub issues the certificate.

An unpublished Sites project was registered during setup before the hosting choice changed to GitHub Pages. Its local `.openai/` configuration is ignored and unused by this project.

## Project skills

The requested Matt Pocock skills were downloaded to `.agents/skills/`: `grill-me`, `grilling`, `grill-with-docs`, `prototype`, `codebase-design`. Those local copies are ignored by Git and become discoverable in the next agent turn. Source: https://github.com/mattpocock/skills.

## Assets and content

Heebo is distributed under the SIL Open Font License; see `docs/assets/Heebo-LICENSE.txt`. The hero photograph is from Unsplash, source URL https://images.unsplash.com/photo-1603048297172-c92544798d5a. Card illustrations are schematic and do not represent the anatomy of individual cuts. Food sources are linked on the website and in the research notes.
