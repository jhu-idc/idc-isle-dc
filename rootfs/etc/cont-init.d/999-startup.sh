#!/usr/bin/with-contenv bash

echo ""
echo ""
echo " -------------------------------------------------------------------------- "
echo " -              Running a Start up script                                 - "
echo " -------------------------------------------------------------------------- "
echo ""

DRUPAL_DIR=/var/www/drupal
CHOWN="/bin/chown"
CHMOD="/bin/chmod"
MKDIR="/bin/mkdir"

set +e

echo "Creating tmp and private directories"
for d in $DRUPAL_DIR/web/sites/default/files/tmp /tmp/private ; do
  echo " directory: '$d'"
  $MKDIR -m 0775 -p "$d"
  $CHOWN -R nginx:nginx "$d"
done

# This is a workaround for a bug.
drush cdel core.extension module.search_api_solr_defaults || true
drush sql-query "DELETE FROM key_value WHERE collection='system.schema' AND name='search_api_solr_defaults';" || true
drush php-eval "\Drupal::keyValue('system.schema')->delete('remote_stream_wrapper')" || true
drush php-eval "\Drupal::keyValue('system.schema')->delete('matomo')" || true

# Fix for Github runner "the input device is not a TTY" error
drush search-api-solr:install-missing-fieldtypes || true
drush search-api:rebuild-tracker || true

# Cleanup
echo "Clean theme-registry..."
drush cc theme-registry

echo "Status..."
drush -d status

CURRENT_VERSION=$(drush cr && drush core-status --fields=drupal-version | cut -d\: -f2 | sed 's/ //g')
echo "Current Drupal version: $CURRENT_VERSION"

echo "Copy Generic File"
if [ ! -f web/sites/default/files/generic.png ] ; then
  cp "web/core/modules/media/images/icons/generic.png" "web/sites/default/files/generic.png" 
fi

echo ""
echo ""
echo " -------------------------------------------------------------------------- "
echo " -                                  Done                                  - "
echo " -------------------------------------------------------------------------- "
echo ""
