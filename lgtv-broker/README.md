# lgtv-broker

Projet Node.js avec Fastify et TypeScript.

## Scripts

- `npm run dev` : démarre en mode développement avec rechargement automatique via `tsx watch`
- `npm run build` : compile TypeScript vers `dist`
- `npm run start` : exécute le build compilé

## Route

- `POST /command`
- Body JSON :
```json
{
  "command": "pause" | "play" | "turnoff" | "volumePlus" | "volumeMinus" | "mute"
}
```
