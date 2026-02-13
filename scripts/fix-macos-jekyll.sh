#!/usr/bin/env bash
set -euo pipefail

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is not installed. Install it first:"
  echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  exit 1
fi

echo "[1/6] Reinstalling Ruby via Homebrew..."
brew reinstall ruby

echo "[2/6] Refreshing shell command cache..."
hash -r

echo "[3/6] Ensuring Ruby and Gem are available..."
ruby -v
gem -v

echo "[4/6] Installing Bundler for current Ruby..."
gem install bundler

echo "[5/6] Verifying Bundler install..."
bundle -v

echo "[6/6] Installing project dependencies and starting Jekyll..."
bundle install
bundle exec jekyll serve
