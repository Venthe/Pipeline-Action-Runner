#!/usr/bin/env bash

set -o errexit
set -o pipefail
#set -o xtrace

echo "RUNNING IN TEST MODE"

node --enable-source-maps /runner/index.js
