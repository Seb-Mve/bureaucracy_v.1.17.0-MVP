import { Administration, GameState } from '@/types/game';

// Administration data
export const administrations: Administration[] = [
  {
    id: 'administration-centrale',
    name: 'Bureau des Documents Obsolètes',
    unlockCost: {},
    isUnlocked: true,
    imagePath: require('@/assets/carousel-images/administration_centrale_bureaucracy_carousel.png'),
    agents: [
      {
        id: 'stagiaire-administratif',
        name: 'Stagiaire administratif',
        description: 'Jeune et enthousiaste, il classe les dossiers à la vitesse de l\'éclair (ou presque).',
        cost: { dossiers: 50 },
        baseProduction: { dossiers: 0.5 },
        owned: 0,
        incrementThreshold: 50,
        incrementValue: 5,
        incrementIsPercentage: true
      },
      {
        id: 'assistant-administratif',
        name: 'Assistant administratif',
        description: 'Pas très rapide, mais très méthodique avec les tampons.',
        cost: { dossiers: 250 },
        baseProduction: { tampons: 0.2 },
        owned: 0,
        incrementThreshold: 100,
        incrementValue: 5,
        incrementIsPercentage: true
      },
      {
        id: 'superviseur-section',
        name: 'Superviseur de section',
        description: 'Motive les stagiaires à produire davantage de dossiers.',
        cost: { tampons: 200 },
        baseProduction: {},
        productionBonus: {
          target: 'dossiers',
          value: 10,
          isPercentage: true,
          isGlobal: false
        },
        owned: 0,
        incrementThreshold: 150,
        incrementValue: 5,
        incrementIsPercentage: false
      },
      {
        id: 'chef-validation',
        name: 'Chef de validation',
        description: 'Expert en formulaires administratifs complexes.',
        cost: { tampons: 500 },
        baseProduction: { formulaires: 0.1 },
        owned: 0,
        incrementThreshold: 100,
        incrementValue: 5,
        incrementIsPercentage: true
      },
      {
        id: 'directeur-pole',
        name: 'Directeur de pôle',
        description: 'Améliore l\'efficacité de tout le département.',
        cost: { formulaires: 100 },
        baseProduction: {},
        productionBonus: {
          target: 'all',
          value: 5,
          isPercentage: true,
          isGlobal: false
        },
        owned: 0,
        incrementThreshold: 150,
        incrementValue: 5,
        incrementIsPercentage: false
      }
    ]
  },
  {
    id: 'service-tampons',
    name: 'Service des Tampons Tamponnés',
    unlockCost: { tampons: 500 },
    isUnlocked: false,
    imagePath: require('@/assets/carousel-images/service_tampons_tamponnes_bureaucracy_carousel.png'),
    agents: [
      {
        id: 'tamponneur-debutant',
        name: 'Tamponneur débutant',
        description: 'Fraîchement formé à l\'art du tamponnage.',
        cost: { dossiers: 300 },
        baseProduction: { tampons: 0.4 },
        owned: 0,
        incrementThreshold: 50,
        incrementValue: 5,
        incrementIsPercentage: true
      },
      {
        id: 'tamponneur-experimente',
        name: 'Tamponneur expérimenté',
        description: 'Un vétéran dont le poignet est parfaitement calibré pour tamponner.',
        cost: { dossiers: 800 },
        baseProduction: { tampons: 1 },
        owned: 0,
        incrementThreshold: 100,
        incrementValue: 5,
        incrementIsPercentage: true
      },
      {
        id: 'chef-tamponnage',
        name: 'Chef de poste tamponnage',
        description: 'Augmente la production de tampons à chaque achat.',
        cost: { tampons: 300 },
        baseProduction: {},
        productionBonus: {
          target: 'tampons',
          value: 5,
          isPercentage: true,
          isGlobal: false
        },
        owned: 0,
        incrementThreshold: 100,
        incrementValue: 5,
        incrementIsPercentage: true
      },
      {
        id: 'controleur-conformite',
        name: 'Contrôleur de conformité',
        description: 'Vérifie que chaque tampon est correctement aligné sur les formulaires.',
        cost: { tampons: 1500 },
        baseProduction: { formulaires: 0.3 },
        owned: 0,
        incrementThreshold: 50,
        incrementValue: 5,
        incrementIsPercentage: true
      },
      {
        id: 'coordinateur-tamponnage',
        name: 'Coordinateur tamponnage',
        description: 'Coordonne toutes les activités de tamponnage pour une efficacité maximale.',
        cost: { formulaires: 200 },
        baseProduction: {},
        productionBonus: {
          target: 'all',
          value: 1,
          isPercentage: true,
          isGlobal: true
        },
        owned: 0,
        incrementThreshold: 150,
        incrementValue: 5,
        incrementIsPercentage: true
      }
    ]
  },
  {
    id: 'cellule-verification',
    name: 'Cellule de Double Vérification',
    unlockCost: { tampons: 1000 },
    isUnlocked: false,
    imagePath: require('@/assets/carousel-images/cellule_double_verification_bureaucracy_carousel.png'),
    agents: [
      {
        id: 'verificateur-auxiliaire',
        name: 'Vérificateur auxiliaire',
        description: 'Vérifie les vérifications des vérificateurs. Oui, vraiment.',
        cost: { dossiers: 200 },
        baseProduction: { tampons: 0.5 },
        owned: 0,
        incrementThreshold: 50,
        incrementValue: 5,
        incrementIsPercentage: true
      },
      {
        id: 'analyste-conformite',
        name: 'Analyste de conformité',
        description: 'Passe sa journée à vérifier que les tampons sont conformes aux normes ISO-TMN-2025.',
        cost: { dossiers: 500 },
        baseProduction: { tampons: 0.6 },
        owned: 0,
        incrementThreshold: 100,
        incrementValue: 5,
        incrementIsPercentage: true
      },
      {
        id: 'controleur-chef',
        name: 'Contrôleur en chef',
        description: 'Augmente la production de tampons à chaque achat.',
        cost: { tampons: 300 },
        baseProduction: {},
        productionBonus: {
          target: 'tampons',
          value: 1,
          isPercentage: true,
          isGlobal: false
        },
        owned: 0,
        incrementThreshold: 100,
        incrementValue: 5,
        incrementIsPercentage: true
      },
      {
        id: 'archiviste-certifie',
        name: 'Archiviste certifié',
        description: 'A obtenu sa certification après 7 ans d\'études en tamponnologie.',
        cost: { tampons: 200 },
        baseProduction: { tampons: 1 },
        owned: 0,
        incrementThreshold: 50,
        incrementValue: 5,
        incrementIsPercentage: true
      },
      {
        id: 'coordinateur-qualite',
        name: 'Coordinateur qualité',
        description: 'Son mantra : "La qualité avant la quantité... mais en grande quantité."',
        cost: { formulaires: 300 },
        baseProduction: {},
        productionBonus: {
          target: 'all',
          value: 10,
          isPercentage: true,
          isGlobal: true
        },
        owned: 0,
        incrementThreshold: 150,
        incrementValue: 5,
        incrementIsPercentage: false
      }
    ]
  },
  {
    id: 'division-archivage',
    name: 'Division de l\'Archivage Physique',
    unlockCost: { formulaires: 1000 },
    isUnlocked: false,
    imagePath: require('@/assets/carousel-images/division_archivage_physique_bureaucracy_carousel.png'),
    agents: [
      {
        id: 'agent-rangement',
        name: 'Agent de rangement',
        description: 'Classe les formulaires par ordre alphabétique, chronologique et chromatique.',
        cost: { tampons: 500 },
        baseProduction: { formulaires: 0.3 },
        owned: 0,
        incrementThreshold: 50,
        incrementValue: 5,
        incrementIsPercentage: true
      },
      {
        id: 'archiviste-methodique',
        name: 'Archiviste méthodique',
        description: 'A développé un système de classement si complexe que lui seul le comprend.',
        cost: { tampons: 1000 },
        baseProduction: { formulaires: 0.5 },
        owned: 0,
        incrementThreshold: 100,
        incrementValue: 5,
        incrementIsPercentage: true
      },
      {
        id: 'responsable-etageres',
        name: 'Responsable des étagères',
        description: 'Optimise la production de formulaires à chaque achat.',
        cost: { formulaires: 350 },
        baseProduction: {},
        productionBonus: {
          target: 'formulaires',
          value: 15,
          isPercentage: true,
          isGlobal: false
        },
        owned: 0,
        incrementThreshold: 100,
        incrementValue: 5,
        incrementIsPercentage: false
      },
      {
        id: 'inspecteur-normes',
        name: 'Inspecteur des normes',
        description: 'Vérifie que chaque formulaire respecte les 217 points de la charte qualité.',
        cost: { tampons: 500 },
        baseProduction: { formulaires: 1 },
        owned: 0,
        incrementThreshold: 50,
        incrementValue: 5,
        incrementIsPercentage: true
      },
      {
        id: 'chef-archivage',
        name: 'Chef de l\'archivage',
        description: 'Son bureau est si bien rangé qu\'il n\'y a même pas un trombone qui dépasse.',
        cost: { formulaires: 400 },
        baseProduction: {},
        productionBonus: {
          target: 'all',
          value: 20,
          isPercentage: true,
          isGlobal: true
        },
        owned: 0,
        incrementThreshold: 150,
        incrementValue: 5,
        incrementIsPercentage: false
      }
    ]
  },
  {
    id: 'agence-redondance',
    name: 'Agence de Redondance Non Justifiée',
    unlockCost: { formulaires: 5000 },
    isUnlocked: false,
    imagePath: require('@/assets/carousel-images/agence_redondance_non_justifiee_bureaucracy_carousel.png'),
    agents: [
      {
        id: 'assistant-duplication',
        name: 'Assistant à la duplication',
        description: 'Son travail consiste à dupliquer des documents déjà dupliqués.',
        cost: { dossiers: 500 },
        baseProduction: { dossiers: 5 },
        owned: 0,
        incrementThreshold: 50,
        incrementValue: 5,
        incrementIsPercentage: true
      },
      {
        id: 'repetiteur-administratif',
        name: 'Répétiteur administratif',
        description: 'Il répète, répète et répète encore les mêmes tâches, comme un disque rayé.',
        cost: { dossiers: 1200 },
        baseProduction: { dossiers: 8 },
        owned: 0,
        incrementThreshold: 100,
        incrementValue: 5,
        incrementIsPercentage: true
      },
      {
        id: 'chef-copie-colle',
        name: 'Chef de section copié-collé',
        description: 'A inventé 27 nouvelles techniques de copier-coller qui augmentent la production de tampons.',
        cost: { tampons: 350 },
        baseProduction: {},
        productionBonus: {
          target: 'tampons',
          value: 10,
          isPercentage: true,
          isGlobal: false
        },
        owned: 0,
        incrementThreshold: 100,
        incrementValue: 5,
        incrementIsPercentage: false
      },
      {
        id: 'responsable-survalidation',
        name: 'Responsable de la sur-validation',
        description: 'Ajoute systématiquement trois validations supplémentaires à chaque formulaire.',
        cost: { formulaires: 250 },
        baseProduction: { formulaires: 1 },
        owned: 0,
        incrementThreshold: 50,
        incrementValue: 5,
        incrementIsPercentage: true
      },
      {
        id: 'redondant-supreme',
        name: 'Grand redondant suprême',
        description: 'Son titre complet fait 27 lignes et mentionne 14 fois le mot "redondance".',
        cost: { formulaires: 500 },
        baseProduction: {},
        productionBonus: {
          target: 'all',
          value: 15,
          isPercentage: true,
          isGlobal: true
        },
        owned: 0,
        incrementThreshold: 150,
        incrementValue: 5,
        incrementIsPercentage: false
      }
    ]
  }
];

// Initial game state
export const initialGameState: GameState = {
  version: 2,
  resources: {
    dossiers: 0,
    tampons: 0,
    formulaires: 0
  },
  production: {
    dossiers: 0,
    tampons: 0,
    formulaires: 0
  },
  administrations: administrations,
  activeAdministrationId: 'administration-centrale',
  lastTimestamp: null,
  conformite: {
    percentage: 0,
    isUnlocked: false,
    lifetimeFormulaires: 0,
    lastTestTimestamp: null,
    highestEverTampons: 0,
    highestEverFormulaires: 0
  },
  messageSystem: {
    sicLastTriggerTime: null,
    nonConformityLastTriggerTime: null,
    lastProductionMilestone: {
      dossiers: 0,
      tampons: 0,
      formulaires: 0
    }
  }
};