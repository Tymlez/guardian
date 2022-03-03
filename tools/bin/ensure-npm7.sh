#!/bin/bash

#
# Ensure all package-lock.json files are version 2 and above, i.e., generated by npm 7 and above.
#

set -e

NUM_NON_NPM7_PACKAGES=$(lerna exec -- cat package-lock.json | grep '"lockfileVersion": 1'  | wc -l | xargs)

if [ "$NUM_NON_NPM7_PACKAGES" != "0" ]; then
  echo "Following packages are not using NPM 7"
  lerna exec --stream -- cat package-lock.json | grep '"lockfileVersion": 1'
  exit 1
fi

cat package-lock.json | grep '"lockfileVersion": 2' || { echo "Root package is not using NPM 7"; false; }