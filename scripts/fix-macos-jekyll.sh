#!/usr/bin/env bash
set -euo pipefail

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is not installed. Install it first:"
  echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  exit 1
fi

echo "[1/11] Reinstalling Ruby via Homebrew..."
brew reinstall ruby

echo "[2/11] Clearing shell cache and Ruby/Bundler env vars..."
hash -r
unset GEM_HOME GEM_PATH BUNDLE_PATH BUNDLE_BIN_PATH RUBYOPT || true

echo "[3/11] Verifying toolchain..."
ruby -v
gem -v

echo "[4/11] Installing Bundler for current Ruby..."
gem install bundler
bundle -v

echo "[5/11] Verifying Gemfile has compatibility gems..."
for dep in 'gem "csv"' 'gem "bigdecimal"' 'gem "webrick"'; do
  if ! grep -F "$dep" Gemfile >/dev/null 2>&1; then
    echo "Missing $dep in Gemfile."
    echo "Please run: git pull (you are likely on an older checkout), then rerun this script."
    exit 1
  fi
done

echo "[6/11] Resetting local bundler config that can pin stale gem paths..."
bundle config unset path || true
bundle config unset without || true
bundle config unset deployment || true
bundle config list

echo "[7/11] Cleaning stale project state..."
rm -f Gemfile.lock
rm -rf .bundle vendor/bundle
bundle clean --force || true

echo "[8/11] Installing compatibility gems globally for Ruby 3.4+/4.x..."
gem install csv bigdecimal webrick

echo "[9/11] Installing project dependencies from Gemfile..."
bundle install

echo "[10/11] Confirming bigdecimal/csv load in bundle context..."
bundle exec ruby -rbigdecimal -rcsv -e 'puts "ok"'

echo "[11/11] Starting local Jekyll server..."
bundle exec jekyll serve
