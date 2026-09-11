# Security

## Content Security Policy

`qarchkhor.html` sets a strict CSP via `<meta http-equiv="Content-Security-Policy">`:

```
default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self';
img-src 'self'; media-src 'self'; connect-src 'self'; object-src 'none';
base-uri 'none'; form-action 'none'
```

Every directive is `'self'` or `'none'` - there is no `unsafe-inline` and no
third-party origin anywhere, because **every runtime asset is self-hosted**:
the Vazirmatn webfont (`assets/fonts/*.woff2`) was previously loaded from
Google Fonts and is now local files, and the title screen's background art
was previously a 1.45MB base64-encoded photo and is now drawn entirely in
CSS (see `css/styles.css`'s `#start-screen` rule) - zero image payload,
zero third-party origin. This also removes a small amount of user-IP
exposure to Google's font CDN.

`frame-ancestors`, `report-uri`/`report-to` and `sandbox` are intentionally
**not** set here - those directives are ignored when delivered via a
`<meta>` tag (only an HTTP response header can carry them).

**Recommended for whoever administers the deploy target's nginx (or other
reverse proxy) config** - none of this can be set from inside this
repository, since it's server configuration, not a file the game ships:

```
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
```

The `Strict-Transport-Security` header only makes sense if the site is
served over HTTPS - if the deploy target is still plain HTTP, that's a
higher-priority fix than any of the above.

## No inline scripts or styles

`js/main.js` is loaded as an external `<script type="module" src="...">`;
`css/styles.css` is loaded as an external stylesheet. There is no inline
`<script>`, `<style>`, or `style="..."` attribute anywhere in the markup -
which is also what makes the strict CSP above possible without an
`unsafe-inline` exception.

## No `innerHTML` with dynamic content

The HUD's life-icon SVGs are built with `document.createElementNS` /
`setAttribute`, never `innerHTML` string concatenation - there is no code
path anywhere that interpolates a value into markup and re-parses it.

## Known accepted risk: password-based SSH deploy

`.github/workflows/deploy.yml` authenticates to the deploy target with
`secrets.SSH_PASSWORD` (via `appleboy/scp-action` / `appleboy/ssh-action`).
The secret itself is handled correctly (a GitHub Actions encrypted secret,
never printed or committed), but password authentication is inherently
weaker than public-key authentication - it's phishable, guessable if weak,
and has no equivalent to a revocable/rotatable keypair scoped to CI.

**This repository's tooling cannot fix this alone** - it requires access to
the target server to install a public key and disable password auth there.

Recommended fix for whoever administers the deploy target:

1. Generate a dedicated ed25519 keypair for CI (not a personal key).
2. Add the public key to the deploy user's `~/.ssh/authorized_keys` on the
   server, restricted with a `command=` / `from=` prefix if the deploy user
   doesn't need a general-purpose shell.
3. Store the private key as a new `SSH_PRIVATE_KEY` secret and switch both
   `appleboy/scp-action` and `appleboy/ssh-action` to their `key:` input
   instead of `password:`.
4. Disable password authentication for that user (or server-wide) once the
   key-based deploy has been verified to work.
5. Remove the now-unused `SSH_PASSWORD` secret.
