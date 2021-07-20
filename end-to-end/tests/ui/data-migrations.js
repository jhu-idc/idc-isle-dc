import { getCurrentUrl } from '../helpers';
import { localAdmin } from '../roles';
import { Selector } from 'testcafe';

const submitId = '#edit-import';

const uiSourcePrefix = '../testdata/ui/';
const uiMigrations = {
  persons: {
    id: 'idc_ingest_taxonomy_persons',
    files: [
      'persons.csv'
    ]
  },
  accessTerms: {
    id: 'idc_ingest_taxonomy_islandora_accessterms',
    files: [
      'access-terms.csv'
    ]
  },
  collections: {
    id: 'idc_ingest_new_collection',
    files: [
      'series-1-collections-01.csv',
      'series-1-collections-02.csv'
    ]
  },
  items: {
    id: 'idc_ingest_new_items',
    files: [
      'series-2-items-01.csv'
    ]
  }
};

const ui_migration_test_path = 'ui_migration';

/**
 * This is run separately by NPM first before the rest of the UI tests
 * in order to populate the site with data
 */

fixture `Run UI Data Migrations`
  .page `https://islandora-idc.traefik.me/migrate_source_ui`
  .beforeEach(async (t) => {
    await t.useRole(localAdmin);
  });


/**
 * This function assumes the test is already on the '/migrate_source_ui' page.
 *
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
 async function migrate(t, migrationId, sourceFile, timeout = 10000) {
  const selectMigration = Selector('#edit-migrations');
  const migrationOptions = selectMigration.find('option');
  const fileInput = Selector('#edit-source-file');

  await t
    .click(selectMigration)
    .click(migrationOptions.withAttribute('value', migrationId))
    .setFilesToUpload(fileInput, [ sourceFile ])
    .click(submitId)
    // .takeScreenshot(`Migration-result-${migrationId}.png`)
    .expect(
      Selector('.messages--status')
        .withText(`done with '${migrationId}'`)
        .withText('0 failed')
        .exists
    ).ok(
      `Failed migration => (${migrationId} : ${sourceFile})`,
      { timeout: timeout }
    )
    .then(() => console.log(`  - Migration done => ${migrationId} : ${sourceFile}`))
    .catch((e) => {
      console.log('#### Something went wrong: ####');
      console.log(e);
    });
}

/**
 * Perform a set of migrations to ready the system with data to test UI features
 *
 * @param {class} t testcafe test controller
 * @param {number} timeout (OPTIONAL) time in ms to wait for each migration to finish
 *                  Default: 10000 (10 seconds)
 */
async function addUiData(t, timeout = 10000) {
  console.log('Adding data for UI tests');

  const origin = await getCurrentUrl();

  await t.navigateTo('https://islandora-idc.traefik.me/migrate_source_ui');

  let migrationId;

  const doMigration = async (filename) => {
    if (!migrationId) return;
    await migrate(t, migrationId, `${uiSourcePrefix}${filename}`, timeout);
  }

  // Access Terms
  migrationId = uiMigrations.accessTerms.id;
  uiMigrations.accessTerms.files.forEach(f =>doMigration(f));

  // Persons
  migrationId = uiMigrations.persons.id;
  uiMigrations.persons.files.forEach(f =>doMigration(f));

  // Collections
  migrationId = uiMigrations.collections.id;
  uiMigrations.collections.files.forEach(f =>doMigration(f));

  // Repo Items
  migrationId = uiMigrations.items.id;
  uiMigrations.items.files.forEach(f =>doMigration(f));

  // When done, create an article for easy checking
  await addUIArticle(t);

  await t.navigateTo(origin);
}

/**
 * Add an article with known data so we can later check to see if UI
 * migrations have already been run.
 *
 * @param {class} t Testcafe controller
 */
async function addUIArticle(t) {
  const origin = await getCurrentUrl();
  await t.navigateTo('https://islandora-idc.traefik.me/node/add/article');
  console.log('  > Creating marker article');

  await t
    .expect(Selector('h1').withText('Create Article').exists)
    .ok('Not on article creation page');

  await t
    .typeText('#edit-title-0-value', 'UI Migrations')
    .click('#edit-path-0')
    .typeText('#edit-path-0-alias', `/${ui_migration_test_path}`)
    .click('#edit-submit')
    .expect(Selector('title').withText('UI Migrations | Default').exists).ok();

  await t.navigateTo(origin);
}

/**
 * See if UI migrations have been done already by checking to see if the
 * marker article exists
 *
 * @param {class} t Testcafe controller
 * @returns {boolean} TRUE if marker article was found, FALSE otherwise
 */
async function checkForUIMigrations(t) {
  const origin = await getCurrentUrl();

  await t.navigateTo(`https://islandora-idc.traefik.me/${ui_migration_test_path}`);
  const result = await Selector('title').withText('UI Migrations | Default').exists;

  await t.navigateTo(origin);

  return result;
}

test('Do migrations', async (t) => {
  if (!(await checkForUIMigrations(t))) {
    await addUiData(t);
  }
});

