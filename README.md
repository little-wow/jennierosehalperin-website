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

1. Pull latest repo changes (Gemfile now includes `csv` + `webrick`).
2. Reinstall gems in this project:

```bash
bundle install
bundle exec jekyll serve
```

If Bundler still uses stale gems:

```bash
bundle clean --force
rm -f Gemfile.lock
bundle install
bundle exec jekyll serve
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
