import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, Area, AreaChart } from "recharts";

/* ═══════════════════════════════════════════
   DESIGN TOKENS — Futuristic Fintech Light
   ═══════════════════════════════════════════ */
const T = {
  bg: "#f0f4f8",
  bgSub: "#e4eaf1",
  card: "rgba(255,255,255,0.72)",
  cardSolid: "#ffffff",
  glass: "rgba(255,255,255,0.55)",
  border: "rgba(0,30,60,0.07)",
  borderAccent: "rgba(0,200,170,0.25)",
  primary: "#00c9a7",
  primaryDark: "#00a78e",
  secondary: "#0057ff",
  accent: "#7c3aed",
  positive: "#00c9a7",
  negative: "#ff5a6e",
  warn: "#ff9f1c",
  text: "#0a1628",
  textSub: "#5a6a7e",
  textMuted: "#94a3b8",
  white: "#ffffff",
  glow: "0 4px 24px rgba(0,201,167,0.12)",
  glowStrong: "0 8px 32px rgba(0,201,167,0.18)",
  cardShadow: "0 1px 3px rgba(0,30,80,0.06), 0 8px 24px rgba(0,30,80,0.04)",
  cardHover: "0 2px 8px rgba(0,30,80,0.08), 0 12px 32px rgba(0,30,80,0.07)",
  radius: 16,
  radiusSm: 10,
};

const ASSETS = [
  { key: "cash", label: "小口", icon: "💵" },
  { key: "rakuten", label: "楽天銀行", icon: "🏦" },
  { key: "mufg", label: "三菱UFJ銀行", icon: "🏛" },
  { key: "paypay", label: "PayPay銀行", icon: "📱" },
  { key: "sbi", label: "住信SBIネット銀行", icon: "🌐" },
];

const CHART_COLORS = ["#00c9a7","#0057ff","#7c3aed","#ff9f1c","#ff5a6e","#06b6d4","#8b5cf6","#f59e0b","#ec4899","#14b8a6"];

const formatNum = (n) => (n == null || isNaN(n)) ? "0" : Number(n).toLocaleString("ja-JP");
const formatDate = (d) => { if(!d)return""; const dt=new Date(d); return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,"0")}/${String(dt.getDate()).padStart(2,"0")}`; };
const getMonthKey = (d) => { const dt=new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`; };
const todayStr = () => new Date().toISOString().slice(0,10);
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,6);

const loadData = async(k,fb)=>{ try{ const r=await window.storage.get(k); return r?JSON.parse(r.value):fb; }catch{return fb;} };
const saveData = async(k,v)=>{ try{await window.storage.set(k,JSON.stringify(v));}catch(e){console.error(e);} };

const calcPayoffDate = (balance, mp, ar) => {
  if(mp<=0||balance<=0) return null;
  const mr=ar/100/12; let rem=balance; let months=0;
  while(rem>0&&months<600){ const interest=rem*mr; const principal=mp-interest; if(principal<=0)return null; rem-=principal; months++; }
  const d=new Date(); d.setMonth(d.getMonth()+months); return d.toISOString().slice(0,10);
};

/* ═══════════════════════════════════════════
   GLOBAL STYLES (injected via <style>)
   ═══════════════════════════════════════════ */
const globalCSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');

*{box-sizing:border-box;margin:0;padding:0;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:${T.textMuted};border-radius:4px;}

@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
@keyframes gradientMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}

.fade-up{animation:fadeUp .45s ease both}
.fade-up-1{animation-delay:.05s}
.fade-up-2{animation-delay:.1s}
.fade-up-3{animation-delay:.15s}
.fade-up-4{animation-delay:.2s}

.payoff-app{
  font-family:'DM Sans','Helvetica Neue',sans-serif;
  background:${T.bg};
  min-height:100vh;
  color:${T.text};
  font-size:14px;
  max-width:520px;
  margin:0 auto;
  padding-bottom:80px;
  position:relative;
  overflow-x:hidden;
}
.payoff-app::before{
  content:'';position:fixed;top:-120px;right:-120px;width:400px;height:400px;
  border-radius:50%;background:radial-gradient(circle,rgba(0,201,167,0.08) 0%,transparent 70%);
  pointer-events:none;z-index:0;
}
.payoff-app::after{
  content:'';position:fixed;bottom:-80px;left:-80px;width:300px;height:300px;
  border-radius:50%;background:radial-gradient(circle,rgba(0,87,255,0.06) 0%,transparent 70%);
  pointer-events:none;z-index:0;
}

.header-gradient{
  background:linear-gradient(135deg,#00c9a7 0%,#0057ff 50%,#7c3aed 100%);
  background-size:200% 200%;animation:gradientMove 6s ease infinite;
  padding:28px 20px 20px;color:#fff;position:relative;z-index:1;
  border-radius:0 0 24px 24px;margin-bottom:16px;
  box-shadow:0 8px 32px rgba(0,87,255,0.15);
}
.header-gradient h1{
  font-family:'Outfit',sans-serif;font-size:28px;font-weight:900;
  letter-spacing:3px;margin:0;
  text-shadow:0 2px 12px rgba(0,0,0,0.15);
}
.header-gradient p{font-size:11px;opacity:.8;letter-spacing:1.5px;margin-top:2px;font-weight:500;}

.nav-pills{
  display:flex;gap:6px;padding:0 16px 12px;position:sticky;top:0;z-index:10;
  background:linear-gradient(180deg,${T.bg} 60%,transparent);
  padding-top:8px;
}
.nav-pill{
  flex:1;padding:10px 0;border:none;border-radius:${T.radiusSm}px;
  font-size:12px;font-weight:600;cursor:pointer;transition:all .25s;
  font-family:'DM Sans',sans-serif;position:relative;overflow:hidden;
}
.nav-pill.active{
  background:linear-gradient(135deg,${T.primary},${T.secondary});
  color:#fff;box-shadow:${T.glowStrong};
}
.nav-pill:not(.active){
  background:${T.white};color:${T.textSub};
  border:1px solid ${T.border};
}
.nav-pill:not(.active):hover{border-color:${T.borderAccent};color:${T.text};}

.glass-card{
  background:${T.card};
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  border:1px solid ${T.border};
  border-radius:${T.radius}px;
  padding:18px;margin:0 16px 14px;
  box-shadow:${T.cardShadow};
  transition:box-shadow .2s;
  position:relative;z-index:1;
}
.glass-card:hover{box-shadow:${T.cardHover};}

.card-title{
  font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;
  color:${T.text};margin-bottom:14px;display:flex;align-items:center;gap:8px;
  letter-spacing:0.3px;
}
.card-title .dot{width:6px;height:6px;border-radius:50%;background:${T.primary};}

.input-field{
  width:100%;padding:11px 14px;border:1.5px solid ${T.border};
  border-radius:${T.radiusSm}px;background:${T.white};color:${T.text};
  font-size:13px;font-family:'DM Sans',sans-serif;outline:none;
  transition:border-color .2s,box-shadow .2s;
}
.input-field:focus{border-color:${T.primary};box-shadow:0 0 0 3px rgba(0,201,167,0.1);}
.input-field::placeholder{color:${T.textMuted};}

select.input-field{appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;}

.label{font-size:11px;color:${T.textSub};margin-bottom:5px;display:block;font-weight:600;letter-spacing:0.3px;}

.btn-primary{
  padding:11px 24px;border:none;border-radius:${T.radiusSm}px;
  background:linear-gradient(135deg,${T.primary},${T.primaryDark});
  color:#fff;font-size:13px;font-weight:700;cursor:pointer;
  font-family:'DM Sans',sans-serif;
  box-shadow:${T.glow};transition:all .2s;letter-spacing:0.3px;
}
.btn-primary:hover{box-shadow:${T.glowStrong};transform:translateY(-1px);}
.btn-primary:active{transform:translateY(0);}

.btn-secondary{
  padding:8px 16px;border:1.5px solid ${T.border};border-radius:${T.radiusSm}px;
  background:${T.white};color:${T.textSub};font-size:12px;font-weight:600;
  cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;
}
.btn-secondary:hover{border-color:${T.primary};color:${T.primary};}

.btn-danger{
  padding:11px 24px;border:none;border-radius:${T.radiusSm}px;
  background:linear-gradient(135deg,${T.negative},#e0405a);
  color:#fff;font-size:13px;font-weight:700;cursor:pointer;
  font-family:'DM Sans',sans-serif;box-shadow:0 4px 16px rgba(255,90,110,0.15);
  transition:all .2s;
}

.stat-pill{
  background:${T.white};border:1px solid ${T.border};
  border-radius:12px;padding:14px;text-align:center;
  box-shadow:0 1px 4px rgba(0,30,80,0.03);
}
.stat-pill .stat-label{font-size:10px;color:${T.textMuted};font-weight:600;letter-spacing:0.5px;text-transform:uppercase;}
.stat-pill .stat-value{font-size:17px;font-weight:800;font-family:'Outfit',sans-serif;margin-top:4px;font-feature-settings:'tnum';}

.list-row{
  display:flex;justify-content:space-between;align-items:center;
  padding:11px 0;border-bottom:1px solid ${T.border};
}
.list-row:last-child{border-bottom:none;}

.badge{
  display:inline-block;padding:2px 8px;border-radius:6px;
  font-size:9px;font-weight:700;letter-spacing:0.5px;
}

.progress-track{height:6px;border-radius:3px;background:${T.bgSub};overflow:hidden;}
.progress-fill{height:100%;border-radius:3px;transition:width .6s cubic-bezier(.22,1,.36,1);}

.modal-overlay{
  position:fixed;top:0;left:0;right:0;bottom:0;
  background:rgba(10,22,40,0.45);backdrop-filter:blur(6px);
  display:flex;align-items:center;justify-content:center;z-index:100;padding:16px;
}
.modal-box{
  background:${T.cardSolid};border-radius:20px;padding:28px;
  width:100%;max-width:420px;box-shadow:0 16px 48px rgba(0,30,80,0.15);
  animation:fadeUp .3s ease;
}
.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;}
.modal-title{font-family:'Outfit',sans-serif;font-size:17px;font-weight:700;color:${T.text};}
.modal-close{background:none;border:none;font-size:20px;color:${T.textMuted};cursor:pointer;padding:4px 8px;border-radius:6px;}
.modal-close:hover{background:${T.bgSub};color:${T.text};}

.empty-state{text-align:center;padding:28px 0;color:${T.textMuted};font-size:12px;}

.icon-btn{background:none;border:none;cursor:pointer;padding:4px 6px;border-radius:6px;color:${T.textMuted};font-size:14px;transition:all .15s;}
.icon-btn:hover{background:${T.bgSub};color:${T.text};}

.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
.flex-row{display:flex;gap:8px;align-items:center;}
.flex-col{display:flex;flex-direction:column;gap:10px;}

.total-banner{
  margin:0 16px 14px;padding:16px 20px;border-radius:${T.radius}px;
  position:relative;z-index:1;overflow:hidden;
}
.total-banner.assets{
  background:linear-gradient(135deg,rgba(0,201,167,0.08),rgba(0,87,255,0.06));
  border:1px solid rgba(0,201,167,0.2);
}
.total-banner.debt{
  background:linear-gradient(135deg,rgba(255,90,110,0.06),rgba(255,159,28,0.04));
  border:1px solid rgba(255,90,110,0.15);
}

.tab-toggle{
  display:flex;gap:4px;padding:4px;background:${T.bgSub};border-radius:${T.radiusSm}px;margin:0 16px 12px;
}
.tab-toggle button{
  flex:1;padding:8px 0;border:none;border-radius:8px;font-size:12px;
  font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;
}
.tab-toggle button.active{background:${T.white};color:${T.text};box-shadow:0 1px 4px rgba(0,30,80,0.08);}
.tab-toggle button:not(.active){background:transparent;color:${T.textMuted};}

.asset-row{
  display:flex;justify-content:space-between;align-items:center;
  padding:10px 12px;border-radius:10px;margin-bottom:6px;
  background:${T.bg};transition:background .15s;
}
.asset-row:hover{background:${T.bgSub};}

.debt-card-inner{
  background:linear-gradient(135deg,rgba(0,201,167,0.03),rgba(0,87,255,0.02));
  border:1px solid ${T.border};border-radius:12px;padding:14px;margin-top:10px;
}

.repay-badge{background:rgba(255,159,28,0.1);color:${T.warn};}
`;

/* ═══════════════════════════════════════════
   MODAL COMPONENT
   ═══════════════════════════════════════════ */
function Modal({open,onClose,title,children}){
  if(!open) return null;
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   BUDGET SECTION
   ═══════════════════════════════════════════ */
function BudgetSection({expenses,setExpenses,incomes,setIncomes,assets,setAssets}){
  const[tab,setTab]=useState("expense");
  const[expItem,setExpItem]=useState("");
  const[expAmount,setExpAmount]=useState("");
  const[expDate,setExpDate]=useState(todayStr());
  const[expAsset,setExpAsset]=useState("cash");
  const[incSource,setIncSource]=useState("");
  const[incAmount,setIncAmount]=useState("");
  const[incDate,setIncDate]=useState(todayStr());
  const[incAsset,setIncAsset]=useState("rakuten");
  const[editAsset,setEditAsset]=useState(null);
  const[editAssetVal,setEditAssetVal]=useState("");

  const addExpense=()=>{
    if(!expItem||!expAmount)return;
    const amt=Number(expAmount);
    setExpenses([{id:uid(),item:expItem,amount:amt,date:expDate,asset:expAsset},...expenses]);
    setAssets({...assets,[expAsset]:(assets[expAsset]||0)-amt});
    setExpItem("");setExpAmount("");
  };
  const addIncome=()=>{
    if(!incSource||!incAmount)return;
    const amt=Number(incAmount);
    setIncomes([{id:uid(),source:incSource,amount:amt,date:incDate,asset:incAsset},...incomes]);
    setAssets({...assets,[incAsset]:(assets[incAsset]||0)+amt});
    setIncSource("");setIncAmount("");
  };
  const deleteExpense=(e)=>{ setExpenses(expenses.filter(x=>x.id!==e.id)); setAssets({...assets,[e.asset]:(assets[e.asset]||0)+e.amount}); };
  const deleteIncome=(i)=>{ setIncomes(incomes.filter(x=>x.id!==i.id)); setAssets({...assets,[i.asset]:(assets[i.asset]||0)-i.amount}); };
  const saveAssetEdit=()=>{ if(editAsset==null)return; setAssets({...assets,[editAsset]:Number(editAssetVal)||0}); setEditAsset(null); };

  const totalAssets=ASSETS.reduce((s,a)=>s+(assets[a.key]||0),0);

  return(
    <>
      <div className="total-banner assets fade-up">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <span style={{fontSize:11,color:T.textSub,fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>Total Assets</span>
          <span style={{fontSize:24,fontWeight:900,fontFamily:"'Outfit',sans-serif",color:totalAssets>=0?T.primary:T.negative,fontFeatureSettings:"'tnum'"}}>
            ¥{formatNum(totalAssets)}
          </span>
        </div>
      </div>

      <div className="glass-card fade-up fade-up-1">
        <div className="card-title"><span className="dot"/>各口座残高</div>
        {ASSETS.map(a=>(
          <div className="asset-row" key={a.key}>
            <div className="flex-row">
              <span style={{fontSize:16}}>{a.icon}</span>
              <span style={{fontSize:12,fontWeight:600}}>{a.label}</span>
            </div>
            <div className="flex-row">
              <span style={{fontSize:14,fontWeight:700,fontFamily:"'Outfit',sans-serif",color:(assets[a.key]||0)>=0?T.text:T.negative,fontFeatureSettings:"'tnum'"}}>
                ¥{formatNum(assets[a.key]||0)}
              </span>
              <button className="icon-btn" onClick={()=>{setEditAsset(a.key);setEditAssetVal(String(assets[a.key]||0));}}>✎</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={editAsset!==null} onClose={()=>setEditAsset(null)} title="残高を編集">
        <div className="flex-col">
          <div>
            <label className="label">{ASSETS.find(a=>a.key===editAsset)?.label} の残高</label>
            <input className="input-field" type="number" value={editAssetVal} onChange={e=>setEditAssetVal(e.target.value)}/>
          </div>
          <div style={{textAlign:"right",marginTop:6}}><button className="btn-primary" onClick={saveAssetEdit}>保存</button></div>
        </div>
      </Modal>

      <div className="tab-toggle fade-up fade-up-2">
        <button className={tab==="expense"?"active":""} onClick={()=>setTab("expense")}>↓ 支出登録</button>
        <button className={tab==="income"?"active":""} onClick={()=>setTab("income")}>↑ 収入登録</button>
      </div>

      {tab==="expense"?(
        <div className="glass-card fade-up fade-up-3">
          <div className="card-title"><span className="dot"/>支出を登録</div>
          <div className="flex-col">
            <div><label className="label">事柄</label><input className="input-field" placeholder="例: 食費・交通費" value={expItem} onChange={e=>setExpItem(e.target.value)}/></div>
            <div className="grid-2">
              <div><label className="label">金額</label><input className="input-field" type="number" placeholder="0" value={expAmount} onChange={e=>setExpAmount(e.target.value)}/></div>
              <div><label className="label">日付</label><input className="input-field" type="date" value={expDate} onChange={e=>setExpDate(e.target.value)}/></div>
            </div>
            <div><label className="label">引き落とし口座</label>
              <select className="input-field" value={expAsset} onChange={e=>setExpAsset(e.target.value)}>
                {ASSETS.map(a=><option key={a.key} value={a.key}>{a.label}</option>)}
              </select>
            </div>
            <button className="btn-primary" style={{width:"100%"}} onClick={addExpense}>登録する</button>
          </div>
        </div>
      ):(
        <div className="glass-card fade-up fade-up-3">
          <div className="card-title"><span className="dot"/>収入を登録</div>
          <div className="flex-col">
            <div><label className="label">収入先</label><input className="input-field" placeholder="例: 株式会社〇〇" value={incSource} onChange={e=>setIncSource(e.target.value)}/></div>
            <div className="grid-2">
              <div><label className="label">金額</label><input className="input-field" type="number" placeholder="0" value={incAmount} onChange={e=>setIncAmount(e.target.value)}/></div>
              <div><label className="label">日付</label><input className="input-field" type="date" value={incDate} onChange={e=>setIncDate(e.target.value)}/></div>
            </div>
            <div><label className="label">入金口座</label>
              <select className="input-field" value={incAsset} onChange={e=>setIncAsset(e.target.value)}>
                {ASSETS.map(a=><option key={a.key} value={a.key}>{a.label}</option>)}
              </select>
            </div>
            <button className="btn-primary" style={{width:"100%"}} onClick={addIncome}>登録する</button>
          </div>
        </div>
      )}

      <div className="glass-card fade-up fade-up-4">
        <div className="card-title"><span className="dot"/>{tab==="expense"?"最近の支出":"最近の収入"}</div>
        {tab==="expense"?(
          expenses.length===0?<div className="empty-state">支出の記録がありません</div>:
          expenses.slice(0,20).map(e=>(
            <div className="list-row" key={e.id}>
              <div>
                <div style={{fontSize:13,fontWeight:600}}>{e.item}</div>
                <div style={{fontSize:10,color:T.textMuted}}>{formatDate(e.date)} ・ {ASSETS.find(a=>a.key===e.asset)?.label}</div>
              </div>
              <div className="flex-row">
                <span style={{fontSize:14,fontWeight:700,fontFamily:"'Outfit',sans-serif",color:T.negative}}>-¥{formatNum(e.amount)}</span>
                <button className="icon-btn" onClick={()=>deleteExpense(e)}>✕</button>
              </div>
            </div>
          ))
        ):(
          incomes.length===0?<div className="empty-state">収入の記録がありません</div>:
          incomes.slice(0,20).map(i=>(
            <div className="list-row" key={i.id}>
              <div>
                <div style={{fontSize:13,fontWeight:600}}>{i.source}</div>
                <div style={{fontSize:10,color:T.textMuted}}>{formatDate(i.date)} ・ {ASSETS.find(a=>a.key===i.asset)?.label}</div>
              </div>
              <div className="flex-row">
                <span style={{fontSize:14,fontWeight:700,fontFamily:"'Outfit',sans-serif",color:T.positive}}>+¥{formatNum(i.amount)}</span>
                <button className="icon-btn" onClick={()=>deleteIncome(i)}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   DEBT SECTION
   ═══════════════════════════════════════════ */
function DebtSection({debts,setDebts,repayments,setRepayments,assets,setAssets}){
  const[showAdd,setShowAdd]=useState(false);
  const[name,setName]=useState("");
  const[balance,setBalance]=useState("");
  const[rate,setRate]=useState("");
  const[monthly,setMonthly]=useState("");
  const[payDay,setPayDay]=useState("25");
  const[payAsset,setPayAsset]=useState("rakuten");

  const[repayModal,setRepayModal]=useState(null);
  const[repayAmt,setRepayAmt]=useState("");
  const[repayDate,setRepayDate]=useState(todayStr());
  const[repayAsset,setRepayAsset]=useState("rakuten");
  const[isExtra,setIsExtra]=useState(false);

  const[editModal,setEditModal]=useState(null);
  const[editMonthly,setEditMonthly]=useState("");
  const[editRate,setEditRate]=useState("");
  const[editPayDay,setEditPayDay]=useState("");

  const addDebt=()=>{
    if(!name||!balance)return;
    setDebts([...debts,{id:uid(),name,originalBalance:Number(balance),currentBalance:Number(balance),rate:Number(rate)||0,monthlyPayment:Number(monthly)||0,payDay:Number(payDay)||25,asset:payAsset}]);
    setShowAdd(false);setName("");setBalance("");setRate("");setMonthly("");setPayDay("25");
  };
  const deleteDebt=(id)=>{ setDebts(debts.filter(d=>d.id!==id)); setRepayments(repayments.filter(r=>r.debtId!==id)); };
  const doRepay=()=>{
    if(!repayModal||!repayAmt)return;
    const amt=Number(repayAmt);
    setRepayments([{id:uid(),debtId:repayModal.id,amount:amt,date:repayDate,asset:repayAsset,isExtra},...repayments]);
    setDebts(debts.map(d=>d.id===repayModal.id?{...d,currentBalance:Math.max(0,d.currentBalance-amt)}:d));
    setAssets({...assets,[repayAsset]:(assets[repayAsset]||0)-amt});
    setRepayModal(null);setRepayAmt("");setIsExtra(false);
  };
  const saveEdit=()=>{
    if(!editModal)return;
    setDebts(debts.map(d=>d.id===editModal.id?{...d,monthlyPayment:Number(editMonthly)||d.monthlyPayment,rate:Number(editRate)>=0?Number(editRate):d.rate,payDay:Number(editPayDay)||d.payDay}:d));
    setEditModal(null);
  };

  const totalDebt=debts.reduce((s,d)=>s+d.currentBalance,0);
  const totalOriginal=debts.reduce((s,d)=>s+d.originalBalance,0);
  const paidPct=totalOriginal>0?((totalOriginal-totalDebt)/totalOriginal*100):0;

  return(
    <>
      <div className="total-banner debt fade-up">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}>
          <span style={{fontSize:11,color:T.textSub,fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>Total Debt</span>
          <span style={{fontSize:24,fontWeight:900,fontFamily:"'Outfit',sans-serif",color:T.negative,fontFeatureSettings:"'tnum'"}}>
            ¥{formatNum(totalDebt)}
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{width:`${paidPct}%`,background:`linear-gradient(90deg,${T.primary},${T.secondary})`}}/>
        </div>
        <div style={{fontSize:10,color:T.textSub,marginTop:5,textAlign:"right",fontWeight:600}}>
          返済進捗 {paidPct.toFixed(1)}%
        </div>
      </div>

      {debts.map((d,idx)=>{
        const debtPaid=d.originalBalance>0?((d.originalBalance-d.currentBalance)/d.originalBalance*100):0;
        const payoffDate=calcPayoffDate(d.currentBalance,d.monthlyPayment,d.rate);
        const debtRepayments=repayments.filter(r=>r.debtId===d.id);
        return(
          <div className={`glass-card fade-up fade-up-${Math.min(idx+1,4)}`} key={d.id}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>{d.name}</div>
                <div style={{fontSize:10,color:T.textMuted,marginTop:3}}>
                  利率 {d.rate}% ・ 毎月{d.payDay}日 ・ 月額 ¥{formatNum(d.monthlyPayment)}
                </div>
              </div>
              <div className="flex-row">
                <button className="icon-btn" onClick={()=>{setEditModal(d);setEditMonthly(String(d.monthlyPayment));setEditRate(String(d.rate));setEditPayDay(String(d.payDay));}}>✎</button>
                <button className="icon-btn" onClick={()=>deleteDebt(d.id)}>✕</button>
              </div>
            </div>

            <div className="debt-card-inner">
              <div className="grid-2">
                <div>
                  <div style={{fontSize:10,color:T.textMuted,fontWeight:600,letterSpacing:0.5}}>残債額</div>
                  <div style={{fontSize:18,fontWeight:800,fontFamily:"'Outfit',sans-serif",color:T.negative,marginTop:2,fontFeatureSettings:"'tnum'"}}>¥{formatNum(d.currentBalance)}</div>
                </div>
                <div>
                  <div style={{fontSize:10,color:T.textMuted,fontWeight:600,letterSpacing:0.5}}>完済予定</div>
                  <div style={{fontSize:14,fontWeight:700,fontFamily:"'Outfit',sans-serif",color:payoffDate?T.text:T.warn,marginTop:2,fontFeatureSettings:"'tnum'"}}>
                    {payoffDate?formatDate(payoffDate):"算出不可"}
                  </div>
                </div>
              </div>
              <div style={{marginTop:10}}>
                <div className="progress-track">
                  <div className="progress-fill" style={{width:`${debtPaid}%`,background:`linear-gradient(90deg,${T.primary},${T.secondary})`}}/>
                </div>
                <div style={{fontSize:10,color:T.textMuted,marginTop:3}}>返済済 {debtPaid.toFixed(1)}% (¥{formatNum(d.originalBalance-d.currentBalance)})</div>
              </div>
            </div>

            <div style={{marginTop:12}}>
              <button className="btn-primary" onClick={()=>{setRepayModal(d);setRepayAmt(String(d.monthlyPayment));setRepayAsset(d.asset);setRepayDate(todayStr());setIsExtra(false);}}>
                返済する
              </button>
            </div>

            {debtRepayments.length>0&&(
              <div style={{marginTop:12}}>
                <div style={{fontSize:10,color:T.textMuted,fontWeight:700,letterSpacing:0.5,marginBottom:6}}>REPAYMENT HISTORY</div>
                {debtRepayments.slice(0,5).map(r=>(
                  <div key={r.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:11,borderBottom:`1px solid ${T.border}`}}>
                    <span style={{color:T.textSub}}>{formatDate(r.date)} {r.isExtra&&<span className="badge repay-badge" style={{marginLeft:4}}>繰上</span>}</span>
                    <span style={{color:T.positive,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>-¥{formatNum(r.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {debts.length===0&&<div className="glass-card empty-state">借入先を登録してください</div>}

      <div style={{padding:"0 16px",marginBottom:14}}>
        <button className="btn-primary" style={{width:"100%"}} onClick={()=>setShowAdd(true)}>＋ 借入先を追加</button>
      </div>

      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="借入先を追加">
        <div className="flex-col">
          <div><label className="label">借入先名</label><input className="input-field" placeholder="例: アコム" value={name} onChange={e=>setName(e.target.value)}/></div>
          <div><label className="label">借入金額</label><input className="input-field" type="number" placeholder="0" value={balance} onChange={e=>setBalance(e.target.value)}/></div>
          <div className="grid-2">
            <div><label className="label">年利 (%)</label><input className="input-field" type="number" step="0.1" placeholder="15.0" value={rate} onChange={e=>setRate(e.target.value)}/></div>
            <div><label className="label">毎月返済額</label><input className="input-field" type="number" placeholder="0" value={monthly} onChange={e=>setMonthly(e.target.value)}/></div>
          </div>
          <div className="grid-2">
            <div><label className="label">返済日 (日)</label><input className="input-field" type="number" min="1" max="31" value={payDay} onChange={e=>setPayDay(e.target.value)}/></div>
            <div><label className="label">引き落とし口座</label>
              <select className="input-field" value={payAsset} onChange={e=>setPayAsset(e.target.value)}>
                {ASSETS.map(a=><option key={a.key} value={a.key}>{a.label}</option>)}
              </select>
            </div>
          </div>
          <button className="btn-primary" style={{width:"100%"}} onClick={addDebt}>追加する</button>
        </div>
      </Modal>

      <Modal open={repayModal!==null} onClose={()=>setRepayModal(null)} title={`${repayModal?.name} への返済`}>
        <div className="flex-col">
          <div><label className="label">返済額</label><input className="input-field" type="number" value={repayAmt} onChange={e=>setRepayAmt(e.target.value)}/></div>
          <div className="grid-2">
            <div><label className="label">返済日</label><input className="input-field" type="date" value={repayDate} onChange={e=>setRepayDate(e.target.value)}/></div>
            <div><label className="label">引き落とし口座</label>
              <select className="input-field" value={repayAsset} onChange={e=>setRepayAsset(e.target.value)}>
                {ASSETS.map(a=><option key={a.key} value={a.key}>{a.label}</option>)}
              </select>
            </div>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,color:T.textSub}}>
            <input type="checkbox" checked={isExtra} onChange={e=>setIsExtra(e.target.checked)} style={{accentColor:T.primary}}/>
            繰り上げ返済
          </label>
          <button className="btn-primary" style={{width:"100%"}} onClick={doRepay}>返済を登録</button>
        </div>
      </Modal>

      <Modal open={editModal!==null} onClose={()=>setEditModal(null)} title={`${editModal?.name} の設定変更`}>
        <div className="flex-col">
          <div><label className="label">毎月返済額</label><input className="input-field" type="number" value={editMonthly} onChange={e=>setEditMonthly(e.target.value)}/></div>
          <div className="grid-2">
            <div><label className="label">年利 (%)</label><input className="input-field" type="number" step="0.1" value={editRate} onChange={e=>setEditRate(e.target.value)}/></div>
            <div><label className="label">返済日 (日)</label><input className="input-field" type="number" min="1" max="31" value={editPayDay} onChange={e=>setEditPayDay(e.target.value)}/></div>
          </div>
          <button className="btn-primary" style={{width:"100%"}} onClick={saveEdit}>保存</button>
        </div>
      </Modal>
    </>
  );
}

/* ═══════════════════════════════════════════
   REPORT SECTION — Monthly + Weekly
   ═══════════════════════════════════════════ */
function ReportSection({expenses,incomes}){
  const now=new Date();
  const[reportTab,setReportTab]=useState("monthly");
  const[year,setYear]=useState(now.getFullYear());
  const[month,setMonth]=useState(now.getMonth()+1);

  // Week state
  const getWeekStart=(d)=>{ const dt=new Date(d); const day=dt.getDay(); const diff=dt.getDate()-day+(day===0?-6:1); dt.setDate(diff); dt.setHours(0,0,0,0); return dt; };
  const[weekStart,setWeekStart]=useState(getWeekStart(new Date()));

  const prevWeek=()=>{ const d=new Date(weekStart); d.setDate(d.getDate()-7); setWeekStart(d); };
  const nextWeek=()=>{ const d=new Date(weekStart); d.setDate(d.getDate()+7); setWeekStart(d); };
  const weekEnd=useMemo(()=>{ const d=new Date(weekStart); d.setDate(d.getDate()+6); return d; },[weekStart]);
  const weekLabel=`${weekStart.getMonth()+1}/${weekStart.getDate()} 〜 ${weekEnd.getMonth()+1}/${weekEnd.getDate()}`;

  // Month data
  const mk=`${year}-${String(month).padStart(2,"0")}`;
  const mExpenses=expenses.filter(e=>getMonthKey(e.date)===mk);
  const mIncomes=incomes.filter(i=>getMonthKey(i.date)===mk);
  const totalExp=mExpenses.reduce((s,e)=>s+e.amount,0);
  const totalInc=mIncomes.reduce((s,i)=>s+i.amount,0);
  const net=totalInc-totalExp;

  // Week data
  const wExpenses=expenses.filter(e=>{ const d=new Date(e.date); return d>=weekStart&&d<=weekEnd; });
  const wIncomes=incomes.filter(i=>{ const d=new Date(i.date); return d>=weekStart&&d<=weekEnd; });
  const wTotalExp=wExpenses.reduce((s,e)=>s+e.amount,0);
  const wTotalInc=wIncomes.reduce((s,i)=>s+i.amount,0);
  const wNet=wTotalInc-wTotalExp;

  // Expense breakdown
  const buildPie=(exps)=>{
    const m={};exps.forEach(e=>{m[e.item]=(m[e.item]||0)+e.amount;});
    return Object.entries(m).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  };
  const mPie=buildPie(mExpenses);
  const wPie=buildPie(wExpenses);

  // Weekly daily breakdown
  const dayNames=["月","火","水","木","金","土","日"];
  const dailyData=useMemo(()=>{
    const data=[];
    for(let i=0;i<7;i++){
      const d=new Date(weekStart);d.setDate(d.getDate()+i);
      const ds=d.toISOString().slice(0,10);
      const exp=expenses.filter(e=>e.date===ds).reduce((s,e)=>s+e.amount,0);
      const inc=incomes.filter(e=>e.date===ds).reduce((s,e)=>s+e.amount,0);
      data.push({day:`${d.getMonth()+1}/${d.getDate()}(${dayNames[i]})`,支出:exp,収入:inc});
    }
    return data;
  },[weekStart,expenses,incomes]);

  // Monthly trend
  const trendData=useMemo(()=>{
    const data=[];
    for(let i=5;i>=0;i--){
      const d=new Date(year,month-1-i,1);
      const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const exp=expenses.filter(e=>getMonthKey(e.date)===k).reduce((s,e)=>s+e.amount,0);
      const inc=incomes.filter(e=>getMonthKey(e.date)===k).reduce((s,e)=>s+e.amount,0);
      data.push({month:`${d.getMonth()+1}月`,収入:inc,支出:exp});
    }
    return data;
  },[year,month,expenses,incomes]);

  const prevMonth=()=>{ if(month===1){setMonth(12);setYear(year-1);}else setMonth(month-1); };
  const nextMonth=()=>{ if(month===12){setMonth(1);setYear(year+1);}else setMonth(month+1); };

  const tooltipStyle={background:T.cardSolid,border:`1px solid ${T.border}`,borderRadius:10,fontSize:12,color:T.text,boxShadow:T.cardShadow};

  const renderSummary=(tInc,tExp,tNet)=>(
    <div className="grid-3" style={{padding:"0 16px",marginBottom:14}}>
      {[{label:"収入",val:tInc,color:T.positive},{label:"支出",val:tExp,color:T.negative},{label:"収支",val:tNet,color:tNet>=0?T.positive:T.negative}].map(s=>(
        <div className="stat-pill" key={s.label}>
          <div className="stat-label">{s.label}</div>
          <div className="stat-value" style={{color:s.color}}>¥{formatNum(s.val)}</div>
        </div>
      ))}
    </div>
  );

  const renderRatio=(tInc,tExp)=>(
    (tInc>0||tExp>0)&&(
      <div className="glass-card fade-up fade-up-2">
        <div className="card-title"><span className="dot"/>収支比率</div>
        <div style={{display:"flex",borderRadius:8,overflow:"hidden",height:28}}>
          {tInc>0&&<div style={{flex:tInc,background:`linear-gradient(90deg,${T.primary},${T.secondary})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff"}}>
            収入 {((tInc/(tInc+tExp))*100).toFixed(0)}%
          </div>}
          {tExp>0&&<div style={{flex:tExp,background:`linear-gradient(90deg,${T.negative},#ff8fa0)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff"}}>
            支出 {((tExp/(tInc+tExp))*100).toFixed(0)}%
          </div>}
        </div>
      </div>
    )
  );

  const renderPie=(data)=>(
    data.length>0&&(
      <div className="glass-card fade-up fade-up-3">
        <div className="card-title"><span className="dot"/>支出内訳</div>
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%" outerRadius={72} innerRadius={38} paddingAngle={2} strokeWidth={0}>
              {data.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
            </Pie>
            <Tooltip formatter={v=>`¥${formatNum(v)}`} contentStyle={tooltipStyle}/>
          </PieChart>
        </ResponsiveContainer>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6}}>
          {data.map((d,i)=>(
            <span key={i} style={{fontSize:10,color:T.textSub,display:"flex",alignItems:"center",gap:4}}>
              <span style={{width:8,height:8,borderRadius:3,background:CHART_COLORS[i%CHART_COLORS.length],display:"inline-block"}}/>
              {d.name} ¥{formatNum(d.value)}
            </span>
          ))}
        </div>
      </div>
    )
  );

  return(
    <>
      <div className="tab-toggle fade-up">
        <button className={reportTab==="monthly"?"active":""} onClick={()=>setReportTab("monthly")}>月次レポート</button>
        <button className={reportTab==="weekly"?"active":""} onClick={()=>setReportTab("weekly")}>週間レポート</button>
      </div>

      {reportTab==="monthly"?(
        <>
          <div className="glass-card fade-up fade-up-1" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <button className="btn-secondary" onClick={prevMonth}>◀</button>
            <span style={{fontSize:16,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>{year}年 {month}月</span>
            <button className="btn-secondary" onClick={nextMonth}>▶</button>
          </div>

          {renderSummary(totalInc,totalExp,net)}
          {renderRatio(totalInc,totalExp)}
          {renderPie(mPie)}

          {trendData.some(d=>d.収入>0||d.支出>0)&&(
            <div className="glass-card fade-up fade-up-4">
              <div className="card-title"><span className="dot"/>月次推移（直近6ヶ月）</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trendData} barGap={3}>
                  <XAxis dataKey="month" tick={{fill:T.textMuted,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:T.textMuted,fontSize:10}} axisLine={false} tickLine={false} width={48} tickFormatter={v=>`${(v/10000).toFixed(0)}万`}/>
                  <Tooltip formatter={v=>`¥${formatNum(v)}`} contentStyle={tooltipStyle}/>
                  <Legend wrapperStyle={{fontSize:10}}/>
                  <Bar dataKey="収入" fill={T.primary} radius={[4,4,0,0]}/>
                  <Bar dataKey="支出" fill={T.negative} radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {totalInc===0&&totalExp===0&&<div className="glass-card empty-state">{year}年{month}月のデータがありません</div>}
        </>
      ):(
        <>
          <div className="glass-card fade-up fade-up-1" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <button className="btn-secondary" onClick={prevWeek}>◀</button>
            <span style={{fontSize:15,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>{weekLabel}</span>
            <button className="btn-secondary" onClick={nextWeek}>▶</button>
          </div>

          {renderSummary(wTotalInc,wTotalExp,wNet)}
          {renderRatio(wTotalInc,wTotalExp)}

          {/* Daily breakdown chart */}
          {dailyData.some(d=>d.支出>0||d.収入>0)&&(
            <div className="glass-card fade-up fade-up-2">
              <div className="card-title"><span className="dot"/>日別推移</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyData} barGap={2}>
                  <XAxis dataKey="day" tick={{fill:T.textMuted,fontSize:9}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:T.textMuted,fontSize:10}} axisLine={false} tickLine={false} width={48} tickFormatter={v=>v>=10000?`${(v/10000).toFixed(0)}万`:`${(v/1000).toFixed(0)}千`}/>
                  <Tooltip formatter={v=>`¥${formatNum(v)}`} contentStyle={tooltipStyle}/>
                  <Legend wrapperStyle={{fontSize:10}}/>
                  <Bar dataKey="収入" fill={T.primary} radius={[4,4,0,0]}/>
                  <Bar dataKey="支出" fill={T.negative} radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {renderPie(wPie)}

          {/* Day-by-day list */}
          <div className="glass-card fade-up fade-up-3">
            <div className="card-title"><span className="dot"/>日別明細</div>
            {dailyData.map((d,i)=>{
              const ds=new Date(weekStart);ds.setDate(ds.getDate()+i);
              const dateStr=ds.toISOString().slice(0,10);
              const dayExps=expenses.filter(e=>e.date===dateStr);
              const dayIncs=incomes.filter(e=>e.date===dateStr);
              if(dayExps.length===0&&dayIncs.length===0) return null;
              return(
                <div key={i} style={{marginBottom:10}}>
                  <div style={{fontSize:11,fontWeight:700,color:T.primary,marginBottom:4,letterSpacing:0.5}}>{d.day}</div>
                  {dayIncs.map(inc=>(
                    <div key={inc.id} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:12}}>
                      <span style={{color:T.textSub}}>{inc.source}</span>
                      <span style={{color:T.positive,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>+¥{formatNum(inc.amount)}</span>
                    </div>
                  ))}
                  {dayExps.map(exp=>(
                    <div key={exp.id} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:12}}>
                      <span style={{color:T.textSub}}>{exp.item}</span>
                      <span style={{color:T.negative,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>-¥{formatNum(exp.amount)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
            {wExpenses.length===0&&wIncomes.length===0&&<div className="empty-state">この週のデータがありません</div>}
          </div>
        </>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
export default function App(){
  const[page,setPage]=useState("budget");
  const[loading,setLoading]=useState(true);
  const[expenses,setExpenses]=useState([]);
  const[incomes,setIncomes]=useState([]);
  const[assets,setAssets]=useState({cash:0,rakuten:0,mufg:0,paypay:0,sbi:0});
  const[debts,setDebts]=useState([]);
  const[repayments,setRepayments]=useState([]);

  useEffect(()=>{
    (async()=>{
      const[e,i,a,d,r]=await Promise.all([
        loadData("po_expenses",[]),loadData("po_incomes",[]),
        loadData("po_assets",{cash:0,rakuten:0,mufg:0,paypay:0,sbi:0}),
        loadData("po_debts",[]),loadData("po_repayments",[]),
      ]);
      setExpenses(e);setIncomes(i);setAssets(a);setDebts(d);setRepayments(r);
      setLoading(false);
    })();
  },[]);

  useEffect(()=>{if(!loading)saveData("po_expenses",expenses);},[expenses,loading]);
  useEffect(()=>{if(!loading)saveData("po_incomes",incomes);},[incomes,loading]);
  useEffect(()=>{if(!loading)saveData("po_assets",assets);},[assets,loading]);
  useEffect(()=>{if(!loading)saveData("po_debts",debts);},[debts,loading]);
  useEffect(()=>{if(!loading)saveData("po_repayments",repayments);},[repayments,loading]);

  if(loading) return(
    <div className="payoff-app" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
      <style>{globalCSS}</style>
      <div style={{color:T.primary,fontSize:14,fontFamily:"'Outfit',sans-serif",fontWeight:600,animation:"pulse 1.2s ease infinite"}}>Loading...</div>
    </div>
  );

  return(
    <div className="payoff-app">
      <style>{globalCSS}</style>

      <header className="header-gradient">
        <h1>PayOFF</h1>
        <p>PERSONAL FINANCE TRACKER</p>
      </header>

      <nav className="nav-pills">
        <button className={`nav-pill ${page==="budget"?"active":""}`} onClick={()=>setPage("budget")}>
          💰 家計管理
        </button>
        <button className={`nav-pill ${page==="debt"?"active":""}`} onClick={()=>setPage("debt")}>
          📋 借金管理
        </button>
        <button className={`nav-pill ${page==="report"?"active":""}`} onClick={()=>setPage("report")}>
          📊 レポート
        </button>
      </nav>

      {page==="budget"&&<BudgetSection expenses={expenses} setExpenses={setExpenses} incomes={incomes} setIncomes={setIncomes} assets={assets} setAssets={setAssets}/>}
      {page==="debt"&&<DebtSection debts={debts} setDebts={setDebts} repayments={repayments} setRepayments={setRepayments} assets={assets} setAssets={setAssets}/>}
      {page==="report"&&<ReportSection expenses={expenses} incomes={incomes}/>}
    </div>
  );
}
