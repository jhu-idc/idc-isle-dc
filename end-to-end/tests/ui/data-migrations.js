import { addUiData } from '../helpers';
import { localAdmin } from '../roles';

fixture `Run UI Data Migrations`
  .page `https://islandora-idc.traefik.me/migrate_source_ui`
  .beforeEach(async (t) => {
    await t.useRole(localAdmin);
  });

test('Do migrations', async (t) => {
  await addUiData(t);
});

