'use client';

import { useLayoutEffect } from 'react';
import { animate, inView } from 'framer-motion';

type Variant = {hash:string; mediaQuery:string};
type Cleanup = () => void;
const all = <T extends Element = HTMLElement>(root: ParentNode, selector: string) => Array.from(root.querySelectorAll<T>(selector));
const marqueeTrackSelector = 'ul[style*="flex-direction:row"],ul[style*="flex-direction: row"]';

/** Owns behavior only. All layout, typography and artwork come from the template. */
export default function TemplateInteractions({ route }: {route:string}) {
  useLayoutEffect(() => {
    const root = document.getElementById('template-root');
    if (!root) return;
    const cleanups: Cleanup[] = [];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const listen = (el: EventTarget, event: string, handler: EventListener) => {
      el.addEventListener(event,handler); cleanups.push(() => el.removeEventListener(event,handler));
    };
    const action = (el: HTMLElement, callback: () => void, label?: string) => {
      el.tabIndex=0; el.setAttribute('role','button');
      if (label) el.setAttribute('aria-label',label);
      listen(el,'click',callback);
      listen(el,'keydown',((e:KeyboardEvent) => {if(e.key==='Enter'||e.key===' '){e.preventDefault();callback();}}) as EventListener);
    };
    const responsive = () => {
      all(root,'[data-responsive-variants]').forEach(el => {
        const variants:Variant[]=JSON.parse(el.dataset.responsiveVariants!);
        const selected=variants.find(v=>matchMedia(v.mediaQuery).matches);
        if(selected){variants.forEach(v=>el.classList.remove('framer-'+v.hash));el.classList.add('framer-'+selected.hash);}
      });
    };
    responsive(); listen(window,'resize',responsive);

    // Original Framer entrance settings (including spring timing and transforms).
    if(!reduced) all(root,'[data-motion-from]').forEach(el=>{
      const from=el.dataset.motionFrom || 'translateY(20px)';
      const to=el.dataset.motionTo || 'none';
      let transition={duration:.8,delay:0};
      if(el.dataset.entrance){
        const variants=JSON.parse(el.dataset.entrance);
        const chosen=Object.keys(variants).find(k=>k!=='default'&&root.querySelector('.framer-'+k));
        const config=variants[chosen || 'default'] || Object.values(variants)[0];
        transition={...transition,...config.animate.transition};
        if(config.animate.rotate) el.dataset.motionTo=`${config.transformTemplate?.includes('translateX(-50%)')?'translateX(-50%) ':''}rotate(${config.animate.rotate}deg)`;
      }
      // Marquee tracks own their transform; animating it here would stop the loop, so they only fade in.
      const isTrack=el.matches(marqueeTrackSelector);
      el.style.opacity='0';if(!isTrack)el.style.transform=from;
      const stop=inView(el,()=>{
        const control=animate(el,isTrack?{opacity:[0,1]}:{opacity:[0,1],transform:[from,el.dataset.motionTo || to]},{...transition,ease:[.22,1,.36,1]});
        cleanups.push(()=>control.stop());
      },{amount:0.08});
      cleanups.push(stop);
    });

    // Button labels roll vertically and the raised button face depresses on hover.
    all(root,'a[data-reset="button"],button[data-reset="button"]').forEach(button=>{
      const face=button.querySelector<HTMLElement>('[data-framer-name="Hover Text"]');
      if(!face)return;
      listen(button,'mouseenter',()=>{animate(face,{y:3},{duration:.2});});
      listen(button,'mouseleave',()=>{animate(face,{y:0},{duration:.2});});
    });

    // Accordion retains the source component variants and measured-height motion.
    all(root,'.framer-40u7o').forEach((card,index)=>{
      const question=card.querySelector<HTMLElement>('[data-framer-name="Question"]');
      const answer=card.querySelector<HTMLElement>('[data-framer-name="Answer"]');
      const icon=question?.querySelector<HTMLElement>('[data-framer-name="Icon"]');
      if(!question||!answer)return;
      let open=card.dataset.framerName==='Open';
      const id=`faq-${index}`;answer.id=id;question.setAttribute('aria-controls',id);
      const render=(instant=false)=>{
        question.setAttribute('aria-expanded',String(open));
        card.classList.toggle('framer-v-18b433x',open);card.classList.toggle('framer-v-myk8ro',!open);
        card.style.backgroundColor=open?'#f6e1cc':'transparent';
        card.style.boxShadow=open?'0 6px 0 #000':'none';
        card.style.setProperty('--border-bottom-width',open?'1px':'0px');
        card.style.setProperty('--border-top-width',open?'1px':'0px');
        card.style.setProperty('--border-left-width',open?'1px':'0px');
        card.style.setProperty('--border-right-width',open?'1px':'0px');
        card.style.setProperty('--border-color',open?'#1a160a':'transparent');
        answer.style.overflow='hidden';
        answer.style.height=open?'auto':'0px';answer.style.opacity=open?'1':'0';
        if(!instant&&open&&!reduced)animate(answer,{height:[0,answer.scrollHeight],opacity:[0,1]},{duration:.3,onComplete:()=>{answer.style.height='auto';}});
        if(icon){icon.style.backgroundColor=open?'#e8442e':'#1a160a';animate(icon,{rotate:open?135:0},{duration:instant?0:.25});}
        const line=card.querySelector<HTMLElement>(':scope > [data-framer-name="Line"]');if(line)line.style.opacity=open?'0':'1';
      };
      render(true);action(question,()=>{open=!open;render();});
    });

    // Three fully populated case-study panels, with keyboard-accessible selectors.
    all(root,'.framer-MaY1h').forEach(carousel=>{
      const left=carousel.querySelector<HTMLElement>(':scope > [data-framer-name="Left"]');
      const right=carousel.querySelector<HTMLElement>(':scope > [data-framer-name="Right"]');
      if(!left||!right)return;
      const tabs=all(left,':scope > [data-framer-name^="Case "]');
      const panels=all(right,':scope > [data-framer-name^="Case "]');
      let selected=0;
      const select=(index:number,initial=false)=>{
        selected=Math.max(0,Math.min(panels.length-1,index));
        panels.forEach((panel,i)=>{panel.dataset.casePanel='';panel.hidden=i!==selected;panel.style.position=i===selected?'relative':'absolute';panel.style.opacity=i===selected?'1':'0';if(i===selected&&!initial&&!reduced)animate(panel,{opacity:[0,1],y:[12,0]},{duration:.35});});
        tabs.forEach((tab,i)=>{tab.dataset.caseTab='';tab.setAttribute('aria-selected',String(i===selected));});
      };
      tabs.forEach((tab,i)=>action(tab,()=>select(i),`Show ${tab.textContent?.trim()}`));
      all(carousel,'[data-framer-name="Left Arrow"],[data-framer-name="Right Arrow"]').forEach(arrow=>{
        const next=arrow.dataset.framerName==='Right Arrow';arrow.dataset.caseArrow='';
        action(arrow,()=>select((selected+(next?1:-1)+panels.length)%panels.length),next?'Next case study':'Previous case study');
      });select(0,true);
    });

    // The curved ticker's path only spans x=-120..1320 of its 1200-wide viewBox, so on screens
    // wider than 1440px the band stops short of the edges. Extend both ends flat to the viewport edges.
    all<SVGSVGElement>(root,'[data-framer-name="Curved Ticker"] svg').forEach(svg=>{
      const paths=all<SVGPathElement>(svg,'path');
      const original=paths[0]?.getAttribute('d');
      if(!original)return;
      const points=[...original.matchAll(/[ML]\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
      if(points.length<2)return;
      const [first,last]=[points[0],points[points.length-1]];
      const viewBoxWidth=svg.viewBox.baseVal?.width||1200;
      const fit=()=>{
        const width=svg.clientWidth,height=svg.clientHeight;
        if(!width||!height)return;
        const scale=Math.min(width/viewBoxWidth,height/(svg.viewBox.baseVal?.height||140));
        const half=width/scale/2+40;
        const left=viewBoxWidth/2-half,right=viewBoxWidth/2+half;
        let d=original;
        if(left<first[0])d=`M${left.toFixed(2)} ${first[1]} L`+d.replace(/^M\s*/,'');
        if(right>last[0])d+=` L${right.toFixed(2)} ${last[1]}`;
        paths.forEach(path=>path.setAttribute('d',d));
      };
      fit();
      const observer=new ResizeObserver(fit);observer.observe(svg);
      cleanups.push(()=>{observer.disconnect();paths.forEach(path=>path.setAttribute('d',original));});
    });
    // Original curved SVG ticker, driven by Motion rather than Framer's runtime.
    if(!reduced)all<SVGTextPathElement>(root,'textPath').forEach(textPath=>{
      const distance=textPath.getComputedTextLength()/4;
      if(!distance)return;
      const control=animate(0,-distance,{duration:distance/70,ease:'linear',repeat:Infinity,onUpdate:value=>textPath.setAttribute('startOffset',String(value))});
      cleanups.push(()=>control.stop());
    });
    // Continuous tracks: the "Grow with us" title ticker drifts left-to-right; the client DM cards
    // drift right-to-left, pause on hover and can be dragged (with momentum) in either direction.
    if(!reduced)all<HTMLUListElement>(root,marqueeTrackSelector).forEach(track=>{
      const items=Array.from(track.children);
      if(!items.length)return;
      const gap=parseFloat(getComputedStyle(track).gap)||0;
      const distance=items.reduce((sum,el)=>sum+el.getBoundingClientRect().width+gap,0);
      if(!distance)return;
      const copies=items.map(el=>el.cloneNode(true) as HTMLElement);
      copies.forEach(el=>{el.setAttribute('aria-hidden','true');track.appendChild(el);});
      const isTitle=!!track.closest('[data-framer-name="Title Ticker"]');
      const direction=isTitle?1:-1, speed=isTitle?60:30;
      const surface=track.parentElement||track;
      let x=isTitle?-distance:0, hovering=false, dragging=false, moved=false, velocity=0;
      let startX=0, startOffset=0, lastX=0, lastTime=0, frame=0, previous=performance.now();
      const wrap=(value:number)=>{const v=value%distance;return v>0?v-distance:v;};
      const tick=(now:number)=>{
        const dt=Math.min(64,now-previous)/1000;previous=now;
        if(!dragging){
          if(Math.abs(velocity)>8){x+=velocity*dt;velocity*=Math.pow(0.04,dt);}
          else{velocity=0;if(!hovering)x+=direction*speed*dt;}
        }
        x=wrap(x);track.style.transform=`translate3d(${x}px,0,0)`;
        frame=requestAnimationFrame(tick);
      };
      frame=requestAnimationFrame(tick);
      cleanups.push(()=>{cancelAnimationFrame(frame);copies.forEach(el=>el.remove());track.style.transform='';});
      if(isTitle)return;
      surface.style.cursor='grab';surface.style.touchAction='pan-y';
      listen(surface,'mouseenter',()=>{hovering=true;});
      listen(surface,'mouseleave',()=>{hovering=false;});
      listen(surface,'dragstart',(e)=>e.preventDefault());
      listen(surface,'pointerdown',((e:PointerEvent)=>{
        if(e.button!==0)return;
        dragging=true;moved=false;velocity=0;startX=lastX=e.clientX;startOffset=x;lastTime=performance.now();
        surface.setPointerCapture(e.pointerId);surface.style.cursor='grabbing';
      }) as EventListener);
      listen(surface,'pointermove',((e:PointerEvent)=>{
        if(!dragging)return;
        const now=performance.now(),dx=e.clientX-startX;
        if(Math.abs(dx)>4)moved=true;
        x=startOffset+dx;
        if(now>lastTime){velocity=(e.clientX-lastX)/((now-lastTime)/1000);}
        lastX=e.clientX;lastTime=now;
      }) as EventListener);
      const release=((e:PointerEvent)=>{
        if(!dragging)return;
        dragging=false;surface.style.cursor='grab';
        if(surface.hasPointerCapture(e.pointerId))surface.releasePointerCapture(e.pointerId);
        if(performance.now()-lastTime>80)velocity=0;
        velocity=Math.max(-2500,Math.min(2500,velocity));
      }) as EventListener;
      listen(surface,'pointerup',release);listen(surface,'pointercancel',release);
      // Swallow the click that follows a drag so links inside cards don't fire.
      const swallow=(e:Event)=>{if(moved){e.preventDefault();e.stopPropagation();moved=false;}};
      surface.addEventListener('click',swallow,true);cleanups.push(()=>surface.removeEventListener('click',swallow,true));
    });

    all(root,'[data-framer-name="Menu Button"]').forEach(button=>{
      let menu:HTMLElement|null=null;
      const close=()=>{menu?.remove();menu=null;document.documentElement.classList.remove('yaw-locked');button.setAttribute('aria-expanded','false');};
      action(button,()=>{
        if(menu){close();return;}
        // App-style phone menu: every service one tap away, then company and account links.
        menu=document.createElement('nav');menu.className='clone-mobile-menu';menu.setAttribute('aria-label','Main navigation');menu.setAttribute('data-lenis-prevent','');
        const groups:[string,[string,string][]][]=[
          ['YouTube services',[['Buy YouTube Views','/buy-youtube-views/'],['Buy YouTube Subscribers','/buy-youtube-subscribers/'],['Buy YouTube Likes','/buy-youtube-likes/'],['Buy YouTube Watch Hours','/buy-youtube-watch-hours/']]],
          ['Google Ads services',[['Google Skip Ads Views','/buy-google-skip-ads-views/'],['Google Display Ads Views','/buy-google-display-ads-views/'],['Google Apps Download','/buy-google-apps-download/'],['Website / App Traffic','/buy-google-ads-website-traffic/']]],
          ['Company',[['About Us','/about-us/'],['Blog','/blog/'],['Tickets / Support','/contact/']]],
        ];
        groups.forEach(([title,links])=>{
          const group=document.createElement('div');group.className='clone-mobile-group';
          const h=document.createElement('p');h.textContent=title;group.appendChild(h);
          links.forEach(([label,href])=>{const a=document.createElement('a');a.textContent=label;a.href=href;if(location.pathname===href)a.setAttribute('aria-current','page');group.appendChild(a);});
          menu!.appendChild(group);
        });
        const account=document.createElement('div');account.className='clone-mobile-account';
        [['My Orders','/orders/'],['Login','/login/']].forEach(([label,href])=>{const a=document.createElement('a');a.textContent=label;a.href=href;account.appendChild(a);});
        menu.appendChild(account);
        document.body.appendChild(menu);document.documentElement.classList.add('yaw-locked');button.setAttribute('aria-expanded','true');
        if(!reduced)animate(menu,{opacity:[0,1],y:[-12,0]},{duration:.25});
      },'Toggle navigation');
      button.setAttribute('aria-expanded','false');
      listen(document,'keydown',((e:KeyboardEvent)=>{if(e.key==='Escape')close();}) as EventListener);
      cleanups.push(close);
    });

    // My Orders filter pills: signed-out visitors see the matching sign-in prompt.
    const ordersEmpty=root.querySelector<HTMLElement>('[data-orders-empty] h3');
    if(ordersEmpty)all<HTMLInputElement>(root,'input[name="filter"]').forEach(input=>listen(input,'change',()=>{
      const value=input.value.toLowerCase();
      ordersEmpty.textContent=value==='all orders'?'Log in to see your orders':`Log in to see orders that are ${value==='awaiting payment'?'awaiting payment':value}`;
    }));

    // Account forms post to their own service, never to the contact form endpoint (checkout lives in Commerce.tsx).
    const yawEndpoints:Record<string,string|undefined>={login:process.env.NEXT_PUBLIC_ACCOUNT_ENDPOINT,signup:process.env.NEXT_PUBLIC_ACCOUNT_ENDPOINT,forgot:process.env.NEXT_PUBLIC_ACCOUNT_ENDPOINT};
    const yawOffline:Record<string,string>={
      login:"Accounts aren't connected in this preview yet, so you can't sign in here. Nothing was sent.",
      signup:"Accounts aren't connected in this preview yet, so no account was created. Nothing was sent.",
      forgot:"Accounts aren't connected in this preview yet, so no reset email was sent.",
    };
    const yawSuccess:Record<string,string>={login:'/orders/',signup:'/orders/'};
    all<HTMLFormElement>(root,'form[data-yaw-form]').forEach(form=>{
      const kind=form.dataset.yawForm!;
      if(kind==='orders'){listen(form,'submit',e=>e.preventDefault());return;}
      listen(form,'submit',async(event)=>{
        event.preventDefault();
        let status=form.querySelector<HTMLElement>('.clone-form-status');
        if(!status){status=document.createElement('p');status.className='clone-form-status';status.setAttribute('role','status');form.appendChild(status);}
        const password=form.querySelector<HTMLInputElement>('input[name="password"]');
        const confirm=form.querySelector<HTMLInputElement>('input[name="confirmPassword"]');
        if(confirm&&password)confirm.setCustomValidity(confirm.value&&confirm.value!==password.value?'Passwords do not match.':'');
        if(!form.reportValidity())return;
        const endpoint=yawEndpoints[kind];
        if(!endpoint){status.textContent=yawOffline[kind];return;}
        const button=form.querySelector<HTMLButtonElement>('button[type="submit"]');if(button)button.disabled=true;
        status.textContent='Sending…';
        try{
          const result=await fetch(endpoint,{method:'POST',body:new FormData(form),credentials:'include'});
          if(!result.ok)throw new Error();
          const body=await result.json().catch(()=>({})) as {redirect?:string};
          if(body.redirect){window.location.assign(body.redirect);return;}
          if(yawSuccess[kind])window.location.assign(yawSuccess[kind]);else status.textContent='Done. Check your inbox for the next step.';
        }catch{status.textContent='Something went wrong. Please try again.';}
        finally{if(button)button.disabled=false;}
      });
    });

    all<HTMLFormElement>(root,'form:not([data-yaw-form])').forEach(form=>{
      listen(form,'submit',async(event)=>{
        event.preventDefault();if(!form.reportValidity())return;
        let status=form.querySelector<HTMLElement>('.clone-form-status');
        if(!status){status=document.createElement('p');status.className='clone-form-status';status.setAttribute('role','status');form.appendChild(status);}
        const endpoint=process.env.NEXT_PUBLIC_FORM_ENDPOINT;
        if(!endpoint){status.textContent="This preview isn't connected to a mailing or booking service yet. Nothing was sent.";return;}
        const button=form.querySelector<HTMLButtonElement>('button[type="submit"]');if(button)button.disabled=true;
        status.textContent='Sending…';
        try{const result=await fetch(endpoint,{method:'POST',body:new FormData(form)});if(!result.ok)throw new Error();window.location.assign('/thank-you/');}
        catch{status.textContent='Unable to send. Please try again.';}
        finally{if(button)button.disabled=false;}
      });
    });
    return()=>cleanups.forEach(cleanup=>cleanup());
  },[route]);
  return null;
}
