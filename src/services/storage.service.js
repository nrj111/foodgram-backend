const ImageKit = require("imagekit");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// derive extension from MIME (e.g., video/mp4 -> .mp4)
function extFromMime(mimeType) {
  if (!mimeType || typeof mimeType !== 'string') return '';
  const map = {
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'video/ogg': '.ogv',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif'
  };
  return map[mimeType] || '';
}

// ensure we only add an extension if one is not present
function withExt(name, ext) {
  const base = name || 'upload';
  if (!ext) return base;
  if (/\.[a-z0-9]+$/i.test(base)) return base;
  return base + ext;
}

function assertImagekitEnv() {
  const missing = [];
  if (!process.env.IMAGEKIT_PUBLIC_KEY) missing.push('IMAGEKIT_PUBLIC_KEY');
  if (!process.env.IMAGEKIT_PRIVATE_KEY) missing.push('IMAGEKIT_PRIVATE_KEY');
  if (!process.env.IMAGEKIT_URL_ENDPOINT) missing.push('IMAGEKIT_URL_ENDPOINT');
  if (missing.length) throw new Error('Missing ImageKit env: ' + missing.join(', '));
}

async function uploadFile(fileBuffer, fileName, mimeType) {
  if (!fileBuffer) throw new Error("No file buffer provided to uploadFile");
  assertImagekitEnv();

  const ext = extFromMime(mimeType);
  const finalName = withExt(fileName, ext);

  try {
    const result = await imagekit.upload({
      file: fileBuffer,
      fileName: finalName,
      useUniqueFileName: true
    });

    if (!result || !result.url) throw new Error("ImageKit upload did not return a url");
    return result.url;
  } catch (err) {
    console.error("ImageKit upload error:", (err && err.message) ? err.message : err);
    throw err;
  }
}

module.exports = {
  uploadFile: uploadFile
};
