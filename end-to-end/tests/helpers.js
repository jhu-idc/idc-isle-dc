import { ClientFunction, Selector } from 'testcafe';

export const getCurrentUrl = ClientFunction(() => window.location.href);

export async function clearCache(t) {
  return await t
    .click('#toolbar-item-devel')
    .click('a[data-drupal-link-system-path="devel/cache/clear"]')
    .expect(Selector('.messages').withText('Cache cleared').exists).ok();
}
