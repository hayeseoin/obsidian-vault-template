#!/bin/bash

set -e

cd "$(dirname "$0")"

which node > /dev/null 2>&1

node ./backlink-files.js
node ./create-indexes.js
node ./create-main-index.js
