// client/src/components/shared/ThreeJSViewer.jsx
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const ThreeJSViewer = ({ modelUrl, className = "w-full h-96" }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const animationIdRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!mountRef.current || !modelUrl) return;
    
    // Prevent duplicate loading
    if (sceneRef.current && sceneRef.current.children.length > 2) { // More than just ground + fallback cube
      console.log('ThreeJSViewer: Model already loaded, skipping duplicate load');
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75, 
      mountRef.current.clientWidth / mountRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(5, 5, 5);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.autoRotate = false;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Add a ground plane for shadows
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add a fallback cube in case model doesn't load
    const fallbackGeometry = new THREE.BoxGeometry(1, 1, 1);
    const fallbackMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
    const fallbackCube = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
    fallbackCube.position.set(0, 0.5, 0);
    fallbackCube.castShadow = true;
    fallbackCube.name = 'fallback-cube';
    scene.add(fallbackCube);

    // Load model
    if (modelUrl) {
      setLoading(true);
      setError(null);
      setProgress(0);
      
      // Validate URL before loading
      if (!modelUrl || modelUrl === 'undefined' || !modelUrl.startsWith('http')) {
        console.error('ThreeJSViewer: Invalid URL format:', modelUrl);
        setError('Invalid model URL format. Please try refreshing the page.');
        setLoading(false);
        return;
      }
      
      // Set a timeout to detect stuck loading
      const loadingTimeout = setTimeout(() => {
        console.warn('ThreeJSViewer: Model loading timeout after 30 seconds');
        setError('Model loading timeout. The file might be too large or corrupted.');
        setLoading(false);
      }, 30000);
      
      const loader = new GLTFLoader();
      console.log('ThreeJSViewer: Starting to load model from:', modelUrl);
      
      loader.load(
        modelUrl,
        (gltf) => {
          console.log('ThreeJSViewer: Model loaded successfully:', gltf);
          console.log('ThreeJSViewer: GLTF structure:', {
            scene: gltf.scene,
            scenes: gltf.scenes,
            animations: gltf.animations,
            cameras: gltf.cameras,
            asset: gltf.asset
          });
          
          try {
            const model = gltf.scene;
            console.log('ThreeJSViewer: Model scene:', model);
            console.log('ThreeJSViewer: Model children count:', model.children.length);
            console.log('ThreeJSViewer: Model children:', model.children.map(child => ({
              name: child.name,
              type: child.type,
              visible: child.visible
            })));
            
            // Check if model has any meshes
            let meshCount = 0;
            model.traverse((child) => {
              if (child.isMesh) {
                meshCount++;
                console.log('ThreeJSViewer: Found mesh:', {
                  name: child.name || 'unnamed',
                  geometry: child.geometry,
                  material: child.material,
                  visible: child.visible,
                  position: child.position,
                  scale: child.scale
                });
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            
            console.log('ThreeJSViewer: Total meshes found:', meshCount);
            
            if (meshCount === 0) {
              console.warn('ThreeJSViewer: No meshes found in main scene, trying other scenes...');
              
              // Try other scenes if available
              if (gltf.scenes && gltf.scenes.length > 1) {
                for (let i = 0; i < gltf.scenes.length; i++) {
                  const altScene = gltf.scenes[i];
                  console.log(`ThreeJSViewer: Trying scene ${i}:`, altScene);
                  
                  let altMeshCount = 0;
                  altScene.traverse((child) => {
                    if (child.isMesh) {
                      altMeshCount++;
                      console.log('ThreeJSViewer: Found mesh in alt scene:', child.name || 'unnamed');
                      child.castShadow = true;
                      child.receiveShadow = true;
                    }
                  });
                  
                  if (altMeshCount > 0) {
                    console.log(`ThreeJSViewer: Found ${altMeshCount} meshes in scene ${i}, using it instead`);
                    
                    // Mark scene for identification
                    altScene.name = 'loaded-model';
                    scene.add(altScene);
                    
                    // Remove fallback cube
                    const fallbackCube = scene.getObjectByName('fallback-cube');
                    if (fallbackCube) {
                      scene.remove(fallbackCube);
                      console.log('ThreeJSViewer: Removed fallback cube, alt scene loaded successfully');
                    }
                    
                    clearTimeout(loadingTimeout);
                    setLoading(false);
                    return;
                  }
                }
              }
              
              console.warn('ThreeJSViewer: No meshes found in any scene, keeping fallback cube');
              clearTimeout(loadingTimeout);
              setLoading(false);
              return;
            }

            // Calculate bounding box and center the model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            console.log('ThreeJSViewer: Model bounds:', { center, size });
            
            // Check if model has valid bounds
            if (size.x === 0 && size.y === 0 && size.z === 0) {
              console.warn('ThreeJSViewer: Model has zero size, keeping fallback cube');
              clearTimeout(loadingTimeout);
              setLoading(false);
              return;
            }
            
            // Center the model
            model.position.sub(center);
            
            // Scale the model to fit in the view
            const maxDimension = Math.max(size.x, size.y, size.z);
            const scale = maxDimension > 0 ? 3 / maxDimension : 1; // Scale to fit in a 3-unit box
            model.scale.setScalar(scale);
            
            console.log('ThreeJSViewer: Model scaled by:', scale);
            
            // Check if model is already in scene
            const existingModel = scene.getObjectByName('loaded-model');
            if (existingModel) {
              console.log('ThreeJSViewer: Model already exists in scene, skipping add');
              clearTimeout(loadingTimeout);
              setLoading(false);
              return;
            }
            
            // Mark model for identification
            model.name = 'loaded-model';
            scene.add(model);
            
            // Remove fallback cube since model loaded successfully
            const fallbackCube = scene.getObjectByName('fallback-cube');
            if (fallbackCube) {
              scene.remove(fallbackCube);
              console.log('ThreeJSViewer: Removed fallback cube, model loaded successfully');
            }
            
            // Adjust camera to view the model
            const distance = maxDimension > 0 ? maxDimension * 2 : 5;
            camera.position.set(distance, distance, distance);
            controls.target.set(0, 0, 0);
            controls.update();
            
            console.log('ThreeJSViewer: Model added to scene, camera positioned at:', camera.position);
            clearTimeout(loadingTimeout);
            setLoading(false);
          } catch (err) {
            console.error('ThreeJSViewer: Error processing model:', err);
            console.error('ThreeJSViewer: Error stack:', err.stack);
            setError('Error processing 3D model');
            setLoading(false);
          }
        },
        (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          console.log(`ThreeJSViewer: Loading progress: ${percent}% (${progress.loaded}/${progress.total} bytes)`);
          
          setProgress(percent);
          
          // Update loading state with progress
          if (percent < 100) {
            setLoading(true);
          }
        },
        (error) => {
          console.error('ThreeJSViewer: Error loading model:', error);
          console.error('ThreeJSViewer: Error details:', {
            message: error.message,
            url: modelUrl,
            type: error.type
          });
          clearTimeout(loadingTimeout);
          setError(`Failed to load 3D model: ${error.message}`);
          setLoading(false);
        }
      );
    }

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      if (controls) {
        controls.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    // Test controls
    console.log('ThreeJSViewer: Controls initialized:', {
      enableDamping: controls.enableDamping,
      enableZoom: controls.enableZoom,
      enablePan: controls.enablePan,
      enableRotate: controls.enableRotate
    });

    // Add event listeners for debugging
    controls.addEventListener('start', () => console.log('Controls: Start'));
    controls.addEventListener('change', () => console.log('Controls: Change'));
    controls.addEventListener('end', () => console.log('Controls: End'));

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [modelUrl]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mountRef} className="w-full h-full" />
      
      {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading 3D model...</p>
                {progress > 0 && (
                  <div className="mt-2">
                    <div className="w-48 bg-gray-200 rounded-full h-2 mx-auto">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{progress}%</p>
                  </div>
                )}
              </div>
            </div>
          )}
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-75">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-200 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Controls instructions overlay */}
      {!loading && !error && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white text-xs p-2 rounded">
          <div>🖱️ Left click + drag: Rotate</div>
          <div>🖱️ Right click + drag: Pan</div>
          <div>🖱️ Scroll: Zoom</div>
        </div>
      )}
    </div>
  );
};

export default ThreeJSViewer;
