// One visual owner and one scroll clock: no overlapping ring copies.
export function initJourney() {
 const story=document.querySelector('.ring-story');if(!story)return;
 const chapters=[...story.querySelectorAll('.story-chapter')],ring=document.getElementById('story-ring'),canvas=document.getElementById('story-canvas'),apart=document.getElementById('story-apart'),poster=document.getElementById('story-poster'),button=document.getElementById('hero-still');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),base=story.dataset.assets;
 const state=window.IslandCut.hero={still:reduced.matches||!!navigator.connection?.saveData,loaded:0,failed:false};
 const clamp=(v)=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v)},mix=(a,b,t)=>a+(b-a)*t;
 const sets={},pending={};let metrics=[],w=0,size=0,nav=0,mobile=false,queued=false,visualLocal=null,lastTick=0;
 const paint=(name,f,c=canvas)=>{
  const images=sets[name];if(!images)return false;
  const frame=clamp(f/(images.length-1))*(images.length-1),n=Math.round(frame),im=images[n],key=name+':'+n;
  if(c.dataset.frame!==key){
   if(c.width!==im.naturalWidth||c.height!==im.naturalHeight){c.width=im.naturalWidth;c.height=im.naturalHeight;}
   const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
   // Keep facets crisp: crossfading rendered angles produces doubled prongs.
   // Smooth the scroll clock and trajectory, not the product's silhouette.
   ctx.drawImage(im,0,0);c.dataset.frame=key;
  }return true;
 };
 async function load(name,path,n){
  if(pending[name])return pending[name];
  pending[name]=(async()=>{const images=new Array(n);let cursor=0;await Promise.all([0,1,2].map(async()=>{while(cursor<n){const i=cursor++,im=new Image();im.src=base+path+String(i).padStart(3,'0')+'.webp';await im.decode();images[i]=im;state.loaded++;}}));sets[name]=images;ask();})().catch(()=>{state.failed=true;state.still=true;mode();});
  return pending[name];
 }
 function measure(){
  mobile=innerWidth<760;w=story.clientWidth;nav=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'))||80;size=mobile?Math.min(w*.88,360):Math.min(w*.47,(innerHeight-nav)*.84,640);
  metrics=chapters.map(el=>{const scene=el.querySelector('.story-scene');return {top:el.offsetTop,height:el.offsetHeight,scene:scene.offsetHeight,travel:Math.max(0,el.offsetHeight-scene.offsetHeight),copy:el.querySelector('.story-copy')};});visualLocal=null;lastTick=0;update();
 }
 function update(){
  queued=false;if(!metrics.length)return;story.dataset.still=String(state.still);
  if(state.still){metrics.forEach(m=>{m.copy.style.opacity='1';m.copy.style.transform='';m.copy.style.clipPath='';m.copy.style.pointerEvents='';});return;}
  const start=story.getBoundingClientRect().top+scrollY,target=scrollY-start+nav,now=performance.now(),dt=lastTick?Math.min(64,now-lastTick):16;lastTick=now;
  if(mobile||visualLocal===null)visualLocal=target;
  else visualLocal+=(target-visualLocal)*(1-Math.exp(-dt/65));
  if(Math.abs(target-visualLocal)<.15)visualLocal=target;
  const local=visualLocal;
  if(local!==target)ask();
  let i=0;while(i<8&&local>=metrics[i+1].top)i++;
  if(i>=4)load('arrive','bridges/arrive-',36);
  const m=metrics[i],active=clamp((local-m.top)/m.height)*m.height,u=active/m.height,R=mobile?.53:.71,L=mobile?.47:.29;
  let x=R,y=local+m.scene*(mobile?.34:.5),s=size,kind='hero',f=0,af=-1;
  metrics.forEach((a,k)=>{a.copy.style.opacity=k===8?'0':'1';a.copy.style.transform='';a.copy.style.clipPath='';a.copy.style.pointerEvents=k===8?'none':'';});
  if(i===0){
   const p=clamp(active/m.travel),openingEnd=m.travel*.27;
   // Carry formation all the way into the next chapter: no frozen tail.
   const d=mobile?ease((p-.27)/.68):ease((active-openingEnd)/(m.height-openingEnd));
   kind=p<=.27?'opening':'depart';f=p<=.27?15*ease(p/.27):35*d;
   x=mix(.5,R,d);s=mix(Math.min(mobile?w:610,m.scene*.68),size,d);y=local+m.scene*mix(.66,mobile?.34:.5,d);
   m.copy.style.opacity=String(1-ease((p-.06)/.2));m.copy.style.pointerEvents=p>.24?'none':'';
   state.phase=p<=.27?'box-opening':'gem-formation';
  }else if(i<=3){
   const positions=[R,L,R,L];x=mix(positions[i-1],positions[i],ease((u-.25)/.65));
   f=i===1?30*ease(u):i===2?mix(30,mobile?59:45,ease(u)):59;
   if(i===3){
    const turn=mobile?ease(u):ease((u-.38)/.54);
    if(!mobile){x=mix(R,L,turn);f=mix(45,59,turn);}
    y+=Math.sin(Math.PI*turn)*m.scene*.06;s=size*mix(1,mobile?.85:.88,turn);
   }
   m.copy.style.opacity=String(1-ease((u-.42)/.43));state.phase='editorial-travel';
   if(i>=2)load('apart','journey/apart-'+(sets.hero?.[0].naturalWidth||560)+'-',32);
  }else if(i===4){
   const p=clamp(active/m.travel),tail=clamp((active-m.travel)/m.scene);
   x=mix(L,R,ease(tail));s=size*mix(mobile?.85:.88,1,ease(tail));
   const spread=mobile?(p<.5?ease((p-.08)/.27):1-ease((p-.65)/.27)):(p<.5?ease((p-.12)/.32):1-ease((p-.56)/.34));
   f=59;af=31*spread;m.copy.style.opacity=String(1-ease(tail));
   if(!mobile&&tail>0){af=-1;f=mix(59,52,ease(tail));}
   state.phase=p<.12?'settle':p<.44?'explode':p<.56?'choices':p<.90?'reassemble':'assembled';
   load('arrive','bridges/arrive-',36);
  }else if(i<8){
   x=i===5?mix(R,L,ease((u-.25)/.65)):i===6?mix(L,R,ease((u-.25)/.65)):R;
   f=i===5?mix(mobile?59:52,30,ease(u)):i===6?30*(1-ease(u)):mobile?0:8*Math.sin(Math.PI*ease(u));
   m.copy.style.opacity=String(1-ease((u-.42)/.43));state.phase='editorial-travel';
  }else{
   const p=clamp(active/m.travel),landDistance=mobile?m.travel*.66:m.travel-m.scene*1.15,landing=ease(active/landDistance),reveal=mobile?ease((p-.72)/.23):ease((active-landDistance-m.scene*.08)/(m.scene*.72));
   x=mix(R,.5,landing);s=mix(size,Math.min(mobile?w:610,m.scene*(mobile?.68:.62)),landing);
   kind='arrive';f=35*landing;y=Math.min(local,m.top+m.travel)+m.scene*mix(mobile?.34:.5,mobile?.74:.72,landing);
   m.copy.style.opacity=String(reveal);m.copy.style.transform='translateY('+((1-reveal)*140)+'px)';m.copy.style.clipPath='inset('+((1-reveal)*100)+'% 0 0 0)';m.copy.style.pointerEvents=reveal>.95?'':'none';
   state.phase=landing<1?'ring-seating':reveal===0?'seated':'final-reveal';
  }
  // Incoming editorial copy waits for the ring to clear its side. Apply the
  // gate to every chapter (not just the active one) so reverse scroll matches.
  if(!mobile)metrics.forEach((a,k)=>{
   if(k===0||k===8)return;
   const entry=ease((local-a.top+a.scene*.08)/(a.scene*.26));
   a.copy.style.opacity=String(Number(a.copy.style.opacity)*entry);
   a.copy.style.pointerEvents=Number(a.copy.style.opacity)>.9?'':'none';
  });
  ring.style.width=ring.style.height=s+'px';ring.style.transform='translate3d('+(w*x-s/2)+'px,'+(y-s/2)+'px,0)';ring.style.opacity=local<story.offsetHeight?'1':'0';
  const drawn=paint(kind,f);canvas.style.opacity=drawn?'1':'0';poster.style.opacity=drawn?'0':'1';
  if(!drawn){const fallback=base+(kind==='opening'||kind==='depart'?'bookends/opening-000.webp':kind==='arrive'?'bookends/return-023.webp':'hero-ring/poster-560.webp');if(poster.getAttribute('src')!==fallback)poster.src=fallback;}
  const split=af>=0&&paint('apart',af,apart);apart.style.opacity=split?'1':'0';if(split){canvas.style.opacity='0';poster.style.opacity='0';}
  state.chapter=i;state.frame=Math.round(f);state.apartFrame=Math.round(af);ring.dataset.phase=state.phase;ring.dataset.chapter=String(i);
 }
 function ask(){if(!queued){queued=true;requestAnimationFrame(update);}}
 function mode(){story.dataset.still=String(state.still);button.setAttribute('aria-pressed',String(state.still));button.textContent=state.still?'Enable scroll animation':'Use a still';measure();if(!state.still){load('opening','bookends/opening-',24);load('hero','hero-ring/ring-'+(innerWidth<760?560:1200)+'-',60);load('depart','bridges/depart-',36);load('apart','journey/apart-'+(innerWidth<760?560:1200)+'-',32);}}
 button.addEventListener('click',()=>{state.still=!state.still;mode();});
 reduced.addEventListener('change',()=>{state.still=reduced.matches;mode();});
 document.getElementById('story-open').addEventListener('click',()=>{if(state.still){document.getElementById('opening-poster').src=base+'bookends/opening-015.webp';return;}window.scrollTo({top:story.getBoundingClientRect().top+scrollY-nav+metrics[0].travel*.27,behavior:'smooth'});});
 addEventListener('scroll',ask,{passive:true});addEventListener('resize',measure);document.fonts.ready.then(()=>{measure();const target=location.hash&&document.getElementById(location.hash.slice(1));if(target)target.scrollIntoView({behavior:'instant',block:'start'});});mode();
}
