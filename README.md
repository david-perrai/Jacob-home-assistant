# Jacob - Assistant Personnel Intelligent

Jacob est un assistant personnel intelligent conçu pour centraliser et simplifier la gestion de votre quotidien. Il combine une interface web moderne avec un backend puissant basé sur l'IA pour offrir des fonctionnalités de calendrier, de météo, de gestion de listes et d'interaction vocale.

## 🚀 Fonctionnalités

- **Intelligence Artificielle** : Intégration de LLMs via Ollama pour répondre à vos requêtes de manière naturelle.
- **Mémoire de conversation** : Jacob conserve les 10 derniers messages en mémoire vive afin de comprendre les questions de suivi. Cette mémoire est commune aux prompts et est réinitialisée au redémarrage du backend.
- **Interaction Vocale et écrite** : Enregistrement déclenché depuis l'interface, transcription de la parole en texte et réponse vocale ; les demandes écrites sont envoyées depuis une fenêtre dédiée.
- **Gestion d'Agenda** : Synchronisation et affichage des événements Google Calendar.
- **Météo en Temps Réel** : Prévisions météorologiques locales avec une vue sur 3 jours.
- **Liste de Courses** : Gestion intuitive de vos listes de courses via des commandes vocales ou textuelles.
- **Pilotage TV** : Commandes vocales et textuelles du téléviseur LG WebOS via le broker `lgtv-broker`.
- **Notifications SSE** : Mises à jour en direct du frontend via Server-Sent Events depuis le backend.
- **Base documentaire RAG** : Import de documents PDF et TXT depuis le bouton flottant ; leur texte est découpé, vectorisé par Ollama et stocké dans PostgreSQL avec pgVector.

## 🛠️ Architecture Technique

Le projet est divisé en deux parties principales :

### Backend (Java / Spring Boot)

- **Langage** : Java 25
- **Framework** : Spring Boot 4.0.0
- **IA** : LangChain4j pour l'orchestration des modèles LLM et du RAG.
- **Base de données** : PostgreSQL pour la persistance des données (listes de courses, etc.).
- **Communication** : SSE (Server-Sent Events) pour pousser des notifications au frontend.

### Frontend (React / Vite)

- **Framework** : React 19 avec Vite.
- **Traitement Audio** : [whisper.cpp](https://github.com/ggml-org/whisper.cpp) sur le serveur, avec un modèle quantifié, pour éviter de télécharger le modèle dans chaque navigateur.
- **Interface** : React avec Material UI.

## 📦 Installation et Configuration

### Prérequis

- Java 25
- Node.js (v18+)
- Maven
- [Ollama](https://ollama.com/) (avec le modèle de conversation configuré et `bge-m3` pour les embeddings)
- PostgreSQL

### Backend

1. Clonez le dépôt.
2. Lancez PostgreSQL avec Docker Compose :
   ```bash
   cd backend
   docker compose up -d postgres
   ```

3. Installez whisper.cpp et téléchargez le modèle `small` depuis le dossier `backend` :
   ```bash
   cd backend
   brew install whisper.cpp
   mkdir -p models
   curl -fL \
     https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small-q5_1.bin \
     -o models/ggml-small-q5_1.bin
   ```

Installez le modèle d'embeddings configuré dans
`backend/src/main/resources/application.yaml` :

```bash
ollama pull bge-m3
```

Les recettes sont vectorisées dans `recipe_embeddings` au démarrage du backend
et à chaque création. Elles peuvent être cherchées par similarité sémantique avec
`GET /recipes/search?query=une%20recette%20avec%20des%20légumes` ; l'API renvoie
jusqu'à `recipe-search.max-results` résultats avec leur score de similarité.
Les embeddings sont conservés séparément de ceux des documents RAG.

Pour importer des documents RAG, utilisez le bouton d'import flottant dans l'interface.
L'API d'import est `POST /rag/documents` avec un champ multipart `file`. Les
fichiers PDF et TXT sont acceptés ; ils sont découpés selon `rag.chunk-size` et
`rag.chunk-overlap` dans `backend/src/main/resources/application.yaml`, puis
indexés dans la table `jacob_embeddings` de PostgreSQL. Lors d'une conversation,
Jacob recherche les passages documentaires pertinents selon `rag.max-results`
et `rag.min-score` et les ajoute au contexte de réponse.

La modal de saisie clavier permet aussi de joindre un PDF, un TXT ou une image
JPEG, PNG ou WebP à une demande. Le fichier est envoyé avec le texte en multipart
à `POST /prompt` et fourni directement au modèle pour cette demande ; il n'est
pas ajouté à l'index documentaire RAG.

### Service de transcription Whisper

Au démarrage du backend Java, `whisper-server` est lancé automatiquement sur `127.0.0.1:8081` avec le modèle `ggml-small-q5_1.bin` situé dans `backend/models/`. À l’arrêt du backend, son processus est arrêté également. Le modèle est recherché dans `models/` depuis le dossier de lancement Java ; s’il est lancé depuis la racine du dépôt, il est aussi recherché dans `backend/models/`. Le modèle est multilingue (français inclus) et pèse environ 190 Mo. Il est plus précis que `base`, mais demande davantage de mémoire et de temps de calcul.

Le backend Java relaie les enregistrements WAV au service sur `http://localhost:8081`. Le port du service Whisper est publié uniquement sur l’interface locale de la machine ; le navigateur communique avec l’API Java, pas directement avec Whisper. Si le serveur Whisper est hébergé ailleurs, configurez `WHISPER_BASE_URL`.

Le démarrage automatique peut être désactivé avec `WHISPER_SERVER_ENABLED=false`. Vous pouvez aussi définir `WHISPER_SERVER_EXECUTABLE` (par défaut `whisper-server`) et `WHISPER_MODEL_PATH` (par défaut `models/ggml-small-q5_1.bin`, relatif au dossier de lancement Java). Si Whisper est hébergé ailleurs, configurez `WHISPER_BASE_URL` et désactivez le démarrage automatique.

Le navigateur envoie l’enregistrement lorsque le détecteur de silence termine ; aucun modèle de transcription n’est chargé côté navigateur. L’installation native Homebrew peut exploiter Metal sur Apple Silicon. Le backend Java continue à relayer les enregistrements à `http://localhost:8081`; configurez `WHISPER_BASE_URL` si le serveur est lancé à une autre adresse.

### Pilotage du téléviseur LG

Démarrez `lgtv-broker` et configurez l'URL HTTP du broker pour le backend avec
`LGTV_BROKER_URL` (par défaut `http://localhost:3000`). Le broker doit lui-même
être configuré avec l'adresse WebSocket du téléviseur dans son fichier `.env`.
Jacob peut mettre en pause ou reprendre la lecture, ajuster le volume, basculer
le mode muet et éteindre le téléviseur à la demande.

### 🗓️ Configuration Google Calendar API

Pour faire fonctionner l'agenda, vous devez configurer un projet sur [Google Cloud Console](https://console.cloud.google.com/) :

1. **Créer un Projet** : Créez un nouveau projet nommé "Jacob".
2. **Activer l'API** : Recherchez et activez "Google Calendar API".
3. **Configurer l'écran de consentement OAuth** :
   - Choisissez le type d'utilisateur "Externe".
   - Ajoutez votre adresse e-mail dans les "Utilisateurs de test" (très important pour le développement).
4. **Créer des Identifiants** :
   - Cliquez sur "Créer des identifiants" > "ID de client OAuth".
   - Type d'application : "Application de bureau" (Desktop App).
   - Téléchargez le fichier JSON et renommez-le en `client_secret.json`.
5. **Installation du secret** : Placez ce fichier dans `backend/src/main/resources/client_secret.json`.

### 🔑 Génération des Jetons Google Calendar (Première exécution)

Lors du premier lancement du backend :

1. Une URL s'affichera dans les logs de la console.
2. Copiez cette URL dans votre navigateur.
3. Connectez-vous avec le compte Google de test configuré précédemment.
4. Une fois autorisé, l'application créera automatiquement un dossier `tokens/` à la racine (ou dans le dossier configuré) contenant le jeton d'accès.

5. Lancez le backend avec Maven :
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

### Frontend

1. Installez les dépendances :
   ```bash
   cd frontend
   npm install
   ```

### ☁️ Configuration Weather API

1. Créez un compte sur [WeatherAPI.com](https://www.weatherapi.com/).
2. Récupérez votre clé d'API (API Key).
3. Ajoutez cette clé dans le fichier `frontend/.env` :
   ```env
   VITE_WEATHER_API_KEY=votre_cle_ici
   ```

> [!WARNING]
> **Sécurité** : Actuellement, les appels à l'API météo sont effectués directement depuis le frontend. Si vous prévoyez d'exposer cette application sur Internet, il est fortement recommandé de déplacer cette logique côté **backend** pour protéger votre clé d'API.

### Démarrer le frontend

Depuis le dossier `frontend`, installez les dépendances et lancez le serveur :

   ```bash
   pnpm install
   npm run dev
   ```

### Installer Jacob sur une tablette

Sur Android, ouvrez le site dans Chrome puis choisissez **Installer
l'application** ou **Ajouter à l'écran d'accueil**. Sur iPad, ouvrez-le dans
Safari, touchez **Partager**, puis **Sur l'écran d'accueil**.

L'installation nécessite une connexion HTTPS considérée comme sûre par la
tablette. En développement, le certificat HTTPS local doit être approuvé par
la tablette ; ignorer simplement l'avertissement du navigateur peut ne pas
suffire à activer l'installation.

## 📂 Structure du Projet

```
Jacob/
├── backend/            # Code source Spring Boot (API, Services, RAG)
├── frontend/           # Code source React (UI, Hooks, Audio processing)
├── tokens/             # Ressources et tokens pour Google Calendar
└── README.md           # Documentation du projet
```
