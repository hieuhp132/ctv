import { useEffect, useRef } from "react";
import * as THREE from "three";

const EarthObject = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      width / height,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setSize(width, height);

    renderer.setPixelRatio(window.devicePixelRatio);

    containerRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(6.5, 32, 32);

    const textureLoader = new THREE.TextureLoader();

    const earthTexture = textureLoader.load(
      "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
    );

    const bumpMap = textureLoader.load(
      "https://unpkg.com/three-globe/example/img/earth-topology.png"
    );

    const material = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpMap: bumpMap,
      bumpScale: 0.05,
      specular: new THREE.Color("grey"),
      shininess: 5,
    });

    const earth = new THREE.Mesh(geometry, material);

    scene.add(earth);

    const glowGeometry = new THREE.SphereGeometry(6.6, 32, 32);

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x4ca1af,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);

    scene.add(glow);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);

    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);

    sunLight.position.set(5, 3, 5);

    scene.add(sunLight);

    camera.position.z = 14;

    const animate = () => {
      requestAnimationFrame(animate);

      earth.rotation.y += 0.005;

      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current) return;

      const w = containerRef.current.clientWidth;

      const h = containerRef.current.clientHeight;

      camera.aspect = w / h;

      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();

      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }

      geometry.dispose();

      material.dispose();

      glowGeometry.dispose();

      glowMaterial.dispose();

      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default EarthObject;