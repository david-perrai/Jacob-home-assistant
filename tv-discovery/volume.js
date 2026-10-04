
const lgtv = require("lgtv2")({
    url: 'ws://192.168.1.83:3000'
});

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Wrapper pour transformer les callbacks en promesses
function request(uri, payload) {
    return new Promise((resolve, reject) => {
        lgtv.request(uri, payload, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
    });
}

// Helper pour demander une entrée utilisateur
function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

lgtv.on('error', function (err) {
    console.log('Erreur:', err);
});

lgtv.on('connect', async function () {
    console.log('✓ Connecté à la TV!');
    
    try {
        while (true) {
            const volumeStr = await askQuestion('\nEntrez la valeur du volume (0-100): ');
            const volume = parseInt(volumeStr);
            
            if (isNaN(volume) || volume < 0 || volume > 100) {
                console.log('❌ Veuillez entrer un nombre entre 0 et 100');
                continue;
            }
            
            const response = await request('ssap://audio/setVolume', {volume: volume});
            console.log(`✓ Volume défini à: ${volume}`);
        }
    } catch (err) {
        console.error('Erreur lors du changement de volume:', err);
        rl.close();
        process.exit(1);
    }
});