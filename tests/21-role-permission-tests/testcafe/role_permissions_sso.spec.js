import {Selector} from 'testcafe';
import {staff1AdminSSO, adminUser, createCLA,pageUserList,usernameCLA} from "./roles";

fixture`Role Permissions: SSO Tests`
  .page`https://islandora-idc.traefik.me/admin/people`;

test('Ensure SSO login does not re-evaluate roles upon login', async t => {

  // log in and out as staff1 for the first time to establish an account
  await t.useRole(staff1AdminSSO);
  await t.navigateTo('https://islandora-idc.traefik.me/user/logout');

  // log in as admin and check out roles.
  await t.useRole(adminUser);
  await t.navigateTo(pageUserList);

  // see that staff1 has no roles right now
  let user = Selector('div.view-content').find('a').withText('staff1@johnsho…');
  await t.expect(user.count).eql(1);
  await t.expect(user.parent('tr').child('td').nth(3).innerText).eql("");

  // let's give staff1 global admin privileges
  await t.click(user);
  await t.click(Selector('#block-idcui-local-tasks').find('a').withText('Roles'))
  await t.click(Selector('label').withText("Global Admin"));
  await t.click("#edit-submit");

  const status = Selector('.messages--status').withText("The roles have been updated.");
  await t.expect(status.count).eql(1);

  await t.navigateTo(pageUserList);

  // confirm that it stuck
  user = Selector('div.view-content').find('a').withText('staff1@johnsho…');
  await t.expect(user.count).eql(1);
  await t.expect(user.parent('tr').child('td').nth(3).innerText).eql("Global Admin");

  // log out - we're done with Admin
  await t.navigateTo('https://islandora-idc.traefik.me/user/logout');

  // log back in as staff1 an ensure they still have global admin perms
  await t.navigateTo("https://islandora-idc.traefik.me/saml_login");
  await t.typeText('#username', 'staff1')
    .typeText('#password', 'moo')
    .click('.form-button');

  await t.navigateTo(pageUserList);
  // let the user check their own perms; since they are a global admin this will work.
  user = Selector('div.view-content').find('a').withText('staff1@johnsho…');
  await t.expect(user.count).eql(1);
  await t.expect(user.parent('tr').child('td').nth(3).innerText)
    .eql("Global Admin");
});
