# Transcendant WIKI

Wiki interactif pour le JDR maison "Transcendant".

## Fonctionnalités

- **Interface moderne et responsive** : Design adapté à tous les appareils (desktop, tablette, mobile)
- **Système d'authentification sécurisé** : Login avec JWT et hashage des mots de passe
- **Édition de contenu** : Éditeur WYSIWYG pour modifier les pages du wiki
- **Gestion de navigation** : Création/modification/suppression de chapitres et pages
- **Recherche intégrée** : Recherche en temps réel dans le contenu
- **Sauvegarde automatique** : Synchronisation avec GitHub via Netlify Functions

## Installation

1. Cloner le dépôt :
```bash
git clone https://github.com/Zhaal/JDR.git
cd JDR
```

2. Configurer les variables d'environnement :
   - Copier `.env.example` vers `.env`
   - Remplir les valeurs nécessaires

3. Déployer sur Netlify :
   - Connecter le dépôt GitHub à Netlify
   - Configurer les variables d'environnement dans Netlify Dashboard
   - Déployer

## Configuration

### Variables d'environnement

- `GITHUB_TOKEN` : Token GitHub avec accès en écriture au dépôt
- `ADMIN_PASSWORD_HASH` : Hash SHA-256 du mot de passe admin
- `JWT_SECRET` : Clé secrète pour signer les tokens JWT

### Générer un hash de mot de passe

```javascript
const crypto = require('crypto');
const password = 'votre_mot_de_passe';
const hash = crypto.createHash('sha256').update(password).digest('hex');
console.log(hash);
```

## Utilisation

### Mode visiteur
- Naviguer dans le wiki via le menu latéral
- Rechercher du contenu

### Mode éditeur
1. Se connecter avec les identifiants admin
2. Le mode édition s'active automatiquement
3. Modifier le contenu directement dans la page
4. Utiliser "Éditer le menu" pour gérer la navigation
5. Les modifications sont sauvegardées automatiquement

## Architecture

```
JDR/
├── css/
│   └── style.css          # Styles modernes avec responsive design
├── js/
│   └── main.js            # Logique frontend + auth
├── netlify/
│   └── functions/
│       ├── auth.js        # Fonction d'authentification
│       └── saveWiki.js    # Fonction de sauvegarde GitHub
├── data/
│   └── wiki.json          # Données du wiki (nav + contenu)
├── index.html             # Page principale
└── netlify.toml           # Configuration Netlify
```

## Sécurité

- Authentification JWT avec expiration (24h)
- Mots de passe hashés en SHA-256
- Tokens stockés en localStorage avec vérification serveur
- CORS configuré pour les fonctions Netlify
- Pas de credentials en dur dans le code client

## Technologies

- **Frontend** : HTML5, CSS3, JavaScript Vanilla
- **Backend** : Netlify Functions (Node.js)
- **Déploiement** : Netlify
- **Stockage** : GitHub (via API)
- **Authentification** : JWT custom

## Licence

Projet privé - Tous droits réservés
