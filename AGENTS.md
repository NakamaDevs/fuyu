# Fuyu agent guide

Use `.nakama/delivery.json` and `.nakama/kaicho/delivery-profiles.md`.
The repository uses the solo delivery route. Tested commits may go directly to main.
Keep semantic commits with `Refs GMD-123` or `Fixes GMD-123` in the body.
The Linear team is GameDev. The project is Fuyu. GMD-26 groups the current milestone.

Run `mise run git-hooks:install` before committing.
Run `python3 .nakama/kaicho_delivery.py branch --format-only` before the first commit.
Run `mise run verify` before delivery. Record actual browser acceptance separately.

Keep domain rules in `src/domain` independent from browser and rendering APIs.
Keep input and browser behavior in `src/application`. Keep rendering in `src/presentation`.
Use the applicable code-review skills for correctness, tests, browser behavior, and documentation.

Preserve the existing Site identity and its private audience.
Do not publish original reference photographs or identifying production details.
Keep third-party license notices. Do not add runtime network dependencies without a concrete need.

Review `docs/development.md` and `docs/delivery.md` before packaging or publication.
A successful build does not prove playable progression or physical mobile acceptance.
