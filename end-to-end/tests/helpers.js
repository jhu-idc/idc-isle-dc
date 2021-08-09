import { ClientFunction, Selector } from 'testcafe';
import fs from "fs";
import path from "path";
import url from "url";
import http from "http";

export const getCurrentUrl = ClientFunction(() => window.location.href);

export async function clearCache(t) {
  return await t
    .click('#toolbar-item-devel')
    .click('a[data-drupal-link-system-path="devel/cache/clear"]')
    .expect(Selector('.messages').withText('Cache cleared').exists).ok();
}

const httpget = (uri, file) => {
  return new Promise((resolve) => {
    http.get(uri, (response) => response.pipe(file));
    resolve();
  });
};

/** Download the contents of a url into a file
 *
 * @param {string} uri a URL from which to download content to a file
 * @returns {string} file path of downloaded file
 */
export const download = async (uri) => {
  const basedir = "/tmp/testcafe/" + process.pid;

  await fs.promises.mkdir(basedir, { recursive: true });
  const filename = path.basename(url.parse(uri).pathname);

  const saveTo = basedir + "/" + filename;
  const file = fs.createWriteStream(saveTo);

  await httpget(uri, file);
  return saveTo;
};

/** Tries given function repeatedly until it returns true; throwing an exception if success isn't achieved until deadline_ms milliseconds
 *
 * @param {function} func function to call until it returns a truthy result, or the deadline passes
 * @param {number} deadline_ms deadline in miliseconds
 * @returns
 */
 export const tryUntilTrue = async (
  func,
  deadline_ms = process.env.TEST_OPERATION_TIMEOUT_MS
) => {
  let expired = false;
  setTimeout(() => {
    expired = true;
  }, deadline_ms);

  for (;;) {
    if (expired) {
      return false;
    }

    if (await func()) {
      return true;
    }
  }
};

/** Perform a migration using the given file and migration type
 *
 * There is no specific feedback as to the success or failure of this operation, unless an exception is thrown
 *
 * @param {TestController} t Testcafe controller
 * @param {string} migrationType (e.g. idc_ingest_media_file, idc_ingest_new_collection)
 * @param {string} file Path to the cvs file to upload for migration
 */
 export const doMigration = async (t, migrationType, file) => {
  await t.navigateTo("https://islandora-idc.traefik.me/migrate_source_ui");

  const selectMigration = Selector("#edit-migrations");
  const migrationOptions = selectMigration.find("option");

  // migrate the test objects into Drupal
  await t
    .click(selectMigration)
    .click(migrationOptions.withAttribute("value", migrationType));

  await t.setFilesToUpload("#edit-source-file", [file]).click("#edit-import");

  // Now, wait until we see messages on screen that everything has migrated successfully
  await t
    .expect(
      await tryUntilTrue(async () => {
        let error_present = await Selector(".messages--error").count;
        let status_present = await Selector(".messages--status").count;

        // Something failed and was kind enough to leave a message
        if (error_present > 0) {
          throw "Error performing migrations!";
        }

        // If there is no status block, we're not done
        if (status_present < 1) {
          return false;
        }

        // Iterate through all messages and look for '0 failed'
        let messages = Selector(".messages__list");
        let message_count = await messages.count;

        for (var i = 0; i < message_count; i++) {
          await t.expect(messages.nth(i).innerText).contains("0 failed");
        }

        return message_count > 0;
      })
    )
    .eql(true, "Could not perform migration!");
};
