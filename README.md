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


### `cannot load such file -- csv (LoadError)` / `cannot load such file -- bigdecimal (LoadError)`

This means your local Ruby/Jekyll stack is still loading an older gem set that does not include `csv` or `bigdecimal`.

Run this from your Git repo root:

```bash
./scripts/fix-macos-jekyll.sh
```

If your script output shows steps like `[7/8]` instead of `[11/11]`, your local repo is behind. Run `git pull` first, then rerun the script.

If you want manual commands instead, run these exact lines (one at a time):

```bash
unset GEM_HOME GEM_PATH BUNDLE_PATH BUNDLE_BIN_PATH RUBYOPT
rm -f Gemfile.lock
rm -rf .bundle vendor/bundle
bundle config unset path
bundle clean --force
gem install bundler csv bigdecimal webrick
bundle install
bundle exec jekyll serve
```

Quick verification commands:

```bash
git pull
grep bigdecimal Gemfile
bundle show bigdecimal
bundle show csv
```

If `bundle show bigdecimal` or `bundle show csv` fails, your local gems are still stale: rerun the script.

Why Bundler says `failed to load command: jekyll`: Bundler is only the launcher. The real failure is the nested `cannot load such file -- bigdecimal` / `csv` line from Jekyll/Liquid.

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
