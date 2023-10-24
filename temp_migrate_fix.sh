#!/bin/bash

# For each title find the Node ID and replace the "collection_object:$TITLE" with the Node ID in the CSV file.
# NODE_ID=$(docker-compose exec -T drupal with-contenv bash -lc 'drush ev '\''$nodes = \Drupal::entityTypeManager()->getStorage("node")->loadByProperties(["title" => "$TITLE[0]"]); if (!empty($nodes)) { print reset($nodes)->id(); } else { print "No node found with the given title."; }'\''')
# sed -i 's/"collection_object:Johns Hopkins File 7 (Television program)"/$NODE_ID/g' islandora_workbench/islandora_workbench_demo_content/migration_from_production/islandora_objects.yml
echo -e "\n\n\nRunning Script to replace the collection_object:$TITLE with the Node ID in the CSV file"

# Define the titles in an array
TITLES=(
  "Johns Hopkins File 7 (Television program)"
  "Johns Hopkins science review (Television program)"
  "Johns Hopkins University graphic and pictorial collection"
  "Johns Hopkins University maps and atlases"
  "Johns Hopkins University News-Letter"
  "Johns Hopkins University oral history collection"
  "Johns Hopkins University television programs collection"
  "Tomorrow (Television program)"
  "Tomorrow's careers (Television program)"
)

# Define the file path
FILE_PATH="islandora_workbench/islandora_workbench_demo_content/migration_from_production/islandora_objects.csv"

# Loop through each title
for TITLE in "${TITLES[@]}"; do
  echo "Fetch the Node ID for the current title in the CSV file"
  ESCAPED_TITLE=$(echo "$TITLE" | sed "s/'/'\\\\''/g")  # Escape single quotes in the title
  NODE_ID=$(docker-compose exec -T drupal with-contenv bash -lc "drush ev '\$nodes = \Drupal::entityTypeManager()->getStorage(\"node\")->loadByProperties([\"title\" => \"$ESCAPED_TITLE\"]); if (!empty(\$nodes)) { print reset(\$nodes)->id(); } else { print \"No node found with the given title.\"; }'")

  # Check if NODE_ID is numeric (meaning we found a valid node ID)
  if [[ $NODE_ID =~ ^[0-9]+$ ]]; then
    echo "Replace the collection_object:$TITLE with the Node ID in the file"
    sed -i "s/,\"collection_object:$TITLE\",/,$NODE_ID,/g" "$FILE_PATH"
  else
    echo "No Node ID found for title: $TITLE"
  fi
done

echo -e "\ndone.\n\n\n"
