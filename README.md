# Repowise — GitHub Repository Intelligence

Live app: https://repowise.web.app

A local-first dashboard built from `AGENTS.md`, with a responsive dark interface and a working sample workspace.

## Run

Requires Node.js 20.17 or newer. No dependencies or build step are needed.

```sh
npm start
```

Open http://localhost:3000. Run `npm test` for analysis and search tests.

## Connect GitHub

Use **Settings & connection** to import a public account by username. For private repositories and management, copy `.env.example` to `.env`, set `GITHUB_TOKEN`, and restart. The token stays server-side. Grant access only to the repositories and operations you intend to use. GitHub enforces token permissions; read-only tokens cannot perform management actions. The server binds exclusively to loopback and rejects foreign hosts and write origins. This is a single-user local application, not a hosted multi-user service.

Sync paginates repository metadata. Use **Analyze repository files** inside details for a staged inspection: metadata, recursive tree, then at most five README/manifest files. Cached analysis is invalidated when the push timestamp changes. GitHub rate limits and permission failures appear in the interface.

## Implemented

- Dashboard cards and list view, aggregate metrics, technology and visibility filters, activity/name/size/creation/health sorting, favorites, multi-selection.
- Evidence-based summaries, technology detection, estimated status, recommendations with reasons, documentation health, and explicit uncertainty.
- Local notes, tags, editable classification/status, review decisions, and manual project groups.
- Review queue with automatic advance; review labels do not mutate GitHub.
- Similarity scoring based on repository name/description tokens and technologies; chronological family view and language insights.
- Common natural-language filters for technologies, visibility, inactivity, creation year, and completion overrides; duplicate search via “likely duplicates”. This is a deterministic parser, not semantic AI search.
- Confirmed archive/unarchive, visibility, rename, description, topics, and individual deletion; deletion requires the exact repository name. Bulk archive/visibility operations report failures and retain completed changes.
- Local persistence in `.data/state.json` and JSON export. Export before resetting to demo; no import interface is currently provided.

## Deliberate limits

No AI service is configured. Summaries start from repository descriptions and analysis uses rules, labeled in the UI. Completeness is unknown. Similarity does not claim source-code ancestry. Detailed commit windows, branch/contributor/PR counts, deployments, model-generated summaries, and full semantic search are not implemented. Basic GitHub open-issue counts include pull requests and are labeled accordingly. Management executes only after confirmation; no background GitHub mutations occur.

The local data file can contain private repository metadata and notes. `.env` and `.data` are gitignored. Demo operations are isolated from GitHub and modify only the current sample workspace.

## Firebase integration

Firebase project: **repowise-neumont**. Google sign-in is enabled and the default Firestore database is in **us-central1**. Rules are deployed from `firestore.rules`.

Open **Settings & connection → Firebase cloud workspace**. Sign in with Google, import your GitHub repositories, and choose **Back up annotations**. Backups store repository names and notes/tags/favorites/review decisions under `users/{uid}/repositories/{repositoryId}`. Only the matching authenticated user can read or write them. Source code and GitHub tokens are excluded from annotation backups. Backups are explicit, not automatic.

**Restore annotations** matches GitHub repository IDs and asks before replacing local annotations. Export first to preserve current state. Backups do not import missing repositories or delete old cloud entries. Import the GitHub account before restoring. Multi-batch failures can leave partial progress; retry to finish.

Firebase web configuration is public app metadata, not an administrator credential. Firebase CLI logs are excluded from Git. Auth sessions are limited to the browser session. Localhost and 127.0.0.1 are authorized sign-in domains.

The hosted app runs at https://repowise.web.app on Firebase Hosting. The Firebase project ID remains repowise-neumont; the public Hosting site is repowise. Session-only requests go directly to GitHub; saved connections use the authenticated backend. Workspace data stays in browser local storage, with optional per-user Firebase annotation backups. Private access supports saved account connections or optional session-only tokens. The local Node version remains available with npm start. Local and hosted workspaces are separate; import GitHub repositories and restore cloud annotations to move between them.

Deploy configuration using `firebase deploy --only auth,firestore:rules --project repowise-neumont`.

References: [Firebase web SDK](https://firebase.google.com/docs/web/alt-setup), [Google sign-in](https://firebase.google.com/docs/auth/web/google-signin), [Firestore rules](https://firebase.google.com/docs/firestore/security/rules-conditions).

## Hosting deployment

Run `npm test` to build and test both local and hosted workflows. Run `npm run deploy` to build and publish to the repowise Hosting site. Only dist/ is deployed; server credentials and .data/ are excluded. Browser storage has finite capacity; keep an exported backup and use Firebase annotation backups.

The public URLs repowise.web.app and repowise.firebaseapp.com are authorized for Firebase Authentication and the restricted Firebase browser key. API restrictions remain limited to Authentication and Firestore.

## Saved GitHub account connections

In the hosted app, sign in with Google, then use **Your GitHub connection → Save connection**. The backend validates the token with GitHub and stores an AES-256-GCM encrypted value in a server-only Firestore collection. Each ciphertext is bound to the Firebase user ID; the encryption key is in Google Secret Manager. Client Firestore rules deny all access to connection and rate-limit records.

**Replace token** validates the replacement before overwriting the saved value. **Disconnect** removes the saved credential from Repowise; it does not revoke that token at GitHub. One active GitHub connection is saved per Firebase account. Fine-grained GitHub tokens still need the correct resource owner, selected repositories, and organization approval.

Saved connections are recovered after signing into the same Firebase account. GitHub requests are forwarded by the authenticated backend and the saved token is never sent back to the browser. Session-only tokens remain optional and are cleared on reload. Browser workspaces are separated by Firebase user; the earlier unsigned-in workspace remains under its original browser-storage key.

The backend verifies Firebase ID tokens (including revocation), requires a verified email, limits requests per user, accepts only supported GitHub API paths and repository updates, and verifies management confirmations. It runs in us-central1 with zero minimum and two maximum instances. These controls limit usage but are not a billing cap.

Run `npm ci` inside functions/ to install backend dependencies. Deploy with `npm run deploy`. Do not overwrite or rotate GITHUB_TOKEN_ENCRYPTION_KEY without migrating existing encrypted records; doing so would make saved tokens unreadable. Neither token values nor encryption keys belong in source control.

Tests cover encryption/tampering, user isolation, unauthenticated requests, restricted proxy destinations, mutation confirmations, saved-connection routing, and browser account switches. The user's first real save/sync is still needed to verify their GitHub token permissions end to end.
