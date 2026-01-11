/**
 * 首屏滚动吸附效果
 * 当下滑超过阈值时自动滑到内容区域，否则返回首屏
 */

import { sakura } from "../main";

export class ScrollSnapEffect {
  private threshold: number = 0.5; // 滚动阈值（首屏高度的50%）
  private isSnapping: boolean = false;
  private headerTop: HTMLElement | null = null;
  private siteContent: HTMLElement | null = null;
  private headerHeight: number = 0;
  private scrollTimeout: number | null = null;

  constructor(thresholdRatio: number = 0.3) {
    this.threshold = thresholdRatio;
  }

  public init(): void {
    this.headerTop = document.querySelector('.headertop');
    this.siteContent = document.querySelector('.site-content');

    // 只有当首屏和内容区域都存在时才启用
    if (!this.headerTop || !this.siteContent) {
      console.log('ScrollSnap: Elements not found, skipping', { 
        headerTop: !!this.headerTop, 
        siteContent: !!this.siteContent,
        currentPage: document.body.className
      });
      return;
    }

    this.headerHeight = this.headerTop.offsetHeight;
    
    // 确保首屏有足够的高度（至少200px才启用吸附）
    if (this.headerHeight < 200) {
      console.log('ScrollSnap: Header too short, skipping', { headerHeight: this.headerHeight });
      return;
    }
    
    console.log('ScrollSnap: Initialized successfully', { 
      headerHeight: this.headerHeight, 
      threshold: this.threshold,
      thresholdPoint: this.headerHeight * this.threshold,
      currentPage: document.body.className
    });
    
    this.bindEvents();
  }

  private bindEvents(): void {
    // 监听滚动
    window.addEventListener('scroll', () => {
      if (this.isSnapping) return;

      const currentScroll = window.pageYOffset;

      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }

      // 只有在首屏范围内才触发吸附判断
      if (currentScroll < this.headerHeight) {
        this.scrollTimeout = window.setTimeout(() => {
          this.handleScrollEnd();
        }, 100); // 缩短延迟，更快响应
      }
    }, { passive: true });

    // 监听窗口大小变化，更新首屏高度
    window.addEventListener('resize', () => {
      if (this.headerTop) {
        const oldHeight = this.headerHeight;
        this.headerHeight = this.headerTop.offsetHeight;
        console.log('ScrollSnap: Window resized', { oldHeight, newHeight: this.headerHeight });
      }
    });
  }

  private handleScrollEnd(): void {
    const currentScroll = window.pageYOffset;
    const thresholdPoint = this.headerHeight * this.threshold;

    console.log('ScrollSnap: Handling scroll end', { 
      currentScroll, 
      thresholdPoint,
      headerHeight: this.headerHeight,
      shouldSnapDown: currentScroll > thresholdPoint,
      shouldSnapUp: currentScroll <= thresholdPoint && currentScroll > 0
    });

    // 在首屏区域内才进行吸附
    if (currentScroll > 0 && currentScroll < this.headerHeight) {
      if (currentScroll > thresholdPoint) {
        // 超过阈值，滚动到内容区域
        console.log('ScrollSnap: Snapping DOWN to content');
        this.snapToContent();
      } else if (currentScroll > 10) { // 至少滚动10px才触发返回顶部
        // 未超过阈值，返回顶部
        console.log('ScrollSnap: Snapping UP to top');
        this.snapToTop();
      }
    }
  }

  private snapToTop(): void {
    if (this.isSnapping) return;
    
    this.isSnapping = true;
    console.log('ScrollSnap: Executing snap to top');
    
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    // 动画结束后重置标志
    setTimeout(() => {
      this.isSnapping = false;
      console.log('ScrollSnap: Snap to top complete');
    }, 600);
  }

  private snapToContent(): void {
    if (!this.siteContent || this.isSnapping) return;

    this.isSnapping = true;
    const contentOffset = this.siteContent.getBoundingClientRect().top + window.pageYOffset;
    
    console.log('ScrollSnap: Executing snap to content', { contentOffset });
    
    window.scrollTo({
      top: contentOffset,
      behavior: 'smooth'
    });

    // 动画结束后重置标志
    setTimeout(() => {
      this.isSnapping = false;
      console.log('ScrollSnap: Snap to content complete');
    }, 600);
  }

  public updateThreshold(ratio: number): void {
    this.threshold = Math.max(0.1, Math.min(0.9, ratio));
  }

  public destroy(): void {
    // 清理事件监听（如果需要）
  }
}

/**
 * 注册滚动吸附效果
 */
export function registerScrollSnap(): void {
  // 检查配置是否开启
  const enableScrollSnap = sakura.getThemeConfig("mainScreen", "focus_scroll_snap", Boolean);
  const enableFullScreen = sakura.getThemeConfig("mainScreen", "focus_height", Boolean);
  const enableHeadFocus = sakura.getThemeConfig("mainScreen", "head_focus", Boolean);
  
  console.log('ScrollSnap: Configuration check', {
    enableScrollSnap: enableScrollSnap?.valueOf(),
    enableFullScreen: enableFullScreen?.valueOf(),
    enableHeadFocus: enableHeadFocus?.valueOf()
  });
  
  if (!enableScrollSnap || !enableScrollSnap.valueOf() || 
      !enableFullScreen || !enableFullScreen.valueOf() ||
      !enableHeadFocus || !enableHeadFocus.valueOf()) {
    console.log('ScrollSnap: Disabled by configuration');
    return;
  }

  // 等待DOM加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('ScrollSnap: DOM loaded, initializing...');
      const scrollSnap = new ScrollSnapEffect(0.3);
      scrollSnap.init();
    });
  } else {
    console.log('ScrollSnap: DOM already loaded, initializing...');
    // 延迟初始化，确保首屏已渲染
    setTimeout(() => {
      const scrollSnap = new ScrollSnapEffect(0.3);
      scrollSnap.init();
    }, 500);
  }
}
