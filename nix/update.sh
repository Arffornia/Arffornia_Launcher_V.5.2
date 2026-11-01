#!/usr/bin/env sh
# Point nix/release.json at the latest GitHub release (or at the tag given as $1, e.g. v0.1.16).
# The hash is the sha512 that electron-builder writes into latest-linux.yml, as an SRI string.
set -eu
repo="Arffornia/Arffornia_Launcher_V.5.2"
tag="${1:-}"
if [ -z "$tag" ]; then
  tag=$(curl -fsSL "https://api.github.com/repos/$repo/releases/latest" | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -n 1)
fi
yml=$(curl -fsSL "https://github.com/$repo/releases/download/$tag/latest-linux.yml")
version=$(printf '%s\n' "$yml" | sed -n 's/^version: *//p')
file=$(printf '%s\n' "$yml" | sed -n 's/^path: *//p')
sha=$(printf '%s\n' "$yml" | sed -n 's/^sha512: *//p')
case "$file" in *.AppImage) ;; *) echo "unexpected path in latest-linux.yml: $file" >&2; exit 1 ;; esac
dir=$(dirname "$0")
cat > "$dir/release.json" <<JSON
{
  "version": "$version",
  "url": "https://github.com/$repo/releases/download/$tag/$file",
  "hash": "sha512-$sha"
}
JSON
echo "nix/release.json -> $version"
