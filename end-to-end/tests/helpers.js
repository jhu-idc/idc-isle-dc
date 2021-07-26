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
