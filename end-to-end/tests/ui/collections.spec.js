import { Selector } from 'testcafe';
import { getCurrentUrl } from '../helpers';

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
  const input = Selector('[data-test-search-input] input');
  const submit = Selector('[data-test-search-input] button');

  await t
    .expect(input.exists).ok()
    .expect(submit.exists).ok()
    .typeText(input, query, { replace: true, paste: true })
    .expect(input.value).contains(query)
    .click(submit);

  return await getCurrentUrl();
}

test('Has expected number of collections', async (t) => {
  const results = Selector('[data-test-search-results-item]');
  const pager = Selector('[data-test-search-pager]').nth(0);

  await t
    .expect(results.count).eql(10)
    .expect(pager.exists).ok()
    .expect(pager.textContent).contains('1 – 10 of');
});

test('Pager controls work', async (t) => {
  const pager = Selector('[data-test-search-pager]').nth(0);
  const pagerButtons = pager.find('button');

  await t
    .expect(pager.exists).ok('No pager found on page')
    .expect(pagerButtons.count).eql(4);

  const next = pagerButtons.nth(-1);

  await t
    .expect(next.exists).ok()
    .expect(next.withAttribute('disabled').exists).notOk('Next btn was disabled, should be enabled')
    .click(next)
    .expect(getCurrentUrl()).contains('page=1')
    .expect(Selector('[data-test-search-results-item]').count).gte(3);
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
