# Jennie Rose Halperin website

A simplified personal website built with **Jekyll** for deployment on **GitHub Pages**.

This version integrates structure and core content from the previous Squarespace site:
- Home
- Bio
- What I Do
- Writing
- Work With Me

## Local development

1. Install Ruby and Bundler.
2. Install dependencies:

   ```bash
   bundle install
   ```

3. Run the site locally:

   ```bash
   bundle exec jekyll serve
   ```

4. Visit `http://127.0.0.1:4000`.

## Common setup errors (macOS)

### `zsh: parse error near ')'`

This usually happens when a command was pasted with mismatched quotes or extra characters.

- Re-type commands manually if they were copied from rich text.
- Run one command per line.
- Use the scripted fix below to avoid shell syntax mistakes.

### `cannot load such file ... bundler ... (LoadError)`

This indicates a Ruby/Bundler mismatch after a Homebrew Ruby upgrade.

Run the repository repair script (from repo root):

```bash
./scripts/fix-macos-jekyll.sh
```

If you want to run steps manually instead:

```bash
brew reinstall ruby
hash -r
gem install bundler
bundle -v
bundle install
bundle exec jekyll serve
```


### `cannot load such file -- csv (LoadError)`

This happens with newer Ruby versions where `csv` is no longer auto-bundled for older Jekyll versions.

Run these exact six commands from your Git repo root (the top-level `jennierosehalperin-website` folder, not system `/` root):

```bash
unset GEM_HOME GEM_PATH BUNDLE_PATH BUNDLE_BIN_PATH RUBYOPT
rm -f Gemfile.lock
bundle clean --force || true
gem install bundler
bundle install
bundle exec jekyll serve
```

Why the message says `bundler: failed to load command: jekyll (/opt/homebrew/lib/ruby/gems/4.0.0/bin/jekyll)`:

- `bundle exec` is launching the `jekyll` executable from your installed gem path.
- That executable starts Jekyll 3.9, which immediately does `require "csv"`.
- On Ruby 3.4+/4.0, `csv` is no longer a default gem, so `require "csv"` fails.
- Bundler then reports the wrapper error (`failed to load command`) even though the root cause is the nested `cannot load such file -- csv` line.

1. Pull latest repo changes (Gemfile now includes `csv` + `webrick`).
2. Reinstall gems in this project:

```bash
bundle install
bundle exec jekyll serve
```

If Bundler still uses stale gems, run this clean-room reset from repo root:

```bash
hash -r
unset GEM_HOME GEM_PATH BUNDLE_PATH BUNDLE_BIN_PATH RUBYOPT
rm -f Gemfile.lock
bundle clean --force || true
bundle install
bundle exec jekyll serve
```

Or run the repo helper script:

```bash
./scripts/fix-macos-jekyll.sh
```

## Deploying on GitHub Pages

1. Push this repository to GitHub.
2. In **Settings → Pages**, set Source to **Deploy from a branch**.
3. Choose the default branch and `/ (root)`.
4. Ensure the `CNAME` file is present for your custom domain.

## Migrating from Squarespace + Gandi to GitHub Pages

### 1) Keep domain at Gandi
No transfer required. Keep registration at Gandi and update DNS records.

### 2) Update DNS at Gandi
Set these records for GitHub Pages:

- `A` records for apex domain (`@`):
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`
- `CNAME` record for `www`:
  - `jennierosehalperin.github.io`

### 3) Remove conflicting Squarespace DNS records
Delete old Squarespace-specific `A`, `CNAME`, or verification records that conflict with the above.

### 4) Verify domain in GitHub
In repository **Settings → Pages**:
- Set custom domain to `jennierosehalperin.me`
- Enable **Enforce HTTPS** once cert provisioning completes.
