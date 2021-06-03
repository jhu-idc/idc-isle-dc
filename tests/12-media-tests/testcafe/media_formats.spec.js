import { adminUser } from "./roles.js";
import { findMediaOf } from "./util.js";
import { tryUntilTrue } from "./util.js";
import { download } from "./util.js";
import { uploadImageInUI , uploadFileInUI } from "./util.js";

fixture`Media format tests`
  .page`https://islandora-idc.traefik.me/migrate_source_ui`.beforeEach(
  async (t) => {
    await t.useRole(adminUser);
  }
);

test("Migrate tiff", async (t) => {
  await t
    .expect(
      await tryUntilTrue(async () => {
        const media = await findMediaOf(t, "Migrated Tiff Object");
        // 4 for Tif, service jpg, thumbnail jpg, FITS file
        return media.length == 4;
      })
    )
    .eql(true, "Did not find TIFF derivatives");
});

test("Upload tiff in UI", async (t) => {
  const file = await download(
    "http://migration-assets/assets/image/formats/tiff.tif"
  );
  await uploadImageInUI(t, "Uploaded Tiff Object", file);

  await t
    .expect(
      await tryUntilTrue(async () => {
        const media = await findMediaOf(t, "Uploaded Tiff Object");
        // 4 for Tif, service jpg, thumbnail jpg, FITS file
        return media.length == 4;
      })
    )
    .eql(true, "Did not find TIFF derivatives");
});

test("Migrate jpeg 2000", async (t) => {
  await t
    .expect(
      await tryUntilTrue(async () => {
        const media = await findMediaOf(t, "Migrated JPEG2000 Object");
        // 4 for jp2000, service jpg, thumbnail jpg, FITS file
        return media.length == 4;
      })
    )
    .eql(true, "Did not find JPEG 2000 derivatives");
});

test("Upload jpeg 2000 in UI", async (t) => {
  const file = await download(
    "http://migration-assets/assets/image/formats/jp2.jp2"
  );
  await uploadImageInUI(t, "Uploaded JPEG2000 Object", file);

  await t
    .expect(
      await tryUntilTrue(async () => {
        const media = await findMediaOf(t, "Uploaded JPEG2000 Object");
        // 4 for jp2000, service jpg, thumbnail jpg, FITS file
        return media.length == 4;
      })
    )
    .eql(true, "Did not find jpg 2000 derivatives");
});

test("Migrate Geo Tiff", async (t) => {
  await t
    .expect(
      await tryUntilTrue(async () => {
        const media = await findMediaOf(t, "Migrated Geo Tiff Object");
        // the geo tiff and just a FITS deriv
        return media.length == 2;
      })
    )
    .eql(true, "Did not find GEO TIF derivatives");
});

test("Upload Geo Tiff in UI", async (t) => {
  const file = await download(
    "http://migration-assets/assets/file/NEFF1851_GEO.tfw"
  );

  await uploadFileInUI(t, "Uploaded Geo Tiff Object", file);

  await t
    .expect(
      await tryUntilTrue(async () => {
        const media = await findMediaOf(t, "Uploaded Geo Tiff Object");
        // the geo tiff and just a FITS deriv
        return media.length == 2;
      })
    )
    .eql(true, "Did not find Geo Tif derivatives");
});

test("Migrate Zip File", async (t) => {
  await t
    .expect(
      await tryUntilTrue(async () => {
        const media = await findMediaOf(t, "Migrated Zip Object");
        // the zip and just a FITS deriv
        return media.length == 2;
      })
    )
    .eql(true, "Did not find Zip derivatives");
});

test("Upload Zip in UI", async (t) => {
  const file = await download(
    "http://migration-assets/assets/file/file_test.zip"
  );
  await uploadFileInUI(t, "Uploaded Zip Object", file);

  await t
    .expect(
      await tryUntilTrue(async () => {
        const media = await findMediaOf(t, "Uploaded Zip Object");
        // the zip and just a FITS deriv
        return media.length == 2;
      })
    )
    .eql(true, "Did not find Zip derivatives");
});

test("Migrate Tar File", async (t) => {
  await t
    .expect(
      await tryUntilTrue(async () => {
        const media = await findMediaOf(t, "Migrated Tar Object");
        // the tar and just a FITS deriv
        return media.length == 2;
      })
    )
    .eql(true, "Did not find Tar derivatives");
});

test("Upload Tar in UI", async (t) => {
  const file = await download(
    "http://migration-assets/assets/file/file_test.tar"
  );
  await uploadFileInUI(t, "Uploaded Tar Object", file);

  await t
    .expect(
      await tryUntilTrue(async () => {
        const media = await findMediaOf(t, "Uploaded Tar Object");
        // the tar and just a FITS deriv
        return media.length == 2;
      })
    )
    .eql(true, "Did not find Tar derivatives");
});

test("Migrate GZip File", async (t) => {
  await t
    .expect(
      await tryUntilTrue(async () => {
        const media = await findMediaOf(t, "Migrated GZip Object");
        // the gzip and just a FITS deriv
        return media.length == 2;
      })
    )
    .eql(true, "Did not find GZip derivatives");
});

test("Upload GZip in UI", async (t) => {
  const file = await download(
    "http://migration-assets/assets/file/file_test.tar.gz"
  );
  await uploadFileInUI(t, "Uploaded GZip Object", file);

  await t
    .expect(
      await tryUntilTrue(async () => {
        const media = await findMediaOf(t, "Uploaded GZip Object");
        // the gzip and just a FITS deriv
        return media.length == 2;
      })
    )
    .eql(true, "Did not find GZip derivatives");
});

test("Migrate TGZ File", async (t) => {
  await t
    .expect(
      await tryUntilTrue(async () => {
        const media = await findMediaOf(t, "Migrated TGZ Object");
        // the tgz and just a FITS deriv
        console.log("tgz count: " + media.length);
        return media.length == 2;
      })
    )
    .eql(true, "Did not find TGZ derivatives");
});

test("Upload TGZ in UI", async (t) => {
  const file = await download(
    "http://migration-assets/assets/file/file_test.tgz"
  );
  await uploadFileInUI(t, "Uploaded TGZ Object", file);

  await t
    .expect(
      await tryUntilTrue(async () => {
        const media = await findMediaOf(t, "Uploaded TGZ Object");
        // the tgz and just a FITS deriv
        return media.length == 2;
      })
    )
    .eql(true, "Did not find TGZ derivatives");
});
