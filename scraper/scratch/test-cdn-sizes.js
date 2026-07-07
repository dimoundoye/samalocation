const axios = require('axios');

async function test() {
    // Original url
    // https://i.roamcdn.net/hz/ed/listing-thumb-543w/87dbFSthrlc94cu_7wwxVQ/-/_1w6IUKZ8WpuZZVqTnmgAA/0c4a9d9ab2b1031d48d744c2bcefaf44fd43608f.jpg
    const basePath = 'hz/ed';
    const imagePath = '87dbFSthrlc94cu_7wwxVQ/-/_1w6IUKZ8WpuZZVqTnmgAA/0c4a9d9ab2b1031d48d744c2bcefaf44fd43608f.jpg';
    
    // We try to replace "listing-thumb-543w" with various sizes
    const sizes = [
        'listing-gallery-1920w',
        'listing-gallery-1080w',
        'listing-gallery-800w',
        'listing-gallery-600w',
        'listing-gallery-full',
        'listing-gallery',
        'listing-full',
        'listing-large',
        'listing-original',
        'listing-thumb-1000w',
        'listing-thumb-800w'
    ];

    for (const size of sizes) {
        const url = `https://i.roamcdn.net/${basePath}/${size}/${imagePath}`;
        try {
            const res = await axios.head(url);
            console.log(`✅ [${size}] -> SUCCESS (Status: ${res.status}) - URL: ${url}`);
        } catch (e) {
            console.log(`❌ [${size}] -> FAILED (${e.message})`);
        }
    }
}

test();
