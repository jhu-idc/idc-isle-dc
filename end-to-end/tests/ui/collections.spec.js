import { Role, Selector } from 'testcafe';
import { addUiData, checkForUIMigrations } from '../helpers';
import { localAdmin } from '../roles';

fixture `Collections Page`
  .page `https://islandora-idc.traefik.me/collections`
  .beforeEach(async (t) => {
    const alreadyDone = await checkForUIMigrations(t);
    if (!alreadyDone) {
      await t.useRole(localAdmin);
      await addUiData(t);
      await t.useRole(Role.anonymous());
    }
  });


test('Has expected number of collections', async (t) => {
  const results = Selector('#idc-search .col-span-3 a[href*="/node/"]');
  const pager = Selector('#idc-search .col-span-3 > div:last-child');

  await t
    .expect(results.count).eql(10)
    .expect(pager.exists).ok()
    .expect(pager.textContent).contains('1 – 10 of');
});
