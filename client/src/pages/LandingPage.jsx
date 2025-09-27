import React, { useRef, useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import * as THREE from 'three';
import { 
  Play, 
  Users, 
  BookOpen, 
  BarChart3, 
  Shield, 
  Gamepad2,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Mail,
  Phone,
  Monitor,
  Smartphone,
  Tablet,
  Star,
  Globe,
  Facebook,
  Linkedin,
  Twitter,
  Award,
  Target,
  Zap,
  Heart,
  Brain,
  Lightbulb,
  ChevronDown,
  HelpCircle,
  MessageCircle,
  Calendar,
  Clock,
  TrendingUp,
  UserCheck,
  School,
  GraduationCap,
  BookMarked,
  FileText,
  Settings,
  Download
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);
  const [language, setLanguage] = useState('fr'); // 'fr' for French, 'ar' for Arabic
  const [activeDemo, setActiveDemo] = useState(0);
  const [liveStats, setLiveStats] = useState({
    students: 1247,
    teachers: 89,
    schools: 23,
    gamesPlayed: 15678
  });
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const [navbarDropdown, setNavbarDropdown] = useState(null);
  const threeRef = useRef(null);
  const gameVisualizationRef = useRef(null);
  const analyticsRef = useRef(null);

  // Live Stats Animation (Stripe-style)
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        students: prev.students + Math.floor(Math.random() * 3),
        teachers: prev.teachers + Math.floor(Math.random() * 2),
        schools: prev.schools + Math.floor(Math.random() * 1),
        gamesPlayed: prev.gamesPlayed + Math.floor(Math.random() * 15)
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setNavbarDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Three.js Interactive 3D Learning Demo
  useEffect(() => {
    if (!threeRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, threeRef.current.clientWidth / threeRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(threeRef.current.clientWidth, threeRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0);
    threeRef.current.appendChild(renderer.domElement);

    // Create a DNA-like helix structure
    const helixGroup = new THREE.Group();
    
    // Create spheres along the helix
    const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const materials = [
      new THREE.MeshPhongMaterial({ color: 0x4F46E5 }),
      new THREE.MeshPhongMaterial({ color: 0x06B6D4 }),
      new THREE.MeshPhongMaterial({ color: 0x10B981 }),
      new THREE.MeshPhongMaterial({ color: 0xF59E0B })
    ];

    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * Math.PI * 8;
      const y = (i / 50) * 4 - 2;
      const radius = 1;
      
      const sphere1 = new THREE.Mesh(sphereGeometry, materials[i % 4]);
      sphere1.position.set(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      );
      helixGroup.add(sphere1);
      
      const sphere2 = new THREE.Mesh(sphereGeometry, materials[(i + 2) % 4]);
      sphere2.position.set(
        Math.cos(angle + Math.PI) * radius,
        y,
        Math.sin(angle + Math.PI) * radius
      );
      helixGroup.add(sphere2);
    }

    scene.add(helixGroup);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 0.4);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    camera.position.z = 5;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      helixGroup.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (threeRef.current && renderer.domElement) {
        threeRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Game Visualization Component
  const GameVisualization = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const particles = [];
      for (let i = 0; i < 30; i++) {
        particles.push({
          x: Math.random() * canvas.offsetWidth,
          y: Math.random() * canvas.offsetHeight,
          radius: Math.random() * 3 + 1,
          dx: (Math.random() - 0.5) * 2,
          dy: (Math.random() - 0.5) * 2,
          color: ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B'][Math.floor(Math.random() * 4)]
        });
      }

      const animate = () => {
        ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        
        particles.forEach(particle => {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fillStyle = particle.color;
          ctx.fill();

          particle.x += particle.dx;
          particle.y += particle.dy;

          if (particle.x < 0 || particle.x > canvas.offsetWidth) particle.dx *= -1;
          if (particle.y < 0 || particle.y > canvas.offsetHeight) particle.dy *= -1;
        });

        requestAnimationFrame(animate);
      };
      animate();
    }, []);

    return <canvas ref={canvasRef} className="w-full h-full" />;
  };

  // Analytics Visualization
  const AnalyticsChart = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const data = [20, 45, 65, 80, 95, 110, 125, 140, 160, 185];
      const maxData = Math.max(...data);
      
      let animationProgress = 0;

      const animate = () => {
        ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        
        const barWidth = canvas.offsetWidth / data.length * 0.8;
        const spacing = canvas.offsetWidth / data.length * 0.2;

        data.forEach((value, index) => {
          const barHeight = (value / maxData) * canvas.offsetHeight * 0.8 * animationProgress;
          const x = index * (barWidth + spacing) + spacing / 2;
          const y = canvas.offsetHeight - barHeight - 20;

          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, '#4F46E5');
          gradient.addColorStop(1, '#06B6D4');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth, barHeight);
        });

        if (animationProgress < 1) {
          animationProgress += 0.02;
          requestAnimationFrame(animate);
        }
      };
      
      setTimeout(animate, 500);
    }, []);

    return <canvas ref={canvasRef} className="w-full h-full" />;
  };

  // Translation Data
  const translations = {
    fr: {
      nav: {
        features: "Fonctionnalités",
        demo: "Démo",
        pricing: "Tarifs",
        faq: "FAQ",
        login: "Connexion",
        dashboard: "Tableau de bord",
        profile: "Profil",
        logout: "Déconnexion",
        getStarted: "Commencer"
      },
      hero: {
        title: "Éducation",
        subtitle: "Réimaginée",
        description: "Transformez l'apprentissage avec des expériences interactives, des insights en temps réel et des outils qui rendent l'éducation engageante pour tous.",
        startTrial: "Commencer l'essai gratuit",
        watchDemo: "Voir la démo"
      },
      mission: {
        title: "Notre Mission",
        subtitle: "Transformer l'Éducation par la Technologie",
        description: "MadrassaPlay existe pour combler le fossé entre l'éducation traditionnelle et les besoins d'apprentissage modernes. Nous croyons que l'apprentissage doit être engageant, interactif et accessible à tous, quel que soit leur parcours ou style d'apprentissage.",
        values: [
          {
            title: "Centré sur l'Étudiant",
            description: "Chaque fonctionnalité est conçue en pensant au parcours d'apprentissage de l'étudiant"
          },
          {
            title: "Innovation d'Abord",
            description: "Nous repoussons constamment les limites de la technologie éducative"
          },
          {
            title: "Communauté",
            description: "Construit par des éducateurs, pour des éducateurs, avec un retour continu"
          }
        ]
      },
      features: {
        title: "Fonctionnalités qui comptent",
        subtitle: "Chaque outil conçu avec un but. Chaque fonctionnalité construite pour l'impact.",
        interactive: "Jeux Interactifs",
        interactiveDesc: "Expériences d'apprentissage gamifiées",
        management: "Gestion de Classe",
        managementDesc: "Outils d'enseignant rationalisés",
        content: "Contenu Intelligent",
        contentDesc: "Matériaux d'apprentissage adaptatifs",
        analytics: "Analytiques en Temps Réel",
        analyticsDesc: "Insights de progrès instantanés"
      },
      gamification: {
        title: "Gamification & Apprentissage Amusant",
        subtitle: "Rendez l'apprentissage addictif avec notre système de gamification complet qui garde les étudiants engagés et motivés.",
        achievement: "Système de Réussite",
        achievementDesc: "Les étudiants gagnent des badges et certificats pour compléter les défis et atteindre les jalons",
        progress: "Suivi des Progrès",
        progressDesc: "Barres de progrès visuelles et systèmes de niveaux qui motivent l'apprentissage continu",
        feedback: "Retour en Temps Réel",
        feedbackDesc: "Récompenses et retours instantanés qui gardent les étudiants engagés et motivés",
        adaptive: "Défis Adaptatifs",
        adaptiveDesc: "Ajustement de difficulté alimenté par l'IA qui assure un rythme d'apprentissage optimal"
      },
      audience: {
        title: "Parfait pour Tous",
        subtitle: "Solutions sur mesure pour chaque membre de la communauté éducative.",
        schools: "Pour les Écoles",
        schoolsSubtitle: "Gestion Éducative Complète",
        teachers: "Pour les Enseignants",
        teachersSubtitle: "Outils d'Enseignement Puissants",
        students: "Pour les Étudiants",
        studentsSubtitle: "Expérience d'Apprentissage Engageante",
        parents: "Pour les Parents",
        parentsSubtitle: "Restez Connecté & Informé"
      },
      success: {
        title: "Histoires de Succès",
        subtitle: "Résultats réels d'écoles réelles utilisant MadrassaPlay."
      },
      faq: {
        title: "Questions Fréquemment Posées",
        subtitle: "Tout ce que vous devez savoir sur MadrassaPlay."
      },
      cta: {
        title: "Prêt à transformer l'éducation ?",
        subtitle: "Rejoignez des milliers d'éducateurs utilisant déjà MadrassaPlay",
        getStarted: "Commencer Gratuitement",
        scheduleDemo: "Planifier une Démo"
      }
    },
    ar: {
      nav: {
        features: "الميزات",
        demo: "العرض التوضيحي",
        pricing: "الأسعار",
        faq: "الأسئلة الشائعة",
        login: "تسجيل الدخول",
        dashboard: "لوحة التحكم",
        profile: "الملف الشخصي",
        logout: "تسجيل الخروج",
        getStarted: "ابدأ الآن"
      },
      hero: {
        title: "التعليم",
        subtitle: "مُعاد تصوره",
        description: "حوّل التعلم بتجارب تفاعلية ورؤى فورية وأدوات تجعل التعليم جذاباً للجميع.",
        startTrial: "ابدأ التجربة المجانية",
        watchDemo: "شاهد العرض التوضيحي"
      },
      mission: {
        title: "مهمتنا",
        subtitle: "تحويل التعليم من خلال التكنولوجيا",
        description: "MadrassaPlay موجود لسد الفجوة بين التعليم التقليدي واحتياجات التعلم الحديثة. نؤمن أن التعلم يجب أن يكون جذاباً وتفاعلياً ومتاحاً للجميع، بغض النظر عن خلفيتهم أو أسلوب تعلمهم.",
        values: [
          {
            title: "مرتكز على الطالب",
            description: "كل ميزة مصممة مع التركيز على رحلة تعلم الطالب"
          },
          {
            title: "الابتكار أولاً",
            description: "نحن ندفع باستمرار حدود التكنولوجيا التعليمية"
          },
          {
            title: "مدفوعة بالمجتمع",
            description: "مبني من قبل المعلمين، للمعلمين، مع ردود فعل مستمرة"
          }
        ]
      },
      features: {
        title: "الميزات المهمة",
        subtitle: "كل أداة مصممة لغرض. كل ميزة مبنية للتأثير.",
        interactive: "ألعاب تفاعلية",
        interactiveDesc: "تجارب تعلم مدمجة بالألعاب",
        management: "إدارة الفصل",
        managementDesc: "أدوات معلم مبسطة",
        content: "محتوى ذكي",
        contentDesc: "مواد تعلم تكيفية",
        analytics: "تحليلات فورية",
        analyticsDesc: "رؤى تقدم فورية"
      },
      gamification: {
        title: "التلعيب والتعلم الممتع",
        subtitle: "اجعل التعلم مسبب للإدمان مع نظام التلعيب الشامل الذي يحافظ على تفاعل وتحفيز الطلاب.",
        achievement: "نظام الإنجازات",
        achievementDesc: "يكسب الطلاب شارات وشهادات لإكمال التحديات والوصول للمعالم",
        progress: "تتبع التقدم",
        progressDesc: "أشرطة تقدم بصرية وأنظمة مستويات تحفز التعلم المستمر",
        feedback: "ردود فعل فورية",
        feedbackDesc: "مكافآت وردود فعل فورية تحافظ على تفاعل وتحفيز الطلاب",
        adaptive: "تحديات تكيفية",
        adaptiveDesc: "تعديل صعوبة مدعوم بالذكاء الاصطناعي يضمن وتيرة تعلم مثالية"
      },
      audience: {
        title: "مثالي للجميع",
        subtitle: "حلول مخصصة لكل عضو في المجتمع التعليمي.",
        schools: "للمدارس",
        schoolsSubtitle: "إدارة تعليمية شاملة",
        teachers: "للمعلمين",
        teachersSubtitle: "أدوات تعليمية قوية",
        students: "للطلاب",
        studentsSubtitle: "تجربة تعلم جذابة",
        parents: "للأولياء",
        parentsSubtitle: "ابق متصلاً ومطلعاً"
      },
      success: {
        title: "قصص النجاح",
        subtitle: "نتائج حقيقية من مدارس حقيقية تستخدم MadrassaPlay."
      },
      faq: {
        title: "الأسئلة الشائعة",
        subtitle: "كل ما تحتاج لمعرفته عن MadrassaPlay."
      },
      cta: {
        title: "مستعد لتحويل التعليم؟",
        subtitle: "انضم إلى آلاف المعلمين الذين يستخدمون MadrassaPlay بالفعل",
        getStarted: "ابدأ مجاناً",
        scheduleDemo: "جدولة عرض توضيحي"
      }
    }
  };

  const t = translations[language];

  // Asset Placeholders (you'll add these images later)
  const assets = {
    screenshots: {
      teacherDashboard: '/assets/asset-1.png', // Teacher dashboard screenshot
      studentGame: '/assets/asset-2.png', // Student playing game
      analytics: '/assets/asset-3.png', // Analytics dashboard
      mobileApp: '/assets/asset-4.png', // Mobile app interface
      classManagement: '/assets/asset-5.png', // Class management view
      parentPortal: '/assets/asset-6.png' // Parent portal
    },
    demos: {
      gamePlay: '/assets/asset-7.mp4', // Gameplay video
      teacherDemo: '/assets/asset-8.mp4', // Teacher workflow demo
      studentExperience: '/assets/asset-9.mp4' // Student experience demo
    },
    icons: {
      gameIcon: '/assets/asset-10.svg', // Game icon
      teacherIcon: '/assets/asset-11.svg', // Teacher icon
      studentIcon: '/assets/asset-12.svg', // Student icon
      parentIcon: '/assets/asset-13.svg' // Parent icon
    }
  };

  // Screenshot Gallery Data (Linear/Notion style)
  const screenshotGallery = [
    {
      id: 'teacher-dashboard',
      title: 'Teacher Dashboard',
      description: 'Real-time class monitoring and student progress tracking',
      image: assets.screenshots.teacherDashboard,
      category: 'Management',
      stats: { students: 24, classes: 3, progress: '89%' },
      features: ['Live student status', 'Progress tracking', 'Class management']
    },
    {
      id: 'student-game',
      title: 'Student Learning',
      description: 'Interactive games and engaging learning experiences',
      image: assets.screenshots.studentGame,
      category: 'Learning',
      stats: { games: 15, score: '92%', streak: '7 days' },
      features: ['Interactive games', 'Progress tracking', 'Achievements']
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights and performance metrics',
      image: assets.screenshots.analytics,
      category: 'Insights',
      stats: { improvement: '+18%', engagement: '94%', completion: '87%' },
      features: ['Performance metrics', 'Learning analytics', 'Progress reports']
    },
    {
      id: 'mobile-app',
      title: 'Mobile Experience',
      description: 'Seamless learning on any device, anywhere',
      image: assets.screenshots.mobileApp,
      category: 'Mobile',
      stats: { downloads: '2.1k', rating: '4.8', users: '1.2k' },
      features: ['Cross-platform', 'Offline mode', 'Push notifications']
    },
    {
      id: 'class-management',
      title: 'Class Management',
      description: 'Organize and manage multiple classes efficiently',
      image: assets.screenshots.classManagement,
      category: 'Organization',
      stats: { classes: 8, students: 156, attendance: '96%' },
      features: ['Class organization', 'Student management', 'Attendance tracking']
    },
    {
      id: 'parent-portal',
      title: 'Parent Portal',
      description: 'Keep parents informed about their child\'s progress',
      image: assets.screenshots.parentPortal,
      category: 'Communication',
      stats: { parents: 89, reports: 156, satisfaction: '98%' },
      features: ['Progress reports', 'Communication', 'Goal setting']
    }
  ];

  // Dynamic Demo Content (Stripe-style)
  const demoContent = [
    {
      id: 'teacher-dashboard',
      title: t.features.management,
      description: t.features.managementDesc,
      image: assets.screenshots.teacherDashboard,
      stats: {
        label: 'Active Classes',
        value: liveStats.schools,
        change: '+12%'
      },
      features: ['Real-time monitoring', 'Student progress', 'Class management']
    },
    {
      id: 'student-game',
      title: t.features.interactive,
      description: t.features.interactiveDesc,
      image: assets.screenshots.studentGame,
      stats: {
        label: 'Games Played Today',
        value: liveStats.gamesPlayed,
        change: '+8%'
      },
      features: ['Interactive learning', 'Gamification', 'Progress tracking']
    },
    {
      id: 'analytics',
      title: t.features.analytics,
      description: t.features.analyticsDesc,
      image: assets.screenshots.analytics,
      stats: {
        label: 'Students Online',
        value: liveStats.students,
        change: '+15%'
      },
      features: ['Performance insights', 'Learning analytics', 'Progress reports']
    }
  ];

  // Mission and About Data
  const missionData = {
    title: t.mission.title,
    subtitle: t.mission.subtitle,
    description: t.mission.description,
    values: [
      {
        icon: <Heart className="w-8 h-8" />,
        title: t.mission.values[0].title,
        description: t.mission.values[0].description
      },
      {
        icon: <Lightbulb className="w-8 h-8" />,
        title: t.mission.values[1].title,
        description: t.mission.values[1].description
      },
      {
        icon: <Users className="w-8 h-8" />,
        title: t.mission.values[2].title,
        description: t.mission.values[2].description
      }
    ]
  };

  // Gamification Features
  const gamificationFeatures = [
    {
      icon: <Award className="w-8 h-8" />,
      title: t.gamification.achievement,
      description: t.gamification.achievementDesc,
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: t.gamification.progress,
      description: t.gamification.progressDesc,
      color: "from-green-400 to-emerald-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: t.gamification.feedback,
      description: t.gamification.feedbackDesc,
      color: "from-blue-400 to-cyan-500"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: t.gamification.adaptive,
      description: t.gamification.adaptiveDesc,
      color: "from-purple-400 to-pink-500"
    }
  ];

  // Success Stories
  const successStories = [
    {
      quote: "MadrassaPlay transformed our school's engagement rates by 300%. Students actually look forward to learning now!",
      author: "Dr. Sarah Ahmed",
      role: "Principal",
      school: "Al-Noor International School",
      image: "SA",
      stats: "300% engagement increase"
    },
    {
      quote: "The 3D learning features made complex science concepts click for my students. Test scores improved dramatically.",
      author: "Mr. Hassan Ali",
      role: "Science Teacher",
      school: "Riyadh Academy",
      image: "HA",
      stats: "85% test score improvement"
    },
    {
      quote: "Finally, a platform that makes learning fun for my kids while giving me peace of mind about their progress.",
      author: "Mrs. Fatima Al-Rashid",
      role: "Parent",
      school: "Dubai Modern School",
      image: "FA",
      stats: "Parent satisfaction: 98%"
    }
  ];

  // FAQ Data
  const faqData = [
    {
      question: "How does MadrassaPlay integrate with existing school systems?",
      answer: "MadrassaPlay offers seamless integration with popular Learning Management Systems (LMS) and Student Information Systems (SIS). We provide APIs and direct integrations with platforms like Google Classroom, Microsoft Teams, and Canvas."
    },
    {
      question: "What devices are supported for student access?",
      answer: "MadrassaPlay works on all modern devices including tablets, smartphones, laptops, and desktop computers. Our responsive design ensures optimal experience across all screen sizes."
    },
    {
      question: "How secure is student data on your platform?",
      answer: "We take data security seriously. All data is encrypted in transit and at rest, we're GDPR and COPPA compliant, and we undergo regular security audits. Student privacy is our top priority."
    },
    {
      question: "Can teachers create custom content and games?",
      answer: "Absolutely! Our platform includes powerful content creation tools that allow teachers to build custom games, quizzes, and interactive lessons tailored to their curriculum and teaching style."
    },
    {
      question: "What support is available for schools and teachers?",
      answer: "We provide comprehensive support including video tutorials, live training sessions, dedicated account managers for larger schools, and 24/7 technical support for premium users."
    },
    {
      question: "How does the pricing work for different school sizes?",
      answer: "We offer flexible pricing based on the number of students and features needed. Small schools can start with our free tier, while larger institutions can choose from our Pro or Enterprise plans with volume discounts."
    }
  ];

  // Audience-specific benefits
  const audienceBenefits = [
    {
      icon: <School className="w-12 h-12" />,
      title: t.audience.schools,
      subtitle: t.audience.schoolsSubtitle,
      benefits: [
        "Centralized student and teacher management",
        "Comprehensive analytics and reporting",
        "Multi-campus support and administration",
        "Integration with existing school systems",
        "Custom branding and white-label options"
      ],
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <GraduationCap className="w-12 h-12" />,
      title: t.audience.teachers,
      subtitle: t.audience.teachersSubtitle,
      benefits: [
        "Easy-to-use content creation tools",
        "Real-time student progress monitoring",
        "Automated grading and feedback systems",
        "Collaborative lesson planning",
        "Professional development resources"
      ],
      color: "from-green-500 to-green-600"
    },
    {
      icon: <BookMarked className="w-12 h-12" />,
      title: t.audience.students,
      subtitle: t.audience.studentsSubtitle,
      benefits: [
        "Interactive games and challenges",
        "Personalized learning paths",
        "3D immersive experiences",
        "Peer collaboration tools",
        "Achievement and reward systems"
      ],
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: <UserCheck className="w-12 h-12" />,
      title: t.audience.parents,
      subtitle: t.audience.parentsSubtitle,
      benefits: [
        "Real-time progress tracking",
        "Detailed performance reports",
        "Communication with teachers",
        "Learning goal setting",
        "Safe and secure platform access"
      ],
      color: "from-orange-500 to-orange-600"
    }
  ];

  const features = [
    {
      icon: <Gamepad2 className="w-6 h-6" />,
      title: t.features.interactive,
      description: t.features.interactiveDesc,
      component: <GameVisualization />
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: t.features.management,
      description: t.features.managementDesc,
      component: (
        <div className="flex items-center justify-center h-full">
          <div className="grid grid-cols-3 gap-2">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg opacity-80" />
            ))}
          </div>
        </div>
      )
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: t.features.content,
      description: t.features.contentDesc,
      component: (
        <div className="flex flex-col space-y-2 p-4">
          <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded w-3/4" />
          <div className="h-2 bg-gradient-to-r from-green-400 to-green-600 rounded w-1/2" />
          <div className="h-2 bg-gradient-to-r from-purple-400 to-purple-600 rounded w-5/6" />
        </div>
      )
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: t.features.analytics,
      description: t.features.analyticsDesc,
      component: <AnalyticsChart />
    }
  ];

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleDashboard = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleProfile = () => {
    if (user) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className={`min-h-screen bg-white ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-semibold text-gray-900">MadrassaPlay</span>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              {/* Features Dropdown */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => setNavbarDropdown(navbarDropdown === 'features' ? null : 'features')}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <span>{t.nav.features}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {navbarDropdown === 'features' && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <a href="#features" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">All Features</a>
                    <a href="#demo" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Live Demo</a>
                    <a href="#pricing" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Pricing</a>
                    <div className="border-t border-gray-100 my-2"></div>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">For Teachers</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">For Students</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">For Schools</a>
                  </div>
                )}
              </div>

              {/* Solutions Dropdown */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => setNavbarDropdown(navbarDropdown === 'solutions' ? null : 'solutions')}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <span>Solutions</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {navbarDropdown === 'solutions' && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">K-12 Education</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Higher Education</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Corporate Training</a>
                    <div className="border-t border-gray-100 my-2"></div>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Remote Learning</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Hybrid Learning</a>
                  </div>
                )}
              </div>

              {/* Resources Dropdown */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => setNavbarDropdown(navbarDropdown === 'resources' ? null : 'resources')}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <span>Resources</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {navbarDropdown === 'resources' && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <a href="#faq" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">FAQ</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Documentation</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Tutorials</a>
                    <div className="border-t border-gray-100 my-2"></div>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Blog</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Case Studies</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Support</a>
                  </div>
                )}
              </div>

              {/* Language Switcher */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setLanguage('fr')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    language === 'fr' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  FR
                </button>
                <button
                  onClick={() => setLanguage('ar')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    language === 'ar' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  عربي
                </button>
              </div>
              
              {user ? (
                <>
                  <button
                    onClick={handleDashboard}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {t.nav.dashboard}
                  </button>
                  <button
                    onClick={handleProfile}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {t.nav.profile}
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {t.nav.logout}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleLogin}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {t.nav.login}
                  </button>
                  <button
                    onClick={handleGetStarted}
                    className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    {t.nav.getStarted}
                  </button>
                </>
              )}
            </div>

            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-6 py-4 space-y-4">
              <a href="#features" className="block text-gray-600">{t.nav.features}</a>
              <a href="#demo" className="block text-gray-600">{t.nav.demo}</a>
              <a href="#pricing" className="block text-gray-600">{t.nav.pricing}</a>
              <a href="#faq" className="block text-gray-600">{t.nav.faq}</a>
              
              {/* Mobile Language Switcher */}
              <div className="flex items-center space-x-2 py-2">
                <button
                  onClick={() => setLanguage('fr')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    language === 'fr' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  FR
                </button>
                <button
                  onClick={() => setLanguage('ar')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    language === 'ar' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  عربي
                </button>
              </div>
              
              {user ? (
                <>
                  <button
                    onClick={handleDashboard}
                    className="block w-full text-left text-gray-600"
                  >
                    {t.nav.dashboard}
                  </button>
                  <button
                    onClick={handleProfile}
                    className="block w-full text-left text-gray-600"
                  >
                    {t.nav.profile}
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg"
                  >
                    {t.nav.logout}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleLogin}
                    className="block w-full text-left text-gray-600"
                  >
                    {t.nav.login}
                  </button>
                  <button
                    onClick={handleGetStarted}
                    className="w-full bg-black text-white px-4 py-2 rounded-lg"
                  >
                    {t.nav.getStarted}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section with Live Stats */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className={`text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {t.hero.title}
              <br />
              <span className="text-gray-400">{t.hero.subtitle}</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              {t.hero.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                className="bg-black text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
              >
                <span>{t.hero.startTrial}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:border-gray-400 transition-colors">
                {t.hero.watchDemo}
              </button>
            </div>
          </div>

          {/* Live Stats Dashboard (Stripe-style) */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {liveStats.students.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Students Active</div>
                <div className="text-xs text-green-600 mt-1">+12% from yesterday</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {liveStats.teachers}
                </div>
                <div className="text-sm text-gray-600">Teachers Online</div>
                <div className="text-xs text-green-600 mt-1">+5% from yesterday</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {liveStats.schools}
                </div>
                <div className="text-sm text-gray-600">Schools Connected</div>
                <div className="text-xs text-green-600 mt-1">+2 this week</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {liveStats.gamesPlayed.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Games Played</div>
                <div className="text-xs text-green-600 mt-1">+18% from yesterday</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Features Section (Stripe-style) */}
      <section id="features" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.features.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t.features.subtitle}
            </p>
          </div>
          
          {/* Interactive Feature Tabs */}
          <div className="mb-12">
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {demoContent.map((demo, index) => (
                <button
                  key={demo.id}
                  onClick={() => setActiveDemo(index)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    activeDemo === index
                      ? 'bg-black text-white shadow-lg'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {demo.title}
                </button>
              ))}
            </div>

            {/* Active Demo Display */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
                      {demoContent[activeDemo].id === 'teacher-dashboard' && <Users className="w-6 h-6" />}
                      {demoContent[activeDemo].id === 'student-game' && <Gamepad2 className="w-6 h-6" />}
                      {demoContent[activeDemo].id === 'analytics' && <BarChart3 className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{demoContent[activeDemo].title}</h3>
                      <p className="text-gray-600">{demoContent[activeDemo].description}</p>
                    </div>
                  </div>
                  
                  {/* Live Stats for Active Demo */}
                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-3xl font-bold text-gray-900">
                          {demoContent[activeDemo].stats.value.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">{demoContent[activeDemo].stats.label}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          {demoContent[activeDemo].stats.change}
                        </div>
                        <div className="text-xs text-gray-500">vs yesterday</div>
                      </div>
                    </div>
                  </div>

                  {/* Feature List */}
                  <div className="space-y-3">
                    {demoContent[activeDemo].features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Demo Image/Video Placeholder */}
                <div className="relative">
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Play className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="text-gray-600 font-medium">Demo: {demoContent[activeDemo].title}</p>
                      <p className="text-sm text-gray-500 mt-2">Asset: {assets.screenshots.teacherDashboard}</p>
                    </div>
                  </div>
                  
                  {/* Overlay Stats */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                    <div className="text-xs text-gray-600">Live Demo</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {demoContent[activeDemo].stats.value.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3D Interactive Learning Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                3D Interactive Learning
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Bring complex concepts to life with immersive 3D visualizations. 
                From molecular structures to historical artifacts, make abstract ideas tangible.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Interactive 3D models</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Real-time manipulation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Cross-platform support</span>
                </div>
              </div>
            </div>
            <div className="h-96 bg-gray-50 rounded-2xl">
              <div ref={threeRef} className="w-full h-full rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Linear/Notion Style Screenshots Gallery */}
      <section id="demo" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              See it in action
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real screenshots from real classrooms. Experience the platform through the eyes of teachers, students, and administrators.
            </p>
          </div>
          
          {/* Screenshot Navigation Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {screenshotGallery.map((screenshot, index) => (
              <button
                key={screenshot.id}
                onClick={() => setActiveScreenshot(index)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeScreenshot === index
                    ? 'bg-black text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {screenshot.title}
              </button>
            ))}
          </div>

          {/* Main Screenshot Display */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Screenshot Image */}
              <div className="relative bg-gray-100 min-h-[500px] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      {screenshotGallery[activeScreenshot].id === 'teacher-dashboard' && <Monitor className="w-12 h-12 text-gray-600" />}
                      {screenshotGallery[activeScreenshot].id === 'student-game' && <Gamepad2 className="w-12 h-12 text-gray-600" />}
                      {screenshotGallery[activeScreenshot].id === 'analytics' && <BarChart3 className="w-12 h-12 text-gray-600" />}
                      {screenshotGallery[activeScreenshot].id === 'mobile-app' && <Smartphone className="w-12 h-12 text-gray-600" />}
                      {screenshotGallery[activeScreenshot].id === 'class-management' && <Users className="w-12 h-12 text-gray-600" />}
                      {screenshotGallery[activeScreenshot].id === 'parent-portal' && <UserCheck className="w-12 h-12 text-gray-600" />}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {screenshotGallery[activeScreenshot].title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {screenshotGallery[activeScreenshot].description}
                    </p>
                    <div className="text-sm text-gray-500">
                      Asset: {screenshotGallery[activeScreenshot].image}
                    </div>
                  </div>
                </div>
                
                {/* Live Stats Overlay */}
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
                  <div className="text-xs text-gray-600 mb-1">Live Stats</div>
                  <div className="text-lg font-bold text-gray-900">
                    {Object.entries(screenshotGallery[activeScreenshot].stats).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        {key}: {value}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Screenshot Details */}
              <div className="p-8">
                <div className="mb-6">
                  <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
                    {screenshotGallery[activeScreenshot].category}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {screenshotGallery[activeScreenshot].title}
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {screenshotGallery[activeScreenshot].description}
                  </p>
                </div>

                {/* Feature List */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                  <div className="space-y-3">
                    {screenshotGallery[activeScreenshot].features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(screenshotGallery[activeScreenshot].stats).map(([key, value]) => (
                    <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{value}</div>
                      <div className="text-sm text-gray-600 capitalize">{key}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Screenshot Thumbnails */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {screenshotGallery.map((screenshot, index) => (
              <button
                key={screenshot.id}
                onClick={() => setActiveScreenshot(index)}
                className={`relative rounded-lg overflow-hidden transition-all duration-300 ${
                  activeScreenshot === index
                    ? 'ring-2 ring-black shadow-lg'
                    : 'hover:shadow-md'
                }`}
              >
                <div className="aspect-video bg-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    {screenshot.id === 'teacher-dashboard' && <Monitor className="w-8 h-8 text-gray-500 mx-auto mb-2" />}
                    {screenshot.id === 'student-game' && <Gamepad2 className="w-8 h-8 text-gray-500 mx-auto mb-2" />}
                    {screenshot.id === 'analytics' && <BarChart3 className="w-8 h-8 text-gray-500 mx-auto mb-2" />}
                    {screenshot.id === 'mobile-app' && <Smartphone className="w-8 h-8 text-gray-500 mx-auto mb-2" />}
                    {screenshot.id === 'class-management' && <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />}
                    {screenshot.id === 'parent-portal' && <UserCheck className="w-8 h-8 text-gray-500 mx-auto mb-2" />}
                    <div className="text-xs text-gray-600">{screenshot.title}</div>
                  </div>
                </div>
                {activeScreenshot === index && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple pricing
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Start free, scale as you grow
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <p className="text-gray-600 mb-6">Perfect for trying out</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">$0</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm">Up to 30 students</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm">Basic features</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm">Email support</span>
                </li>
              </ul>
              <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:border-gray-400 transition-colors">
                Start Free
              </button>
            </div>

            <div className="bg-black rounded-2xl p-8 text-white relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-medium">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-gray-300 mb-6">For growing schools</p>
              <div className="text-4xl font-bold mb-6">$9<span className="text-lg text-gray-300">/student/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  <span className="text-sm">Unlimited students</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  <span className="text-sm">All features including 3D</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  <span className="text-sm">Priority support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  <span className="text-sm">Advanced analytics</span>
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full bg-white text-black py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Start Pro Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About/Mission Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {missionData.title}
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {missionData.description}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {missionData.values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gamification Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.gamification.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t.gamification.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {gamificationFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience Benefits Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.audience.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t.audience.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {audienceBenefits.map((audience, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className={`w-16 h-16 bg-gradient-to-br ${audience.color} rounded-2xl flex items-center justify-center text-white mb-6`}>
                  {audience.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{audience.title}</h3>
                <p className="text-gray-600 mb-6">{audience.subtitle}</p>
                <ul className="space-y-3">
                  {audience.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.success.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t.success.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {story.image}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{story.author}</h4>
                    <p className="text-sm text-gray-600">{story.role}</p>
                    <p className="text-xs text-gray-500">{story.school}</p>
                  </div>
                </div>
                <blockquote className="text-gray-700 italic mb-4">
                  "{story.quote}"
                </blockquote>
                <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium inline-block">
                  {story.stats}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.faq.title}
            </h2>
            <p className="text-xl text-gray-600">
              {t.faq.subtitle}
            </p>
          </div>
          
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      faqOpen === index ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
                {faqOpen === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            {t.cta.title}
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            {t.cta.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="bg-white text-black px-8 py-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              {t.cta.getStarted}
            </button>
            <button className="border border-gray-300 text-gray-300 px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors">
              {t.cta.scheduleDemo}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-black font-bold text-sm">M</span>
                </div>
                <span className="font-semibold text-white">MadrassaPlay</span>
              </div>
              <p className="text-gray-400 mb-4">
                Transforming education through interactive learning and innovative technology.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#demo" className="text-gray-400 hover:text-white transition-colors">Demo</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#faq" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Training</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-400">
                  <Mail className="w-4 h-4 mr-2" />
                  <span className="text-sm">support@madrassaplay.com</span>
                </li>
                <li className="flex items-center text-gray-400">
                  <Phone className="w-4 h-4 mr-2" />
                  <span className="text-sm">+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center text-gray-400">
                  <Globe className="w-4 h-4 mr-2" />
                  <span className="text-sm">Available in 15+ languages</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2025 MadrassaPlay. All rights reserved.
              </div>
              <div className="flex items-center space-x-6 text-gray-400 text-sm">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;