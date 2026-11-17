'use client';

import { useLayoutEffect } from 'react';
import { animate, inView } from 'framer-motion';

type Variant = {hash:string; mediaQuery:string};
type Cleanup = () => void;
const all = <T extends Element = HTMLElement>(root: ParentNode, selector: string) => Array.from(root.querySelectorAll<T>(selector));

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
      el.style.opacity='0';el.style.transform=from;
      const stop=inView(el,()=>{
        const control=animate(el,{opacity:[0,1],transform:[from,el.dataset.motionTo || to]},{...transition,ease:[.22,1,.36,1]});
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

    // Original curved SVG ticker, driven by Motion rather than Framer's runtime.
    if(!reduced)all<SVGTextPathElement>(root,'textPath').forEach(textPath=>{
      const distance=textPath.getComputedTextLength()/4;
      if(!distance)return;
      const control=animate(0,-distance,{duration:distance/70,ease:'linear',repeat:Infinity,onUpdate:value=>textPath.setAttribute('startOffset',String(value))});
      cleanups.push(()=>control.stop());
    });
    // Continuous titles and DM cards share the original track gap and speed.
    if(!reduced)all<HTMLUListElement>(root,'ul[style*="flex-direction:row"],ul[style*="flex-direction: row"]').forEach(track=>{
      const items=Array.from(track.children);
      if(!items.length)return;
      const gap=parseFloat(getComputedStyle(track).gap)||0;
      const distance=items.reduce((sum,el)=>sum+el.getBoundingClientRect().width+gap,0);
      if(!distance)return;
      const copies=items.map(el=>el.cloneNode(true) as HTMLElement);
      copies.forEach(el=>{el.setAttribute('aria-hidden','true');track.appendChild(el);});
      const control=animate(track,{x:[0,-distance]},{duration:distance/(track.closest('[data-framer-name="Title Ticker"]')?60:30),ease:'linear',repeat:Infinity});
      listen(track,'mouseenter',()=>control.pause());listen(track,'mouseleave',()=>control.play());
      cleanups.push(()=>{control.stop();copies.forEach(el=>el.remove());});
    });

    all(root,'[data-framer-name="Menu Button"]').forEach(button=>{
      let menu:HTMLElement|null=null;
      const close=()=>{menu?.remove();menu=null;button.setAttribute('aria-expanded','false');};
      action(button,()=>{
        if(menu){close();return;}
        menu=document.createElement('nav');menu.className='clone-mobile-menu';menu.setAttribute('aria-label','Main navigation');
        const links=[['YouTube','/youtube-services/'],['Google Ads','/google-ads/'],['About','/about-us/'],['Blog','https://youtubeadwords.long-bar-2706.workers.dev/blog'],['Contact','/contact/'],['My Orders','https://youtubeadwords.long-bar-2706.workers.dev/orders']];
        links.forEach(([label,href])=>{const a=document.createElement('a');a.textContent=label;a.href=href;menu!.appendChild(a);});
        document.body.appendChild(menu);button.setAttribute('aria-expanded','true');
        if(!reduced)animate(menu,{opacity:[0,1],y:[-12,0]},{duration:.25});
      },'Toggle navigation');
      button.setAttribute('aria-expanded','false');
      listen(document,'keydown',((e:KeyboardEvent)=>{if(e.key==='Escape')close();}) as EventListener);
      cleanups.push(close);
    });

    all<HTMLFormElement>(root,'form').forEach(form=>{
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
