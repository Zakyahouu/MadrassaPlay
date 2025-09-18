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
    
    // Common UI
    'dashboard': 'Tableau de Bord',
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
    'email-address': 'Adresse e-mail',
    'phone-number': 'Numéro de téléphone',
    'secondary-phone': 'Téléphone secondaire',
    'address': 'Adresse',
    'teaching-information': 'Informations d\'Enseignement',
    'years-of-experience': 'Années d\'expérience',
    'employment-status': 'Statut d\'emploi',
    'activities': 'Activités',
    'work-information': 'Informations de Travail',
    'management-access': 'Accès à la Gestion',
    'staff-management': 'Gestion du Personnel',
    'class-management': 'Gestion des Classes',
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
    'email-address': 'عنوان البريد الإلكتروني',
    'phone-number': 'رقم الهاتف',
    'secondary-phone': 'الهاتف الثانوي',
    'address': 'العنوان',
    'teaching-information': 'معلومات التدريس',
    'years-of-experience': 'سنوات الخبرة',
    'employment-status': 'حالة التوظيف',
    'activities': 'الأنشطة',
    'work-information': 'معلومات العمل',
    'management-access': 'الوصول للإدارة',
    'staff-management': 'إدارة الموظفين',
    'class-management': 'إدارة الفصول',
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
    return localStorage.getItem('language') || 'fr';
  });

  const [isRTL, setIsRTL] = useState(language === 'ar');
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  useEffect(() => {
    // Save language to localStorage
    localStorage.setItem('language', language);
    setIsRTL(language === 'ar');
    
    // Update document direction
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setIsChangingLanguage(true);
    
    // Add a small delay for smooth transition
    setTimeout(() => {
      setLanguage(prev => prev === 'fr' ? 'ar' : 'fr');
      
      // Hide loading after language change is complete
      setTimeout(() => {
        setIsChangingLanguage(false);
      }, 300);
    }, 200);
  };

  const t = (key) => {
    return translations[language][key] || key;
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
