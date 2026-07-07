const axios = require('axios');

async function test() {
    const basePath = 'hz/ed';
    const imagePath = '87dbFSthrlc94cu_7wwxVQ/-/_1w6IUKZ8WpuZZVqTnmgAA/0c4a9d9ab2b1031d48d744c2bcefaf44fd43608f.jpg';
    
    // We try to replace "listing-thumb-543w" with various thumb sizes
    const sizes = [
        'listing-thumb-1200w',
        'listing-thumb-1080w',
        'listing-thumb-960w',
        'listing-thumb-750w',
        'listing-thumb-600w',
        'listing-thumb-300w',
        'listing-thumb-200w'
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
