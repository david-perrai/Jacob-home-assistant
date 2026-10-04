
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
            const command = await askQuestion('\nEntrez une commande (play/pause): ');
            const lowerCommand = command.toLowerCase().trim();
            
            if (lowerCommand === 'play') {
                const response = await request('ssap://media.controls/play');                
                console.log('✓ Lecture en cours');
            } else if (lowerCommand === 'pause') {   
                // lgtv.request('ssap://system.notifications/createToast', {message: "Je t'aime mon amour mais il ne serait pas temps d'aller faire dodo ?"})             
                lgtv.request('ssap://system/turnOff');
                // const response = await request('ssap://media.controls/pause');
                console.log('✓ Pause activée');
            } else {
                console.log('❌ Commande invalide. Entrez "play" ou "pause"');
            }
        }
    } catch (err) {
        console.error('Erreur:', err);
        rl.close();
        process.exit(1);
    }
});