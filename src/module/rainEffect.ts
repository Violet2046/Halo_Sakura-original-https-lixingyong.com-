import { sakura } from "../main";
import * as THREE from "three";
import vertexShader from "../shaders/rain.vert?raw";
import fragmentShader from "../shaders/rain-new.frag?raw";

interface RainConfig {
  dropsCount: number;
  speed: number;
  glassBlur: number;  // 0.0-1.0
}

/**
 * Three.js 玻璃雨滴效果管理器
 */
class RainEffect {
  private container: HTMLElement | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private clock: THREE.Clock | null = null;
  private config: RainConfig;
  private animationId: number | null = null;
  private texture: THREE.Texture | null = null;

  constructor(config: RainConfig) {
    this.config = config;
  }

  public init(): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        // 延迟一点确保主题背景已应用
        setTimeout(() => this.setup(), 300);
      });
    } else {
      // 延迟一点确保主题背景已应用
      setTimeout(() => this.setup(), 300);
    }
  }

  private async setup(): Promise<void> {
    await this.loadTexture();
    await this.createScene();
    this.animate();
  }

  private async loadTexture(): Promise<void> {
    return new Promise((resolve) => {
      // 从 body 的 data-bg-url 属性获取背景图片
      const bodyElement = document.body;
      const bgUrl = bodyElement.getAttribute('data-bg-url') || '';
      
      console.log("Rain effect: Reading background URL from data-bg-url:", bgUrl);

      if (bgUrl) {
        // 加载实际背景图
        const loader = new THREE.TextureLoader();
        console.log("Rain effect: Attempting to load texture from:", bgUrl);
        loader.load(
          bgUrl,
          (loadedTexture) => {
            // 配置纹理以支持mipmap和textureLod
            loadedTexture.generateMipmaps = true;
            loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
            loadedTexture.magFilter = THREE.LinearFilter;
            loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
            loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
            loadedTexture.needsUpdate = true;
            this.texture = loadedTexture;
            console.log("Rain effect: ✓ Successfully loaded background texture");
            resolve();
          },
          undefined,
          (error) => {
            console.warn("Rain effect: ✗ Failed to load background texture:", error);
            console.warn("Rain effect: Using fallback gradient texture");
            this.createFallbackTexture();
            resolve();
          }
        );
      } else {
        console.warn("Rain effect: No data-bg-url attribute found on body");
        console.warn("Rain effect: Using fallback gradient texture");
        this.createFallbackTexture();
        resolve();
      }
    });
  }

  private createFallbackTexture(): void {
    // 创建一个渐变备用纹理
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 512, 512);
      gradient.addColorStop(0, "#87CEEB");  // 天蓝色
      gradient.addColorStop(1, "#F0E68C");  // 淡黄色
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
    }

    const fallbackTexture = new THREE.CanvasTexture(canvas);
    fallbackTexture.generateMipmaps = true;
    fallbackTexture.minFilter = THREE.LinearMipmapLinearFilter;
    fallbackTexture.magFilter = THREE.LinearFilter;
    fallbackTexture.needsUpdate = true;
    
    this.texture = fallbackTexture;
    console.log("Rain effect: Created fallback gradient texture");
  }

  private async createScene(): Promise<void> {
    // 创建容器
    this.container = document.createElement("div");
    this.container.className = "rain-canvas";
    
    // 全屏显示雨滴效果，作为最底层背景
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -9999;
      background-color: var(--background-color, #fff);
    `;
    document.body.appendChild(this.container);

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 创建场景
    this.scene = new THREE.Scene();

    // 创建正交相机
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // 创建渲染器 - 不透明模式，因为我们要渲染完整的背景+雨滴效果
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false  // 不需要透明
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // 创建着色器材质 - 使用纹理采样
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector3(width, height, 1.0) },
        rainAmount: { value: this.config.dropsCount / 150 },
        iChannel0: { value: this.texture }  // 背景纹理
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    });

    // 创建全屏四边形
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(mesh);

    // 创建时钟
    this.clock = new THREE.Clock();

    // 监听窗口大小变化
    window.addEventListener("resize", () => this.onResize());

    console.log("Three.js glass rain effect initialized with background texture");
  }

  private onResize(): void {
    if (!this.renderer || !this.material) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.setSize(width, height);
    this.material.uniforms.iResolution.value.set(width, height, 1.0);
  }

  private animate = (): void => {
    if (!this.scene || !this.camera || !this.renderer || !this.material || !this.clock) {
      return;
    }

    const time = this.clock.getElapsedTime() * (this.config.speed / 5);
    this.material.uniforms.iTime.value = time;

    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(this.animate);
  };

  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    if (this.material) {
      this.material.dispose();
      this.material = null;
    }

    if (this.texture) {
      this.texture.dispose();
      this.texture = null;
    }

    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    this.scene = null;
    this.camera = null;
    this.clock = null;
  }

  public updateConfig(config: Partial<RainConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.material) {
      this.material.uniforms.rainAmount.value = this.config.dropsCount / 150;
      if (config.glassBlur !== undefined) {
        this.material.uniforms.glassBlur.value = this.config.glassBlur;
      }
    }
  }

  public async reloadTexture(): Promise<void> {
    // 释放旧纹理
    if (this.texture) {
      this.texture.dispose();
      this.texture = null;
    }
    
    // 重新加载背景纹理
    await this.loadTexture();
    
    // 更新shader的纹理uniform
    if (this.material && this.texture) {
      this.material.uniforms.iChannel0.value = this.texture;
      this.material.needsUpdate = true;
      console.log("Rain effect: Texture reloaded for theme change");
    }
  }
}

let rainEffectInstance: RainEffect | null = null;

export function registerRainEffect(): void {
  const enableRain = sakura.getThemeConfig("theme", "enable_rain_effect", Boolean);
  
  if (!enableRain || !enableRain.valueOf()) {
    return;
  }

  const dropsCount = sakura.getThemeConfig("theme", "rain_drops_count", Number);
  const speed = sakura.getThemeConfig("theme", "rain_speed", Number);
  
  // 从body的data属性读取当前主题的玻璃模糊强度
  const bodyElement = document.body;
  const dataGlassBlur = bodyElement.getAttribute('data-rain-glass-blur');
  const glassBlur = dataGlassBlur ? parseFloat(dataGlassBlur) : 0.3;

  const config: RainConfig = {
    dropsCount: dropsCount ? dropsCount.valueOf() : 100,
    speed: speed ? speed.valueOf() : 5,
    glassBlur: glassBlur,
  };

  rainEffectInstance = new RainEffect(config);
  rainEffectInstance.init();

  document.addEventListener("sakura:refresh", () => {
    const newEnableRain = sakura.getThemeConfig("theme", "enable_rain_effect", Boolean);
    
    if (newEnableRain && newEnableRain.valueOf()) {
      const newDropsCount = sakura.getThemeConfig("theme", "rain_drops_count", Number);
      const newSpeed = sakura.getThemeConfig("theme", "rain_speed", Number);
      
      // 从body的data属性读取切换后主题的玻璃模糊强度
      const newDataGlassBlur = bodyElement.getAttribute('data-rain-glass-blur');
      const newGlassBlur = newDataGlassBlur ? parseFloat(newDataGlassBlur) : 0.3;
      
      const updatedConfig: RainConfig = {
        dropsCount: newDropsCount ? newDropsCount.valueOf() : 100,
        speed: newSpeed ? newSpeed.valueOf() : 5,
        glassBlur: newGlassBlur,
      };
      
      if (rainEffectInstance) {
        rainEffectInstance.updateConfig(updatedConfig);
        // 主题切换时重新加载背景纹理
        rainEffectInstance.reloadTexture();
      } else {
        rainEffectInstance = new RainEffect(updatedConfig);
        rainEffectInstance.init();
      }
    } else {
      if (rainEffectInstance) {
        rainEffectInstance.destroy();
        rainEffectInstance = null;
      }
    }
  });
}
