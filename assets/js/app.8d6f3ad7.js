/* IFL website. One script for every page: each feature runs only when its markup is on the page. */
(function(){
"use strict";
var D={lang:"en",t:{}};
try{D=JSON.parse(document.getElementById("ifl-data").textContent);}catch(e){}
var LANG=D.lang,T=D.t||{};
var REDUCE=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var FINE=window.matchMedia("(hover: hover) and (pointer: fine)").matches;
var $=function(s,r){return (r||document).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var pad=function(n){return String(n).padStart(2,"0");};
var store={sget:function(k){try{return sessionStorage.getItem(k);}catch(e){return null;}},sset:function(k,v){try{sessionStorage.setItem(k,v);}catch(e){}}};

/* Analytics: every element with data-event reports a click. GA4 if present, otherwise the dataLayer. */
function track(name,params){
  params=Object.assign({lang:LANG,page_path:location.pathname},params||{});
  window.dataLayer=window.dataLayer||[];window.dataLayer.push(Object.assign({event:name},params));
  /* Google Ads conversions and GA4 events are set up in Google Tag Manager (GTM-WXQQ7V9P) */
}
/* Cookie choice (only on the page when Google tags are switched on) */
function initCookies(){
  var bar=$("#cookie"); if(!bar)return;
  var get=function(){try{return localStorage.getItem("ifl-consent");}catch(e){return null;}};
  if(!get())bar.hidden=false;
  $$("[data-ck]",bar).forEach(function(b){b.addEventListener("click",function(){
    var v=b.dataset.ck; try{localStorage.setItem("ifl-consent",v);}catch(e){}
    if(typeof window.gtag==="function")window.gtag("consent","update",{ad_storage:v,ad_user_data:v,ad_personalization:v,analytics_storage:v});window.dataLayer.push({event:"consent_choice",consent:v});
    bar.hidden=true;});});
  $$("[data-ck-open]").forEach(function(b){b.addEventListener("click",function(){bar.hidden=false;});});
}
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("[data-event]");if(a)track(a.dataset.event,{location:a.dataset.location||""});});

/* Hero headline: letters punch in (English only, never with reduced motion) */
function splitChars(el){
  if(LANG!=="en"||REDUCE)return;
  var txt=el.textContent,i=0;
  el.setAttribute("aria-hidden","true");
  el.innerHTML=txt.split(" ").map(function(w){return '<span style="display:inline-block;white-space:nowrap">'+Array.from(w).map(function(c){return '<span class="ch" style="--i:'+(i++)+'">'+c.replace(/[&<>]/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[m];})+"</span>";}).join("")+"</span>";}).join(" ");
}
function initHero(){
  var hero=$("#hero"); if(!hero)return;
  var h1=$("h1",hero); if(h1&&LANG==="en"&&!REDUCE)h1.setAttribute("aria-label",h1.textContent.replace(/\s+/g," ").trim());
  $$("[data-split]",hero).forEach(splitChars);
  runIntro(function(){
    hero.classList.add("go");
    if(REDUCE)return;
    var n=hero.querySelectorAll(".ch").length;
    var at=LANG==="en"?260+(n/2)*28+420:760;
    setTimeout(function(){hero.classList.add("impact");setTimeout(function(){hero.classList.remove("impact");},760);},at);
  });
  initSpotlight(hero); initDust(hero);
}
/* Intro: the bell. Once per visit, skippable, never with reduced motion. */
function runIntro(done){
  var el=$("#intro");
  /* visitors from an ad (or any tagged link) go straight to the page: no intro */
  var fromAd=/[?&](gclid|gbraid|wbraid|fbclid|utm_[a-z]+)=/.test(location.search);
  if(!el||REDUCE||fromAd||store.sget("ifl-intro")){done();return;}
  store.sset("ifl-intro","1");
  el.hidden=false; document.body.classList.add("is-intro");
  var finished=false;
  var end=function(){if(finished)return;finished=true;el.classList.add("done");document.body.classList.remove("is-intro");done();};
  requestAnimationFrame(function(){el.classList.add("run");});
  el.addEventListener("click",end); document.addEventListener("keydown",end,{once:true});
  setTimeout(end,2300);
}
function initSpotlight(hero){
  if(!FINE||REDUCE){hero.classList.add("drift");if(!REDUCE)initTilt(hero);return;}
  var raf=0,x=62,y=38,tx=62,ty=38;
  hero.addEventListener("pointermove",function(e){var r=hero.getBoundingClientRect();tx=(e.clientX-r.left)/r.width*100;ty=(e.clientY-r.top)/r.height*100;if(!raf)raf=requestAnimationFrame(step);});
  function step(){x+=(tx-x)*.14;y+=(ty-y)*.14;hero.style.setProperty("--mx",x.toFixed(2)+"%");hero.style.setProperty("--my",y.toFixed(2)+"%");raf=(Math.abs(tx-x)>.1||Math.abs(ty-y)>.1)?requestAnimationFrame(step):0;}
}
/* Phones: tilt moves the spotlight. Only where no permission prompt is needed (Android); iPhone keeps the slow drift. */
function initTilt(hero){
  if(!("DeviceOrientationEvent" in window)||typeof DeviceOrientationEvent.requestPermission==="function")return;
  var x=62,y=38,tx=62,ty=38,raf=0,on=false,seen=false;
  new IntersectionObserver(function(es){on=es[0].isIntersecting;}).observe(hero);
  addEventListener("deviceorientation",function(e){
    if(e.gamma==null||!on)return;
    if(!seen){seen=true;hero.classList.remove("drift");}
    tx=50+Math.max(-30,Math.min(30,e.gamma))*1.4; ty=40+Math.max(-25,Math.min(25,(e.beta||45)-45))*1.2;
    if(!raf)raf=requestAnimationFrame(step);
  });
  function step(){x+=(tx-x)*.12;y+=(ty-y)*.12;hero.style.setProperty("--mx",x.toFixed(2)+"%");hero.style.setProperty("--my",y.toFixed(2)+"%");raf=(Math.abs(tx-x)>.1||Math.abs(ty-y)>.1)?requestAnimationFrame(step):0;}
}
function initDust(hero){
  var c=$("#dust"); if(!c||REDUCE||!c.getContext)return;
  var ctx=c.getContext("2d"),W,H,P=[],on=true,raf;
  function mk(any){return{x:Math.random()*W,y:any?Math.random()*H:H+10,r:(Math.random()*1.6+.4)*(devicePixelRatio||1),v:Math.random()*.35+.08,s:Math.random()*.6+.2,a:Math.random()*.5+.15,p:Math.random()*6.28};}
  function size(){var d=Math.min(devicePixelRatio||1,2);W=c.width=c.offsetWidth*d;H=c.height=c.offsetHeight*d;P=Array.from({length:Math.round(Math.min(110,innerWidth/14))},function(){return mk(true);});}
  function frame(){ctx.clearRect(0,0,W,H);for(var i=0;i<P.length;i++){var p=P[i];p.y-=p.v;p.p+=.01;p.x+=Math.sin(p.p)*p.s;if(p.y<-10)Object.assign(p,mk(false));ctx.globalAlpha=p.a;ctx.fillStyle="#f3e2b8";ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fill();}if(on)raf=requestAnimationFrame(frame);}
  size(); addEventListener("resize",size);
  new IntersectionObserver(function(es){on=es[0].isIntersecting;if(on){cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);}}).observe(hero);
}

/* Walkout: a camera flash and a burst of sweat and chalk on every bout change */
var CUR=0,walkTL=null,walkST=null,burstCtx=null,burstP=[],burstRaf=0;
function initBurst(){var c=$("#burst");if(!c||!c.getContext)return;burstCtx=c.getContext("2d");var sz=function(){var d=Math.min(devicePixelRatio||1,2);c.width=c.offsetWidth*d;c.height=c.offsetHeight*d;};sz();addEventListener("resize",sz);}
function burst(){
  if(REDUCE||!burstCtx)return;
  var c=burstCtx.canvas,W=c.width,H=c.height,d=Math.min(devicePixelRatio||1,2);
  for(var i=0;i<70;i++){var a=Math.random()*6.283,s=(Math.random()*9+3)*d;burstP.push({x:W/2,y:H*.46,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2*d,r:(Math.random()*2.2+.6)*d,l:1,gold:Math.random()<.35});}
  if(!burstRaf)burstRaf=requestAnimationFrame(function f(){burstCtx.clearRect(0,0,W,H);burstP=burstP.filter(function(p){return p.l>0;});burstP.forEach(function(p){p.x+=p.vx;p.y+=p.vy;p.vx*=.95;p.vy=p.vy*.95+.25*d;p.l-=.022;burstCtx.globalAlpha=Math.max(0,p.l);burstCtx.fillStyle=p.gold?"#f3d17c":"#e8f0ff";burstCtx.beginPath();burstCtx.arc(p.x,p.y,p.r,0,6.283);burstCtx.fill();});burstRaf=burstP.length?requestAnimationFrame(f):0;});
}
function hit(){var st=$("#stage");if(REDUCE||!st)return;st.classList.remove("hit");void st.offsetWidth;st.classList.add("hit");burst();}
function setCur(i,fx){
  CUR=i;
  $$("#rail button").forEach(function(b,k){b.setAttribute("aria-current",String(k===i));});
  $$(".scene").forEach(function(s,k){s.classList.toggle("is-cur",k===i);});
  if(fx)hit();
}
function goTo(i){
  if(!walkST){var s=$$(".scene")[i];if(s)s.scrollIntoView({behavior:REDUCE?"auto":"smooth",block:"nearest",inline:"center"});return;}
  var y=walkST.start+(walkST.end-walkST.start)*(i/walkTL.duration());
  window.scrollTo({top:y+2,behavior:REDUCE?"auto":"smooth"});
}

/* Scroll choreography (home): Wai Kru pin, walkout, road to the prize */
var motion=[];
function bigScreen(){return window.innerWidth>=820&&window.innerHeight>=600;}
function buildMotion(){
  var walk=$(".walk"),road=$(".road:not(.road--fixed)"),wk=$("#wkPin");
  if(!walk&&!road&&!wk)return;
  motion.forEach(function(x){if(x.scrollTrigger)x.scrollTrigger.kill();x.kill();});motion=[];walkTL=null;walkST=null;
  if(window.gsap)gsap.set(["#roadTrack","#wkImg","#roadRope"].filter(function(s){return $(s);}),{clearProps:"transform"});
  var ok=!!(window.gsap&&window.ScrollTrigger&&!REDUCE&&bigScreen());
  if(walk)walk.classList.toggle("walk--static",!ok);
  if(road)road.classList.toggle("road--static",!ok);
  if(!ok){
    $$(".scene").forEach(function(s){s.style.visibility="";s.style.opacity="";});
    if(wk)$$(".waikru__txt>*",wk).forEach(function(e){e.style.opacity="";e.style.visibility="";e.style.transform="";});
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  if(wk){
    var w=gsap.timeline({scrollTrigger:{trigger:wk,start:"top top",end:"+=110%",pin:true,scrub:0.6}});
    w.fromTo("#wkImg",{scale:1.28},{scale:1,ease:"none",duration:1},0)
     .fromTo($$(".waikru__txt>*",wk),{autoAlpha:0,y:50},{autoAlpha:1,y:0,stagger:0.12,duration:0.35,ease:"power3.out"},0.05);
    motion.push(w);
  }
  if(walk){
    var scenes=gsap.utils.toArray(".scene"),n=scenes.length;
    scenes.forEach(function(s,i){gsap.set(s,{autoAlpha:i===0?1:0});s.classList.toggle("is-cur",i===0);});
    CUR=0;
    var tl=gsap.timeline({defaults:{ease:"power3.out"},scrollTrigger:{trigger:"#stage",start:"top top",end:function(){return "+="+Math.round(window.innerHeight*(n-1)*0.5);},pin:true,scrub:0.6,
      snap:{snapTo:"labelsDirectional",duration:{min:0.2,max:0.6},delay:0.08,ease:"power1.inOut"},invalidateOnRefresh:true,
      onUpdate:function(self){var i=Math.min(n-1,Math.round(self.animation.time()));if(i!==CUR)setCur(i,true);}}});
    tl.addLabel("b0",0);
    for(var i=1;i<n;i++){
      var p=scenes[i-1],c=scenes[i],at=i-1;
      tl.to(p.querySelector(".fighter--a"),{xPercent:-45,autoAlpha:0,filter:"blur(10px)",duration:0.45,ease:"power2.in"},at)
        .to(p.querySelector(".fighter--b"),{xPercent:45,autoAlpha:0,filter:"blur(10px)",duration:0.45,ease:"power2.in"},at)
        .to(p.querySelectorAll(".names,.scene__tag,.scene__num"),{autoAlpha:0,y:-30,duration:0.35,ease:"power2.in"},at)
        .to(p.querySelectorAll(".slab"),{autoAlpha:0,duration:0.35},at+0.1)
        .fromTo(".ropes i",{xPercent:0},{xPercent:i%2?-4:4,duration:0.9,ease:"none"},at)
        .set(c,{autoAlpha:1},at+0.42).set(p,{autoAlpha:0},at+0.5)
        .fromTo(c.querySelector(".slab--a"),{xPercent:-100},{xPercent:0,duration:0.5},at+0.42)
        .fromTo(c.querySelector(".slab--b"),{xPercent:100},{xPercent:0,duration:0.5},at+0.42)
        .fromTo(c.querySelector(".fighter--a"),{xPercent:-55,autoAlpha:0,filter:"blur(14px)"},{xPercent:0,autoAlpha:1,filter:"blur(0px)",duration:0.55},at+0.46)
        .fromTo(c.querySelector(".fighter--b"),{xPercent:55,autoAlpha:0,filter:"blur(14px)"},{xPercent:0,autoAlpha:1,filter:"blur(0px)",duration:0.55},at+0.46)
        .fromTo(c.querySelector(".scene__num"),{autoAlpha:0,scale:1.25},{autoAlpha:1,scale:1,duration:0.5},at+0.44)
        .fromTo(c.querySelectorAll(".nm b,.vs,.nm .rec,.nm .adv,.scene__tag"),{autoAlpha:0,y:40},{autoAlpha:1,y:0,duration:0.4,stagger:0.03},at+0.55)
        .addLabel("b"+i,i);
    }
    tl.to({},{duration:0.15},n-1);
    walkTL=tl; walkST=tl.scrollTrigger; motion.push(tl);
  }
  if(road&&$("#roadTrack")){
    var track=$("#roadTrack"),prize=$("#prize"),counted=false;
    var dist=function(){return Math.max(0,track.scrollWidth-window.innerWidth);};
    var tw=gsap.to(track,{x:function(){return -dist();},ease:"none",scrollTrigger:{trigger:"#roadPin",start:"top top",end:function(){return "+="+Math.round(dist()*0.6);},pin:true,scrub:0.8,invalidateOnRefresh:true,
      onUpdate:function(self){gsap.set("#roadRope",{scaleX:self.progress});if(!counted&&self.progress>0.8){counted=true;countPrize(prize);}}}});
    motion.push(tw);
  }
  ScrollTrigger.refresh();
}
function countPrize(el){
  if(!el||REDUCE)return;
  var o={v:0};
  gsap.to(o,{v:250000,duration:1.6,ease:"power3.out",onUpdate:function(){el.textContent="฿"+Math.round(o.v).toLocaleString("en-US");}});
}
function initRail(){$$("#rail button").forEach(function(b){b.addEventListener("click",function(){goTo(+b.dataset.go);});});}

/* Film strip: drag, arrows, centre frame develops into colour */
function initFilm(){
  var tr=$("#track"); if(!tr)return;
  var frames=$$(".frame",tr);
  var io=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle("is-center",e.intersectionRatio>0.7);});},{root:tr,threshold:[0,.7,1]});
  frames.forEach(function(f){io.observe(f);});
  var step=function(d){var w=frames[0].getBoundingClientRect().width+10;tr.scrollBy({left:d*w,behavior:REDUCE?"auto":"smooth"});};
  $$("[data-film]").forEach(function(b){b.addEventListener("click",function(){step(+b.dataset.film);});});
  tr.addEventListener("keydown",function(e){if(e.key==="ArrowRight"){e.preventDefault();step(1);}if(e.key==="ArrowLeft"){e.preventDefault();step(-1);}});
  if(!FINE)return;
  var down=false,sx=0,sl=0;
  tr.addEventListener("pointerdown",function(e){down=true;sx=e.clientX;sl=tr.scrollLeft;tr.style.scrollSnapType="none";tr.setPointerCapture(e.pointerId);});
  tr.addEventListener("pointermove",function(e){if(!down)return;tr.scrollLeft=sl-(e.clientX-sx);});
  var up=function(){if(!down)return;down=false;tr.style.scrollSnapType="";var w=frames[0].getBoundingClientRect().width+10;tr.scrollTo({left:Math.round(tr.scrollLeft/w)*w,behavior:"smooth"});};
  tr.addEventListener("pointerup",up);tr.addEventListener("pointercancel",up);
}

/* Ticket stub: tilt with the pointer, stamp slams when it comes into view */
function initStub(){
  var stub=$("#stub"); if(!stub)return;
  new IntersectionObserver(function(es){if(es[0].isIntersecting)stub.classList.add("stamped");},{threshold:.55}).observe(stub);
  $$(".btn",stub).forEach(function(b){b.addEventListener("click",function(){stub.classList.add("torn");setTimeout(function(){stub.classList.remove("torn");},1600);});});
  if(!FINE||REDUCE)return;
  var side=stub.parentElement;
  side.addEventListener("pointermove",function(e){var r=stub.getBoundingClientRect();var x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;stub.style.setProperty("--ry",(x*10).toFixed(2)+"deg");stub.style.setProperty("--rx",(-y*8).toFixed(2)+"deg");});
  side.addEventListener("pointerleave",function(){stub.style.setProperty("--ry","0deg");stub.style.setProperty("--rx","0deg");});
}
function initMagnet(){
  if(!FINE||REDUCE)return;
  $$("[data-magnet]").forEach(function(b){
    b.addEventListener("pointermove",function(e){var r=b.getBoundingClientRect();b.style.setProperty("--tx",((e.clientX-r.left-r.width/2)*.18).toFixed(1)+"px");b.style.setProperty("--ty",((e.clientY-r.top-r.height/2)*.28).toFixed(1)+"px");});
    b.addEventListener("pointerleave",function(){b.style.setProperty("--tx","0px");b.style.setProperty("--ty","0px");});
  });
}

/* Phones and tablets: the fight card is a swipeable carousel. Each bout plays in when it lands, with a buzz on Android. */
var carouselIO=null;
function initCarousel(){
  var box=$("#scenes"),walk=$(".walk"); if(!box||!walk)return;
  var scenes=$$(".scene",box),hint=$(".walk__hint"),visible=false,cur=-1,swiped=false,touched=false;
  function play(i,buzz){
    if(!walk.classList.contains("walk--static"))return;
    scenes.forEach(function(s,k){s.classList.toggle("is-live",k===i&&visible);s.classList.remove("is-hit");});
    if(visible&&!REDUCE){var s=scenes[i];void s.offsetWidth;s.classList.add("is-hit");}
    $$("#rail button").forEach(function(b,k){b.setAttribute("aria-current",String(k===i));});
    if(buzz&&touched&&navigator.vibrate&&!REDUCE){try{navigator.vibrate(12);}catch(e){}}
  }
  box.addEventListener("touchstart",function(){touched=true;},{passive:true});
  carouselIO=new IntersectionObserver(function(es){es.forEach(function(e){if(e.intersectionRatio>.6){var i=scenes.indexOf(e.target);if(i!==cur){var moved=cur!==-1;cur=i;play(i,moved);if(moved&&!swiped){swiped=true;if(hint)hint.classList.add("is-gone");track("fightcard_swipe",{});}}}});},{root:box,threshold:[.6]});
  scenes.forEach(function(s){carouselIO.observe(s);});
  new IntersectionObserver(function(es){var v=es[0].isIntersecting;if(v!==visible){visible=v;if(cur<0)cur=0;play(cur,false);}},{threshold:.35}).observe(box);
}

/* Scroll reveals: content eases up as it arrives. */
/* Wai Kru ritual: the active step follows the scroll (desktop) or the swipe (phones) */
function initRitual(){
  var list=$("#wkSteps"); if(!list||!("IntersectionObserver" in window))return;
  var steps=$$(".wkr__step",list),imgs=$$(".wkr__img"),dots=$$(".wkr__dots i"),hint=$(".wkr__hint"),cur=0,io=null;
  function set(i){if(i===cur)return;cur=i;
    steps.forEach(function(s,k){s.classList.toggle("is-on",k===i);});
    imgs.forEach(function(m,k){m.classList.toggle("is-on",k===i);});
    dots.forEach(function(d,k){d.classList.toggle("is-on",k===i);});}
  function build(){
    if(io)io.disconnect();
    var narrow=innerWidth<820;
    io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)set(+e.target.getAttribute("data-i"));});},
      narrow?{root:list,threshold:.6}:{rootMargin:"-45% 0px -45% 0px"});
    steps.forEach(function(s){io.observe(s);});
  }
  build();
  var nw=innerWidth<820; addEventListener("resize",function(){var n=innerWidth<820;if(n!==nw){nw=n;build();}});
  if(hint)list.addEventListener("scroll",function(){if(list.scrollLeft>40)hint.classList.add("is-gone");},{passive:true});
}
function initReveal(){
  var sel=".sec__head>*,.fcard,.bcard,.stat,.ecard,.ncard,.road--static .panel,.fmt li,.dates li,.film__head>*,.join__head,.vb__head>*,.post__body>*,.duel,.vf__ifl5,.fh__row,.rs__row,.share,.nextf,.signup__txt,.signup__form,.walk--static .walk__head>*,.tbc,.wkg__h,.wkg__item,.wkc__head>*,.wkc__item,.wks__card";
  var els=$$(sel); if(!els.length)return;
  if(!("IntersectionObserver" in window)){return;}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}});},{rootMargin:"0px 0px -8% 0px",threshold:.08});
  var groups=new Map();
  els.forEach(function(el){
    var r=el.getBoundingClientRect(); if(r.top<innerHeight*.9&&r.bottom>0)return; /* already on screen: leave it */
    var k=el.parentElement,n=groups.get(k)||0;groups.set(k,n+1);
    el.style.setProperty("--rv",String(Math.min(n,5)));el.setAttribute("data-rv","");io.observe(el);
  });
}

/* Fighter profiles: swipe left or right on the photo for the next fighter. */
function initSwipe(){
  var hero=$("[data-swipe-next]"); if(!hero||FINE)return;
  var x0=0,y0=0,t0=0;
  hero.addEventListener("touchstart",function(e){var t=e.touches[0];x0=t.clientX;y0=t.clientY;t0=Date.now();},{passive:true});
  hero.addEventListener("touchend",function(e){var t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;
    if(Math.abs(dx)>70&&Math.abs(dy)<60&&Date.now()-t0<700){track("fighter_swipe",{dir:dx<0?"next":"prev"});location.href=hero.getAttribute(dx<0?"data-swipe-next":"data-swipe-prev");}},{passive:true});
}

/* YouTube loads only when tapped */
function initYouTube(){
  $$("[data-yt]").forEach(function(b){b.addEventListener("click",function(){
    var f=document.createElement("iframe");f.src="https://www.youtube-nocookie.com/embed/"+encodeURIComponent(b.dataset.yt)+"?autoplay=1&rel=0";
    f.allow="autoplay; encrypted-media; picture-in-picture; fullscreen";f.title="YouTube video";b.replaceWith(f);track("video_play",{id:b.dataset.yt});
  });});
}

/* Countdown to the first bell */
function initCountdown(){
  var root=$("[data-countdown]"); if(!root||!D.bell)return;
  var bell=new Date(D.bell).getTime();
  var set=function(k,v){var el=root.querySelector('[data-cd="'+k+'"]');if(el&&el.textContent!==v){el.textContent=v;if(!REDUCE){el.classList.remove("tick");void el.offsetWidth;el.classList.add("tick");}}};
  var timer;
  function tick(){var ms=bell-Date.now();if(ms<=0){root.classList.add("is-live");clearInterval(timer);return;}
    var d=Math.floor(ms/864e5);ms-=d*864e5;var h=Math.floor(ms/36e5);ms-=h*36e5;var m=Math.floor(ms/6e4);ms-=m*6e4;var s=Math.floor(ms/1e3);
    set("d",String(d));set("h",pad(h));set("m",pad(m));set("s",pad(s));}
  tick(); timer=setInterval(tick,1000);
}

/* Nav, mobile ticket dock, menu */
function initNav(){
  var nav=$("#nav"),hero=$("[data-hero]");
  if(nav&&hero)new IntersectionObserver(function(es){nav.classList.toggle("is-solid",!es[0].isIntersecting);},{rootMargin:"-80px 0px 0px 0px"}).observe(hero);
  var dock=$("#dock"),start=$("[data-dock-start]"),tix=$("#tickets");
  if(dock){
    var out=!start,tin=false,upd=function(){dock.classList.toggle("is-on",out&&!tin);};
    if(start)new IntersectionObserver(function(es){out=!es[0].isIntersecting&&es[0].boundingClientRect.top<0;upd();}).observe(start);
    if(tix)new IntersectionObserver(function(es){tin=es[0].isIntersecting;upd();},{threshold:.15}).observe(tix);
    var foot=$(".foot");if(foot)new IntersectionObserver(function(es){dock.classList.toggle("is-foot",es[0].isIntersecting);}).observe(foot);
    upd();
  }
  var btn=$("[data-menu-btn]"),panel=$("[data-menu]");
  if(btn&&panel){
    var close=function(){panel.classList.remove("open");btn.setAttribute("aria-expanded","false");};
    btn.addEventListener("click",function(){var o=panel.classList.toggle("open");btn.setAttribute("aria-expanded",String(o));});
    $$("a",panel).forEach(function(a){a.addEventListener("click",close);});
    document.addEventListener("keydown",function(e){if(e.key==="Escape")close();});
  }
}

/* Fighter profile: count-up and copy link */
function initFighter(){
  if(!REDUCE)$$("[data-num]").forEach(function(n){var to=+n.dataset.num,t0=performance.now();(function st(now){var p=Math.min(1,(now-t0)/900),e=1-Math.pow(1-p,3);n.textContent=Math.round(to*e);if(p<1)requestAnimationFrame(st);})(t0);});
  $$("[data-copy]").forEach(function(cp){
    cp.addEventListener("click",function(){
      var url=cp.dataset.copy,done=function(){cp.textContent=T.v_copied;track("share_copy",{url:url});setTimeout(function(){cp.textContent=T.v_copy;},1800);};
      if(navigator.share&&!FINE){navigator.share({url:url,title:document.title}).then(function(){track("share_native",{url:url});},function(){});return;}
      try{navigator.clipboard.writeText(url).then(done,function(){sel();done();});}catch(e){sel();done();}
      function sel(){var u=cp.parentElement.querySelector(".share__url");if(!u)return;var r=document.createRange();r.selectNodeContents(u);var s=getSelection();s.removeAllRanges();s.addRange(r);}
    });
  });
}

/* Bracket: division tabs */
function initBracket(){
  var tabs=$$("[data-div]"); if(!tabs.length)return;
  tabs.forEach(function(b){b.addEventListener("click",function(){
    var div=b.dataset.div;
    tabs.forEach(function(x){x.setAttribute("aria-pressed",String(x===b));});
    $$("[data-bk]").forEach(function(p){p.hidden=p.dataset.bk!==div;if(!p.hidden){var bk=$(".bk",p);bk.classList.remove("enter");void bk.offsetWidth;bk.classList.add("enter");}});
    track("bracket_division",{division:div});
  });});
}

/* Fighters index: filter by division */
function initFilter(){
  var btns=$$("[data-filter]"),grid=$(".fgrid"); if(!btns.length||!grid)return;
  btns.forEach(function(b){b.addEventListener("click",function(){
    var f=b.dataset.filter,n=0;
    btns.forEach(function(x){x.setAttribute("aria-pressed",String(x===b));});
    grid.classList.remove("anim");void grid.offsetWidth;
    $$(".fcard",grid).forEach(function(c){var show=f==="all"||c.dataset.div===f;c.classList.toggle("is-out",!show);if(show)c.style.setProperty("--n",n++);});
    grid.classList.add("anim");
  });});
}

/* Forms: send without leaving the page. Without JavaScript the form still posts and lands on the thank you page. */
function initForms(){
  $$("form[data-form]").forEach(function(f){
    var ts=f.querySelector('[name="ts"]'); if(ts)ts.value=String(Date.now());
    var st=f.querySelector(".form__status"),btn=f.querySelector('[type="submit"]'),ok=f.nextElementSibling,started=false;
    f.addEventListener("input",function(){if(!started){started=true;track("form_start",{form:f.dataset.form});}},{once:false});
    f.addEventListener("submit",function(e){
      e.preventDefault(); if(f.dataset.busy)return; f.dataset.busy="1";
      $$(".is-bad",f).forEach(function(x){x.classList.remove("is-bad");});
      var label=btn.innerHTML; btn.disabled=true; btn.innerHTML="<span>"+T.fm_sending+"</span>"; st.textContent="";
      var finish=function(msg){st.textContent=msg||"";btn.disabled=false;btn.innerHTML=label;delete f.dataset.busy;};
      fetch(f.action,{method:"POST",body:new FormData(f),headers:{Accept:"application/json"}}).then(function(res){
        return res.json().catch(function(){return {};}).then(function(j){
          if(res.ok&&j.ok){f.hidden=true;if(ok){ok.hidden=false;ok.focus();}track("form_submit",{form:f.dataset.form});return;}
          if(res.status===429)return finish(T.fm_err_rate);
          if(j.fields&&j.fields.length){j.fields.forEach(function(n){var el=f.elements[n];var box=el&&(el.closest?el.closest(".fld"):(el[0]&&el[0].closest(".fld")));if(box)box.classList.add("is-bad");});return finish(T.fm_err_fields);}
          finish(T.fm_err);
        });
      }).catch(function(){finish(T.fm_err);});
    });
  });
}

function init(){
  initCookies(); initNav(); initCountdown(); initHero(); initBurst(); initRail(); initFilm(); initStub(); initMagnet();
  initFighter(); initBracket(); initFilter(); initForms(); initSwipe(); initYouTube();
  buildMotion(); initCarousel(); initRitual(); initReveal();
  var big=bigScreen();
  addEventListener("resize",function(){var nb=bigScreen();if(nb!==big){big=nb;buildMotion();}});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
