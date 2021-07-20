import { Selector } from 'testcafe';
import { getCurrentUrl } from '../helpers';
import page from './pages/collections';

fixture `Collections Page`
  .page `https://islandora-idc.traefik.me/collections`;

const results = Selector('[data-test-search-results-item]');

/**
 *
 * @param {class} t Testcafe controller
 * @param {string} query search query
 * @returns {string} URL after search is executed
 */
async function doSearch(t, query) {
  await t
    .expect(page.searchInput.exists).ok()
    .expect(page.searchSubmit.exists).ok()
    .typeText(page.searchInput, query, { replace: true, paste: true })
    .expect(page.searchInput.value).contains(query)
    .click(page.searchSubmit);

  return await getCurrentUrl();
}

test('Has expected number of collections', async (t) => {
  await t
    .expect(page.results.count).eql(10)
    .expect(page.pagers[0]).ok()
    .expect(page.pagers[0].pager.textContent).contains('1 – 10 of');
});

test('Pager controls work', async (t) => {
  const pager = page.pagers[0];

  await t
    .expect(pager).ok('No pager found on page')
    .expect(pager.buttons.count).eql(4);

  await t
    .expect(pager.next.exists).ok()
    .expect(pager.next.withAttribute('disabled').exists).notOk('Next btn was disabled, should be enabled')
    .click(pager.next)
    .expect(getCurrentUrl()).contains('page=1')
    .expect(page.results.count).gte(3);
});

test('Basic search input', async (t) => {
  const query = 'animal';
  const url = await doSearch(t, query);

  await t
    .expect(url).contains(`query=${query}`)
    .expect(results.count).eql(7);
});

test('Proximity search syntax', async (t) => {
  const query = '"collection images"~5';
  const url = await doSearch(t, query);

  await t
    .expect(decodeURI(url)).contains(`query=${query}`)
    .expect(results.count).eql(6);
});

/**
 * Do a search, then change sort order to DESC and see that
 * the ordering has changed.
 */
test('List option: sort order', async (t) => {
  const orderValue = 'sort_order=DESC';
  await doSearch(t, 'animal');

  await t
    .expect(page.results.count).eql(7)
    .expect(page.results.nth(0).withText('Cow Collection').exists).ok()
    .expect(page.listOptions.sortOrder.exists).ok();

  await page.listOptions.sortOrder.setValue(`&${orderValue}`);

  await t
    .expect(await getCurrentUrl()).contains(orderValue)
    .expect(page.results.nth(0).withText('Arctic Animals').exists).ok();
});

test.skip('List option: sort by', async (t) => {});
test.skip('List option: items per page', async (t) => {});
test.skip('List option: go to page', async (t) => {});
