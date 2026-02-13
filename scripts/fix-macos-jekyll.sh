#!/usr/bin/env bash
set -euo pipefail

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is not installed. Install it first:"
  echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  exit 1
fi

echo "[1/8] Reinstalling Ruby via Homebrew..."
brew reinstall ruby

echo "[2/8] Clearing stale shell cache and Ruby/Bundler environment..."
hash -r
unset GEM_HOME GEM_PATH BUNDLE_PATH BUNDLE_BIN_PATH RUBYOPT || true

echo "[3/8] Ensuring Ruby and Gem are available..."
ruby -v
gem -v

echo "[4/8] Installing Bundler for current Ruby..."
gem install bundler

echo "[5/8] Verifying Bundler install..."
bundle -v

echo "[6/8] Removing stale project lock/install state..."
rm -f Gemfile.lock
bundle clean --force || true

echo "[7/8] Reinstalling project dependencies..."
bundle install

echo "[8/8] Starting local Jekyll server..."
bundle exec jekyll serve
