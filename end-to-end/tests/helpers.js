const selectMigration = Selector('#edit-migrations');
const migrationOptions = selectMigration.find('option');

const fileUploaderId = '#edit-source-file';
const submitId = '#edit-import';

/**
 * Execute a migration in the UI, then wait for a status message to appear
 * on screen comfirming it was run. This makes no distinction between a
 * successfull or failed migration.
 *
 * Note, if a migration is run multiple times, the system should overwrite or
 * update already existing nodes.
 *
 * @param t testcafe class
 * @param {string} migrationId system ID of the desired migration
 * @param {string} sourceFile file path of the migration data
 * @param {number} timeout (OPTIONAL) time in ms to wait for migration status message
 *                  Default: 10000 (10 seconds)
 */
export async function migrate(t, migrationId, sourceFile, timeout = 10000) {
  await t
    .click(selectMigration)
    .click(migrationOptions.withAttribute('value', migrationId));

  await t
    .setFilesToUpload(fileUploaderId, [ sourceFile ])
    .click(submitId);

  await t.expect(
    Selector('.message--status')
      .withText(`done with ${migrationId}`)
      .exists
  ).ok(
    'Found no status messages about finishing this migration',
    { timeout: timeout }
  );
}
