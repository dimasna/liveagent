(function () {
  // SVG icons
  const phoneIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;

  const closeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  let iframe: HTMLIFrameElement | null = null;
  let container: HTMLDivElement | null = null;
  let button: HTMLButtonElement | null = null;
  let isOpen = false;

  // Derive widget URL from this script's own src
  const currentScript = document.currentScript as HTMLScriptElement;
  const WIDGET_URL = currentScript
    ? currentScript.src.replace(/\/widget\.js(\?.*)?$/, "")
    : window.location.origin;

  // Read configuration from data attributes
  let agentId: string | null = null;
  let position: "bottom-right" | "bottom-left" = "bottom-right";
  let themeColor = "#3b82f6";

  if (currentScript) {
    agentId = currentScript.getAttribute("data-agent-id");
    position =
      (currentScript.getAttribute("data-position") as
        | "bottom-right"
        | "bottom-left") || "bottom-right";
    themeColor =
      currentScript.getAttribute("data-color") || themeColor;
  } else {
    // Fallback: find script tag by src
    const scripts = document.querySelectorAll('script[src*="widget.js"]');
    const embedScript = Array.from(scripts).find((script) =>
      script.hasAttribute("data-agent-id"),
    ) as HTMLScriptElement | undefined;

    if (embedScript) {
      agentId = embedScript.getAttribute("data-agent-id");
      position =
        (embedScript.getAttribute("data-position") as
          | "bottom-right"
          | "bottom-left") || "bottom-right";
      themeColor =
        embedScript.getAttribute("data-color") || themeColor;
    }
  }

  if (!agentId) {
    console.error(
      "LiveAgent Widget: data-agent-id attribute is required on the script tag.",
    );
    return;
  }

  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", render);
    } else {
      render();
    }
  }

  function render() {
    // Inject keyframe styles
    const style = document.createElement("style");
    style.textContent = `
      @keyframes liveagent-btn-pulse {
        0%, 100% { box-shadow: 0 0 0 0 ${themeColor}66; }
        50% { box-shadow: 0 0 0 10px ${themeColor}00; }
      }
    `;
    document.head.appendChild(style);

    // Create floating button
    button = document.createElement("button");
    button.id = "liveagent-widget-button";
    button.innerHTML = phoneIcon;
    button.style.cssText = `
      position: fixed;
      ${position === "bottom-right" ? "right: 20px;" : "left: 20px;"}
      bottom: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${themeColor};
      color: white;
      border: none;
      cursor: pointer;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 24px ${themeColor}40;
      transition: all 0.2s ease;
      animation: liveagent-btn-pulse 2.5s ease-in-out infinite;
    `;

    button.addEventListener("click", toggleWidget);
    button.addEventListener("mouseenter", () => {
      if (button) button.style.transform = "scale(1.08)";
    });
    button.addEventListener("mouseleave", () => {
      if (button) button.style.transform = "scale(1)";
    });

    document.body.appendChild(button);

    // Create widget container (hidden initially)
    container = document.createElement("div");
    container.id = "liveagent-widget-container";
    container.style.cssText = `
      position: fixed;
      ${position === "bottom-right" ? "right: 20px;" : "left: 20px;"}
      bottom: 90px;
      width: 380px;
      height: 580px;
      max-width: calc(100vw - 40px);
      max-height: calc(100vh - 110px);
      z-index: 999998;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
      display: none;
      opacity: 0;
      transform: translateY(12px) scale(0.96);
      transition: opacity 0.25s ease, transform 0.25s ease;
    `;

    // Create iframe
    iframe = document.createElement("iframe");
    iframe.src = buildWidgetUrl();
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      background: white;
    `;
    iframe.allow = "microphone; clipboard-read; clipboard-write";

    container.appendChild(iframe);
    document.body.appendChild(container);

    // Listen for messages from the widget iframe
    window.addEventListener("message", handleMessage);
  }

  function buildWidgetUrl(): string {
    const params = new URLSearchParams();
    if (themeColor !== "#3b82f6") {
      params.set("color", themeColor);
    }
    const qs = params.toString();
    return `${WIDGET_URL}/${agentId}${qs ? "?" + qs : ""}`;
  }

  function handleMessage(event: MessageEvent) {
    if (event.origin !== new URL(WIDGET_URL).origin) return;

    const { type, payload } = event.data || {};

    switch (type) {
      case "liveagent:close":
        hide();
        break;
      case "liveagent:resize":
        if (payload?.height && container) {
          container.style.height = `${payload.height}px`;
        }
        break;
      case "liveagent:call-started":
        if (button) {
          button.style.animation = "none";
          button.style.background = "#22c55e";
        }
        break;
      case "liveagent:call-ended":
        if (button && !isOpen) {
          button.style.animation =
            "liveagent-btn-pulse 2.5s ease-in-out infinite";
          button.style.background = themeColor;
        }
        break;
    }
  }

  function toggleWidget() {
    if (isOpen) {
      hide();
    } else {
      show();
    }
  }

  function show() {
    if (container && button) {
      isOpen = true;
      container.style.display = "block";
      // Trigger reflow then animate in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (container) {
            container.style.opacity = "1";
            container.style.transform = "translateY(0) scale(1)";
          }
        });
      });
      button.innerHTML = closeIcon;
      button.style.animation = "none";
      button.style.background = "#6b7280";
    }
  }

  function hide() {
    if (container && button) {
      isOpen = false;
      container.style.opacity = "0";
      container.style.transform = "translateY(12px) scale(0.96)";
      setTimeout(() => {
        if (container) container.style.display = "none";
      }, 250);
      button.innerHTML = phoneIcon;
      button.style.background = themeColor;
      button.style.animation =
        "liveagent-btn-pulse 2.5s ease-in-out infinite";
    }
  }

  function destroy() {
    window.removeEventListener("message", handleMessage);
    if (container) {
      container.remove();
      container = null;
      iframe = null;
    }
    if (button) {
      button.remove();
      button = null;
    }
    isOpen = false;
  }

  // Expose global API
  (window as any).LiveAgentWidget = {
    show,
    hide,
    destroy,
    init(config: {
      agentId?: string;
      position?: "bottom-right" | "bottom-left";
      color?: string;
    }) {
      destroy();
      if (config.agentId) agentId = config.agentId;
      if (config.position) position = config.position;
      if (config.color) themeColor = config.color;
      init();
    },
  };

  // Auto-initialize
  init();
})();
