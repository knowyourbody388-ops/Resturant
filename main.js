document.addEventListener('DOMContentLoaded',()=>{
  AOS.init({duration:850,once:true,offset:80});
  const buttons=document.querySelectorAll('[data-filter]');
  const cards=document.querySelectorAll('[data-category]');
  buttons.forEach(btn=>btn.addEventListener('click',()=>{buttons.forEach(b=>b.classList.remove('active'));btn.classList.add('active');const f=btn.dataset.filter;cards.forEach(c=>{c.style.display=(f==='all'||c.dataset.category===f)?'block':'none';});}));

  document.querySelectorAll('.navbar .nav-link, .navbar .btn').forEach(link=>link.addEventListener('click',()=>{const nav=document.getElementById('nav'); if(nav && nav.classList.contains('show') && window.bootstrap){bootstrap.Collapse.getOrCreateInstance(nav).hide();}}));
  if(document.querySelector('.gallery-swiper')) new Swiper('.gallery-swiper',{slidesPerView:1,spaceBetween:20,loop:true,autoplay:{delay:2500},breakpoints:{768:{slidesPerView:2},992:{slidesPerView:3}},pagination:{el:'.swiper-pagination',clickable:true}});
});


// Advanced UI interactions
window.addEventListener('load',()=>{const p=document.getElementById('preloader'); if(p) setTimeout(()=>p.classList.add('hide'),350);});
window.addEventListener('scroll',()=>{const h=document.documentElement; const progress=document.getElementById('scrollProgress'); if(progress){const sc=h.scrollTop/(h.scrollHeight-h.clientHeight)*100; progress.style.width=sc+'%';} const top=document.getElementById('backToTop'); if(top) top.classList.toggle('show', window.scrollY>650);});
document.addEventListener('DOMContentLoaded',()=>{const top=document.getElementById('backToTop'); if(top) top.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));});


// NamkeenCart: click menu items, build WhatsApp order message, persist with LocalStorage
(function(){
  const CART_KEY='namkeen_order_cart_v1';
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const onlyDigits=(n)=>String(n||'').replace(/\D/g,'');
  const getCMS=()=>window.NAMKEEN_CMS || (typeof loadCMS==='function'?loadCMS():{}) || {};
  const getSettings=()=> (getCMS().settings || {});
  const loadCart=()=>{try{return JSON.parse(localStorage.getItem(CART_KEY)||'[]')}catch(e){return []}};
  const saveCart=(cart)=>localStorage.setItem(CART_KEY,JSON.stringify(cart));
  function getWaBase(){
    const s=getSettings();
    let digits=onlyDigits(s.whatsappNumber || '02089337554');
    if(digits.startsWith('0')) digits='44'+digits.slice(1);
    return 'https://wa.me/'+digits+'?text=';
  }
  function buildMessage(){
    const s=getSettings();
    const cart=loadCart();
    if(!cart.length) return s.whatsappMessage || 'Hello Namkeen Restaurant Tooting, I would like to place an order.';
    const lines=[];
    lines.push('Hello '+(s.brandName || 'Restaurant')+', I would like to place this order:');
    lines.push('');
    cart.forEach((item,i)=> lines.push(`${i+1}. ${item.name} x${item.qty} - ${item.price}`));
    lines.push('');
    lines.push('Please confirm availability and total price.');
    return lines.join('\n');
  }
  function whatsappLink(){return getWaBase()+encodeURIComponent(buildMessage());}
  function updateOrderLinks(){
    qsa('a[href*="wa.me"], #cartWhatsappBtn').forEach(a=>{a.href=whatsappLink();});
  }
  function addItem(item){
    const cart=loadCart();
    const key=(item.name+'|'+item.price).toLowerCase();
    const existing=cart.find(x=>(x.name+'|'+x.price).toLowerCase()===key);
    if(existing) existing.qty+=1; else cart.push({...item, qty:1});
    saveCart(cart); renderCart(true); showAddedPulse();
  }
  function changeQty(index,delta){
    const cart=loadCart();
    if(!cart[index]) return;
    cart[index].qty += delta;
    if(cart[index].qty<=0) cart.splice(index,1);
    saveCart(cart); renderCart();
  }
  function removeItem(index){const cart=loadCart(); cart.splice(index,1); saveCart(cart); renderCart();}
  function clearCart(){saveCart([]); renderCart();}
  function totalQty(){return loadCart().reduce((sum,i)=>sum+(Number(i.qty)||0),0)}
  function renderCart(briefOpen=false){
    const cart=loadCart();
    const box=qs('#cartItems');
    const total=qs('#cartTotalCount');
    const badge=qs('#cartBadge');
    const count=totalQty();
    if(total) total.textContent=count;
    if(badge) badge.textContent=count;
    if(box){
      if(!cart.length){box.innerHTML='<p class="cart-empty">Your cart is empty. Click any menu item to add it here.</p>'}
      else box.innerHTML=cart.map((it,i)=>`<div class="cart-item"><div><h4>${esc(it.name)}</h4><small>${esc(it.category||'Menu Item')}</small><div class="qty-controls"><button type="button" data-cart-dec="${i}">−</button><span>${it.qty}</span><button type="button" data-cart-inc="${i}">+</button></div><button class="remove-item" type="button" data-cart-remove="${i}">Remove</button></div><div class="cart-price">${esc(it.price)}</div></div>`).join('');
    }
    updateOrderLinks();
    if(briefOpen && window.innerWidth>800){openCart(); setTimeout(()=>{const d=qs('#orderCartDrawer'); if(d&&d.classList.contains('show')) closeCart();},900)}
  }
  function openCart(){const d=qs('#orderCartDrawer'); if(d){d.classList.add('show');d.setAttribute('aria-hidden','false')}}
  function closeCart(){const d=qs('#orderCartDrawer'); if(d){d.classList.remove('show');d.setAttribute('aria-hidden','true')}}
  function showAddedPulse(){const f=qs('#cartFloat'); if(!f) return; f.classList.add('pulse-added'); setTimeout(()=>f.classList.remove('pulse-added'),450)}
  function bindCart(){
    qsa('.menu-card').forEach(card=>{
      if(card.dataset.cartBound) return;
      card.dataset.cartBound='1';
      if(!card.classList.contains('orderable-item')) card.classList.add('orderable-item');
      if(!card.querySelector('.add-cart-btn')) card.insertAdjacentHTML('beforeend','<button type="button" class="add-cart-btn">Add to order</button>');
      card.addEventListener('click',(e)=>{
        e.preventDefault();
        const name=card.dataset.menuName || card.querySelector('h3')?.textContent?.trim() || 'Menu item';
        const price=card.dataset.menuPrice || card.querySelector('.price')?.textContent?.trim() || '';
        const category=card.dataset.menuCategory || card.querySelector('.cat')?.textContent?.trim() || '';
        addItem({name,price,category});
      });
    });
  }
  document.addEventListener('DOMContentLoaded',()=>{
    bindCart(); renderCart(); updateOrderLinks();
    qs('#cartFloat')?.addEventListener('click',openCart);
    qs('#cartClose')?.addEventListener('click',closeCart);
    qs('#orderCartDrawer')?.addEventListener('click',(e)=>{if(e.target.id==='orderCartDrawer') closeCart();});
    qs('#cartClearBtn')?.addEventListener('click',clearCart);
    document.addEventListener('click',(e)=>{
      const inc=e.target.closest('[data-cart-inc]'); const dec=e.target.closest('[data-cart-dec]'); const rem=e.target.closest('[data-cart-remove]');
      if(inc){changeQty(Number(inc.dataset.cartInc),1)}
      if(dec){changeQty(Number(dec.dataset.cartDec),-1)}
      if(rem){removeItem(Number(rem.dataset.cartRemove))}
      const wa=e.target.closest('a[href*="wa.me"]'); if(wa) wa.href=whatsappLink();
    });
    // Re-bind after CMS/menu filters or admin data renders menu dynamically.
    setTimeout(bindCart,250); setTimeout(()=>{bindCart();renderCart();},900);
  });
  window.NamkeenCart={loadCart,clearCart,renderCart,whatsappLink};
})();
