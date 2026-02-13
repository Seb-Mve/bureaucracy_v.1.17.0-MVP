# BUREAUCRACY++ 🗂️

[![Version](https://img.shields.io/badge/version-1.17.0-blue.svg)](package.json)
[![Expo SDK](https://img.shields.io/badge/Expo-53.0.0-000020.svg?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.79.1-61DAFB.svg?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)

> Un jeu incrémental/idle satirique sur la bureaucratie française, où vous gérez des ressources administratives et recrutez des agents pour automatiser la production.

## 📖 Description

**BUREAUCRACY++** est un jeu mobile incrémental développé avec React Native et Expo. Plongez dans l'univers absurde de l'administration française où vous devez gérer trois types de ressources bureaucratiques :

- 📁 **Dossiers** - La base de toute administration
- 🏷️ **Tampons** - Pour valider officiellement les documents
- 📋 **Formulaires** - L'essence même de la bureaucratie

### Caractéristiques principales

- 🎮 **Gameplay incrémental** - Cliquez pour tamponner des dossiers et accumuler des ressources
- 👥 **Recrutement d'agents** - Embauchez des stagiaires, assistants, superviseurs et plus encore
- 🏛️ **Administrations multiples** - Débloquez 5 administrations différentes (Centrale, Fiscale, Sociale, Municipale, Régionale)
- 📊 **Système de bonus** - Bonus locaux et globaux pour optimiser votre production
- 💾 **Sauvegarde automatique** - Votre progression est automatiquement sauvegardée
- ⚡ **Optimisé pour la performance** - Boucle de mise à jour à 100ms avec calculs optimisés

## 🚀 Installation

### Prérequis

- Node.js 18+ (recommandé: 20.x)
- npm ou yarn
- Expo CLI (installé automatiquement)
- Pour le développement mobile :
  - iOS: Xcode 15+ (macOS uniquement)
  - Android: Android Studio + JDK 17

### Installation des dépendances

```bash
# Cloner le projet
git clone <repository-url>
cd bureaucracy_v.1.17.0-MVP

# Installer les dépendances
npm install
```

## 🎯 Démarrage rapide

### Développement

```bash
# Démarrer le serveur de développement
npm run dev

# Ou avec Expo CLI directement
npx expo start
```

Options disponibles après le démarrage :
- Appuyez sur `i` pour iOS Simulator
- Appuyez sur `a` pour Android Emulator
- Scannez le QR code avec l'app Expo Go sur votre téléphone

### Build Web

```bash
npm run build:web
```

## 🏗️ Architecture

### Structure du projet

```
bureaucracy_v.1.17.0-MVP/
├── app/                          # Expo Router - Pages et navigation
│   ├── (tabs)/                   # Navigation à onglets
│   │   ├── index.tsx            # 🏠 Bureau principal (tamponneur)
│   │   ├── recruitment.tsx      # 👥 Recrutement d'agents
│   │   ├── progression.tsx      # 📊 Suivi de progression
│   │   └── options.tsx          # ⚙️ Options et paramètres
│   └── _layout.tsx              # Layout racine
├── components/                   # Composants React réutilisables
│   ├── AdministrationCard.tsx   # Affichage des administrations
│   ├── AgentItem.tsx            # Item d'agent individuel
│   ├── NotificationBadge.tsx    # Badge de notification
│   ├── ResourceBar.tsx          # Barre d'affichage des ressources
│   └── StampButton.tsx          # Bouton principal de tamponneur
├── context/                      # Gestion d'état globale
│   └── GameStateContext.tsx     # Context principal du jeu
├── data/                         # Données et configuration du jeu
│   └── gameData.ts              # Définitions des administrations/agents
├── types/                        # Types TypeScript
│   └── game.ts                  # Interfaces du modèle de jeu
├── constants/                    # Constantes de l'application
│   └── Colors.ts                # Palette de couleurs
└── .specify/                     # Infrastructure SpecKit
    ├── agents/                   # 9 agents personnalisés
    ├── scripts/                  # Scripts de développement
    └── templates/                # Templates de spécification

```

### Stack technique

| Catégorie | Technologies |
|-----------|-------------|
| **Framework** | React Native 0.79.1, Expo SDK 53 |
| **Langage** | TypeScript 5.x (mode strict) |
| **Navigation** | Expo Router v4 (File-based routing) |
| **État global** | React Context API + useReducer |
| **Persistance** | AsyncStorage (sauvegarde automatique toutes les 5s) |
| **UI Components** | React Native Core Components |
| **Optimisation** | Memoization, production cache, batch updates |

### Flux de données

```
User Interaction → GameStateContext → State Update → Production Cache → Component Re-render
                                    ↓
                                AsyncStorage (debounced save)
```

## 🎮 Système de jeu

### Ressources

| Ressource | Description | Usage |
|-----------|-------------|-------|
| **Dossiers** | Ressource de base | Recrutement d'agents initiaux |
| **Tampons** | Obtenu par validation | Déblocage d'agents avancés |
| **Formulaires** | Ressource avancée | Déblocage d'administrations |

### Mécaniques de production

1. **Production de base** : Chaque agent a une production de base par seconde
2. **Bonus locaux** : Certains agents boostent la production d'autres agents de la même administration
3. **Bonus globaux** : Certains agents boostent toutes les productions du même type
4. **Incréments** : Les agents gagnent des bonus tous les X agents achetés

### Administrations

1. **Administration Centrale** (déverrouillée par défaut)
2. **Administration Fiscale** (coût: formulaires)
3. **Administration Sociale** (coût: formulaires)
4. **Administration Municipale** (coût: formulaires)
5. **Administration Régionale** (coût: formulaires)

## 🛠️ Scripts disponibles

```bash
npm run dev          # Lancer le serveur de développement
npm run build:web    # Build pour le web
npm run lint         # Linter le code (Expo lint)
```

## 📐 Principes du projet

Le projet suit une **constitution stricte** définie dans `.specify/memory/constitution.md` avec 5 principes fondamentaux :

1. **🎮 User Experience & Performance First** - 60fps, réactivité <100ms
2. **🏗️ Code Quality & Maintainability** - Architecture propre, TypeScript strict
3. **🇫🇷 French Language & Cultural Authenticity** - Français authentique
4. **♿ Accessibility & Inclusive Design** - WCAG 2.1 AA compliance
5. **📐 Architectural Separation of Concerns** - Séparation claire des couches

## 🤝 Développement avec SpecKit

Le projet utilise **SpecKit**, une infrastructure de développement basée sur des spécifications :

```bash
# Créer une nouvelle fonctionnalité
.specify/scripts/bash/create-new-feature.sh "feature-name"

# Utiliser les agents personnalisés
/speckit.specify "Description de la fonctionnalité"  # Créer spec.md
/speckit.plan                                         # Créer plan.md
/speckit.tasks                                        # Créer tasks.md
/speckit.implement                                    # Exécuter l'implémentation
/speckit.analyze                                      # Analyser la cohérence
```

## 📱 Compatibilité

- ✅ **iOS** : iOS 13+
- ✅ **Android** : Android 6.0+ (API 23+)
- ✅ **Web** : Navigateurs modernes (Chrome, Firefox, Safari, Edge)

## 🧪 Tests

⚠️ **Note** : L'infrastructure de test n'est pas encore implémentée. Contribution bienvenue !

## 📄 Licence

Propriétaire - Tous droits réservés

## 👨‍💻 Auteur

**Bureaucracy++ Team**

---

**Note** : Ce projet est en cours de développement (v1.17.0-MVP). Les fonctionnalités peuvent évoluer.

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/Seb-Mve/bureaucracy_v.1.17.0-MVP)