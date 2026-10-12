import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./Ambient3DObject.css";

export default function Ambient3DObject({ className = "" }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch (error) {
      console.error("Unable to initialize the decorative 3D object:", error);
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
    camera.position.z = 4.6;

    const root = new THREE.Group();
    scene.add(root);

    const knotGeometry = new THREE.TorusKnotGeometry(0.78, 0.16, 96, 10, 2, 3);
    const knotMaterial = new THREE.MeshBasicMaterial({
      color: 0x42dce4,
      wireframe: true,
      transparent: true,
      opacity: 0.88,
    });
    root.add(new THREE.Mesh(knotGeometry, knotMaterial));

    const coreGeometry = new THREE.IcosahedronGeometry(0.4, 1);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x8c53ee,
      wireframe: true,
      transparent: true,
      opacity: 0.72,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    root.add(core);

    const orbitGeometry = new THREE.TorusGeometry(1.18, 0.008, 6, 100);
    const orbitMaterial = new THREE.MeshBasicMaterial({
      color: 0xe63ab9,
      transparent: true,
      opacity: 0.64,
    });
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.set(0.86, 0.25, -0.3);
    root.add(orbit);

    const orbitTwoGeometry = new THREE.TorusGeometry(1.34, 0.006, 6, 100);
    const orbitTwoMaterial = new THREE.MeshBasicMaterial({
      color: 0x38a6ee,
      transparent: true,
      opacity: 0.42,
    });
    const orbitTwo = new THREE.Mesh(orbitTwoGeometry, orbitTwoMaterial);
    orbitTwo.rotation.set(-0.65, 0.4, 0.65);
    root.add(orbitTwo);

    const nodeGeometry = new THREE.SphereGeometry(0.055, 12, 12);
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x8ceff1 });
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
    node.position.set(1.05, 0.58, 0.2);
    root.add(node);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.setAttribute("role", "presentation");
    host.appendChild(renderer.domElement);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isInView = true;
    let frameId = 0;
    let resizeObserver;
    const clock = new THREE.Clock();

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };

    const renderFrame = () => {
      if (!isInView || document.hidden) {
        frameId = 0;
        return;
      }
      const time = clock.getElapsedTime();
      if (!reducedMotion.matches) {
        root.rotation.y = time * 0.22;
        root.rotation.x = Math.sin(time * 0.38) * 0.12;
        root.position.y = Math.sin(time * 0.7) * 0.07;
        core.rotation.x = time * 0.25;
        core.rotation.y = -time * 0.34;
        orbit.rotation.z = time * 0.16;
        orbitTwo.rotation.y = -time * 0.13;
      }
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(renderFrame);
    };

    const startAnimation = () => {
      if (!frameId && isInView && !document.hidden && !reducedMotion.matches) {
        frameId = window.requestAnimationFrame(renderFrame);
      } else if (reducedMotion.matches) {
        renderer.render(scene, camera);
      }
    };

    const stopAnimation = () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isInView = entry.isIntersecting;
      if (isInView) startAnimation();
      else stopAnimation();
    });
    visibilityObserver.observe(host);

    const handleVisibilityChange = () => {
      if (document.hidden) stopAnimation();
      else startAnimation();
    };
    const handleMotionChange = () => {
      if (reducedMotion.matches) {
        stopAnimation();
        renderer.render(scene, camera);
      } else {
        startAnimation();
      }
    };

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
    } else {
      window.addEventListener("resize", resize);
    }

    resize();
    startAnimation();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    reducedMotion.addEventListener("change", handleMotionChange);

    return () => {
      stopAnimation();
      visibilityObserver.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reducedMotion.removeEventListener("change", handleMotionChange);
      host.removeChild(renderer.domElement);
      knotGeometry.dispose();
      knotMaterial.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      orbitGeometry.dispose();
      orbitMaterial.dispose();
      orbitTwoGeometry.dispose();
      orbitTwoMaterial.dispose();
      nodeGeometry.dispose();
      nodeMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={`ambient-3d-object ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
