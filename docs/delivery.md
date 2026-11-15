# Delivery

Fuyu uses the solo route defined in `.nakama/delivery.json`.
The owner-approved policy is mirrored in `.nakama/kaicho/delivery-profiles.md`.
The Linear project is Fuyu in GameDev. GMD-26 groups the current milestone.

## Local checks

Use the exact Node version in `mise.toml` and the committed npm lockfile.
Install dependencies with `npm ci`. Install hooks with `mise run git-hooks:install`.
Run `mise run verify` before delivery.
Run browser acceptance separately. Record the revision, environment, actions, results, and remaining limits in Linear.

The repository has no GitHub Actions workflow yet. Local verification does not imply successful CI.
Physical iOS and Android checks remain separate from desktop browser and simulated pointer tests.

## GitHub source

Use semantic commits with a real GMD reference in the body.
New branches use `type/GMD-123-description`. Preserve published branches and other contributors' changes.
Publish only reviewed source and game-only evidence. Keep secrets and original reference photographs outside Git.

The initial public history starts from a sanitized recovered snapshot.
The original local history remains unchanged. It is not part of the public history.

## Existing Site

Keep the project identity in `.openai/hosting.json` and preserve the Site's private audience.
Use the Sites plugin source helper and native version/deployment tools for normal Site publication.
The plugin packages `dist/` after the Vite build.

GitHub and Sites retain separate Git histories with matching source trees.
Copy the verified GitHub source tree into the existing Site checkout without replacing its `.git` directory.
Create a semantic source commit there before running the packaging helper.
The helper must push that exact commit before a version can be saved.
Record both source SHAs and the saved Site version in Linear.

For an owner-private Site, use `save_version_and_deploy_private` after source preparation.
If unavailable, save the version and then use `deploy_private_site_version`.
Do not create a second Site or change its audience during an update.
Check a non-terminal deployment until it succeeds or fails.
Test the deployed game before accepting the delivery issue.

## Rollback

Keep the previous saved Site version.
Use the same native deployment route to restore that version if a new version fails acceptance.
Revert a public source commit with a new semantic commit. Do not force-push or replace published history.
