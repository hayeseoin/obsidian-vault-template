#!/bin/bash

set -e

cd "$(dirname "$0")"

echo "$(date): Script executed" >> /tmp/obsidian_index_generator_script.log

which node > /dev/null 2>&1

# node ./backlink-files.js
node ./create-indexes.js
# node ./create-main-index.js
