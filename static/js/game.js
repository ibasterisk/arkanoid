'use strict';
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const $ = (id) => document.getElementById(id);
  const txt = {
    sk: {eyebrow:'VLOŽ MINCU · HRÁČ JEDNA',stage:'ÚROVEŇ',allClear:'VŠETKO ZNIČENÉ',soundOn:'ZAP',soundOff:'VYP',subtitle:'Rozbi všetky tehličky. Zdolaj každý level.',score:'SKÓRE',level:'LEVEL',lives:'ŽIVOTY',best:'REKORD',pause:'PAUZA',resume:'POKRAČOVAŤ',restart:'ZNOVU',hint:'Myš / ← → / A D / dotyk · Medzerník: štart / pauza',footer:'8 LEVELOV · BONUSY · NEÓN',ready:'PRIPRAVENÝ HRÁČ JEDNA',title:'ARKANOID',intro:'Ovládaj plošinku a znič všetky tehličky.',start:'▶ ŠTART',next:'LEVEL DOKONČENÝ!',nextText:'Skvelé! Pokračuj na ďalšiu úroveň.',continue:'▶ ĎALŠÍ LEVEL',over:'KONIEC HRY',overText:'Tehličky vyhrali tento súboj. Skús to znovu!',again:'↻ NOVÁ HRA',win:'VÍŤAZSTVO!',winText:'Rozbil si všetky tehličky vo všetkých leveloch!',paused:'PAUZA',pausedText:'Nadýchni sa, arkáda počká.',resumeBtn:'▶ POKRAČOVAŤ',launch:'MEDZERNÍK / KLIK – VYPUSTIŤ LOPTIČKU',bonusWide:'ŠIROKÁ PLOŠINKA',bonusSlow:'POMALÁ LOPTIČKA',bonusLife:'ŽIVOT NAVYŠE'},
    en: {eyebrow:'INSERT COIN · PLAYER ONE',stage:'STAGE',allClear:'ALL CLEAR',soundOn:'ON',soundOff:'OFF',subtitle:'Break every brick. Conquer every level.',score:'SCORE',level:'LEVEL',lives:'LIVES',best:'BEST',pause:'PAUSE',resume:'RESUME',restart:'RESTART',hint:'Mouse / ← → / A D / touch · Space: launch / pause',footer:'8 LEVELS · POWER-UPS · NEON',ready:'READY PLAYER ONE',title:'ARKANOID',intro:'Control your paddle and smash every brick.',start:'▶ START',next:'LEVEL COMPLETE!',nextText:'Nice! Ready for the next stage?',continue:'▶ NEXT LEVEL',over:'GAME OVER',overText:'The bricks won this round. Try again!',again:'↻ NEW GAME',win:'YOU WIN!',winText:'You destroyed every brick in every level!',paused:'PAUSED',pausedText:'Take a breath, the arcade will wait.',resumeBtn:'▶ RESUME',launch:'SPACE / CLICK – LAUNCH BALL',bonusWide:'WIDE PADDLE',bonusSlow:'SLOW BALL',bonusLife:'EXTRA LIFE'}
  };
  let lang = localStorage.getItem('iba-arkanoid-lang') === 'en' ? 'en' : 'sk';
  let sound = localStorage.getItem('iba-arkanoid-sound') !== 'off';
  let audioCtx;
  let state = 'menu', overlayMode = 'start';
  let level = 1, score = 0, lives = 3;
  let best = Number(localStorage.getItem('iba-arkanoid-best') || 0) || 0;
  let keys = {left:false,right:false}, mouseX = W / 2;
  let controlMode = 'pointer';
  let paddle = {x: W/2-54, y:H-41, w:108, h:13, speed:660};
  let ball = {x:W/2,y:H-53,vx:180,vy:-290,r:7,stuck:true};
  let bricks = [], powerUps = [], particles = [], stars = [];
  let effectWide = 0, effectSlow = 0, messageTime = 0, message = '';
  let previousTime = 0;
  const rows = 6, cols = 11, bw = 61, bh = 19, gap = 8, offsetX = (W-(cols*bw+(cols-1)*gap))/2, offsetY = 81;
  const palette = ['#ff568f','#ffac69','#f7d96b','#55e2e8','#6599fc','#ad84ff'];
  let seed = 13;
  const random = () => {seed = (seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<55;i++) stars.push({x:random()*W,y:random()*H,r:.5+random()*1.1,a:.08+random()*.28});
  const T = () => txt[lang];
  const fmt = (n) => String(n).padStart(6,'0');
  const clamp = (n,lo,hi) => Math.max(lo,Math.min(hi,n));
  function beep(freq=440,duration=.06,type='sine',vol=.04){
    if(!sound)return;
    try{
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      if(audioCtx.state==='suspended') audioCtx.resume();
      const osc=audioCtx.createOscillator(), gain=audioCtx.createGain(), now=audioCtx.currentTime;
      osc.type=type; osc.frequency.setValueAtTime(freq,now);
      gain.gain.setValueAtTime(vol,now); gain.gain.exponentialRampToValueAtTime(.001,now+duration);
      osc.connect(gain);gain.connect(audioCtx.destination);osc.start(now);osc.stop(now+duration);
    }catch(e){/* audio unavailable */}
  }
  function updateHUD(){
    $('score').textContent=fmt(score);$('best').textContent=fmt(best);
    $('level').textContent=`${String(level).padStart(2,'0')} / 08`;
    $('lives').textContent=Array(Math.max(0,lives)).fill('♥').join(' ') || '—';
  }
  function setScore(n){
    score+=n;
    if(score>best){best=score;try{localStorage.setItem('iba-arkanoid-best',String(best));}catch(e){}}
    updateHUD();
  }
  function translate(){
    const t=T();
    for(const id of ['subtitle','scoreLabel','levelLabel','livesLabel','bestLabel','controlsHint','footerHint']){
      const key={scoreLabel:'score',levelLabel:'level',livesLabel:'lives',bestLabel:'best',controlsHint:'hint',footerHint:'footer'}[id] || id;
      $(id).textContent=t[key];
    }
    $('eyebrow').textContent=t.eyebrow;
    document.documentElement.lang=lang;
    $('pauseLabel').textContent=state==='paused'?t.resume:t.pause;
    $('restartLabel').textContent=t.restart;
    $('langBtn').textContent=lang==='sk'?'🇸🇰 SK':'🇬🇧 EN';
    $('langBtn').title=lang==='sk'?'Switch to English':'Prepnúť do slovenčiny';
    $('soundBtn').textContent='♫ '+(sound?t.soundOn:t.soundOff);
    if(state!=='playing')showOverlay(overlayMode,false);
  }
  function showOverlay(mode, update=true){
    overlayMode=mode;
    const t=T(), data={
      start:[t.ready,t.title,t.intro,t.start],
      next:[`${t.stage} ${String(level).padStart(2,'0')}`,t.next,t.nextText,t.continue],
      over:[t.ready,t.over,t.overText,t.again],
      win:[t.allClear,t.win,t.winText,t.again],
      paused:[t.ready,t.paused,t.pausedText,t.resumeBtn]
    }[mode];
    $('overlayTag').textContent=data[0];$('overlayTitle').textContent=data[1];$('overlayText').textContent=data[2];$('playBtn').textContent=data[3];
    $('overlay').classList.remove('hidden');
    if(update)updateHUD();
  }
  function hideOverlay(){$('overlay').classList.add('hidden');}
  function buildLevel(){
    bricks=[];powerUps=[];particles=[];effectWide=0;effectSlow=0;paddle.w=108;
    const maxRow=Math.min(rows,3+Math.ceil(level/2));
    for(let r=0;r<maxRow;r++)for(let c=0;c<cols;c++){
      const hole=(level>=2 && (r+c+level)%((level%3)+5)===0) || (level>=5 && r===2 && c===5);
      if(hole)continue;
      const hp=(level>=3 && r<Math.floor(level/2) && (r+c)%3===0)?2:1;
      bricks.push({x:offsetX+c*(bw+gap),y:offsetY+r*(bh+gap),w:bw,h:bh,hp,maxHp:hp,color:palette[(r+level-1)%palette.length]});
    }
    paddle.x=W/2-paddle.w/2;resetBall();updateHUD();
  }
  function resetBall(){
    ball={x:paddle.x+paddle.w/2,y:paddle.y-9,vx:(level%2?-1:1)*(170+level*9),vy:-(280+level*13),r:7,stuck:true};
  }
  function launch(){
    if(!ball.stuck||state!=='playing')return;
    ball.stuck=false;beep(460,.12,'triangle');
  }
  function startNew(){level=1;lives=3;score=0;buildLevel();state='playing';hideOverlay();updateHUD();}
  function advance(){level++;buildLevel();state='playing';hideOverlay();}
  function resume(){state='playing';hideOverlay();$('pauseLabel').textContent=T().pause;previousTime=performance.now();}
  function togglePause(){
    if(state==='playing'){state='paused';keys.left=false;keys.right=false;showOverlay('paused');$('pauseLabel').textContent=T().resume;}
    else if(state==='paused') resume();
  }
  function playAction(){
    if(overlayMode==='start'||overlayMode==='over'||overlayMode==='win')startNew();
    else if(overlayMode==='next')advance();
    else if(overlayMode==='paused')resume();
  }
  function burst(x,y,color,count=7){for(let i=0;i<count;i++){let a=random()*Math.PI*2,s=50+random()*170;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.3+random()*.36,color});}}
  function dropPowerUp(x,y){
    const r=random();if(r>.15)return;
    const type=r<.047?'wide':r<.102?'slow':'life';
    powerUps.push({x,y,vy:115,type,r:12});
  }
  function activatePowerUp(type){
    if(type==='wide'){effectWide=13;paddle.w=165;message=T().bonusWide;beep(580,.17,'triangle');}
    else if(type==='slow'){
      effectSlow=10;ball.vx*=.77;ball.vy*=.77;message=T().bonusSlow;beep(400,.17,'triangle');
    }else{lives=Math.min(6,lives+1);message=T().bonusLife;beep(700,.22,'sine');}
    messageTime=1.7;updateHUD();
  }
  function collideCircleRect(b,rect){
    const px=clamp(b.x,rect.x,rect.x+rect.w), py=clamp(b.y,rect.y,rect.y+rect.h);
    const dx=b.x-px,dy=b.y-py;return dx*dx+dy*dy<=b.r*b.r;
  }
  function step(dt){
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=150*dt;p.life-=dt;}
    particles=particles.filter(p=>p.life>0);
    if(messageTime>0)messageTime-=dt;
    if(state!=='playing')return;
    if(effectWide>0){effectWide-=dt;if(effectWide<=0){const center=paddle.x+paddle.w/2;paddle.w=108;paddle.x=clamp(center-54,0,W-108);}}
    if(effectSlow>0){effectSlow-=dt;if(effectSlow<=0){ball.vx/= .77;ball.vy/= .77;}}
    const oldX=paddle.x;
    if(keys.left)paddle.x-=paddle.speed*dt;
    if(keys.right)paddle.x+=paddle.speed*dt;
    if(controlMode==='pointer'&&!keys.left&&!keys.right)paddle.x+=(mouseX-(paddle.x+paddle.w/2))*Math.min(1,dt*15);
    paddle.x=clamp(paddle.x,8,W-paddle.w-8);
    if(ball.stuck){ball.x=paddle.x+paddle.w/2;ball.y=paddle.y-ball.r-2;}
    else {
      // Fixed substeps prevent fast ball from tunneling through thin bricks.
      const distance=Math.hypot(ball.vx,ball.vy)*dt;
      const segments=Math.max(1,Math.ceil(distance/(ball.r*.8)));
      for(let s=0;s<segments;s++){
        const d=dt/segments, prevX=ball.x,prevY=ball.y;
        ball.x+=ball.vx*d;ball.y+=ball.vy*d;
        if(ball.x-ball.r<0){ball.x=ball.r;ball.vx=Math.abs(ball.vx);beep(260,.03);}
        if(ball.x+ball.r>W){ball.x=W-ball.r;ball.vx=-Math.abs(ball.vx);beep(260,.03);}
        if(ball.y-ball.r<0){ball.y=ball.r;ball.vy=Math.abs(ball.vy);beep(260,.03);}
        if(ball.vy>0&&collideCircleRect(ball,paddle)&&prevY<=paddle.y){
          ball.y=paddle.y-ball.r-1;
          const impact=(ball.x-(paddle.x+paddle.w/2))/(paddle.w/2);
          const speed=Math.min(640,Math.max(320,Math.hypot(ball.vx,ball.vy)+4));
          ball.vx=speed*Math.sin(clamp(impact,-.95,.95)*1.12)+(paddle.x-oldX)*.28;
          ball.vy=-Math.sqrt(Math.max(120*120,speed*speed-ball.vx*ball.vx));
          beep(310,.055,'triangle');
        }
        for(let i=bricks.length-1;i>=0;i--){
          const br=bricks[i];if(!collideCircleRect(ball,br))continue;
          const crossedX=prevX+ball.r<=br.x || prevX-ball.r>=br.x+br.w;
          if(crossedX)ball.vx*=-1;else ball.vy*=-1;
          br.hp--;burst(ball.x,ball.y,br.color,br.hp?3:7);
          setScore(br.hp?5:10+level*2);beep(br.hp?320:450+level*30,.055,'square',.022);
          if(br.hp<=0){bricks.splice(i,1);dropPowerUp(br.x+br.w/2,br.y+br.h/2);}
          break;
        }
        if(ball.y-ball.r>H){
          lives--;updateHUD();beep(160,.25,'sawtooth',.035);
          if(lives<=0){state='over';showOverlay('over');}
          else{resetBall();}
          break;
        }
        if(bricks.length===0){
          state=level>=8?'win':'next';
          beep(740,.2,'triangle');showOverlay(state);break;
        }
      }
    }
    for(const p of powerUps){
      p.y+=p.vy*dt;
      if(p.y+p.r>paddle.y && p.y-p.r<paddle.y+paddle.h && p.x>paddle.x-12&&p.x<paddle.x+paddle.w+12){p.used=true;activatePowerUp(p.type);}
    }
    powerUps=powerUps.filter(p=>!p.used&&p.y<H+30);
  }
  function rounded(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function draw(){
    ctx.clearRect(0,0,W,H);
    const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#0e1935');grad.addColorStop(1,'#070d1c');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#24345335';ctx.lineWidth=1;
    for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    for(const s of stars){ctx.globalAlpha=s.a;ctx.fillStyle='#b9eaff';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,2*Math.PI);ctx.fill();}ctx.globalAlpha=1;
    ctx.textAlign='center';ctx.font='bold 11px system-ui';ctx.fillStyle='#4a638c';ctx.fillText(`iBASTERISK · ${T().stage} ${String(level).padStart(2,'0')}`,W/2,33);
    for(const b of bricks){
      ctx.shadowColor=b.color;ctx.shadowBlur=b.hp===2?3:8;
      ctx.fillStyle=b.hp===2?'#283858':b.color;rounded(b.x,b.y,b.w,b.h,4);ctx.fill();
      ctx.shadowBlur=0;ctx.fillStyle=b.hp===2?b.color:'#ffffff35';rounded(b.x+3,b.y+2,b.w-6,3,2);ctx.fill();
    }
    ctx.shadowColor=effectWide>0?'#f6d365':'#36e5ed';ctx.shadowBlur=20;
    ctx.fillStyle=effectWide>0?'#f6d365':'#36e5ed';rounded(paddle.x,paddle.y,paddle.w,paddle.h,7);ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle='#ffffff90';rounded(paddle.x+9,paddle.y+2,paddle.w-18,3,2);ctx.fill();
    ctx.shadowColor='#ffffff';ctx.shadowBlur=18;ctx.fillStyle='#f5faff';ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    for(const p of powerUps){
      const color=p.type==='wide'?'#ffda67':p.type==='slow'?'#a58cff':'#fc669c';ctx.shadowBlur=9;ctx.shadowColor=color;
      ctx.fillStyle=color;rounded(p.x-12,p.y-12,24,24,6);ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle='#111a30';ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.fillText(p.type==='wide'?'W':p.type==='slow'?'S':'+',p.x,p.y+5);
    }
    for(const p of particles){ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3);}ctx.globalAlpha=1;
    if(ball.stuck&&state==='playing'){ctx.fillStyle='#a2b4d8';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillText(T().launch,W/2,H-85);}
    if(messageTime>0){ctx.fillStyle='#ffdc76';ctx.font='bold 20px system-ui';ctx.fillText(message,W/2,H/2);}
  }
  function loop(now){
    let dt=previousTime?Math.min(.032,(now-previousTime)/1000):0;
    previousTime=now;
    step(dt);draw();requestAnimationFrame(loop);
  }
  $('playBtn').addEventListener('click',playAction);
  $('pauseBtn').addEventListener('click',togglePause);
  $('restartBtn').addEventListener('click',()=>{state='menu';showOverlay('start');$('pauseLabel').textContent=T().pause;});
  $('langBtn').addEventListener('click',()=>{lang=lang==='sk'?'en':'sk';try{localStorage.setItem('iba-arkanoid-lang',lang);}catch(e){}translate();});
  $('soundBtn').addEventListener('click',()=>{sound=!sound;try{localStorage.setItem('iba-arkanoid-sound',sound?'on':'off');}catch(e){}translate();if(sound)beep(550);});
  document.addEventListener('keydown',(e)=>{
    if(['ArrowLeft','ArrowRight','Space','KeyA','KeyD'].includes(e.code))e.preventDefault();
    if(e.code==='ArrowLeft'||e.code==='KeyA'){controlMode='keyboard';keys.left=true;}
    if(e.code==='ArrowRight'||e.code==='KeyD'){controlMode='keyboard';keys.right=true;}
    if(e.code==='Space'&&!e.repeat){
      if(state==='playing')ball.stuck?launch():togglePause();
      else playAction();
    }
  });
  document.addEventListener('keyup',(e)=>{if(e.code==='ArrowLeft'||e.code==='KeyA')keys.left=false;if(e.code==='ArrowRight'||e.code==='KeyD')keys.right=false;});
  function pointer(e){
    if(e.type==='pointerdown') controlMode='pointer';
    if(controlMode!=='pointer' && e.type!=='pointerdown') return;
    const rect=canvas.getBoundingClientRect();
    mouseX=clamp((e.clientX-rect.left)*W/rect.width,0,W);
    if(state==='playing'&&ball.stuck&&e.type==='pointerdown')launch();
  }
  canvas.addEventListener('pointermove',pointer);canvas.addEventListener('pointerdown',pointer);
  for(const [id,dir] of [['leftBtn','left'],['rightBtn','right']]){
    const btn=$(id);btn.addEventListener('pointerdown',(e)=>{e.preventDefault();controlMode='keyboard';keys[dir]=true;btn.setPointerCapture(e.pointerId);});
    for(const ev of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(ev,()=>{keys[dir]=false;});
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')togglePause();});
  window.addEventListener('blur',()=>{if(state==='playing')togglePause();});
  buildLevel();translate();updateHUD();requestAnimationFrame(loop);
})();
