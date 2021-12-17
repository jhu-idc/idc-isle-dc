import GlobalSearch from './pages/global-search';
import Results from './pages/searchable';

fixture`Global Search`
  .page`https://islandora-idc.traefik.me`;

test('A basic single word search', async (t) => {
  await GlobalSearch.search('duck', t);
  await t.expect(Results.results.count).eql(4);
});

test('Boolean search: "yellow AND duck"', async (t) => {
  await GlobalSearch.search('yellow AND duck', t);
  await t.expect(Results.results.count).eql(1);
});

test('Boolean search: "s3 OR duck"', async (t) => {
  await GlobalSearch.search('s3 OR duck', t);
  await t.expect(Results.results.count).eql(6);
});

test('Simple wildcard search with "*"', async (t) => {
  await GlobalSearch.search('test*', t);
  await t.expect(Results.results.count).eql(5);
});

test('Use of double quotes to search exact phrase: "Copyright Undetermined"', async (t) => {
  await GlobalSearch.search('"Copyright Undetermined"', t);
  await t.expect(Results.results.count).eql(4);
});
