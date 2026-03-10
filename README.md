# Jacob - Assistant Personnel Intelligent

Jacob est un assistant personnel intelligent conçu pour centraliser et simplifier la gestion de votre quotidien. Il combine une interface web moderne avec un backend puissant basé sur l'IA pour offrir des fonctionnalités de calendrier, de météo, de gestion de listes et d'interaction vocale.

## 🚀 Fonctionnalités

- **Intelligence Artificielle** : Intégration de LLMs via Ollama pour répondre à vos requêtes de manière naturelle.
- **Interaction Vocale** : Détection du mot d'éveil ("Jacob") et transcription de la parole en texte (Picovoice Porcupine & Hugging Face Transformers).
- **Gestion d'Agenda** : Synchronisation et affichage des événements Google Calendar.
- **Météo en Temps Réel** : Prévisions météorologiques locales avec une vue sur 3 jours.
- **Liste de Courses** : Gestion intuitive de vos listes de courses via des commandes vocales ou textuelles.
- **Notifications SSE** : Mises à jour en direct du frontend via Server-Sent Events depuis le backend.

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
- **Traitement Audio** :
  - [Picovoice Porcupine](https://picovoice.ai/) pour la détection du mot d'éveil.
  - [Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js/) pour la transcription audio locale.
- **Style** : CSS Moderne avec une interface réactive et esthétique.

## 📦 Installation et Configuration

### Prérequis

- Java 25
- Node.js (v18+)
- Maven
- [Ollama](https://ollama.com/) (avec les modèles `llama3.2:3b` et `nomic-embed-text` installés)
- PostgreSQL

### Backend

1. Clonez le dépôt.
2. Lancez la base de données PostgreSQL avec Docker Compose :
   ```bash
   cd backend
   docker-compose up -d
   ```

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

### 🎙️ Configuration Picovoice (Wake Word)

1. Créez un compte sur [Picovoice Console](https://console.picovoice.ai/).
2. Récupérez votre **AccessKey**.
3. Ajoutez cette clé dans le fichier `frontend/.env` :

   ```env
   VITE_PICOVOICE_ACCESS_KEY=votre_cle_ici
   ```

4. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```
   > [!WARNING]
   > **Sécurité** : Actuellement, les appels à l'API Picovoice sont effectués directement depuis le frontend. Si vous prévoyez d'exposer cette application sur Internet, il est fortement recommandé de déplacer cette logique côté **backend** pour protéger votre clé d'API.

## 📂 Structure du Projet

```
Jacob/
├── backend/            # Code source Spring Boot (API, Services, RAG)
├── frontend/           # Code source React (UI, Hooks, Audio processing)
├── tokens/             # Ressources et tokens pour Picovoice
└── README.md           # Documentation du projet
```
