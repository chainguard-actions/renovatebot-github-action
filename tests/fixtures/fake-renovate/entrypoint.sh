#!/bin/sh
# Fake renovate image used by the tests. It avoids pulling the multi-GB real
# image while still letting the tests verify what the action passes to
# `docker run` (environment variables and arguments).
if [ "$1" = "--version" ]; then
  echo "99.0.0-fake"
  exit 0
fi
mkdir -p /out
env | sort > /out/env
echo "$@" > /out/args
echo "fake renovate ran"
exit 0
