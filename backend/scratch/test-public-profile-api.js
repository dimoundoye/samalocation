const axios = require('axios');

async function test() {
    const id = '72e6c631-e81b-453f-a714-ca994f0b3b7b';
    const url = `http://localhost:5000/api/owner/${id}/public-profile`;
    console.log('Appel API sur :', url);
    try {
        const res = await axios.get(url);
        console.log('Statut :', res.status);
        console.log('Données :', JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error('Erreur API :', e.message);
        if (e.response) {
            console.error('Corps de l\'erreur :', e.response.data);
        }
    }
}

test();
