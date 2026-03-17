import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import { Eye, EyeOff, TrendingUp } from "lucide-react";

const ParticleBackground = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    containerRef.current.appendChild(renderer.domElement);

    const particleCount = 1500;
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.08,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    camera.position.z = 20;

    const animate = () => {
      requestAnimationFrame(animate);

      const positions = geometry.attributes.position.array;

      for (let i = 0; i < particleCount; i++) {
        velocities[i * 3] += (Math.random() - 0.5) * 0.0005;
        velocities[i * 3 + 1] += (Math.random() - 0.5) * 0.0005;
        velocities[i * 3 + 2] += (Math.random() - 0.5) * 0.0005;

        velocities[i * 3] *= 0.99;
        velocities[i * 3 + 1] *= 0.99;
        velocities[i * 3 + 2] *= 0.99;

        positions[i * 3] += velocities[i * 3];
        positions[i * 3 + 1] += velocities[i * 3 + 1];
        positions[i * 3 + 2] += velocities[i * 3 + 2];

        if (positions[i * 3] > 25) positions[i * 3] = -25;
        if (positions[i * 3] < -25) positions[i * 3] = 25;

        if (positions[i * 3 + 1] > 25) positions[i * 3 + 1] = -25;
        if (positions[i * 3 + 1] < -25) positions[i * 3 + 1] = 25;

        if (positions[i * 3 + 2] > 25) positions[i * 3 + 2] = -25;
        if (positions[i * 3 + 2] < -25) positions[i * 3 + 2] = 25;
      }

      geometry.attributes.position.needsUpdate = true;

      particles.rotation.y += 0.0005;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;

      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);

      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }

      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 z-0 bg-[#050505]" />;
};

export default ParticleBackground;