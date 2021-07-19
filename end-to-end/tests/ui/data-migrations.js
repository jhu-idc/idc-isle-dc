import { addUiData, checkForUIMigrations } from '../helpers';
import { localAdmin } from '../roles';

/**
 * This is run separately by NPM first before the rest of the UI tests
 * in order to populate the site with data
 */

fixture `Run UI Data Migrations`
  .page `https://islandora-idc.traefik.me/migrate_source_ui`
  .beforeEach(async (t) => {
    await t.useRole(localAdmin);
  });

test('Do migrations', async (t) => {
  if (!(await checkForUIMigrations(t))) {
    await addUiData(t);
  }
});

