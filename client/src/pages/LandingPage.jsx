import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
// Add these imports at the top
import { useContext, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import '../styles/landing-page.css';
import { 
  Play, 
  Users, 
  BookOpen, 
  BarChart3, 
  Gamepad2,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Mail,
  Phone,
  Globe,
  Facebook,
  Linkedin,
  Instagram,
  Video,
  Star,
  Zap,
  Eye,
  Layers,
  Target,
  TrendingUp,
  Award,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Shield,
  Sparkles
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);
  const [language, setLanguage] = useState('ar'); // Default to Arabic as per PDF
  const [activeStep, setActiveStep] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [liveStats, setLiveStats] = useState({
    students: 1247,
    teachers: 89,
    games: 156,
    models3D: 234
  });
  const threeViewerRef = useRef(null);
  const heroVisualizationRef = useRef(null);
  const heroRef = useRef(null);
  const problemRef = useRef(null);
  const featuresRef = useRef(null);
  const viewer3DRef = useRef(null);
  const howItWorksRef = useRef(null);
  const testimonialsRef = useRef(null);
  const screenshotsRef = useRef(null);
  const audienceRef = useRef(null);
  const ctaRef = useRef(null);

  // Screenshot Gallery Data (from original)
  const screenshotGallery = [
    {
      id: 'teacher-dashboard',
      title: language === 'ar' ? 'لوحة تحكم المعلم' : 'Tableau de bord enseignant',
      description: language === 'ar' ? 'مراقبة الفصل وتتبع تقدم الطلاب في الوقت الفعلي' : 'Surveillance de classe et suivi des progrès en temps réel',
      image: '/assets/asset-1.png',
      category: language === 'ar' ? 'إدارة' : 'Gestion',
      stats: { students: 24, classes: 3, progress: '89%' },
      features: [
        language === 'ar' ? 'حالة الطلاب المباشرة' : 'Statut des élèves en direct',
        language === 'ar' ? 'تتبع التقدم' : 'Suivi des progrès',
        language === 'ar' ? 'إدارة الفصل' : 'Gestion de classe'
      ]
    },
    {
      id: 'student-game',
      title: language === 'ar' ? 'تعلم الطالب' : 'Apprentissage étudiant',
      description: language === 'ar' ? 'ألعاب تفاعلية وتجارب تعليمية جذابة' : 'Jeux interactifs et expériences d\'apprentissage engageantes',
      image: '/assets/asset-2.png',
      category: language === 'ar' ? 'تعلم' : 'Apprentissage',
      stats: { games: 15, score: '92%', streak: language === 'ar' ? '7 أيام' : '7 jours' },
      features: [
        language === 'ar' ? 'ألعاب تفاعلية' : 'Jeux interactifs',
        language === 'ar' ? 'تتبع التقدم' : 'Suivi des progrès',
        language === 'ar' ? 'إنجازات' : 'Réalisations'
      ]
    },
    {
      id: 'analytics',
      title: language === 'ar' ? 'لوحة التحليلات' : 'Tableau d\'analyse',
      description: language === 'ar' ? 'رؤى شاملة ومقاييس الأداء' : 'Insights complets et métriques de performance',
      image: '/assets/asset-3.png',
      category: language === 'ar' ? 'رؤى' : 'Insights',
      stats: { improvement: '+18%', engagement: '94%', completion: '87%' },
      features: [
        language === 'ar' ? 'مقاييس الأداء' : 'Métriques de performance',
        language === 'ar' ? 'تحليلات التعلم' : 'Analyses d\'apprentissage',
        language === 'ar' ? 'تقارير التقدم' : 'Rapports de progrès'
      ]
    },
    {
      id: 'mobile-app',
      title: language === 'ar' ? 'تجربة الموبايل' : 'Expérience mobile',
      description: language === 'ar' ? 'تعلم سلس على أي جهاز، في أي مكان' : 'Apprentissage fluide sur tout appareil',
      image: '/assets/asset-4.png',
      category: language === 'ar' ? 'موبايل' : 'Mobile',
      stats: { downloads: '2.1k', rating: '4.8', users: '1.2k' },
      features: [
        language === 'ar' ? 'متعدد المنصات' : 'Multi-plateforme',
        language === 'ar' ? 'وضع عدم الاتصال' : 'Mode hors ligne',
        language === 'ar' ? 'إشعارات فورية' : 'Notifications push'
      ]
    },
    {
      id: 'class-management',
      title: language === 'ar' ? 'إدارة الفصول' : 'Gestion de classe',
      description: language === 'ar' ? 'تنظيم وإدارة فصول متعددة بكفاءة' : 'Organiser et gérer plusieurs classes efficacement',
      image: '/assets/asset-5.png',
      category: language === 'ar' ? 'تنظيم' : 'Organisation',
      stats: { classes: 8, students: 156, attendance: '96%' },
      features: [
        language === 'ar' ? 'تنظيم الفصول' : 'Organisation des classes',
        language === 'ar' ? 'إدارة الطلاب' : 'Gestion des élèves',
        language === 'ar' ? 'تتبع الحضور' : 'Suivi de présence'
      ]
    },
    {
      id: 'finance-management',
      title: language === 'ar' ? 'إدارة المالية' : 'Gestion financière',
      description: language === 'ar' ? 'تتبع مالي شامل وإدارة المدفوعات' : 'Suivi financier complet et gestion des paiements',
      image: '/assets/finance.png',
      category: language === 'ar' ? 'مالية' : 'Finance',
      stats: { payments: 156, revenue: '$12.5k', transactions: 89 },
      features: [
        language === 'ar' ? 'تتبع المدفوعات' : 'Suivi des paiements',
        language === 'ar' ? 'تقارير مالية' : 'Rapports financiers',
        language === 'ar' ? 'تحليلات الإيرادات' : 'Analyses de revenus'
      ]
    },
    {
      id: 'model-3d',
      title: language === 'ar' ? 'إدارة النماذج 3D' : 'Gestion de modèles 3D',
      description: language === 'ar' ? 'نماذج تعليمية ثلاثية الأبعاد تفاعلية ومحتوى تعليمي' : 'Modèles 3D interactifs et contenu éducatif',
      image: '/assets/model-3d.png',
      category: language === 'ar' ? 'تعلم 3D' : 'Apprentissage 3D',
      stats: { models: 45, downloads: 234, engagement: '92%' },
      features: [
        language === 'ar' ? 'مكتبة نماذج 3D' : 'Bibliothèque de modèles 3D',
        language === 'ar' ? 'محتوى تفاعلي' : 'Contenu interactif',
        language === 'ar' ? 'محاكاة تعليمية' : 'Simulations éducatives'
      ]
    }
  ];

  // Auto-increment live stats
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        students: Math.min(prev.students + Math.floor(Math.random() * 3), 5000),
        teachers: Math.min(prev.teachers + Math.floor(Math.random() * 2), 500),
        games: Math.min(prev.games + Math.floor(Math.random() * 1), 300),
        models3D: Math.min(prev.models3D + Math.floor(Math.random() * 2), 1000)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate how it works steps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handle navbar border on scroll
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle section animations
  useEffect(() => {
    const sections = [
      { ref: heroRef, direction: 'left' },
      { ref: problemRef, direction: 'right' },
      { ref: featuresRef, direction: 'left' },
      { ref: viewer3DRef, direction: 'right' },
      { ref: howItWorksRef, direction: 'left' },
      { ref: testimonialsRef, direction: 'right' },
      { ref: screenshotsRef, direction: 'left' },
      { ref: audienceRef, direction: 'right' },
      { ref: ctaRef, direction: 'left' }
    ];
    
    const animatedSections = new Set();
    
    const observers = sections.map((section) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !animatedSections.has(section.ref)) {
              // Find the inner content div and animate only that
              const contentDiv = entry.target.querySelector('.section-content');
              if (contentDiv) {
                contentDiv.style.transition = 'transform 1.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.8s cubic-bezier(0.4, 0, 0.2, 1)';
                contentDiv.style.transform = 'translateX(0)';
                contentDiv.style.opacity = '1';
              }
              animatedSections.add(section.ref);
            }
          });
        },
        { threshold: 0.2 }
      );
      
      if (section.ref.current) {
        // Find and set initial position on content only
        const contentDiv = section.ref.current.querySelector('.section-content');
        if (contentDiv) {
          const initialTransform = section.direction === 'left' ? 'translateX(-50%)' : 'translateX(50%)';
          contentDiv.style.transform = initialTransform;
          contentDiv.style.opacity = '0';
        }
        observer.observe(section.ref.current);
      }
      return observer;
    });

    // Make hero section content visible immediately
    if (heroRef.current) {
      setTimeout(() => {
        const heroContent = heroRef.current.querySelector('.section-content');
        if (heroContent) {
          heroContent.style.transition = 'transform 0.8s ease-out, opacity 0.8s ease-out';
          heroContent.style.transform = 'translateX(0)';
          heroContent.style.opacity = '1';
        }
        animatedSections.add(heroRef);
      }, 100);
    }

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  // Enhanced 3D Viewer - Educational molecule/DNA visualization
  useEffect(() => {
    if (!threeViewerRef.current) return;

    let animationId;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75, 
      threeViewerRef.current.clientWidth / threeViewerRef.current.clientHeight, 
      0.1, 
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(threeViewerRef.current.clientWidth, threeViewerRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0);
    threeViewerRef.current.appendChild(renderer.domElement);

    // Create educational 3D model (DNA-like structure)
    const modelGroup = new THREE.Group();
    
    const sphereGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const materials = [
      new THREE.MeshPhongMaterial({ color: 0x4F46E5, emissive: 0x4F46E5, emissiveIntensity: 0.2 }),
      new THREE.MeshPhongMaterial({ color: 0x06B6D4, emissive: 0x06B6D4, emissiveIntensity: 0.2 }),
      new THREE.MeshPhongMaterial({ color: 0x10B981, emissive: 0x10B981, emissiveIntensity: 0.2 }),
      new THREE.MeshPhongMaterial({ color: 0xF59E0B, emissive: 0xF59E0B, emissiveIntensity: 0.2 })
    ];

    // Create double helix structure
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 6;
      const y = (i / 40) * 5 - 2.5;
      const radius = 1.2;
      
      const sphere1 = new THREE.Mesh(sphereGeometry, materials[i % 4]);
      sphere1.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      modelGroup.add(sphere1);
      
      const sphere2 = new THREE.Mesh(sphereGeometry, materials[(i + 2) % 4]);
      sphere2.position.set(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius);
      modelGroup.add(sphere2);

      // Connect atoms with lines
      if (i % 5 === 0) {
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc, opacity: 0.3, transparent: true });
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
          sphere1.position,
          sphere2.position
        ]);
        const line = new THREE.Line(lineGeometry, lineMaterial);
        modelGroup.add(line);
      }
    }

    scene.add(modelGroup);

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x4F46E5, 1);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x06B6D4, 0.8);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    camera.position.z = 6;

    // Animation with mouse interaction
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      modelGroup.rotation.y += 0.005;
      modelGroup.rotation.x = mouseY * 0.3;
      modelGroup.rotation.y += mouseX * 0.01;
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!threeViewerRef.current) return;
      const width = threeViewerRef.current.clientWidth;
      const height = threeViewerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animationId) cancelAnimationFrame(animationId);
      if (threeViewerRef.current && renderer.domElement) {
        threeViewerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Lightweight Hero Background - CSS Gradient Dots Pattern
  const HeroVisualization = () => {
    return (
      <div className="absolute inset-0 overflow-hidden">
        {/* Dots gradient background using CSS */}
        <div className="absolute inset-0 dots-gradient-bg"></div>

        {/* Subtle floating accent dots */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-2 h-2 bg-white/20 rounded-full animate-float-slow"></div>
          <div className="absolute top-40 right-32 w-1.5 h-1.5 bg-white/15 rounded-full animate-float-medium"></div>
          <div className="absolute bottom-32 left-40 w-2 h-2 bg-white/25 rounded-full animate-float-fast"></div>
          <div className="absolute top-60 left-1/3 w-1.5 h-1.5 bg-white/30 rounded-full animate-float-slow"></div>
          <div className="absolute bottom-40 right-20 w-2 h-2 bg-white/20 rounded-full animate-float-medium"></div>
          <div className="absolute top-32 left-1/2 w-1 h-1 bg-white/25 rounded-full animate-float-fast"></div>
          <div className="absolute bottom-20 left-1/4 w-1.5 h-1.5 bg-white/18 rounded-full animate-float-slow"></div>
          <div className="absolute top-80 right-1/4 w-1 h-1 bg-white/22 rounded-full animate-float-medium"></div>
          <div className="absolute bottom-60 right-1/3 w-2 h-2 bg-white/16 rounded-full animate-float-fast"></div>
          <div className="absolute top-16 right-16 w-1.5 h-1.5 bg-white/28 rounded-full animate-float-slow"></div>
          <div className="absolute bottom-16 left-16 w-1 h-1 bg-white/24 rounded-full animate-float-medium"></div>
          <div className="absolute top-1/2 left-16 w-2 h-2 bg-white/19 rounded-full animate-float-fast"></div>
        </div>
      </div>
    );
  };

  // Translation content matching PDF
  const translations = {
    ar: {
      nav: {
        features: "المميزات",
        how: "كيف يعمل",
        testimonials: "آراء المستخدمين",
        login: "تسجيل الدخول",
        getStarted: "ابدأ الآن",
        dashboard: "لوحة التحكم"
      },
      hero: {
        title: "WajibET - التعليم أصبح أكثر متعة",
        subtitle: "وواقعية مع WajibET",
        description: "منصة تعليمية مبتكرة تجمع بين الألعاب التفاعلية والمجسمات ثلاثية الأبعاد، لتجعل الدروس تجربة مشوقة سواء في الفصل أو من المنزل.",
        startFree: "ابدأ الآن",
        watchDemo: "شاهد العرض التوضيحي"
      },
      problem: {
        title: "لماذا WajibET؟",
        subtitle: "التحديات التي يواجهها التعليم التقليدي وحلولنا المبتكرة",
        issues: [
          "الحصص التقليدية تسبب الملل وقلة التفاعل",
          "الطلاب يحتاجون لطرق جديدة أكثر جذبًا",
          "الأساتذة يبحثون عن أدوات بسيطة وفعالة",
          "صعوبة متابعة تقدم الطلاب بشكل فوري",
          "عدم وجود أدوات تفاعلية للمواد المعقدة"
        ],
        solution: "الحل المبتكر",
        solutionText: "WajibET يجعل التعليم تجربة تفاعلية ممتعة بفضل تقنياتنا المتقدمة:",
        solutionPoints: [
          "ألعاب تعليمية محفزة مع نظام النقاط والشارات",
          "عارض 3D Viewer مدمج يضيف الواقعية للدروس",
          "متابعة فورية لنتائج الطلاب والتقدم",
          "سهولة الاستخدام للمعلمين والطلاب على حد سواء",
          "دعم جميع المواد الدراسية والمستويات التعليمية"
        ],
        stats: {
          engagement: "+85%",
          retention: "+92%",
          satisfaction: "4.8/5"
        }
      },
      features: {
        title: "المزايا الرئيسية",
        subtitle: "كل ما تحتاجه لتحويل التعليم إلى تجربة ممتعة",
        list: [
          {
            title: "مكتبة قوالب ضخمة",
            description: "مكتبة كبيرة من القوالب التعليمية الجاهزة"
          },
          {
            title: "ألعاب تفاعلية",
            description: "ألعاب تفاعلية حضوريًا أو عن بعد"
          },
          {
            title: "تخصيص سهل",
            description: "تخصيص سهل حسب المستوى والمادة"
          },
          {
            title: "3D Viewer مدمج",
            description: "عرض مجسمات ثلاثية الأبعاد (علوم، رياضيات، هندسة…)"
          },
          {
            title: "متابعة فورية",
            description: "متابعة نتائج الطلاب في الوقت الحقيقي"
          }
        ]
      },
      viewer3D: {
        title: "التعلم كما لم تره من قبل",
        subtitle: "3D Viewer داخل WajibET",
        description: "اكتشف الأعضاء البشرية، الأشكال الهندسية، أو الظواهر العلمية في بيئة ثلاثية الأبعاد تفاعلية. الطلاب لا يقرأون فقط… بل يعيشون التجربة!",
        capabilities: [
          "تدوير وتكبير النماذج ثلاثية الأبعاد",
          "استكشاف تفاصيل معقدة بسهولة",
          "مناسب لجميع المواد الدراسية",
          "واجهة بسيطة وسهلة الاستخدام"
        ]
      },
      howItWorks: {
        title: "كيف يعمل WajibET؟",
        subtitle: "أربع خطوات بسيطة لتحويل طريقة التدريس",
        steps: [
          {
            title: "اختر القالب",
            description: "اختر القالب أو اللعبة التعليمية المناسبة"
          },
          {
            title: "أضف النشاط",
            description: "أضف نشاطًا تفاعليًا للطلاب"
          },
          {
            title: "عزز بـ 3D",
            description: "عزز التجربة باستخدام 3D Viewer"
          },
          {
            title: "راقب النتائج",
            description: "راقب النتائج والتقدم مباشرة"
          }
        ]
      },
      testimonials: {
        title: "ماذا يقول المستخدمون؟",
        subtitle: "تجارب حقيقية من معلمين وطلاب",
        list: [
          {
            quote: "طلابي صاروا أكثر حماسًا للدروس",
            author: "أستاذة سارة",
            role: "معلمة علوم"
          },
          {
            quote: "3D Viewer جعل شرح العلوم أسرع وأسهل",
            author: "الأستاذ محمد",
            role: "معلم فيزياء"
          },
          {
            quote: "بسيط جدًا، حتى المعلمين الجدد يقدرون يستخدمونه",
            author: "د. فاطمة",
            role: "مديرة مدرسة"
          }
        ]
      },
      audience: {
        title: "لمن صُمم WajibET؟",
        subtitle: "حلول مصممة لكل فرد في المنظومة التعليمية",
        groups: [
          {
            title: "المدارس والمؤسسات",
            description: "منصة شاملة لإدارة العملية التعليمية"
          },
          {
            title: "الأساتذة",
            description: "أدوات تدريس حديثة وطرق جديدة للشرح"
          },
          {
            title: "التلاميذ", // changed from أولياء التلاميذ
            description: "تدعم التلاميذ خلال مسارهم الدراسي" // changed from دعم تعلم الأبناء من المنزل بسهولة
          }
        ]
      },
      cta: {
        title: "اجعل التعليم أكثر متعة مع WajibET اليوم!",
        subtitle: "ابدأ مجانًا واكتشف الفرق",
        button: "ابدأ الآن",
        demo: "احجز عرضًا توضيحيًا"
      },
      footer: {
        rights: "© EDZ Smart System. جميع الحقوق محفوظة",
        contact: "تواصل معنا"
      }
    },
    fr: {
      nav: {
        features: "Fonctionnalités",
        how: "Comment ça marche",
        testimonials: "Témoignages",
        login: "Connexion",
        getStarted: "Commencer",
        dashboard: "Tableau de bord"
      },
      hero: {
        title: "WajibET - L'éducation devient",
        subtitle: "plus amusante et réaliste avec WajibET",
        description: "Une plateforme éducative innovante qui combine jeux interactifs et modèles 3D pour transformer les cours en une expérience captivante, en classe ou à la maison.",
        startFree: "Commencer maintenant",
        watchDemo: "Voir la démo"
      },
      problem: {
        title: "Pourquoi WajibET ?",
        subtitle: "Les défis de l'éducation traditionnelle et nos solutions innovantes",
        issues: [
          "Les cours traditionnels causent l'ennui et le manque d'interaction",
          "Les élèves ont besoin de méthodes plus attrayantes",
          "Les enseignants cherchent des outils simples et efficaces",
          "Difficulté à suivre les progrès des élèves en temps réel",
          "Absence d'outils interactifs pour les matières complexes"
        ],
        solution: "La solution innovante",
        solutionText: "WajibET rend l'éducation une expérience interactive et amusante grâce à nos technologies avancées :",
        solutionPoints: [
          "Jeux éducatifs motivants avec système de points et badges",
          "Visualiseur 3D intégré qui ajoute du réalisme aux leçons",
          "Suivi instantané des résultats et progrès des élèves",
          "Facilité d'utilisation pour les enseignants et élèves",
          "Support de toutes les matières et niveaux scolaires"
        ],
        stats: {
          engagement: "+85%",
          retention: "+92%",
          satisfaction: "4.8/5"
        }
      },
      features: {
        title: "Fonctionnalités principales",
        subtitle: "Tout ce dont vous avez besoin pour transformer l'éducation",
        list: [
          {
            title: "Grande bibliothèque",
            description: "Large collection de modèles éducatifs prêts à l'emploi"
          },
          {
            title: "Jeux interactifs",
            description: "Jeux interactifs en présentiel ou à distance"
          },
          {
            title: "Personnalisation facile",
            description: "Adaptation simple selon le niveau et la matière"
          },
          {
            title: "Visualiseur 3D intégré",
            description: "Affichage de modèles 3D (sciences, maths, géométrie…)"
          },
          {
            title: "Suivi en temps réel",
            description: "Suivez les résultats des élèves instantanément"
          }
        ]
      },
      viewer3D: {
        title: "L'apprentissage comme vous ne l'avez jamais vu",
        subtitle: "Visualiseur 3D dans WajibET",
        description: "Découvrez les organes humains, les formes géométriques ou les phénomènes scientifiques dans un environnement 3D interactif. Les élèves ne lisent pas seulement… ils vivent l'expérience !",
        capabilities: [
          "Rotation et zoom des modèles 3D",
          "Explorer facilement les détails complexes",
          "Adapté à toutes les matières",
          "Interface simple et facile à utiliser"
        ]
      },
      howItWorks: {
        title: "Comment fonctionne WajibET ?",
        subtitle: "Quatre étapes simples pour transformer l'enseignement",
        steps: [
          {
            title: "Choisissez le modèle",
            description: "Sélectionnez le modèle ou le jeu éducatif approprié"
          },
          {
            title: "Ajoutez l'activité",
            description: "Ajoutez une activité interactive pour les élèves"
          },
          {
            title: "Améliorez avec 3D",
            description: "Enrichissez l'expérience avec le visualiseur 3D"
          },
          {
            title: "Suivez les résultats",
            description: "Surveillez les résultats et les progrès directement"
          }
        ]
      },
      testimonials: {
        title: "Que disent les utilisateurs ?",
        subtitle: "Expériences réelles d'enseignants et d'élèves",
        list: [
          {
            quote: "Mes élèves sont devenus plus enthousiastes pour les cours",
            author: "Professeur Sarah",
            role: "Enseignante de sciences"
          },
          {
            quote: "Le visualiseur 3D a rendu l'explication des sciences plus rapide et facile",
            author: "Professeur Mohamed",
            role: "Enseignant de physique"
          },
          {
            quote: "Très simple, même les nouveaux enseignants peuvent l'utiliser",
            author: "Dr. Fatima",
            role: "Directrice d'école"
          }
        ]
      },
      audience: {
        title: "Pour qui est conçu WajibET ?",
        subtitle: "Des solutions adaptées à chaque membre de la communauté éducative",
        groups: [
          {
            title: "Écoles et institutions",
            description: "Plateforme complète pour gérer le processus éducatif"
          },
          {
            title: "Enseignants",
            description: "Outils d'enseignement modernes et nouvelles méthodes"
          },
          {
            title: "Élèves", // changed for consistency
            description: "Accompagne les élèves tout au long de leur parcours scolaire" // changed for consistency
          }
        ]
      },
      cta: {
        title: "Rendez l'éducation plus amusante avec WajibET aujourd'hui !",
        subtitle: "Commencez gratuitement et découvrez la différence",
        button: "Commencer maintenant",
        demo: "Réserver une démo"
      },
      footer: {
        rights: "© EDZ Smart System. Tous droits réservés",
        contact: "Contactez-nous"
      }
    }
  };

  const t = translations[language];

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

  return (
    <div className={`min-h-screen bg-white ${language === 'ar' ? 'rtl font-arabic' : 'ltr'} md:scroll-smooth overflow-x-hidden md:scroll-snap-y-mandatory`} dir={language === 'ar' ? 'rtl' : 'ltr'} style={{ scrollBehavior: 'smooth' }}>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full bg-white/90 backdrop-blur-lg z-50 transition-transform duration-300 ${hasScrolled ? '-translate-y-full' : 'translate-y-0'} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <span className="font-bold text-xl text-gray-900">WajibET</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8 rtl:space-x-reverse">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                {t.nav.features}
              </a>
              <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                {t.nav.how}
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                {t.nav.testimonials}
              </a>
              
              {/* Language Switcher */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => setLanguage('ar')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    language === 'ar' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  عربي
                </button>
                <button
                  onClick={() => setLanguage('fr')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    language === 'fr' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  FR
                </button>
              </div>
              
              {user ? (
                <>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                  >
                    {t.nav.dashboard}
                  </button>
                  <button
                    onClick={handleGetStarted}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:shadow-lg transition-all font-medium"
                  >
                    {t.nav.getStarted}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleLogin}
                    className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                  >
                    {t.nav.login}
                  </button>
                  <button
                    onClick={handleGetStarted}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:shadow-lg transition-all font-medium"
                  >
                    {t.nav.getStarted}
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-gray-700 hover:text-blue-600 font-medium py-2">
                {t.nav.features}
              </a>
              <a href="#how-it-works" className="block text-gray-700 hover:text-blue-600 font-medium py-2">
                {t.nav.how}
              </a>
              <a href="#testimonials" className="block text-gray-700 hover:text-blue-600 font-medium py-2">
                {t.nav.testimonials}
              </a>
              
              <div className="flex items-center space-x-2 rtl:space-x-reverse py-2">
                <button
                  onClick={() => setLanguage('ar')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 ${
                    language === 'ar' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  عربي
                </button>
                <button
                  onClick={() => setLanguage('fr')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 ${
                    language === 'fr' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  FR
                </button>
              </div>
              
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium"
                >
                  {t.nav.dashboard}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleLogin}
                    className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium"
                  >
                    {t.nav.login}
                  </button>
                  <button
                    onClick={handleGetStarted}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    {t.nav.getStarted}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen md:h-screen pt-24 pb-24 mb-24 flex items-center px-4 sm:px-6 lg:px-8 overflow-hidden md:scroll-snap-align-start">
        {/* Optimized Background Animation */}
        <div className="absolute inset-0">
          <HeroVisualization />
        </div>

        <div className="section-content relative max-w-7xl mx-auto py-8 md:py-0">
          <div className="text-center mb-12">

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {t.hero.title}
              <br />
              <span className="text-indigo-600">
                {t.hero.subtitle}
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              {t.hero.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleGetStarted}
                className="group bg-indigo-600 text-white px-8 py-4 rounded-xl hover:shadow-2xl hover:bg-indigo-700 transition-all duration-300 font-semibold text-lg flex items-center space-x-2 rtl:space-x-reverse"
              >
                <span>{t.hero.startFree}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </button>
              <a 
                href="/tutorial"
                target="_blank"
                rel="noopener noreferrer"
                className="group border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-all font-semibold text-lg flex items-center space-x-2 rtl:space-x-reverse"
              >
                <Play className="w-5 h-5" />
                <span>{t.hero.watchDemo}</span>
              </a>
            </div>
          </div>

          {/* REMOVE: Hero stats grid
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-indigo-600" />
                <span className="text-xs text-green-600 font-medium">+12%</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {liveStats.students.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">{language === 'ar' ? 'طالب نشط' : 'Étudiants actifs'}</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-8 h-8 text-cyan-600" />
                <span className="text-xs text-green-600 font-medium">+8%</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {liveStats.teachers}
              </div>
              <div className="text-sm text-gray-600">{language === 'ar' ? 'معلم' : 'Enseignants'}</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Gamepad2 className="w-8 h-8 text-green-600" />
                <span className="text-xs text-green-600 font-medium">+15%</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {liveStats.games}
              </div>
              <div className="text-sm text-gray-600">{language === 'ar' ? 'لعبة تعليمية' : 'Jeux éducatifs'}</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Layers className="w-8 h-8 text-amber-600" />
                <span className="text-xs text-green-600 font-medium">+20%</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {liveStats.models3D}
              </div>
              <div className="text-sm text-gray-600">{language === 'ar' ? 'مجسم 3D' : 'Modèles 3D'}</div>
            </div>
          </div>
          */}
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section ref={problemRef} className="min-h-screen md:h-screen pt-24 pb-24 mb-24 flex items-center px-4 sm:px-6 lg:px-8 bg-gray-50 md:scroll-snap-align-start">
        <div className="section-content max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t.problem.title}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t.problem.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Problem Side */}
            <div className="space-y-8">
              <div className="bg-red-50 border-l-4 border-red-500 p-8 rounded-r-xl shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4 rtl:ml-4 rtl:mr-0">
                    <X className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-900">{language === 'ar' ? 'التحديات' : 'Les défis'}</h3>
                </div>
                <ul className="space-y-4">
                  {t.problem.issues.map((issue, index) => (
                    <li key={index} className="flex items-start space-x-3 rtl:space-x-reverse text-red-800">
                      <X className="w-5 h-5 flex-shrink-0 mt-1" />
                      <span className="leading-relaxed">{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Problem Statistics */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  {language === 'ar' ? 'إحصائيات المشكلة' : 'Statistiques du problème'}
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-red-600">70%</div>
                    <div className="text-sm text-gray-600">
                      {language === 'ar' ? 'ملل الطلاب' : 'Élèves ennuyés'}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">45%</div>
                    <div className="text-sm text-gray-600">
                      {language === 'ar' ? 'انخفاض التفاعل' : 'Faible interaction'}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">60%</div>
                    <div className="text-sm text-gray-600">
                      {language === 'ar' ? 'صعوبة المتابعة' : 'Suivi difficile'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Solution Side */}
            <div className="space-y-8">
              <div className="bg-green-50 border-l-4 border-green-500 p-8 rounded-r-xl shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4 rtl:ml-4 rtl:mr-0">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-900">{t.problem.solution}</h3>
                </div>
                <ul className="space-y-4">
                  {t.problem.solutionPoints.map((point, index) => (
                    <li key={index} className="flex items-start space-x-3 rtl:space-x-reverse text-green-800">
                      <CheckCircle className="w-5 h-5 flex-shrink-0 mt-1 text-green-600" />
                      <span className="leading-relaxed font-medium">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Solution Statistics */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  {language === 'ar' ? 'نتائج WajibET' : 'Résultats WajibET'}
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{t.problem.stats.engagement}</div>
                    <div className="text-sm text-gray-600">
                      {language === 'ar' ? 'زيادة التفاعل' : 'Interaction +'}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{t.problem.stats.retention}</div>
                    <div className="text-sm text-gray-600">
                      {language === 'ar' ? 'تحسين الاحتفاظ' : 'Rétention +'}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{t.problem.stats.satisfaction}</div>
                    <div className="text-sm text-gray-600">
                      {language === 'ar' ? 'رضا المستخدمين' : 'Satisfaction'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section ref={featuresRef} id="features" className="min-h-screen md:h-screen pt-24 pb-24 mb-24 flex items-center px-4 sm:px-6 lg:px-8 md:scroll-snap-align-start">
        <div className="section-content max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t.features.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t.features.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.features.list.map((feature, index) => (
              <div 
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:border-indigo-200 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {index === 0 && <BookOpen className="w-7 h-7 text-white" />}
                  {index === 1 && <Gamepad2 className="w-7 h-7 text-white" />}
                  {index === 2 && <Target className="w-7 h-7 text-white" />}
                  {index === 3 && <Layers className="w-7 h-7 text-white" />}
                  {index === 4 && <BarChart3 className="w-7 h-7 text-white" />}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3D Viewer Showcase Section */}
      <section ref={viewer3DRef} className="min-h-screen md:h-screen pt-24 pb-24 mb-24 flex items-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white relative overflow-hidden md:scroll-snap-align-start">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        <div className="section-content relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div>
              <div className="inline-block bg-blue-500/20 backdrop-blur-sm text-blue-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
                {t.viewer3D.subtitle}
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 leading-tight">
                {t.viewer3D.title}
              </h2>
              
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                {t.viewer3D.description}
              </p>

              <div className="space-y-4">
                {t.viewer3D.capabilities.map((capability, index) => (
                  <div key={index} className="flex items-start space-x-3 rtl:space-x-reverse">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <span className="text-blue-100 text-lg">{capability}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleGetStarted}
                className="mt-8 bg-white text-blue-900 px-8 py-4 rounded-xl hover:shadow-2xl transition-all font-semibold text-lg inline-flex items-center space-x-2 rtl:space-x-reverse group"
              >
                <span>{language === 'ar' ? 'جرب 3D Viewer الآن' : 'Essayer le visualiseur 3D'}</span>
                <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* 3D Viewer Demo */}
            <div className="relative">
              <div className="aspect-square bg-white/10 backdrop-blur-sm rounded-3xl p-4 shadow-2xl border border-white/20">
                <div ref={threeViewerRef} className="w-full h-full rounded-2xl" />
              </div>
              
              {/* Floating Info Cards */}
              <div className="absolute -top-6 -right-6 bg-white text-gray-900 px-4 py-3 rounded-xl shadow-lg">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold">{language === 'ar' ? 'تفاعلي 100%' : 'Interactif 100%'}</span>
                </div>
              </div>
              
              {/* REMOVE: 235+ مجسم (floating info card in 3D Viewer section)
              <div className="absolute -bottom-6 -left-6 bg-white text-gray-900 px-4 py-3 rounded-xl shadow-lg">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Eye className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold">{liveStats.models3D}+ {language === 'ar' ? 'مجسم' : 'modèles'}</span>
                </div>
              </div>
              */}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section ref={howItWorksRef} id="how-it-works" className="min-h-screen md:h-screen pt-24 pb-24 mb-24 flex items-center px-4 sm:px-6 lg:px-8 md:scroll-snap-align-start">
        <div className="section-content max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t.howItWorks.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t.howItWorks.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {t.howItWorks.steps.map((step, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl p-8 shadow-lg border-2 transition-all duration-500 ${
                  activeStep === index 
                    ? 'border-indigo-500 shadow-2xl scale-105' 
                    : 'border-gray-100 hover:border-indigo-200'
                }`}
              >
                {/* Step Number */}
                <div className={`absolute -top-4 ${language === 'ar' ? '-right-4' : '-left-4'} w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ${
                  activeStep === index
                    ? 'bg-indigo-600 animate-pulse'
                    : 'bg-gray-400'
                }`}>
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 transition-all ${
                  activeStep === index
                    ? 'bg-indigo-600'
                    : 'bg-gray-100'
                }`}>
                  {index === 0 && <BookOpen className={`w-8 h-8 ${activeStep === index ? 'text-white' : 'text-gray-600'}`} />}
                  {index === 1 && <Target className={`w-8 h-8 ${activeStep === index ? 'text-white' : 'text-gray-600'}`} />}
                  {index === 2 && <Layers className={`w-8 h-8 ${activeStep === index ? 'text-white' : 'text-gray-600'}`} />}
                  {index === 3 && <TrendingUp className={`w-8 h-8 ${activeStep === index ? 'text-white' : 'text-gray-600'}`} />}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>

                {/* Progress Indicator */}
                {activeStep === index && (
                  <div className="mt-6 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 animate-pulse"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center mt-12 space-x-3 rtl:space-x-reverse">
            {t.howItWorks.steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  activeStep === index
                    ? 'bg-indigo-600 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section ref={testimonialsRef} id="testimonials" className="min-h-screen md:h-screen pt-24 pb-24 mb-24 flex items-center px-4 sm:px-6 lg:px-8 bg-gray-50 md:scroll-snap-align-start">
        <div className="section-content max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t.testimonials.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t.testimonials.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.testimonials.list.map((testimonial, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-8 shadow-lg border-2 transition-all duration-500 ${
                  activeTestimonial === index
                    ? 'border-indigo-500 shadow-2xl scale-105'
                    : 'border-gray-100 hover:border-indigo-200'
                }`}
              >
                {/* Quote Icon */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex space-x-1 rtl:space-x-reverse">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <MessageSquare className="w-8 h-8 text-indigo-500 opacity-30" />
                </div>

                <blockquote className="text-gray-700 text-lg mb-6 leading-relaxed italic">
                  "{testimonial.quote}"
                </blockquote>

                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial Indicators */}
          <div className="flex justify-center mt-12 space-x-3 rtl:space-x-reverse">
            {t.testimonials.list.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  activeTestimonial === index
                    ? 'bg-indigo-600 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`View testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>
      <section ref={screenshotsRef} className="min-h-screen pt-24 pb-24 mb-24 flex items-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-900 via-gray-900 to-gray-900 text-white relative overflow-hidden md:scroll-snap-align-start">
        <div className="section-content max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-whitesmoke mb-4">
              {language === 'ar' ? 'شاهد المنصة في العمل' : 'Voir la plateforme en action'}
            </h2>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto">
              {language === 'ar' 
                ? 'لقطات حقيقية من فصول دراسية حقيقية. اختبر المنصة من خلال عيون المعلمين والطلاب والإداريين'
                : 'Captures réelles de vraies salles de classe. Découvrez la plateforme à travers les yeux des enseignants, étudiants et administrateurs'
              }
            </p>
          </div>
          
          {/* Screenshot Navigation Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {screenshotGallery.map((screenshot, index) => (
              <button
                key={screenshot.id}
                onClick={() => setActiveScreenshot(index)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeScreenshot === index
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white/10 backdrop-blur-sm text-gray-200 hover:bg-white/20 border border-white/20'
                }`}
              >
                {screenshot.title}
              </button>
            ))}
          </div>

          {/* Main Screenshot Display */}
          <div className="relative">
            {/* Navigation Arrows */}
            <button
              onClick={() => setActiveScreenshot(prev => (prev - 1 + screenshotGallery.length) % screenshotGallery.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all duration-300"
              aria-label="Previous screenshot"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <button
              onClick={() => setActiveScreenshot(prev => (prev + 1) % screenshotGallery.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all duration-300"
              aria-label="Next screenshot"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Screenshot Image */}
              <div className="relative bg-gray-100 min-h-[400px] lg:min-h-[600px] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <div className="w-full h-full flex items-center justify-center p-6 lg:p-8">
                    <img 
                      src={screenshotGallery[activeScreenshot].image} 
                      alt={screenshotGallery[activeScreenshot].title}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    {/* Fallback placeholder */}
                    <div className="text-center hidden">
                      <div className="w-24 h-24 bg-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        {activeScreenshot === 0 && <Users className="w-12 h-12 text-gray-600" />}
                        {activeScreenshot === 1 && <Gamepad2 className="w-12 h-12 text-gray-600" />}
                        {activeScreenshot === 2 && <BarChart3 className="w-12 h-12 text-gray-600" />}
                        {activeScreenshot === 3 && <Users className="w-12 h-12 text-gray-600" />}
                        {activeScreenshot === 4 && <Users className="w-12 h-12 text-gray-600" />}
                        {activeScreenshot === 5 && <BarChart3 className="w-12 h-12 text-gray-600" />}
                        {activeScreenshot === 6 && <Layers className="w-12 h-12 text-gray-600" />}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {screenshotGallery[activeScreenshot].title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {screenshotGallery[activeScreenshot].description}
                      </p>
                      <div className="text-sm text-gray-500">
                        {language === 'ar' ? 'ملف' : 'Fichier'}: {screenshotGallery[activeScreenshot].image}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Screenshot Details */}
              <div className="p-6 lg:p-10">
                <div className="mb-6">
                  <div className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
                    {screenshotGallery[activeScreenshot].category}
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                    {screenshotGallery[activeScreenshot].title}
                  </h3>
                  <p className="text-gray-600 text-base lg:text-lg leading-relaxed">
                    {screenshotGallery[activeScreenshot].description}
                  </p>
                </div>

                {/* Feature List */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    {language === 'ar' ? 'الميزات الرئيسية' : 'Fonctionnalités clés'}
                  </h4>
                  <div className="space-y-3">
                    {screenshotGallery[activeScreenshot].features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3 rtl:space-x-reverse">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 text-sm lg:text-base">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 lg:gap-4">
                  {Object.entries(screenshotGallery[activeScreenshot].stats).map(([key, value]) => (
                    <div key={key} className="text-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                      <div className="text-xl lg:text-2xl font-bold text-gray-900">{value}</div>
                      <div className="text-xs lg:text-sm text-gray-600 capitalize">{key}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Screenshot Thumbnails */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {screenshotGallery.map((screenshot, index) => (
              <button
                key={screenshot.id}
                onClick={() => setActiveScreenshot(index)}
                className={`relative rounded-lg overflow-hidden transition-all duration-300 ${
                  activeScreenshot === index
                    ? 'ring-2 ring-indigo-600 shadow-lg scale-100'
                    : 'hover:shadow-md scale-50 opacity-40'
                }`}
              >
                <div className="aspect-video bg-gray-200 flex items-center justify-center overflow-hidden">
                  <img 
                    src={screenshot.image} 
                    alt={screenshot.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  {/* Fallback icon */}
                  <div className="text-center hidden w-full h-full items-center justify-center bg-gray-100">
                    {index === 0 && <Users className="w-8 h-8 text-gray-500" />}
                    {index === 1 && <Gamepad2 className="w-8 h-8 text-gray-500" />}
                    {index === 2 && <BarChart3 className="w-8 h-8 text-gray-500" />}
                    {index === 3 && <Users className="w-8 h-8 text-gray-500" />}
                    {index === 4 && <Users className="w-8 h-8 text-gray-500" />}
                    {index === 5 && <BarChart3 className="w-8 h-8 text-gray-500" />}
                    {index === 6 && <Layers className="w-8 h-8 text-gray-500" />}
                  </div>
                </div>
                {activeScreenshot === index && (
                  <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>
      {/* Audience Section */}
      <section ref={audienceRef} className="min-h-screen md:h-screen pt-24 pb-24 mb-24 flex items-center px-4 sm:px-6 lg:px-8 md:scroll-snap-align-start">
        <div className="section-content max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t.audience.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t.audience.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.audience.groups.map((group, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-10 shadow-lg border border-gray-100 hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 text-center"
              >
                <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  {index === 0 && <Shield className="w-10 h-10 text-white" />}
                  {index === 1 && <Users className="w-10 h-10 text-white" />}
                  {index === 2 && <Users className="w-10 h-10 text-white" />}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{group.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{group.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section ref={ctaRef} className="min-h-screen md:h-screen pt-24 pb-24 mb-24 flex items-center px-4 sm:px-6 lg:px-8 bg-indigo-600 text-white md:scroll-snap-align-start">
        <div className="section-content max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
            {t.cta.title}
          </h2>
          <p className="text-xl text-indigo-100 mb-10">
            {t.cta.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="group bg-white text-indigo-600 px-10 py-5 rounded-xl hover:shadow-2xl transition-all duration-300 font-bold text-lg inline-flex items-center justify-center space-x-3 rtl:space-x-reverse"
            >
              <span>{t.cta.button}</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </button>
            <button className="border-2 border-white text-white px-10 py-5 rounded-xl hover:bg-white hover:text-indigo-600 transition-all font-bold text-lg inline-flex items-center justify-center space-x-3 rtl:space-x-reverse">
              <Clock className="w-6 h-6" />
              <span>{t.cta.demo}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">W</span>
                </div>
                <span className="font-bold text-2xl">WajibET</span>
              </div>
              <p className="text-gray-400 text-lg mb-6 leading-relaxed max-w-md">
                {language === 'ar'
                  ? 'منصة تعليمية مبتكرة تجمع بين الألعاب التفاعلية والمجسمات ثلاثية الأبعاد'
                  : 'Plateforme éducative innovante combinant jeux interactifs et modèles 3D'
                }
              </p>
              <div className="mb-6">
                <img
                  src="/assets/qr-code.png"
                  alt="QR Code"
                  className="w-24 h-24 rounded-lg border border-gray-600"
                />
              </div>
              <div className="flex space-x-4 rtl:space-x-reverse">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-indigo-600 transition-colors" aria-label="Facebook">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-indigo-600 transition-colors" aria-label="Instagram">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-indigo-600 transition-colors" aria-label="TikTok">
                  <Video className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-lg mb-4">{t.footer.contact}</h4>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3 rtl:space-x-reverse text-gray-400 hover:text-white transition-colors">
                  <Mail className="w-5 h-5" />
                  <span className="text-sm">edz_smartsystem@gmail.com</span>
                </li>
                <li className="flex items-center space-x-3 rtl:space-x-reverse text-gray-400 hover:text-white transition-colors">
                  <Phone className="w-5 h-5" />
                  <span className="text-sm">+213 795 54 44 83</span>
                </li>
                <li className="flex items-center space-x-3 rtl:space-x-reverse text-gray-400 hover:text-white transition-colors">
                  <Globe className="w-5 h-5" />
                  <span className="text-sm">www.wajibet.com</span>
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-lg mb-4">{language === 'ar' ? 'روابط سريعة' : 'Liens rapides'}</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm">{t.nav.features}</a></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors text-sm">{t.nav.how}</a></li>
                <li><a href="#testimonials" className="text-gray-400 hover:text-white transition-colors text-sm">{t.nav.testimonials}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">{language === 'ar' ? 'الدعم الفني' : 'Support technique'}</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-gray-400 text-sm">
                {t.footer.rights}
              </div>
              <div className="flex items-center space-x-6 rtl:space-x-reverse text-gray-400 text-sm">
                <a href="#" className="hover:text-white transition-colors">
                  {language === 'ar' ? 'سياسة الخصوصية' : 'Politique de confidentialité'}
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  {language === 'ar' ? 'الشروط والأحكام' : 'Conditions d\'utilisation'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};


export default LandingPage;