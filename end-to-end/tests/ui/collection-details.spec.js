import { getCurrentUrl } from '../helpers';
import Page from './pages/collection-details';

/**
 * Duck Collection page
 */
fixture `Collection Details Page`
  .page `https://islandora-idc.traefik.me/node/42`;

test('English description is displayed', async (t) => {
  await t
    .expect(Page.description.exists).ok()
    .expect(Page.description.withText('Collection of ducks').exists).ok()
    .expect(Page.description.withText('(English)').exists).ok();
});

test('Action buttons present', async (t) => {
  await t
    .expect(Page.contactBtn.exists).ok()
    .expect(Page.copyUrlBtn.exists).ok()
    .expect(Page.downloadBtn.exists).notOk();
});

test('Featured repo items are present', async (t) => {
  await t
    .expect(Page.featuredItems.list.exists).ok()
    .expect(Page.featuredItems.items.count).eql(2);
});

test('Metadata toggle', async (t) => {
  await t
    .expect(Page.drawerContent.clientHeight).eql(0)
    .click(Page.drawerToggle)
    .expect(Page.drawerContent.clientHeight).gt(0)
    .click(Page.drawerToggle)
    .expect(Page.drawerContent.clientHeight).eql(0);
});

test('Metadata display', async (t) => {
  await Page.toggleMetadata();

  await t
    .expect(Page.metadata.count).eql(6)
    .expect(Page.metadata.withText('Translated Descriptions').exists).ok()
    .expect(Page.metadata.withText('Alternative Titles').exists).ok()
    .expect(Page.metadata.withText('Contact Name').exists).ok()
    .expect(Page.metadata.withText('Contact Email').exists).ok()
    .expect(Page.metadata.withText('Collection Numbers').exists).ok()
    .expect(Page.metadata.withText('Citable URL').exists).ok()
    .expect(Page.metadata.withText('Finding Aids').exists).ok();

  await t
    .expect(Page.metadata.withText('ducks (Spanish)').exists).ok()
    .expect(Page.metadata.withText('Moo Jones').exists).ok()
    .expect(Page.metadata.withText('moo@example.com').exists).ok()
    .expect(Page.metadata.withText('/node/42').exists).ok();
});

test('Facet toggle', async (t) => {

});
