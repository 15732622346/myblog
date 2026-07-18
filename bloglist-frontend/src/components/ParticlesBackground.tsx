import { useCallback, useEffect } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import type { Container, Engine } from "tsparticles-engine";
import { loadLinksPreset } from "tsparticles-preset-links";

const ParticlesBackground = () => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
    await loadLinksPreset(engine);
  }, []);

  const particlesLoaded = useCallback(async (container: Container | undefined) => {
    console.log("粒子背景已加载", container);
    
    // 设置粒子背景的Canvas背景色
    if (container) {
      const canvas = container.canvas.element;
      if (canvas) {
        canvas.style.backgroundColor = "#23a6d5";
        console.log("粒子背景Canvas背景色已设置为: #23a6d5");
      }
    }
  }, []);
  
  // 添加定期检查背景颜色的效果
  useEffect(() => {
    // 定期检查并设置背景色
    const checkInterval = setInterval(() => {
      const tsParticles = document.getElementById('tsparticles');
      if (tsParticles) {
        const canvas = tsParticles.querySelector('canvas');
        if (canvas) {
          const computedStyle = window.getComputedStyle(canvas);
          if (computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)' || 
              computedStyle.backgroundColor === 'rgb(0, 0, 0)') {
            console.log('修复粒子背景Canvas背景色');
            canvas.style.backgroundColor = "#23a6d5";
          }
        }
      }
    }, 1000);
    
    return () => clearInterval(checkInterval);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      loaded={particlesLoaded}
      options={{
        fullScreen: {
          enable: true,
          zIndex: -1
        },
        fpsLimit: 60,
        particles: {
          number: {
            value: 80,
            density: {
              enable: true,
              value_area: 800
            }
          },
          color: {
            value: "#ffffff"
          },
          shape: {
            type: "circle"
          },
          opacity: {
            value: 0.5,
            random: true,
            anim: {
              enable: true,
              speed: 1,
              opacity_min: 0.1,
              sync: false
            }
          },
          size: {
            value: 3,
            random: true,
            anim: {
              enable: true,
              speed: 2,
              size_min: 0.1,
              sync: false
            }
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: "#ffffff",
            opacity: 0.4,
            width: 1
          },
          move: {
            enable: true,
            speed: 1,
            direction: "none",
            random: true,
            straight: false,
            out_mode: "out",
            bounce: false,
            attract: {
              enable: false,
              rotateX: 600,
              rotateY: 1200
            }
          }
        },
        interactivity: {
          detect_on: "window",
          events: {
            onhover: {
              enable: true,
              mode: "grab"
            },
            onclick: {
              enable: true,
              mode: "push"
            },
            resize: true
          },
          modes: {
            grab: {
              distance: 140,
              line_linked: {
                opacity: 1
              }
            },
            bubble: {
              distance: 400,
              size: 40,
              duration: 2,
              opacity: 8,
              speed: 3
            },
            repulse: {
              distance: 200,
              duration: 0.4
            },
            push: {
              particles_nb: 4
            },
            remove: {
              particles_nb: 2
            }
          }
        },
        retina_detect: true,
        background: {
          color: "#23a6d5",
          image: "",
          position: "50% 50%",
          repeat: "no-repeat",
          size: "cover"
        }
      }}
    />
  );
};

export default ParticlesBackground; 