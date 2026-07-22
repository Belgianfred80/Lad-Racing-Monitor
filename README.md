# Monitoring Ladbrokes.be — Guide d'installation

Ce projet vérifie **toutes les 15 minutes** que les pages suivantes s'affichent
correctement et rapidement :

- Courses hippiques : https://www.ladbrokes.be/fr/horseraces/#!/1_pmu-french-horse-racing
- Courses de lévriers : https://www.ladbrokes.be/fr/greyhound/#!/19_greyhound-racing

Il détecte trois types de problèmes :

1. **Site hors ligne** (le serveur ne répond pas, ou répond avec une erreur)
2. **Page qui répond mais contenu absent** (le cas des "rectangles gris" —
   la page se charge mais les courses ne s'affichent pas)
3. **Page anormalement lente** (contenu affiché en plus de 15 secondes)

En cas d'échec, GitHub vous envoie automatiquement un **e-mail**, et une
**capture d'écran** de la page au moment du problème est conservée 14 jours.

---

## Installation (une seule fois, ~10 minutes)

### Étape 1 — Créer le repo

1. Connectez-vous sur https://github.com
2. Cliquez sur le **+** en haut à droite → **New repository**
3. Nom : `ladbrokes-monitor` — Visibilité : **Private** — puis **Create repository**

### Étape 2 — Déposer les fichiers

1. Sur la page du repo vide, cliquez sur **uploading an existing file**
2. Glissez-déposez **tout le contenu** de ce dossier (le dossier `.github`,
   le dossier `monitor`, `package.json`, `package-lock.json` s'il existe, `README.md`)
   > ⚠️ Le dossier `.github` est parfois masqué par Windows. Si le glisser-déposer
   > ne le prend pas, uploadez le fichier `monitor.yml` manuellement :
   > **Add file → Create new file**, tapez comme nom
   > `.github/workflows/monitor.yml` et collez le contenu du fichier.
3. Cliquez sur **Commit changes**

### Étape 3 — Activer et tester

1. Dans le repo, ouvrez l'onglet **Actions**
2. Si un bandeau vous demande d'activer les workflows, cliquez sur
   **I understand my workflows, go ahead and enable them**
3. Cliquez sur **Monitoring Ladbrokes** (à gauche) → bouton **Run workflow** →
   **Run workflow** (vert). C'est un lancement manuel pour tester tout de suite.
4. Attendez 2-3 minutes. Le run apparaît : ✅ vert = pages saines,
   ❌ rouge = problème détecté (cliquez dessus pour voir les détails et
   télécharger les captures d'écran dans la section **Artifacts**).

À partir de là, le check tourne automatiquement toutes les 15 minutes.

### Étape 4 — Vérifier les notifications e-mail

GitHub vous envoie un e-mail à chaque **échec** de workflow (comportement par
défaut). Pour vérifier le réglage : photo de profil → **Settings** →
**Notifications** → section **Actions** → cochez au minimum
**Email** pour "Failed workflows only".

---

## Utilisation au quotidien

- **Rien à faire** tant que tout va bien.
- En cas de problème : vous recevez un e-mail → cliquez sur le lien du run →
  lisez le résumé (quelle page, quel symptôme) → téléchargez l'artifact
  `diagnostic-...` pour voir la capture d'écran de la page cassée.
- Historique complet dans l'onglet **Actions** du repo.

## Ajouter / retirer une page surveillée

Éditez le fichier `monitor/pages.config.js` directement sur GitHub
(icône crayon), sur le modèle des deux pages existantes. Les seuils
(15 s de lenteur, 20 s d'attente du contenu) se règlent en haut du même fichier.

## Points d'attention

- **Quota gratuit** : ~2 min par check × 96 checks/jour ≈ 5800 min/mois,
  au-dessus des 2000 min/mois gratuites d'un repo privé. Trois solutions :
  passer le cron à `*/30` (toutes les 30 min ≈ 2900 min/mois, léger dépassement)
  ou `0,30 8-23 * * *` (toutes les 30 min, uniquement de 8h à 23h ≈ profil
  d'usage réel), ou accepter quelques euros de dépassement.
- **Protections anti-bot** : les sites de paris bloquent parfois les navigateurs
  automatisés venant de datacenters. Si le premier test échoue avec une page
  de type CAPTCHA / "Access denied" sur la capture d'écran, ce n'est pas un
  faux réglage — c'est un blocage. Des solutions existent (autre hébergement,
  mode furtif) ; voir la personne qui vous a fourni ce projet 🙂
- **Heure du cron** : GitHub planifie en UTC et peut décaler un run de
  quelques minutes en période de charge. Sans importance pour ce besoin.
