# lgtv-broker

Projet Node.js avec Fastify et TypeScript.

## Organisation du code

- `src/index.ts` charge la configuration et démarre Fastify.
- `src/controllers/tvController.ts` valide et traite la route HTTP `/command`.
- `src/services/tvService.ts` gère la connexion à la TV et exécute les commandes WebOS.

## Configuration

- `LGTV_URL` : adresse WebSocket du téléviseur, définie dans le fichier `.env`.
- `PORT` : port HTTP du broker (par défaut `3000`).
- `HOST` : interface réseau d'écoute (par défaut `0.0.0.0`).

Le téléviseur doit autoriser **LG Connect Apps**. Lors de la première connexion,
acceptez la demande affichée sur l'écran du téléviseur. La clé d'association est
stockée par `lgtv2` dans le dossier utilisateur du processus.

## Scripts

- `pnpm dev` : démarre en mode développement avec rechargement automatique via `tsx watch`
- `pnpm build` : compile TypeScript vers `dist`
- `pnpm start` : exécute le build compilé

## Route

- `GET /audioStatus` retourne l'état audio normalisé du téléviseur :
```json
{
  "status": "ok",
  "command": "audioStatus",
  "response": {
    "returnValue": true,
    "scenario": "mastervolume_ext_speaker_bt",
    "volume": 16,
    "mute": false
  }
}
```
- `POST /command`
- Body JSON :
```json
{
  "command": "pause" | "play" | "turnoff" | "volumePlus" | "volumeMinus" | "mute"
}
```

Le broker exécute la commande sur le téléviseur avant de retourner `{ "status": "ok" }`.
Il renvoie `502` si la connexion ou la commande échoue, et `400` si le corps ou la
commande est invalide.

| Commande | Action WebOS |
| --- | --- |
| `pause` | Mettre le média en pause |
| `play` | Reprendre la lecture |
| `turnoff` | Éteindre le téléviseur |
| `volumePlus` | Augmenter le volume |
| `volumeMinus` | Diminuer le volume |
| `mute` | Basculer l'état muet |
