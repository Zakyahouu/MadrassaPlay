import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
// Add these imports at the top
import { useContext, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/layout/LanguageSwitcher';
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
  const { t: globalT, language, isRTL } = useLanguage();
  const t = globalT.landingPage || { nav: {}, hero: {}, problem: {}, features: {}, viewer3D: {}, howItWorks: {}, testimonials: {}, audience: {}, cta: {}, footer: {}, screenshots: [] };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeScreenshot, setActiveScreenshot] = useState(0);
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

  // Screenshot Gallery Configuration
  const screenshotImages = [
    '/assets/asset-1.png',
    '/assets/asset-2.png',
    '/assets/asset-3.png',
    '/assets/asset-4.png',
    '/assets/asset-5.png',
    '/assets/finance.png',
    '/assets/model-3d.png'
  ];

  const screenshotIds = [
    'teacher-dashboard',
    'student-game',
    'analytics',
    'mobile-app',
    'class-management',
    'finance-management',
    'model-3d'
  ];

  const screenshotsData = t.screenshots || [];
  const screenshotGallery = screenshotsData.map((item, index) => ({
    ...item,
    id: screenshotIds[index] || `screenshot-${index}`,
    image: screenshotImages[index] || '/assets/asset-1.png'
  }));

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

  // Removed on-scroll navbar animation

  // Removed on-scroll section animations

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
      <nav className={`fixed top-0 w-full bg-white/90 backdrop-blur-lg z-50 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <img
                src="/assets/Wajibet.png"
                alt="wajibET logo"
                className="w-10 h-10 rounded-xl object-cover shadow-lg"
              />
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
                <LanguageSwitcher />
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 ${language === 'ar' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                >
                  عربي
                </button>
                <button
                  onClick={() => setLanguage('fr')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 ${language === 'fr' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
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
                  {t.wajibetResults}
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{t.problem.stats.engagement}</div>
                    <div className="text-sm text-gray-600">
                      {t.increasedInteraction}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{t.problem.stats.retention}</div>
                    <div className="text-sm text-gray-600">
                      {t.improvedRetention}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{t.problem.stats.satisfaction}</div>
                    <div className="text-sm text-gray-600">
                      {t.userSatisfaction}
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
                <span>{t.tryViewerNow}</span>
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
                  <span className="font-semibold">{t.interactive100}</span>
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
                className={`relative bg-white rounded-2xl p-8 shadow-lg border-2 transition-all duration-500 ${activeStep === index
                  ? 'border-indigo-500 shadow-2xl scale-105'
                  : 'border-gray-100 hover:border-indigo-200'
                  }`}
              >
                {/* Step Number */}
                <div className={`absolute -top-4 ${isRTL ? '-right-4' : '-left-4'} w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ${activeStep === index
                  ? 'bg-indigo-600 animate-pulse'
                  : 'bg-gray-400'
                  }`}>
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 transition-all ${activeStep === index
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
                className={`w-3 h-3 rounded-full transition-all ${activeStep === index
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
                className={`bg-white rounded-2xl p-8 shadow-lg border-2 transition-all duration-500 ${activeTestimonial === index
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
                className={`w-3 h-3 rounded-full transition-all ${activeTestimonial === index
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
              {t.watchPlatform}
            </h2>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto">
              {t.watchPlatformDesc}
            </p>
          </div>

          {/* Screenshot Navigation Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {screenshotGallery.map((screenshot, index) => (
              <button
                key={screenshot.id}
                onClick={() => setActiveScreenshot(index)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${activeScreenshot === index
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
                          {t.file}: {screenshotGallery[activeScreenshot].image}
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
                      {t.keyFeatures}
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
                className={`relative rounded-lg overflow-hidden transition-all duration-300 ${activeScreenshot === index
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
                <img
                  src="/assets/Wajibet.png"
                  alt="wajibET logo"
                  className="w-12 h-12 rounded-xl object-cover shadow-lg"
                />
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
              <h4 className="font-bold text-lg mb-4">{t.quickLinks}</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm">{t.nav.features}</a></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors text-sm">{t.nav.how}</a></li>
                <li><a href="#testimonials" className="text-gray-400 hover:text-white transition-colors text-sm">{t.nav.testimonials}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">{t.technicalSupport}</a></li>
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
                  {t.privacyPolicy}
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  {t.termsConditions}
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