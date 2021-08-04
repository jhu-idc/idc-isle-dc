#!/bin/bash
set -e

TESTCAFE_TESTS_FOLDER="$(pwd)/$(dirname $0)/$(basename $0 .sh)/tests"

# Start the backend that serves the media files to be migrated
# Listens internally on port 80 (addressed as http://<assets_container>/assets/)
startMigrationAssetsContainer

# Run 'admin' end-to-end tests
docker run --rm --network gateway --env-file "${ENV_FILE}" -v "${TESTCAFE_TESTS_FOLDER}":/end-to-end testcafe/testcafe --screenshots path=/end-to-end/reports,takeOnFails=true chromium /end-to-end/tests/admin/*.spec.js

# Run UI data migrations
docker run --rm --network gateway --env-file "${ENV_FILE}" -v "${TESTCAFE_TESTS_FOLDER}":/end-to-end testcafe/testcafe --screenshots path=/end-to-end/reports,takeOnFails=true chromium /end-to-end/tests/ui/data-*.js

# Run UI tests
docker run --rm --network gateway --env-file "${ENV_FILE}" -v "${TESTCAFE_TESTS_FOLDER}":/end-to-end testcafe/testcafe --screenshots path=/end-to-end/reports,takeOnFails=true chromium /end-to-end/tests/ui/*.spec.js
