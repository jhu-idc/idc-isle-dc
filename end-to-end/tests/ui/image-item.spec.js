import Page from './pages/item-detail-image';

async function hasMetadata(t, field, value) {
  const selector = Page.metadata.withText(field).parent();
  await t
    .expect(selector.exists).ok()
    .expect(selector.withText(value).exists).ok();
}

/**
 * Item details for 'Mallard' item, a single Tiff image
 */
fixture `Repository Item Details Page`
  .page `https://islandora-idc.traefik.me/node/49`;

test('Description', async (t) => {
  await t.expect(Page.description.withText('(English)').exists).ok();
});

test('Metadata', async (t) => {
  await t.expect(Page.metadata.count).eql(12);

  await hasMetadata(t, 'Alternative Title', 'Mallard Duck (English)');
  await hasMetadata(t, 'Alternative Title', 'Pato Mallard (Spanish)');
  await hasMetadata(t, 'Member of', 'Duck Collection');
  await hasMetadata(t, 'Resource Type', 'Image');
  await hasMetadata(t, 'Access Rights', 'Public digital access');
  await hasMetadata(t, 'Date Available', '2001-01-01');
  await hasMetadata(t, 'Date Created', '2001-01-01');
  await hasMetadata(t, 'Date Copyrighted', '2001-01-01');
  await hasMetadata(t, 'Date Published', '2001-01-01');
  await hasMetadata(t, 'Citable URL', '/node/49');
  await hasMetadata(t, 'Title Language', 'English');
  await hasMetadata(t, 'Description', 'a dabbling duck');
});

test('Contact modal', async (t) => {
  await t
    .expect(Page.contactBtn.exists).ok()
    .expect(Page.contactModal.visibility().exists).notOk()
    .click(Page.contactBtn)
    .expect(Page.contactModal.visibility().exists).ok()
    // Make sure collection is auto-filled
    .expect(Page.contactModal.collection.value).eql('Duck Collection (42)');
});

test.skip('Download', async (t) => {});
test.skip('Export metadata', async (t) => {});
