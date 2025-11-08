import { documentFunction, sakura } from "../main";

export default class Index {
  /**
   * 注册实时时钟功能
   */
  @documentFunction()
  public registerRealtimeClock() {
    const fallbackWeekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let initialized = false;
    let observer: MutationObserver | null = null;
    let domReadyHandler: (() => void) | null = null;
    let timerId: number | null = null;

    const normalizeWeekDays = (rawWeekDays: unknown): string[] => {
      if (typeof rawWeekDays === "string") {
        const parts = rawWeekDays.split(",").map((item) => item.trim()).filter(Boolean);
        if (parts.length >= fallbackWeekDays.length) {
          return parts.slice(0, fallbackWeekDays.length);
        }
      }
      return fallbackWeekDays;
    };

    const startClock = (clockElement: HTMLDivElement) => {
      if (initialized) {
        return true;
      }
      initialized = true;

      const updateClock = () => {
        const format = clockElement.getAttribute("data-format") || "datetime";
        const use12Hour = clockElement.getAttribute("data-use-12hour") === "true";
        const weekDays = normalizeWeekDays(
          sakura.translate("home.clock.weekdays", fallbackWeekDays.join(","))
        );

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const weekDay = weekDays[now.getDay()] || fallbackWeekDays[now.getDay()];

        // 12小时制处理
        let period = "";
        if (use12Hour) {
          period = hours >= 12 ? " PM" : " AM";
          hours = hours % 12 || 12;
        }
        const hoursStr = String(hours).padStart(2, "0");

        let timeString = "";
        switch (format) {
          case "time":
            timeString = `${hoursStr}:${minutes}:${seconds}${period}`;
            break;
          case "date":
            timeString = `${year}-${month}-${day}`;
            break;
          case "datetime":
            timeString = `${year}-${month}-${day} ${hoursStr}:${minutes}:${seconds}${period}`;
            break;
          case "datetime_week":
            // 根据语言判断格式
            const lang = document.documentElement.lang || "zh";
            if (lang.startsWith("zh")) {
              timeString = `${year}-${month}-${day} 星期${weekDay} ${hoursStr}:${minutes}:${seconds}${period}`;
            } else {
              timeString = `${year}-${month}-${day} ${weekDay} ${hoursStr}:${minutes}:${seconds}${period}`;
            }
            break;
          default:
            timeString = `${year}-${month}-${day} ${hoursStr}:${minutes}:${seconds}${period}`;
        }

        // 更新元素内容和 data-text 属性（用于故障效果）
        clockElement.textContent = timeString;
        clockElement.setAttribute("data-text", timeString);
      };

      // 立即更新一次并启动定时器
      updateClock();
      timerId = window.setInterval(updateClock, 1000);

      const cleanup = () => {
        if (timerId !== null) {
          window.clearInterval(timerId);
          timerId = null;
        }
        window.removeEventListener("sakura:refresh", cleanup);
      };

      window.addEventListener("sakura:refresh", cleanup, { once: true });
      return true;
    };

    const tryInitialize = () => {
      if (initialized) {
        return true;
      }
      const element = document.querySelector(".realtime-clock-glitch") as HTMLDivElement | null;
      if (!element) {
        return false;
      }
      const started = startClock(element);
      if (started && observer) {
        observer.disconnect();
        observer = null;
      }
      if (started && domReadyHandler) {
        document.removeEventListener("DOMContentLoaded", domReadyHandler);
        domReadyHandler = null;
      }
      return started;
    };

    if (tryInitialize()) {
      return;
    }

    domReadyHandler = () => {
      if (tryInitialize()) {
        domReadyHandler = null;
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", domReadyHandler, { once: true });
    } else {
      domReadyHandler();
    }

    if (initialized) {
      return;
    }

    observer = new MutationObserver(() => {
      if (tryInitialize()) {
        observer?.disconnect();
        observer = null;
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // 兜底，避免观察器长期存在
    window.setTimeout(() => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    }, 10000);
  }

  /**
   * 注册下拉箭头功能
   */
  @documentFunction()
  public registerArrowDown() {
    const arrowDownElement = document.querySelector(".headertop-down");
    if (arrowDownElement) {
      import("font-awesome-animation/css/font-awesome-animation.min.css");
    }
    arrowDownElement?.addEventListener("click", () => {
      const contentOffset = document.querySelector(".site-content")?.getBoundingClientRect().top || 0;
      window.scrollTo({
        top: contentOffset + +window.pageYOffset,
        behavior: "smooth",
      });
    });
  }

  /**
   * 注册背景切换事件
   */
  @documentFunction()
  public registerBackgroundChangeEvent() {
    const backgorundElement = document.querySelector(".bg-change-js") as HTMLImageElement;
    if (!backgorundElement) {
      return;
    }
    const backgroundNextBotton = document.getElementById("bg-next");
    const backgroundPrevBotton = document.getElementById("bg-prev");
    const backgroundLoopSize = (sakura.getThemeConfig("random_image", "rimage_cover_back_num", Number) || 0).valueOf();
    backgroundNextBotton?.addEventListener("click", () => {
      let currIndex = Number(backgorundElement.getAttribute("data-currIndex"));
      if (backgroundLoopSize === 0) {
        currIndex = Math.ceil(Math.random() * 99);
      } else {
        currIndex = (currIndex + 1) % backgroundLoopSize;
      }
      handlerChangeBackground(currIndex);
    });

    backgroundPrevBotton?.addEventListener("click", () => {
      let currIndex = Number(backgorundElement.getAttribute("data-currIndex"));
      if (backgroundLoopSize === 0) {
        currIndex = Math.ceil(Math.random() * 99);
      } else {
        currIndex = (currIndex - 1 + backgroundLoopSize) % backgroundLoopSize;
      }
      handlerChangeBackground(currIndex);
    });
    const handlerChangeBackground = (backageImageIndex: number) => {
      const randomUrl = backgorundElement.getAttribute("data-url");
      backgorundElement.src = `${randomUrl}&t=${backageImageIndex}`;
      backgorundElement.setAttribute("data-currIndex", `${backageImageIndex}`);
    };
  }

  /**
   * 注册背景视频功能
   */
  @documentFunction()
  public registerBackgroundVideo() {
    const videoContainerElement = document.querySelector(".video-container");
    if (!videoContainerElement) {
      return;
    }
    videoContainerElement.insertAdjacentElement("afterbegin", document.createElement("video"));
    const videoStatusElement = videoContainerElement.querySelector(".video-status") as HTMLDivElement;
    const focusInfoElement = document.querySelector(".focusinfo") as HTMLDivElement;
    const homeWaveElement = document.querySelector(".home-wave") as HTMLDivElement;
    const videoPlayButtonElement = videoContainerElement.querySelector(".video-play") as HTMLDivElement;
    const videoPauseButtonElement = videoContainerElement.querySelector(".video-pause") as HTMLDivElement;

    let videoPlayer: any = undefined;
    videoPlayButtonElement?.addEventListener("click", async () => {
      videoStatusElement.innerHTML = sakura.translate("home.video.loading", "正在载入视频 ...");
      videoStatusElement.style.bottom = "0";
      import("video.js")
        .then((module: any) => {
          if (videoPlayer) {
            videoPlayer.play();
            return;
          }
          videoPlayer = module.default(videoContainerElement.querySelector("video"), {
            controls: false,
            controlsBar: false,
            children: ["MediaLoader"],
            autoplay: false,
            preload: "auto",
            muted: false,
            loop: false,
            sources: [
              {
                src: sakura.getThemeConfig("mainScreen", "bgvideo_url", String)?.toString(),
              },
            ],
          });

          videoPlayer.on("loadeddata", () => {
            videoStatusElement.style.bottom = "-100px";
            homeWaveElement.style.bottom = "-100px";
            focusInfoElement.style.top = "-999px";
            videoPlayButtonElement.style.display = "none";
            videoPauseButtonElement.style.display = "block";
            videoPlayer.play();
          });

          videoPlayer.on("play", () => {
            videoStatusElement.style.bottom = "-100px";
            homeWaveElement.style.bottom = "-100px";
            focusInfoElement.style.top = "-999px";
            videoPlayButtonElement.style.display = "none";
            videoPauseButtonElement.style.display = "block";
          });

          videoPlayer.on("pause", () => {
            videoStatusElement.innerHTML = sakura.translate("home.video.statu_pause", "已暂停 ...");
            videoStatusElement.style.bottom = "0";
            homeWaveElement.style.bottom = "0";
            focusInfoElement.style.top = "0";
            videoPlayButtonElement.style.display = "block";
            videoPauseButtonElement.style.display = "none";
          });

          videoPlayer.on("waiting", () => {
            videoStatusElement.innerHTML = sakura.translate("home.video.statu_waiting", "加载中 ...");
            videoStatusElement.style.bottom = "0";
          });

          videoPlayer.on("canplay", () => {
            videoStatusElement.style.bottom = "-100px";
          });

          videoPlayer.on("error", () => {
            videoStatusElement.innerHTML = sakura.translate("home.video.statu_error", "视频播放错误");
            setTimeout(() => {
              focusInfoElement.style.top = "0";
              homeWaveElement.style.bottom = "0";
              videoStatusElement.style.bottom = "-100px";
              videoPlayButtonElement.style.display = "block";
              videoPauseButtonElement.style.display = "none";
              videoPlayer.dispose();
              videoPlayer = undefined;
              videoContainerElement.insertAdjacentElement("afterbegin", document.createElement("video"));
            }, 2000);
          });

          videoPlayer.on("ended", () => {
            focusInfoElement.style.top = "0";
            homeWaveElement.style.bottom = "0";
            videoStatusElement.style.bottom = "-100px";
            videoPlayButtonElement.style.display = "block";
            videoPauseButtonElement.style.display = "none";
            videoPlayer.dispose();
            videoPlayer = undefined;
            videoContainerElement.insertAdjacentElement("afterbegin", document.createElement("video"));
          });
        })
        .catch((error) => {
          console.error(error);
          videoStatusElement.innerHTML = sakura.translate("home.video.statu_error", "视频加载失败");
          videoStatusElement.style.bottom = "0";

          setTimeout(() => {
            videoStatusElement.style.bottom = "-100px";
          }, 2000);
        });
    });

    videoPauseButtonElement?.addEventListener("click", () => {
      if (videoPlayer) {
        videoPlayer.pause();
      }
    });
  }
}
