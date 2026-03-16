(function () {
  // Wave icon SVG (liveagent logo, no background)
  const waveSvg = `<svg width="22" height="22" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
    <rect x="6.5" y="11" width="2.5" height="6" rx="1.25" fill="#0a0a0a" opacity="0.35"/>
    <rect x="10.5" y="8.5" width="2.5" height="11" rx="1.25" fill="#0a0a0a" opacity="0.55"/>
    <rect x="14.5" y="6" width="2.5" height="16" rx="1.25" fill="#0a0a0a"/>
    <rect x="18.5" y="9" width="2.5" height="10" rx="1.25" fill="#0a0a0a" opacity="0.55"/>
    <rect x="22.5" y="11.5" width="2.5" height="5" rx="1.25" fill="#0a0a0a" opacity="0.35"/>
  </svg>`;

  const closeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  let iframe: HTMLIFrameElement | null = null;
  let container: HTMLDivElement | null = null;
  let button: HTMLButtonElement | null = null;
  let isOpen = false;

  // Derive widget URL from this script's own src
  const currentScript = document.currentScript as HTMLScriptElement;

  // Find the script element (currentScript is null for async/dynamic scripts)
  let scriptEl: HTMLScriptElement | null = currentScript;
  if (!scriptEl) {
    const scripts = document.querySelectorAll('script[src*="widget.js"]');
    scriptEl = (Array.from(scripts).find((s) =>
      s.hasAttribute("data-agent-id"),
    ) as HTMLScriptElement | null);
  }

  const WIDGET_URL = scriptEl
    ? scriptEl.src.replace(/\/widget\.js(\?.*)?$/, "")
    : window.location.origin;

  // Read configuration from data attributes
  let agentId: string | null = null;
  let position: "bottom-right" | "bottom-left" = "bottom-right";
  let themeColor = "#0a0a0a";
  let bgColor = "#0a0a0a";
  let buttonLabel = "Booking/Reservation Agent";
  let autoOpen = false;

  function readAttributes(el: HTMLElement) {
    agentId = el.getAttribute("data-agent-id");
    position =
      (el.getAttribute("data-position") as
        | "bottom-right"
        | "bottom-left") || "bottom-right";
    themeColor = el.getAttribute("data-color") || themeColor;
    bgColor = el.getAttribute("data-bg") || bgColor;
    buttonLabel = el.getAttribute("data-label") || buttonLabel;
    autoOpen = el.getAttribute("data-open") === "true";
  }

  if (scriptEl) {
    readAttributes(scriptEl);
  }

  if (!agentId) {
    console.error(
      "Liveagent.dev Widget: data-agent-id attribute is required on the script tag.",
    );
    return;
  }

  // Try to fetch saved widget config from the API
  const API_URL = scriptEl?.getAttribute("data-api-url") || WIDGET_URL.replace(/:\d+$/, ":3005");

  async function fetchConfig() {
    try {
      const res = await fetch(`${API_URL}/api/agents/${agentId}/widget-config`);
      if (!res.ok) return;
      const data = await res.json();
      // Only apply fetched values if not already set via data attributes
      if (!scriptEl?.getAttribute("data-color") && data.widgetColor) {
        themeColor = data.widgetColor;
      }
      if (!scriptEl?.getAttribute("data-bg") && data.widgetBgColor) {
        bgColor = data.widgetBgColor;
      }
      if (!scriptEl?.getAttribute("data-label") && data.name) {
        buttonLabel = data.name;
      }
      if (data.widgetPosition) {
        position = data.widgetPosition as "bottom-right" | "bottom-left";
      }
    } catch {
      // Silently fail — use defaults
    }
  }

  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        fetchConfig().then(render);
      });
    } else {
      fetchConfig().then(render);
    }
  }

  function render() {
    // Create floating pill button with metallic orb + label
    button = document.createElement("button");
    button.id = "liveagent-widget-button";
    button.innerHTML = `
      <span style="display:flex;align-items:center;gap:10px;">
        <span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;flex-shrink:0;">${waveSvg}</span>
        <span style="font-size:14px;font-weight:500;white-space:nowrap;">${buttonLabel}</span>
      </span>
    `;
    button.style.cssText = `
      position: fixed;
      ${position === "bottom-right" ? "right: 20px;" : "left: 20px;"}
      bottom: 20px;
      height: 48px;
      padding: 0 20px 0 10px;
      border-radius: 9999px;
      background: #f5f5f4;
      color: #1a1a1a;
      border: 1px solid rgba(0,0,0,0.06);
      cursor: pointer;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    button.addEventListener("click", toggleWidget);
    button.addEventListener("mouseenter", () => {
      if (button) {
        button.style.transform = "scale(1.03)";
        button.style.boxShadow = "0 4px 20px rgba(0,0,0,0.12)";
      }
    });
    button.addEventListener("mouseleave", () => {
      if (button) {
        button.style.transform = "scale(1)";
        button.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)";
      }
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
      background: #0a0a0a;
    `;
    iframe.allow = "microphone; clipboard-read; clipboard-write";

    container.appendChild(iframe);
    document.body.appendChild(container);

    // Listen for messages from the widget iframe
    window.addEventListener("message", handleMessage);

    // Auto-open the widget if configured
    if (autoOpen) {
      show();
    }
  }

  function buildWidgetUrl(): string {
    const params = new URLSearchParams();
    if (themeColor !== "#0a0a0a") {
      params.set("color", themeColor);
    }
    if (bgColor !== "#0a0a0a") {
      params.set("bg", bgColor);
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
        // Keep current button state (open/closed style stays)
        break;
      case "liveagent:call-ended":
        // Keep current button state
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

  function setButtonOpen() {
    if (!button) return;
    button.innerHTML = closeIcon;
    button.style.background = "#6b7280";
    button.style.color = "white";
    button.style.padding = "0";
    button.style.width = "48px";
    button.style.borderRadius = "50%";
    button.style.border = "none";
  }

  function setButtonClosed() {
    if (!button) return;
    button.innerHTML = `
      <span style="display:flex;align-items:center;gap:10px;">
        <span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;flex-shrink:0;">${waveSvg}</span>
        <span style="font-size:14px;font-weight:500;white-space:nowrap;">${buttonLabel}</span>
      </span>
    `;
    button.style.background = "#f5f5f4";
    button.style.color = "#1a1a1a";
    button.style.padding = "0 20px 0 10px";
    button.style.width = "auto";
    button.style.borderRadius = "9999px";
    button.style.border = "1px solid rgba(0,0,0,0.06)";
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
      setButtonOpen();
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
      setButtonClosed();
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
