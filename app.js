const $=id=>document.getElementById(id);
const defaults={aimEnabled:false,aimKey:"I",cpsEnabled:false,cpsValue:10,rodEnabled:false,rodCombo:"Rod → Sword"};
let stored={};
try{stored=JSON.parse(localStorage.getItem("hcunion-config")||"{}")||{}}catch{stored={}}
let state={...defaults,...stored};
delete state.macros;
let comboStep=0;
const comboSteps=["① Use your fishing rod","② Manually switch to your sword","③ Complete your practice step, then reset for another round"];
function save(){localStorage.setItem("hcunion-config",JSON.stringify(state));$("saveStatus").textContent="Saved locally ✓"}
function paint(){
  $("aimEnabled").checked=!!state.aimEnabled;
  $("cpsEnabled").checked=!!state.cpsEnabled;
  $("cpsValue").value=state.cpsValue;
  $("cpsLabel").textContent=state.cpsValue+" CPS";
  $("rodEnabled").checked=!!state.rodEnabled;
  $("rodCombo").value=state.rodCombo;
  $("aimKey").textContent=state.aimKey;
  paintCombo();
}
["aimEnabled","cpsEnabled","rodEnabled"].forEach(id=>$(id).addEventListener("change",e=>{state[id]=e.target.checked;save()}));
$("cpsValue").addEventListener("input",e=>{state.cpsValue=Number(e.target.value);$("cpsLabel").textContent=state.cpsValue+" CPS";save()});
$("rodCombo").addEventListener("input",e=>{state.rodCombo=e.target.value;save()});
let listening=false;
$("aimKey").addEventListener("click",()=>{listening=true;$("aimKey").textContent="Press key…";$("aimKey").classList.add("listening")});
window.addEventListener("keydown",e=>{
  if(!listening)return;
  e.preventDefault();
  if(["Shift","Control","Alt","Meta"].includes(e.key))return;
  state.aimKey=e.key.length===1?e.key.toUpperCase():e.key;
  listening=false;
  $("aimKey").classList.remove("listening");
  paint();
  save();
});
document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b===btn));
  ["modules","settings"].forEach(page=>$(page+"Page").classList.toggle("hidden",page!==btn.dataset.page));
}));
function paintCombo(){
  $("comboStep").textContent=comboStep===3?"✓ Practice round complete":comboSteps[comboStep];
  $("comboCount").textContent=comboStep===3?"Complete":"Step "+(comboStep+1)+" of 3";
  $("comboProgress").style.width=(comboStep/3*100)+"%";
  $("comboNext").textContent=comboStep===3?"Start next round":"Mark step complete";
  $("comboStatus").textContent=comboStep===3?"Ready for another practice round.":"Practice guide only — no game inputs are sent.";
}
$("comboNext").addEventListener("click",()=>{comboStep=comboStep===3?0:comboStep+1;paintCombo()});
$("comboReset").addEventListener("click",()=>{comboStep=0;paintCombo()});
$("resetButton").addEventListener("click",()=>{
  state={...defaults};
  comboStep=0;
  save();
  paint();
});
paint();