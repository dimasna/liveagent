"use strict";(()=>{(function(){let u='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',w='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',a=null,e=null,t=null,s=!1,r=document.currentScript,m=r?r.src.replace(/\/widget\.js(\?.*)?$/,""):window.location.origin,l=null,d="bottom-right",i="#3b82f6";if(r)l=r.getAttribute("data-agent-id"),d=r.getAttribute("data-position")||"bottom-right",i=r.getAttribute("data-color")||i;else{let n=document.querySelectorAll('script[src*="widget.js"]'),o=Array.from(n).find(c=>c.hasAttribute("data-agent-id"));o&&(l=o.getAttribute("data-agent-id"),d=o.getAttribute("data-position")||"bottom-right",i=o.getAttribute("data-color")||i)}if(!l){console.error("LiveAgent Widget: data-agent-id attribute is required on the script tag.");return}function p(){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",h):h()}function h(){let n=document.createElement("style");n.textContent=`
      @keyframes liveagent-btn-pulse {
        0%, 100% { box-shadow: 0 0 0 0 ${i}66; }
        50% { box-shadow: 0 0 0 10px ${i}00; }
      }
    `,document.head.appendChild(n),t=document.createElement("button"),t.id="liveagent-widget-button",t.innerHTML=u,t.style.cssText=`
      position: fixed;
      ${d==="bottom-right"?"right: 20px;":"left: 20px;"}
      bottom: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${i};
      color: white;
      border: none;
      cursor: pointer;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 24px ${i}40;
      transition: all 0.2s ease;
      animation: liveagent-btn-pulse 2.5s ease-in-out infinite;
    `,t.addEventListener("click",v),t.addEventListener("mouseenter",()=>{t&&(t.style.transform="scale(1.08)")}),t.addEventListener("mouseleave",()=>{t&&(t.style.transform="scale(1)")}),document.body.appendChild(t),e=document.createElement("div"),e.id="liveagent-widget-container",e.style.cssText=`
      position: fixed;
      ${d==="bottom-right"?"right: 20px;":"left: 20px;"}
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
    `,a=document.createElement("iframe"),a.src=x(),a.style.cssText=`
      width: 100%;
      height: 100%;
      border: none;
      background: white;
    `,a.allow="microphone; clipboard-read; clipboard-write",e.appendChild(a),document.body.appendChild(e),window.addEventListener("message",b)}function x(){let n=new URLSearchParams;i!=="#3b82f6"&&n.set("color",i);let o=n.toString();return`${m}/${l}${o?"?"+o:""}`}function b(n){if(n.origin!==new URL(m).origin)return;let{type:o,payload:c}=n.data||{};switch(o){case"liveagent:close":g();break;case"liveagent:resize":c?.height&&e&&(e.style.height=`${c.height}px`);break;case"liveagent:call-started":t&&(t.style.animation="none",t.style.background="#22c55e");break;case"liveagent:call-ended":t&&!s&&(t.style.animation="liveagent-btn-pulse 2.5s ease-in-out infinite",t.style.background=i);break}}function v(){s?g():f()}function f(){e&&t&&(s=!0,e.style.display="block",requestAnimationFrame(()=>{requestAnimationFrame(()=>{e&&(e.style.opacity="1",e.style.transform="translateY(0) scale(1)")})}),t.innerHTML=w,t.style.animation="none",t.style.background="#6b7280")}function g(){e&&t&&(s=!1,e.style.opacity="0",e.style.transform="translateY(12px) scale(0.96)",setTimeout(()=>{e&&(e.style.display="none")},250),t.innerHTML=u,t.style.background=i,t.style.animation="liveagent-btn-pulse 2.5s ease-in-out infinite")}function y(){window.removeEventListener("message",b),e&&(e.remove(),e=null,a=null),t&&(t.remove(),t=null),s=!1}window.LiveAgentWidget={show:f,hide:g,destroy:y,init(n){y(),n.agentId&&(l=n.agentId),n.position&&(d=n.position),n.color&&(i=n.color),p()}},p()})();})();
