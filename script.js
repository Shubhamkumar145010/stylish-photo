const professionals=[
 {name:"Priya Sharma",role:"Electrician",category:"Home",icon:"👩🏽‍🔧",area:"Noida sector 18",rating:"4.9",reviews:128,copy:"Repairs, wiring and installations with clear quotes."},
 {name:"Dr. Neha Kapoor",role:"General Physician",category:"Medical",icon:"👩🏻‍⚕️",area:"Delhi NCR",rating:"4.9",reviews:96,copy:"Online and local consultations for common concerns."},
 {name:"Kabir Mehta",role:"Web Developer",category:"Digital",icon:"👨🏽‍💻",area:"Gurugram",rating:"4.9",reviews:114,copy:"Business websites, stores and web applications."},
 {name:"Aisha Khan",role:"Video Editor",category:"Digital",icon:"👩🏽‍🎨",area:"Delhi",rating:"4.8",reviews:86,copy:"Reels, YouTube videos and professional editing."},
 {name:"Rohan Verma",role:"Math Tutor",category:"Learning",icon:"👨🏽‍🏫",area:"Noida",rating:"5.0",reviews:73,copy:"Patient tutoring for school and competitive exams."},
 {name:"Meera Joshi",role:"Chartered Accountant",category:"Business",icon:"👩🏻‍💼",area:"Ghaziabad",rating:"4.8",reviews:54,copy:"Tax filing, GST and accounting support."},
 {name:"Arjun Singh",role:"Photographer",category:"Personal",icon:"📷",area:"Delhi NCR",rating:"4.9",reviews:61,copy:"Events, portraits and product photography."},
 {name:"Aman Plumbing",role:"Plumber",category:"Home",icon:"🔧",area:"Noida sector 62",rating:"4.7",reviews:43,copy:"Leaks, taps and bathroom repairs."}
];
const stores=[
 {name:"Sharma General Store",icon:"🛒",area:"0.8 km · Verified shop",products:[["Rice 5 kg","₹399"],["Milk 1 litre","₹64"]]},
 {name:"CarePlus Pharmacy",icon:"💊",area:"1.2 km · Verified shop",products:[["First-aid kit","₹249"],["Vitamin tablets","₹199"]]},
 {name:"Tiffin Ghar",icon:"🍱",area:"0.5 km · Verified kitchen",products:[["Veg thali","₹120"],["Dal chawal","₹90"]]}
];
const grid=document.querySelector("#professionalGrid"),search=document.querySelector("#globalSearch"),count=document.querySelector("#resultCount"),empty=document.querySelector("#emptyProfessionals"),modeNotice=document.querySelector("#modeNotice");
let activeCategory="All",cart=[];
let backendProfessionals=null;
async function loadProfessionals(){
 try{
  const response=await fetch(`/api/professionals?limit=50`,{headers:{"Accept":"application/json"}});
  if(!response.ok) return;
  const payload=await response.json();
  if(Array.isArray(payload.data)){backendProfessionals=payload.data;modeNotice.textContent="Live directory data · verification statuses are supplied by the secure backend.";modeNotice.classList.add("live")}
 }catch{
  backendProfessionals=null;
 }
 renderProfessionals();
}
function renderProfessionals(){
 const query=search.value.toLowerCase().trim();
 const source=backendProfessionals?.map(p=>({name:p.display_name,role:p.category,category:p.category,icon:"👤",area:p.service_area,rating:"—",reviews:0,copy:p.description}))||professionals;
 const matches=source.filter(p=>(activeCategory==="All"||p.category===activeCategory)&&(!query||`${p.name} ${p.role} ${p.category} ${p.area}`.toLowerCase().includes(query)));
 const badge=backendProfessionals?"Backend profile · status controlled":"Demo example · verification required";
 grid.innerHTML=matches.map(p=>`<article class="pro-card"><div class="pro-top"><span class="pro-avatar">${p.icon}</span><div><h3>${p.name}</h3><p>${p.role} · ${p.area}</p></div></div><span class="verified">${badge}</span><p>${p.copy}</p><div class="pro-footer"><span class="rating">★ ${p.rating} <span>(${p.reviews})</span></span><button class="connect-button" data-name="${p.name}">Request connection</button></div></article>`).join("");
 count.textContent=`${matches.length} professionals`;
 empty.style.display=matches.length?"none":"block";
 document.querySelectorAll(".connect-button").forEach(button=>button.addEventListener("click",()=>openModal("Request a connection",`Your request to connect with ${button.dataset.name} will stay private until accepted.`,"Send request")));
}
function renderStores(){
 document.querySelector("#storeGrid").innerHTML=stores.map(s=>`<article class="store-card"><div class="store-top"><span class="store-icon">${s.icon}</span><span class="verified">Example listing · review required</span></div><h3>${s.name}</h3><p>${s.area}</p>${s.products.map(p=>`<div class="product"><span>${p[0]}<br><small>${p[1]}</small></span><button class="add-button" data-product="${p[0]}" data-price="${p[1]}" data-store="${s.name}">Add</button></div>`).join("")}</article>`).join("");
 document.querySelectorAll(".add-button").forEach(button=>button.addEventListener("click",()=>{cart.push({product:button.dataset.product,price:button.dataset.price,store:button.dataset.store});renderCart()}));
}
function renderCart(){document.querySelector("#cartCount").textContent=`${cart.length} item${cart.length===1?"":"s"}`;document.querySelector("#cartSummary").textContent=cart.length?`${cart.length} item${cart.length===1?"":"s"} ready to order`:"Your cart is empty";document.querySelector("#reviewOrder").disabled=!cart.length}
const modal=document.querySelector("#actionModal"),modalTitle=document.querySelector("#modalTitle"),modalCopy=document.querySelector("#modalCopy"),modalSubmit=document.querySelector("#modalSubmit"),success=document.querySelector("#successMessage");
let accessToken=window.localStorage.getItem("localhelp_access_token")||"";
async function readAuthCallback(){
 const hash=new URLSearchParams(window.location.hash.replace(/^#/,""));
 const token=hash.get("access_token");
 const tokenHash=new URLSearchParams(window.location.search).get("token_hash");
 if(token){accessToken=token;window.localStorage.setItem("localhelp_access_token",token);history.replaceState({},document.title,window.location.pathname);success.textContent="You are signed in.";closeModal()}
 if(tokenHash){
  const type=new URLSearchParams(window.location.search).get("type")||"magiclink";
  const response=await fetch("/api/auth/verify-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tokenHash,type})});
  const payload=await response.json().catch(()=>null);
  if(response.ok&&payload?.data?.accessToken){accessToken=payload.data.accessToken;window.localStorage.setItem("localhelp_access_token",accessToken);history.replaceState({},document.title,window.location.pathname);success.textContent="You are signed in."}
 }
}
readAuthCallback();
function openModal(title,copy,submit){modalTitle.textContent=title;modalCopy.textContent=copy;modalSubmit.textContent=submit;success.textContent="";modal.classList.add("open");modal.setAttribute("aria-hidden","false");modal.querySelector("input").focus()}
function closeModal(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true")}
document.querySelector("#joinButton").addEventListener("click",()=>openModal("Join LocalHelp","Create a secure account with your email. We never ask for government documents in this app.","Send sign-in link"));
document.querySelector("#signInButton").addEventListener("click",()=>openModal("Sign in securely","We will send a one-time sign-in link to your email.","Send sign-in link"));
document.querySelector("#closeModal").addEventListener("click",closeModal);modal.addEventListener("click",event=>{if(event.target===modal)closeModal()});
document.querySelector("#actionForm").addEventListener("submit",async event=>{event.preventDefault();const submit=event.target.querySelector("button");submit.disabled=true;success.textContent="Sending secure sign-in link…";try{const response=await fetch("/api/auth/request-otp",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({emailOrPhone:event.target.contact.value.trim()})});if(response.ok){success.textContent="Check your email for the sign-in link.";event.target.reset()}else{const payload=await response.json().catch(()=>null);success.textContent=payload?.error?.message||"Secure authentication is not configured yet."}}catch{success.textContent="The secure service is unavailable. Please try again later."}finally{submit.disabled=false}});
document.querySelector("#searchButton").addEventListener("click",()=>{document.querySelector("#discover").scrollIntoView({behavior:"smooth"});renderProfessionals()});search.addEventListener("input",renderProfessionals);
document.querySelectorAll(".chip").forEach(button=>button.addEventListener("click",()=>{document.querySelector(".chip.active").classList.remove("active");button.classList.add("active");activeCategory=button.dataset.category;renderProfessionals()}));
document.querySelectorAll("[data-plan]").forEach(button=>button.addEventListener("click",()=>openModal(button.dataset.plan,"This plan is ready for secure checkout after a backend payment provider is connected. No card data is stored by LocalHelp.","Continue to checkout")));
async function submitProfessionalForm(form, endpoint, message, body){
 const button=form.querySelector("button[type=submit]");
 button.disabled=true;
 message.textContent="Saving securely…";
 try{
  const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json",...(accessToken?{Authorization:`Bearer ${accessToken}`}:{})},body:JSON.stringify(body)});
  const payload=await response.json().catch(()=>null);
  message.textContent=response.ok?"Saved. Your profile/work sample is ready for moderation.":payload?.error?.message||"Sign in is required before publishing.";
 }catch{message.textContent="The secure service is unavailable. Please try again later."}
 finally{button.disabled=false}
}
document.querySelector("#professionalProfileForm").addEventListener("submit",event=>{
 event.preventDefault();
 const form=event.target, data=new FormData(form);
 submitProfessionalForm(form,"/api/professional/profile",document.querySelector("#profileMessage"),{
  displayName:data.get("displayName"),category:data.get("category"),description:data.get("description"),
  serviceArea:data.get("serviceArea"),experienceYears:data.get("experienceYears")?Number(data.get("experienceYears")):undefined,
  availability:data.get("availability"),pricingSummary:data.get("pricingSummary")
 });
});
document.querySelector("#portfolioForm").addEventListener("submit",event=>{
 event.preventDefault();
 const form=event.target, data=new FormData(form);
 submitProfessionalForm(form,"/api/professional/portfolio",document.querySelector("#portfolioMessage"),{
  title:data.get("title"),description:data.get("description"),
  skills:String(data.get("skills")||"").split(",").map(skill=>skill.trim()).filter(Boolean),
  portfolioUrl:data.get("portfolioUrl")||undefined
 });
});
document.querySelector("#reviewOrder").addEventListener("click",()=>{const lines=cart.map(item=>`${item.product} from ${item.store} — ${item.price}`).join("\n");openModal("Review local order",`Your items:\n${lines}\n\nOrder requests require a configured store backend. No payment will be taken in this prototype.`,"Request order")});
renderProfessionals();renderStores();renderCart();loadProfessionals();
