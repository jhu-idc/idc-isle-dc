#!/bin/bash
set -e

TESTCAFE_TESTS_FOLDER="$(pwd)/$(dirname $0)/$(basename $0 .sh)/testcafe"

# Start the backend that serves the media files to be migrated
# Listens internally on port 80 (addressed as http://<assets_container>/assets/)
startMigrationAssetsContainer

if [ -t 1 ] ; then
  docker-compose exec -T testcafe npm test
else
  docker-compose exec -ti testcafe npm test
fi
