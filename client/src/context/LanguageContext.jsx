import React, { createContext, useContext, useState, useEffect } from 'react';


const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translation keys for French and Arabic
const translations = {
  fr: {
    // Navigation
    'overview': 'Aperçu',
    'classes': 'Classes',
    'attendance': 'Présence',
    'timetable': 'Emploi du Temps',
    'students': 'Étudiants',
    'teachers': 'Enseignants',
    'employees': 'Employés',
    'rooms': 'Salles',
    'equipment': 'Équipement',
    'catalog': 'Catalogue',
    'ads': 'Publicités',
    'reports': 'Rapports',
    'finance': 'Finance',
    'log': 'Journal',
    'badges': 'Badges',
    'analytics': 'Analyses',
    'schools': 'Écoles',
    'games': 'Jeux',
    'templates': 'Modèles de Jeux',
    'template-guide': 'Guide des Modèles',
    'template-games': 'Jeux par Modèle',
    'my-games': 'Mes Jeux',
    'create-game': 'Créer un Jeu',
    'live-sessions': 'Sessions en Direct',
    'assignments': 'Devoirs',
    'resources': 'Ressources',
    'calendar': 'Calendrier',
    'my-classes': 'Mes Classes',
    'no-announcements': 'لا توجد إعلانات حتى الآن.',
    'failed-to-load-announcements': 'فشل في تحميل الإعلانات.',
    'write-announcement': 'اكتب إعلانًا...',
    'post': 'نشر',
    'failed-to-post-announcement': 'فشل في نشر الإعلان.',
    
    // Common UI
    'dashboard': 'Tableau de Bord',
    'manage-dashboard': 'Gérer le tableau de bord',
    'profile': 'Profil',
    'logout': 'Déconnexion',
    'search': 'Rechercher...',
    'notifications': 'Notifications',
    'recent-notifications': 'Notifications Récentes',
    'coming-soon': 'Bientôt Disponible',
    'welcome': 'Bienvenue',
    'welcome-back': 'Bon retour',
    'ready-to-continue': 'Prêt à continuer votre parcours d\'apprentissage ?',
    'no-badges-yet': 'Aucun badge pour le moment.',
    'no-achievements-yet': 'Aucun accomplissement pour le moment.',
    'recent-games': 'Jeux Récents',
    'recently-earned-badges': 'Badges Récemment Obtenus',
    
    // Login
    'welcome-back-login': 'Bon Retour',
    'sign-in-to-continue': 'Connectez-vous pour continuer vers Skill Snap',
    'email-address': 'Adresse e-mail',
    'enter-email': 'Entrez votre e-mail',
    'password': 'Mot de passe',
    'enter-password': 'Entrez votre mot de passe',
    'signing-in': 'Connexion en cours...',
    'sign-in': 'Se connecter',
    'forgot-password': 'Mot de passe oublié ?',
    'login-error': 'Une erreur s\'est produite lors de la connexion.',
    
    // Quick Actions
    'class-management': 'Gestion des Classes',
    'manage-classes-schedules': 'Gérer les classes et les horaires',
    'attendance-tracking': 'Suivi de Présence',
    'monitor-student-attendance': 'Surveiller la présence des étudiants',
    'schedule-management': 'Gestion des Horaires',
    'view-manage-schedules': 'Voir et gérer les horaires des classes',
    'student-records': 'Dossiers des Étudiants',
    'access-student-info': 'Accéder aux informations et notes des étudiants',
    'reports-analytics': 'Rapports et Analyses',
    'generate-performance-reports': 'Générer des rapports de performance',
    'system-settings': 'Paramètres du Système',
    'configure-school-settings': 'Configurer les paramètres de l\'école',
    
    // PDF Reports
    'financial-analytics-report': 'Rapport d\'Analyses Financières',
    'address': 'Adresse',
    'phone': 'Téléphone',
    'email': 'E-mail',
    'generated-on': 'Généré le',
    'generated-by': 'Généré par',
    'user': 'Utilisateur',
    'unknown': 'Inconnu',
    'salaries-by-role': 'Salaires par Rôle',
    'role': 'Rôle',
    'count': 'Nombre',
    'total-calculated': 'Total Calculé',
    'total-paid': 'Total Payé',
    'remaining': 'Restant',
    
    // Notifications
    'notifications-coming-soon': 'Fonctionnalité de notifications bientôt disponible !',
    'stay-tuned': 'Restez à l\'écoute',
    
    // Profile
    'back-to-dashboard': 'Retour au Tableau de Bord',
    'profile-information': 'Informations du Profil',
    'basic-information': 'Informations de Base',
    'phone-number': 'Numéro de téléphone',
    'secondary-phone': 'Téléphone secondaire',
    'teaching-information': 'Informations d\'Enseignement',
    'years-of-experience': 'Années d\'expérience',
    'employment-status': 'Statut d\'emploi',
    'activities': 'Activités',
    'work-information': 'Informations de Travail',
    'management-access': 'Accès à la Gestion',
    'staff-management': 'Gestion du Personnel',
    'reports-access': 'Accès aux Rapports',
    'work-status': 'Statut de travail',
    'account-information': 'Informations du Compte',
    'member-since': 'Membre depuis',
    'last-updated': 'Dernière mise à jour',
    'enrollments-balances': 'Inscriptions et Soldes',
    'no-enrollments-found': 'Aucune inscription trouvée',
    'payments': 'Paiements',
    'no-payments-yet': 'Aucun paiement pour le moment',
    'add-payment': 'Ajouter un Paiement',
    'quick-stats': 'Statistiques Rapides',
    'edit-profile': 'Modifier le Profil',
    'save': 'Enregistrer',
    'cancel': 'Annuler',
    
    // Finance & Management
    'january': 'Janvier',
    'february': 'Février', 
    'march': 'Mars',
    'april': 'Avril',
    'may': 'Mai',
    'june': 'Juin',
    'july': 'Juillet',
    'august': 'Août',
    'september': 'Septembre',
    'october': 'Octobre',
    'november': 'Novembre',
    'december': 'Décembre',
    
    // Common Actions
    'add': 'Ajouter',
    'edit': 'Modifier',
    'delete': 'Supprimer',
    'view': 'Voir',
    'create': 'Créer',
    'update': 'Mettre à jour',
    'close': 'Fermer',
    'open': 'Ouvrir',
    'submit': 'Soumettre',
    'reset': 'Réinitialiser',
    'clear': 'Effacer',
    'refresh': 'Actualiser',
    
    // Dashboard Content
    'total-students': 'Total Étudiants',
    'total-teachers': 'Total Enseignants',
    'total-classes': 'Total Classes',
    'active-sessions': 'Sessions Actives',
    'recent-activity': 'Activité Récente',
    'quick-actions': 'Actions Rapides',
    'statistics': 'Statistiques',
    'performance': 'Performance',
    'attendance-rate': 'Taux de Présence',
    'average-score': 'Score Moyen',
    
    // Forms & Tables
    'first-name': 'Prénom',
    'last-name': 'Nom',
    'full-name': 'Nom Complet',
    'date': 'Date',
    'time': 'Heure',
    'status': 'Statut',
    'actions': 'Actions',
    'description': 'Description',
    'notes': 'Notes',
    'comments': 'Commentaires',
    
    // Status Labels
    'active': 'Actif',
    'inactive': 'Inactif',
    'pending': 'En Attente',
    'completed': 'Terminé',
    'cancelled': 'Annulé',
    'draft': 'Brouillon',
    'published': 'Publié',
    
    // Finance Specific
    'financial-analytics-dashboard': 'Tableau de Bord des Analyses Financières',
    'comprehensive-analysis': 'Analyse complète pour',
    'generating-pdf': 'Génération PDF...',
    'export-pdf': 'Exporter PDF',
    'export-excel': 'Exporter Excel',
    'try-again': 'Réessayer',
    'error-loading-analytics': 'Erreur lors du chargement des analyses',
    'key-performance-indicators': 'Indicateurs de Performance Clés',
    'total-income': 'Revenus Totaux',
    'total-expenses': 'Dépenses Totales',
    'net-balance': 'Solde Net',
    'total-debts': 'Dettes Totales',
    'positive-balance': 'Solde positif',
    'negative-balance': 'Solde négatif',
    'manual': 'Manuel',
    'average': 'Moy',
    
    // Dashboard Management
    'management': 'Gestion',
    'under-development': 'Cette section est en cours de développement',
    'content-will-be-displayed': 'Le contenu pour la gestion {section} sera affiché ici',
    
    // Common Dashboard Elements
    'loading': 'Chargement...',
    'no-data': 'Aucune donnée',
    'no-results': 'Aucun résultat',
    'search-placeholder': 'Rechercher...',
    'filter': 'Filtrer',
    'sort': 'Trier',
    'export': 'Exporter',
    'import': 'Importer',
    'print': 'Imprimer',
    
    // Admin Dashboard
    'total-schools': 'Total Écoles',
    'total-users': 'Total Utilisateurs',
    'system-health': 'État du Système',
    'recent-registrations': 'Inscriptions Récentes',
    'user-management': 'Gestion des Utilisateurs',
    'school-management': 'Gestion des Écoles',
    'platform-overview': 'Aperçu de la Plateforme',
    'total-games': 'Total Jeux',
    'system-status': 'Statut du Système',
    
    // Teacher Dashboard  
    'create-assignment': 'Créer un Devoir',
    'view-results': 'Voir les Résultats',
    'student-progress': 'Progrès des Étudiants',
    'lesson-plans': 'Plans de Cours',
    'grade-book': 'Carnet de Notes',
    
    // Student Dashboard
    'my-assignments': 'Mes Devoirs',
    'my-grades': 'Mes Notes',
    'upcoming-tests': 'Tests à Venir',
    'study-materials': 'Matériel d\'Étude',
    'my-progress': 'Mon Progrès',
    'play-games': 'Jouer aux Jeux',
    'view-grades': 'Voir les Notes',
    'download-materials': 'Télécharger le Matériel',
    
    // Forms and Inputs
    'required-field': 'Champ obligatoire',
    'optional': 'Optionnel',
    'select-option': 'Sélectionner une option',
    'choose-file': 'Choisir un fichier',
    'upload': 'Télécharger',
    'download': 'Télécharger',
    'browse': 'Parcourir',
    'select-all': 'Tout sélectionner',
    'deselect-all': 'Tout désélectionner',
    
    // Error Messages
    'error-occurred': 'Une erreur s\'est produite',
    'please-try-again': 'Veuillez réessayer',
    'invalid-input': 'Saisie invalide',
    'required-fields-missing': 'Champs obligatoires manquants',
    'connection-error': 'Erreur de connexion',
    'server-error': 'Erreur du serveur',
    'validation-error': 'Erreur de validation',
    
    // Success Messages  
    'saved-successfully': 'Enregistré avec succès',
    'updated-successfully': 'Mis à jour avec succès',
    'deleted-successfully': 'Supprimé avec succès',
    'created-successfully': 'Créé avec succès',
    'operation-successful': 'Opération réussie',
    'changes-saved': 'Modifications enregistrées',
    
    // Time and Date
    'today': 'Aujourd\'hui',
    'yesterday': 'Hier',
    'tomorrow': 'Demain',
    'this-week': 'Cette semaine',
    'this-month': 'Ce mois',
    'this-year': 'Cette année',
    'last-week': 'Semaine dernière',
    'last-month': 'Mois dernier',
    'last-year': 'Année dernière',
    
    // Common UI Elements
    'yes': 'Oui',
    'no': 'Non',
    'ok': 'OK',
    'confirm': 'Confirmer',
    'back': 'Retour',
    'next': 'Suivant',
    'previous': 'Précédent',
    'finish': 'Terminer',
    'continue': 'Continuer',
    'skip': 'Passer',
    'done': 'Terminé',
    
    // Additional Manager/Admin terms
    'total-personnel': 'Total Personnel',
    'active-teachers': 'Enseignants Actifs',
    'leaderboard': 'Classement',
    'join-live': 'Rejoindre en Direct',
    'announcements': 'Annonces',
  'no-announcements': 'Aucune annonce pour le moment.',
  'failed-to-load-announcements': 'Échec du chargement des annonces.',
  'write-announcement': 'Écrire une annonce...',
  'post': 'Publier',
  'failed-to-post-announcement': 'Échec de la publication de l\'annonce.',
    'games-completed': 'Jeux Terminés',
    'current-streak': 'Série Actuelle',
    'total-points': 'Points Totaux',
    'time-spent': 'Temps Passé',
    'hours': 'heures',
    'day': 'jour',
    'days': 'jours',
    'student-dashboard': 'Tableau de Bord Étudiant',
    'welcome-student-dashboard': 'Bienvenue sur votre tableau de bord étudiant',
    
    // Admin specific translations
    'test-games': 'Jeux de Test',
    'template-games': 'Jeux par Modèle',
    'template-guide': 'Guide des Modèles',
    'quick-actions': 'Actions Rapides',
    'streamline-workflow': 'Simplifiez votre flux de travail avec des actions en un clic',
    'coming-soon': 'Bientôt',
    'search-schools': 'Rechercher des écoles...',
    'all-status': 'Tous les Statuts',
    'trial': 'Essai',
    'add-school': 'Ajouter une École',
    'no-schools-found': 'Aucune école trouvée',
    'no-schools-match-filters': 'Aucune école ne correspond à vos filtres',
    'failed-fetch-schools': 'Échec de la récupération des écoles. Veuillez réessayer plus tard.',
    'loading-test-games': 'Chargement des jeux de test...',
    'failed-fetch-test-games': 'Échec de la récupération des jeux de test',
    'delete-test-game': 'Supprimer ce jeu de test ?',
    'failed-delete-game': 'Échec de la suppression du jeu',
    
    // Manager Dashboard specific translations
    'schedule-management': 'Gestion des Horaires',
    'view-manage-schedules': 'Voir et gérer les horaires des classes',
    'student-files': 'Dossiers des Étudiants',
    'access-student-info-grades': 'Accéder aux informations et notes des étudiants',
    'reports-analytics': 'Rapports et Analyses',
    'generate-performance-reports': 'Générer des rapports de performance',
    'system-settings': 'Paramètres du Système',
    'configure-school-settings': 'Configurer les paramètres de l\'école',
    'notifications-coming-soon': 'Fonctionnalité de notifications bientôt disponible !',
    'stay-tuned': 'Restez à l\'écoute',
    'personnel': 'Personnel',
    'publicites': 'Publicités',
    'rapports': 'Rapports',
    
    // Catalog Management
    'skill-snap-catalog-management': 'Gestion du Catalogue Skill Snap',
    'manage-all-services-offerings': 'Gérer tous les services et offres pour votre école',
    'search-offerings': 'Rechercher des offres...',
    'support-lessons': 'Cours de Soutien',
    'review-courses': 'Cours de Révision',
    'vocational-trainings': 'Formations Professionnelles',
    'languages': 'Langues',
    'other-activities': 'Autres Activités',
    
    // Common Manager UI
    'add-new': 'Ajouter Nouveau',
    'edit': 'Modifier',
    'delete': 'Supprimer',
    'view': 'Voir',
    'search': 'Rechercher',
    'filter': 'Filtrer',
    'export': 'Exporter',
    'import': 'Importer',
    'save': 'Enregistrer',
    'cancel': 'Annuler',
    'confirm': 'Confirmer',
    'loading': 'Chargement...',
    'no-data': 'Aucune donnée',
    'no-results': 'Aucun résultat',
    'error-occurred': 'Une erreur s\'est produite',
    'success': 'Succès',
    'warning': 'Avertissement',
    'info': 'Information',
    
    // Additional Manager translations
    'failed-load-catalog-data': 'Échec du chargement des données du catalogue. Veuillez réessayer.',
    'confirm-delete-item': 'Êtes-vous sûr de vouloir supprimer cet élément ?',
    'failed-delete-item': 'Échec de la suppression de l\'élément. Veuillez réessayer.',
    
    // Classes Management
    'auth-token-not-found': 'Token d\'authentification non trouvé. Veuillez vous connecter.',
    'confirm-delete-class': 'Êtes-vous sûr de vouloir supprimer cette classe ?',
    'class-deleted-successfully': 'Classe supprimée avec succès.',
    'failed-delete-class': 'Échec de la suppression de la classe.',
    'error': 'Erreur',
    'class-name': 'Nom de la Classe',
    'teacher': 'Enseignant',
    'room': 'Salle',
    'schedule': 'Horaire',
    'capacity': 'Capacité',
    'enrolled': 'Inscrits',
    'price-dz': 'Prix (DZ)',
    'search-class-teacher-room': 'Rechercher par nom de classe, enseignant ou salle...',
    'create-class': 'Créer une Classe',
    'class-details': 'Détails de la Classe',
    'capacity-enrollment': 'Capacité et Inscriptions',
    'actions': 'Actions',
    'edit-class': 'Modifier la Classe',
    'delete-class': 'Supprimer la Classe',
    'no-classes-found': 'Aucune classe trouvée',
    'try-adjusting-search': 'Essayez d\'ajuster vos critères de recherche.',
    'get-started-create-first-class': 'Commencez par créer votre première classe.',
    'create-first-class': 'Créer la Première Classe',
    'manage-attendance-payments': 'Gérer les présences et paiements',
    'close': 'Fermer',
    
    // Attendance Management
    'failed-load-classes': 'Échec du chargement des classes',
    'student-not-found': 'Étudiant non trouvé',
    'search-failed': 'Échec de la recherche',
    'failed-load-student-data': 'Échec du chargement des données de l\'étudiant',
    'attendance-management': 'Gestion des Présences',
    'track-manage-student-attendance': 'Suivre et gérer les présences des étudiants',
    'attendance-controls': 'Contrôles de Présence',
    'select-class': 'Sélectionner une Classe',
    'scan-student-code': 'Scanner le Code Étudiant',
    'scan-type-student-code': 'Scanner ou saisir le code étudiant...',
    'search-student': 'Rechercher un Étudiant',
    'searching': 'Recherche...',
    'search-results': 'Résultats de Recherche',
    'found': 'trouvé(s)',
    'no-students-found': 'Aucun Étudiant Trouvé',
    'no-students-match-search': 'Aucun étudiant ne correspond à vos critères de recherche.',
    'error-loading-classes': 'Erreur de Chargement des Classes',
    'no-class-selected': 'Aucune Classe Sélectionnée',
    'please-select-class-dropdown': 'Veuillez sélectionner une classe dans le menu déroulant ci-dessus pour voir et gérer les présences.',
    'attendance-roster': 'Liste de Présence',
    
    // Students Management
    'search-by-name-phone-code': 'Rechercher par nom, téléphone ou code étudiant...',
    'add-student': 'Ajouter un Étudiant',
    'add-first-student': 'Ajouter le Premier Étudiant',
    'get-started-add-first-student': 'Commencez par ajouter votre premier étudiant.',
    'enroll-student': 'Inscrire un Étudiant',
    'student': 'Étudiant',
    
    // Teachers Management
    'search-teachers': 'Rechercher des enseignants...',
    'add-teacher': 'Ajouter un Enseignant',
    'no-teachers-found': 'Aucun enseignant trouvé',
    'try-adjusting-search-filter': 'Essayez d\'ajuster vos critères de recherche ou de filtre.',
    'get-started-add-first-teacher': 'Commencez par ajouter votre premier enseignant.',
    
    // Common Manager UI (additional)
    'add-first-teacher': 'Ajouter le Premier Enseignant',
    'add-first-employee': 'Ajouter le Premier Employé',
    'add-first-room': 'Ajouter la Première Salle',
    'add-first-equipment': 'Ajouter le Premier Équipement',
    'no-employees-found': 'Aucun employé trouvé',
    'no-rooms-found': 'Aucune salle trouvée',
    'no-equipment-found': 'Aucun équipement trouvé',
    'no-ads-found': 'Aucune publicité trouvée',
    
    // Employees Management
    'add-employee': 'Ajouter un Employé',
    'search-by-name-role-phone': 'Rechercher par nom, rôle ou téléphone...',
    'update-employee': 'Mettre à jour l\'Employé',
    
    // Rooms Management
    'search-rooms': 'Rechercher des salles...',
    'add-room': 'Ajouter une Salle',
    'no-rooms-match-search': 'Aucune salle ne correspond à vos critères de recherche.',
    'get-started-create-first-room': 'Commencez par créer votre première salle.',
    
    // Equipment Management
    'search-equipment': 'Rechercher de l\'équipement...',
    'add-equipment': 'Ajouter un Équipement',
    'no-equipment-match-search': 'Aucun équipement ne correspond à vos critères de recherche.',
    'get-started-create-first-equipment': 'Commencez par créer votre premier équipement.',
    
    // Ads Management
    'search-ads': 'Rechercher des publicités...',
    'add-ad': 'Ajouter une Publicité',
    'no-ads-match-search': 'Aucune publicité ne correspond à vos critères de recherche.',
    'get-started-create-first-ad': 'Commencez par créer votre première publicité.',
    
    // Ads Management
    'advertisements': 'Publicités',
    'manage-announcements-promotional': 'Gérer les annonces et le contenu promotionnel',
    'create-advertisement': 'Créer une Publicité',
    'advertisement': 'Publicité',
    'target-audience': 'Public Cible',
    'get-started-create-first-advertisement': 'Commencez par créer votre première publicité pour communiquer avec les étudiants et les enseignants.',
    'create-first-advertisement': 'Créer la Première Publicité',
    'edit-advertisement': 'Modifier la Publicité',
    'update-equipment': 'Mettre à jour l\'Équipement',

    // Finance Page Translations
    'finance': 'Finance',
    'manage-school-financial-data': 'Gérez les données financières de votre école',
    'back-to-dashboard': 'Retour au tableau de bord',
    'no-school-assigned': 'Aucune école assignée',
    'need-school-assignment-financial-data': 'Vous devez être assigné à une école pour accéder aux données financières.',
    'feature-available-next-phase': 'Cette fonctionnalité sera disponible dans la prochaine phase.',
    'tab': 'Onglet',

    // Finance Overview Tab
    'authentication-required': 'Authentification requise',
    'failed-fetch-financial-data': 'Échec du chargement des données financières',
    'confirm-freeze-month': 'Êtes-vous sûr de vouloir geler {month}/{year}? Cette action ne peut pas être annulée.',
    'month-frozen-successfully': 'Mois gelé avec succès!',
    'failed-freeze-month': 'Échec du gel du mois',
    'loading-financial-data': 'Chargement des données financières...',
    'error-loading-data': 'Erreur lors du chargement des données',
    'try-again': 'Réessayer',
    'summary-locked': 'Résumé verrouillé',
    'live-calculation': 'Calcul en direct',
    'frozen-on': 'Gelé le',
    'by': 'par',
    'freezing': 'Gel en cours...',
    'freeze-month': 'Geler le mois',
    'refresh': 'Actualiser',
    'payments': 'Paiements',
    'teacher-earnings': 'Gains des enseignants',
    'last-updated': 'Dernière mise à jour',
    'recent-transactions': 'Transactions récentes',

    // Finance Teachers Tab
    'failed-fetch-teacher-payout-data': 'Échec du chargement des données de paiement des enseignants',
    'loading-teacher-payout-data': 'Chargement des données de paiement des enseignants...',
    'paid': 'Payé',
    'partial': 'Partiel',
    'pending': 'En attente',
    'unknown': 'Inconnu',
    'teacher-payouts': 'Paiements des enseignants',
    'no-teachers-match-filters': 'Aucun enseignant ne correspond à vos filtres actuels.',
    'no-teacher-payout-data-available': 'Aucune donnée de paiement d\'enseignant disponible pour ce mois.',
    'classes': 'Classes',
    'students-paid': 'Étudiants payés',
    'calculated-income': 'Revenus calculés',
    'paid-amount': 'Montant payé',
    'remaining': 'Restant',
    'status': 'Statut',
    'actions': 'Actions',
    'class': 'classe',
    'details': 'Détails',
    'pay': 'Payer',

    // Finance Employees Tab
    'failed-fetch-employees': 'Échec du chargement des employés',
    'confirm-archive-employee': 'Êtes-vous sûr de vouloir archiver cet employé?',
    'employee-archived-successfully': 'Employé archivé avec succès',
    'failed-delete-employee': 'Échec de la suppression de l\'employé',
    'loading-employees': 'Chargement des employés...',
    'error-loading-employees': 'Erreur lors du chargement des employés',
    'employee-management': 'Gestion des employés',
    'manage-non-teacher-staff-salaries': 'Gérez les salaires et paiements du personnel non-enseignant',
    'add-employee': 'Ajouter un employé',
    'search-employees': 'Rechercher des employés...',
    'all-status': 'Tous les statuts',
    'active': 'Actif',
    'inactive': 'Inactif',
    'employee': 'Employé',
    'role': 'Rôle',
    'salary': 'Salaire',
    'hire-date': 'Date d\'embauche',
    'view-details': 'Voir les détails',
    'edit-employee': 'Modifier l\'employé',
    'pay-salary': 'Payer le salaire',
    'archive-employee': 'Archiver l\'employé',
    'no-employees-found': 'Aucun employé trouvé',
    'try-adjusting-search-filter': 'Essayez d\'ajuster vos critères de recherche ou de filtre',
    'get-started-add-first-employee': 'Commencez par ajouter votre premier employé',

    // Finance Expenses Tab
    'failed-fetch-transactions': 'Échec du chargement des transactions',
    'confirm-delete-transaction': 'Êtes-vous sûr de vouloir supprimer cette transaction?',
    'failed-delete-transaction': 'Échec de la suppression de la transaction',
    'loading-transactions': 'Chargement des transactions...',
    'manual-transactions': 'Transactions manuelles',
    'transaction': 'transaction',
    'add-transaction': 'Ajouter une transaction',
    'total-income': 'Revenus totaux',
    'total-expenses': 'Dépenses totales',
    'net-balance': 'Solde net',
    'search-transactions': 'Rechercher des transactions...',
    'all-categories': 'Toutes les catégories',
    'all-types': 'Tous les types',
    'income': 'Revenus',
    'expense': 'Dépense',
    'no-transactions-found': 'Aucune transaction trouvée',
    'no-transactions-match-filters': 'Aucune transaction ne correspond à vos filtres actuels.',
    'no-manual-transactions-recorded': 'Aucune transaction manuelle enregistrée pour ce mois.',
    'date': 'Date',
    'category': 'Catégorie',
    'description': 'Description',
    'type': 'Type',
    'amount': 'Montant',
    'receipt-number': 'Numéro de reçu',
    'created-by': 'Créé par',

    // Finance Categories
    'rent': 'Loyer',
    'electricity': 'Électricité',
    'water': 'Eau',
    'internet': 'Internet',
    'insurance': 'Assurance',
    'equipment': 'Équipement',
    'maintenance': 'Maintenance',
    'supplies': 'Fournitures',
    'activities': 'Activités',
    'donations': 'Dons',
    'other-income': 'Autres revenus',
    'other-expense': 'Autre dépense',
  },
  
  ar: {
    // Navigation
    'overview': 'نظرة عامة',
    'classes': 'الفصول',
    'attendance': 'الحضور',
    'timetable': 'الجدول الزمني',
    'students': 'الطلاب',
    'teachers': 'المعلمون',
    'employees': 'الموظفون',
    'rooms': 'القاعات',
    'equipment': 'المعدات',
    'catalog': 'الكتالوج',
    'ads': 'الإعلانات',
    'reports': 'التقارير',
    'finance': 'المالية',
    'log': 'السجل',
    'badges': 'الشارات',
    'analytics': 'التحليلات',
    'schools': 'المدارس',
    'games': 'الألعاب',
    'templates': 'قوالب الألعاب',
    'template-guide': 'دليل القوالب',
    'template-games': 'ألعاب حسب القالب',
    'my-games': 'ألعابي',
    'create-game': 'إنشاء لعبة',
    'live-sessions': 'الجلسات المباشرة',
    'assignments': 'المهام',
    'resources': 'الموارد',
    'calendar': 'التقويم',
    'my-classes': 'فصولي',
    
    // Common UI
    'dashboard': 'لوحة التحكم',
    'manage-dashboard': 'إدارة لوحة التحكم',
    'profile': 'الملف الشخصي',
    'logout': 'تسجيل الخروج',
    'search': 'بحث...',
    'notifications': 'الإشعارات',
    'recent-notifications': 'الإشعارات الأخيرة',
    'coming-soon': 'قريباً',
    'welcome': 'مرحباً',
    'welcome-back': 'مرحباً بعودتك',
    'ready-to-continue': 'مستعد لمواصلة رحلة التعلم؟',
    'no-badges-yet': 'لا توجد شارات بعد.',
    'no-achievements-yet': 'لا توجد إنجازات بعد.',
    'recent-games': 'الألعاب الأخيرة',
    'recently-earned-badges': 'الشارات المكتسبة مؤخراً',
    
    // Login
    'welcome-back-login': 'مرحباً بعودتك',
    'sign-in-to-continue': 'سجل الدخول للمتابعة إلى Skill Snap',
    'email-address': 'عنوان البريد الإلكتروني',
    'enter-email': 'أدخل بريدك الإلكتروني',
    'password': 'كلمة المرور',
    'enter-password': 'أدخل كلمة المرور',
    'signing-in': 'جاري تسجيل الدخول...',
    'sign-in': 'تسجيل الدخول',
    'forgot-password': 'نسيت كلمة المرور؟',
    'login-error': 'حدث خطأ أثناء تسجيل الدخول.',
    
    // Quick Actions
    'class-management': 'إدارة الفصول',
    'manage-classes-schedules': 'إدارة الفصول والجداول',
    'attendance-tracking': 'تتبع الحضور',
    'monitor-student-attendance': 'مراقبة حضور الطلاب',
    'schedule-management': 'إدارة الجدول',
    'view-manage-schedules': 'عرض وإدارة الجداول الزمنية',
    'student-records': 'سجلات الطلاب',
    'access-student-info': 'الوصول إلى معلومات ودرجات الطلاب',
    'reports-analytics': 'التقارير والتحليلات',
    'generate-performance-reports': 'إنشاء تقارير الأداء',
    'system-settings': 'إعدادات النظام',
    'configure-school-settings': 'تكوين إعدادات المدرسة',
    
    // PDF Reports
    'financial-analytics-report': 'تقرير التحليلات المالية',
    'address': 'العنوان',
    'phone': 'الهاتف',
    'email': 'البريد الإلكتروني',
    'generated-on': 'تم إنشاؤه في',
    'generated-by': 'تم إنشاؤه بواسطة',
    'user': 'المستخدم',
    'unknown': 'غير معروف',
    'salaries-by-role': 'الرواتب حسب الدور',
    'role': 'الدور',
    'count': 'العدد',
    'total-calculated': 'المجموع المحسوب',
    'total-paid': 'المجموع المدفوع',
    'remaining': 'المتبقي',
    
    // Notifications
    'notifications-coming-soon': 'ميزة الإشعارات قريباً!',
    'stay-tuned': 'ترقبوا المزيد',
    
    // Profile
    'back-to-dashboard': 'العودة إلى لوحة التحكم',
    'profile-information': 'معلومات الملف الشخصي',
    'basic-information': 'المعلومات الأساسية',
    'phone-number': 'رقم الهاتف',
    'secondary-phone': 'الهاتف الثانوي',
    'teaching-information': 'معلومات التدريس',
    'years-of-experience': 'سنوات الخبرة',
    'employment-status': 'حالة التوظيف',
    'activities': 'الأنشطة',
    'work-information': 'معلومات العمل',
    'management-access': 'الوصول للإدارة',
    'staff-management': 'إدارة الموظفين',
    'reports-access': 'الوصول للتقارير',
    'work-status': 'حالة العمل',
    'account-information': 'معلومات الحساب',
    'member-since': 'عضو منذ',
    'last-updated': 'آخر تحديث',
    'enrollments-balances': 'التسجيلات والأرصدة',
    'no-enrollments-found': 'لم يتم العثور على تسجيلات',
    'payments': 'المدفوعات',
    'no-payments-yet': 'لا توجد مدفوعات بعد',
    'add-payment': 'إضافة دفعة',
    'quick-stats': 'إحصائيات سريعة',
    'edit-profile': 'تعديل الملف الشخصي',
    'save': 'حفظ',
    'cancel': 'إلغاء',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or default to French
    const savedLanguage = localStorage.getItem('language');
    console.log('Initial language from localStorage:', savedLanguage);
    return savedLanguage || 'fr';
  });

  const [isRTL, setIsRTL] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage === 'ar';
  });
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  useEffect(() => {
    // Save language to localStorage
    localStorage.setItem('language', language);
    setIsRTL(language === 'ar');
    
    // Update document direction
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Debug logging
    console.log('Language changed to:', language);
    console.log('RTL mode:', language === 'ar');
    console.log('Document direction:', document.documentElement.dir);
  }, [language]);

  const toggleLanguage = () => {
    console.log('Toggling language from:', language);
    setIsChangingLanguage(true);
    
    // Add a small delay for smooth transition
    setTimeout(() => {
      const newLanguage = language === 'fr' ? 'ar' : 'fr';
      console.log('Setting new language to:', newLanguage);
      setLanguage(newLanguage);
      
      // Hide loading after language change is complete
      setTimeout(() => {
        setIsChangingLanguage(false);
        console.log('Language change complete');
      }, 300);
    }, 200);
  };

  const t = (key) => {
    const translation = translations[language]?.[key];
    if (!translation) {
      console.warn(`Translation missing for key "${key}" in language "${language}"`);
      return key;
    }
    return translation;
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    isRTL,
    isChangingLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
