const ImageKit = require("imagekit");

const imagekit = new ImageKit({
    publicKey : process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey : process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint : process.env.IMAGEKIT_URL_ENDPOINT
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

function assertImagekitEnv() {
    const missing = [];
    if (!process.env.IMAGEKIT_PUBLIC_KEY) missing.push('IMAGEKIT_PUBLIC_KEY');
    if (!process.env.IMAGEKIT_PRIVATE_KEY) missing.push('IMAGEKIT_PRIVATE_KEY');
    if (!process.env.IMAGEKIT_URL_ENDPOINT) missing.push('IMAGEKIT_URL_ENDPOINT');
    if (missing.length) {
        throw new Error(`Missing ImageKit env: ${missing.join(', ')}`);
    }
}

async function uploadFile (fileBuffer, fileName, mimeType) {
    if (!fileBuffer) {
        throw new Error("No file buffer provided to uploadFile");
    }
    assertImagekitEnv();

    try {
        const base64 = fileBuffer.toString('base64');
        const ext = extFromMime(mimeType);
        const finalName = `${fileName || 'upload'}${ext}`;

        const result = await imagekit.upload({
            file: base64,            // raw base64 string accepted
            fileName: finalName,
            useUniqueFileName: true
            // folder: 'foodgram' // optional: uncomment to group uploads
        });

        if (!result || !result.url) {
            throw new Error("ImageKit upload did not return a url");
        }

        return result.url;
    } catch (err) {
        console.error("ImageKit upload error:", err?.message || err);
        throw err;
    }
}

module.exports = {
    uploadFile
}
