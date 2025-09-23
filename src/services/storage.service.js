const ImageKit = require("imagekit");

const imagekit = new ImageKit({
    publicKey : process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey : process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint : process.env.IMAGEKIT_URL_ENDPOINT
});

async function uploadFile (fileBuffer, fileName, mimeType) {
    if (!fileBuffer) {
        throw new Error("No file buffer provided to uploadFile");
    }

    try {
        // ImageKit accepts base64 string; convert buffer -> base64
        const base64 = fileBuffer.toString('base64');
        // Optionally you can include data URI prefix: data:<mime>;base64,<base64>
        // Many examples use plain base64 string as well.
        const fileParam = base64;

        const result = await imagekit.upload({
            file : fileParam,
            fileName : fileName
        });

        if (!result || !result.url) {
            throw new Error("ImageKit upload did not return a url");
        }

        return result.url;
    } catch (err) {
        console.error("ImageKit upload error:", err.message || err);
        throw err;
    }
}

// New: provide signature/token/expire/publicKey/urlEndpoint for client-side uploads
function getImagekitAuth() {
    if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
        throw new Error("Missing ImageKit environment variables");
    }
    const params = imagekit.getAuthenticationParameters();
    return {
        signature: params.signature,
        token: params.token,
        expire: params.expire,
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    };
}

module.exports = {
    uploadFile,
    getImagekitAuth
}
