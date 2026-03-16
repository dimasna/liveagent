"use strict";(()=>{(function(){let h=`<svg width="22" height="22" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
    <rect x="6.5" y="11" width="2.5" height="6" rx="1.25" fill="#0a0a0a" opacity="0.35"/>
    <rect x="10.5" y="8.5" width="2.5" height="11" rx="1.25" fill="#0a0a0a" opacity="0.55"/>
    <rect x="14.5" y="6" width="2.5" height="16" rx="1.25" fill="#0a0a0a"/>
    <rect x="18.5" y="9" width="2.5" height="10" rx="1.25" fill="#0a0a0a" opacity="0.55"/>
    <rect x="22.5" y="11.5" width="2.5" height="5" rx="1.25" fill="#0a0a0a" opacity="0.35"/>
  </svg>`,k='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',o=null,i=null,t=null,g=!1,a=document.currentScript;if(!a){let e=document.querySelectorAll('script[src*="widget.js"]');a=Array.from(e).find(n=>n.hasAttribute("data-agent-id"))}let p=a?a.src.replace(/\/widget\.js(\?.*)?$/,""):window.location.origin,s=null,l="bottom-right",r="#0a0a0a",d="#0a0a0a",c="Booking/Reservation Agent",x=!1;function A(e){s=e.getAttribute("data-agent-id"),l=e.getAttribute("data-position")||"bottom-right",r=e.getAttribute("data-color")||r,d=e.getAttribute("data-bg")||d,c=e.getAttribute("data-label")||c,x=e.getAttribute("data-open")==="true"}if(a&&A(a),!s){console.error("Liveagent.dev Widget: data-agent-id attribute is required on the script tag.");return}let E=a?.getAttribute("data-api-url")||p.replace(/:\d+$/,":3005");async function y(){try{let e=await fetch(`${E}/api/agents/${s}/widget-config`);if(!e.ok)return;let n=await e.json();!a?.getAttribute("data-color")&&n.widgetColor&&(r=n.widgetColor),!a?.getAttribute("data-bg")&&n.widgetBgColor&&(d=n.widgetBgColor),!a?.getAttribute("data-label")&&n.name&&(c=n.name),n.widgetPosition&&(l=n.widgetPosition)}catch{}}function m(){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{y().then(b)}):y().then(b)}function b(){t=document.createElement("button"),t.id="liveagent-widget-button",t.innerHTML=`
      <span style="display:flex;align-items:center;gap:10px;">
        <span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;flex-shrink:0;">${h}</span>
        <span style="font-size:14px;font-weight:500;white-space:nowrap;">${c}</span>
      </span>
    `,t.style.cssText=`
      position: fixed;
      ${l==="bottom-right"?"right: 20px;":"left: 20px;"}
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
    `,t.addEventListener("click",T),t.addEventListener("mouseenter",()=>{t&&(t.style.transform="scale(1.03)",t.style.boxShadow="0 4px 20px rgba(0,0,0,0.12)")}),t.addEventListener("mouseleave",()=>{t&&(t.style.transform="scale(1)",t.style.boxShadow="0 2px 12px rgba(0,0,0,0.08)")}),document.body.appendChild(t),i=document.createElement("div"),i.id="liveagent-widget-container",i.style.cssText=`
      position: fixed;
      ${l==="bottom-right"?"right: 20px;":"left: 20px;"}
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
    `,o=document.createElement("iframe"),o.src=S(),o.style.cssText=`
      width: 100%;
      height: 100%;
      border: none;
      background: #0a0a0a;
    `,o.allow="microphone; clipboard-read; clipboard-write",i.appendChild(o),document.body.appendChild(i),window.addEventListener("message",w),x&&f()}function S(){let e=new URLSearchParams;r!=="#0a0a0a"&&e.set("color",r),d!=="#0a0a0a"&&e.set("bg",d);let n=e.toString();return`${p}/${s}${n?"?"+n:""}`}function w(e){if(e.origin!==new URL(p).origin)return;let{type:n,payload:L}=e.data||{};switch(n){case"liveagent:close":u();break;case"liveagent:resize":L?.height&&i&&(i.style.height=`${L.height}px`);break;case"liveagent:call-started":break;case"liveagent:call-ended":break}}function T(){g?u():f()}function M(){t&&(t.innerHTML=k,t.style.background="#6b7280",t.style.color="white",t.style.padding="0",t.style.width="48px",t.style.borderRadius="50%",t.style.border="none")}function $(){t&&(t.innerHTML=`
      <span style="display:flex;align-items:center;gap:10px;">
        <span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;flex-shrink:0;">${h}</span>
        <span style="font-size:14px;font-weight:500;white-space:nowrap;">${c}</span>
      </span>
    `,t.style.background="#f5f5f4",t.style.color="#1a1a1a",t.style.padding="0 20px 0 10px",t.style.width="auto",t.style.borderRadius="9999px",t.style.border="1px solid rgba(0,0,0,0.06)")}function f(){i&&t&&(g=!0,i.style.display="block",requestAnimationFrame(()=>{requestAnimationFrame(()=>{i&&(i.style.opacity="1",i.style.transform="translateY(0) scale(1)")})}),M())}function u(){i&&t&&(g=!1,i.style.opacity="0",i.style.transform="translateY(12px) scale(0.96)",setTimeout(()=>{i&&(i.style.display="none")},250),$())}function v(){window.removeEventListener("message",w),i&&(i.remove(),i=null,o=null),t&&(t.remove(),t=null),g=!1}window.LiveAgentWidget={show:f,hide:u,destroy:v,init(e){v(),e.agentId&&(s=e.agentId),e.position&&(l=e.position),e.color&&(r=e.color),m()}},m()})();})();
