#!/bin/sh
testcafe chromium:headless tests/admin/*.spec.js && \
testcafe chromium:headless tests/ui/data-migrations.js && \
testcafe --concurrency 2 chromium:headless tests/ui/*.spec.js
