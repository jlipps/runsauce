#!/usr/bin/env bash
set -e

regenerator=$(npm bin)/regenerator
echo "* Removing old es5 files"
rm -rf ./lib/es5
mkdir ./lib/es5
echo "* Generating new es5 files"
files=$(ls ./lib)
for f in $files; do
    if test -f ./lib/$f ; then
        echo "  $f -> es5/$f"
        $regenerator ./lib/$f > ./lib/es5/$f
    fi
done
