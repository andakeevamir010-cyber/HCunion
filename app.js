const $=id=>document.getElementById(id);
const defaults={aimEnabled:false,aimKey:"I",cpsEnabled:false,cpsValue:10,rodEnabled:false,rodCombo:"Rod → Sword",macros:[]};
let state={...defaults,...JSON.parse(localStorage.getItem("hcunion-config")||"{}")};
function save(){localStorage.setItem("hcunion-config",JSON.stringify(state));$("saveStatus").textContent="Saved locally ✓"}
function paint(){ $("aimEnabled").checked=state.aimEnabled;$("cpsEnabled").checked=state.cpsEnabled;$("cpsValue").value=state.cpsValue;$("cpsLabel").textContent=state.cpsValue+" CPS";$("rodEnabled").checked=state.rodEnabled;$("rodCombo").value=state.rodCombo;$("aimKey").textContent=state.aimKey;renderMacros()}
["aimEnabled","cpsEnabled","rodEnabled"].forEach(id=>$(id).addEventListener("change",e=>{state[id]=e.target.checked;save()}));
$("cpsValue").addEventListener("input",e=>{state.cpsValue=Number(e.target.value);$("cpsLabel").textContent=state.cpsValue+" CPS";save()});
$("rodCombo").addEventListener("input",e=>{state.rodCombo=e.target.value;save()});
let listening=false;
$("aimKey").addEventListener("click",()=>{listening=true;$("aimKey").textContent="Press key…";$("aimKey").classList.add("listening")});
window.addEventListener("keydown",e=>{if(!listening)return;e.preventDefault();if(["Shift","Control","Alt","Meta"].includes(e.key))return;state.aimKey=e.key.length===1?e.key.toUpperCase():e.key;listening=false;$("aimKey").classList.remove("listening");paint();save()});
document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b===btn));["modules","macros","settings"].forEach(page=>$(page+"Page").classList.toggle("hidden",page!==btn.dataset.page))}));
function renderMacros(){$("macroList").replaceChildren();state.macros.forEach((m,i)=>{const item=document.createElement("div");item.className="macro-item";const copy=document.createElement("div");const name=document.createElement("strong");name.textContent=m.name;const msg=document.createElement("small");msg.textContent=m.text;copy.append(name,msg);const actions=document.createElement("div");const copyBtn=document.createElement("button");copyBtn.className="secondary-button";copyBtn.textContent="Copy";copyBtn.onclick=()=>navigator.clipboard?.writeText(m.text);const del=document.createElement("button");del.className="secondary-button";del.textContent="Delete";del.onclick=()=>{state.macros.splice(i,1);save();renderMacros()};actions.append(copyBtn,del);item.append(copy,actions);$("macroList").append(item)})}
$("addMacro").addEventListener("click",()=>{const name=$("macroName").value.trim(),text=$("macroText").value.trim();if(!name||!text)return;state.macros.push({name,text});$("macroName").value="";$("macroText").value="";save();renderMacros()});
$("resetButton").addEventListener("click",()=>{state={...defaults,macros:[]};save();paint()});
paint();