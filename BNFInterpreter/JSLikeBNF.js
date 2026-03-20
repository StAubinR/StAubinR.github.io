// Javascript like BNF with Closure, Let Var
// Missing: More validations
"use strict";
export default function BNF(evalTree) {

  const v = evalTree;
  const gcs = ()=>vs.length-1; // Get current scope
  // Get a var scope
  const gs = (n)=>{let is; for(is=gcs(); is && !(n in vs[is]);is--){}; return is};
  const vt = "VAR()"; // Tag to indicate where a function var start
   // Get VAR scope
  const gvs = ()=>{let is; for (is=gcs(); is && !vs[is][vt]; is--){}; return is};
   // assign a list of vars to its values
  const ns = (n,v)=>Object.fromEntries(n.map((on,i)=>[on,v[i]]));

  // Var Scopes
  let   vs = [{}];
  const consoleLog = (a)=>{console.log(a); return a}// 
  const setIDHtml  = (n,v)=>document.getElementById(n).innerHTML  = v;
  const addIDHtml  = (n,v)=>document.getElementById(n).innerHTML += v;
  vs[0]["consoleLog"] = {vl:["a"],     bl:[()=>{let a=vs[gs("a")]["a"]; consoleLog(a); return a}], cl:[{}]};
  vs[0]["setIDHtml"]  = {vl:["n","v"], bl:[()=>setIDHtml(vs[gs("n")]["n"],vs[gs("v")]["v"])]     , cl:[{}]};
  vs[0]["addIDHtml"]  = {vl:["n","v"], bl:[()=>addIDHtml(vs[gs("n")]["n"],vs[gs("v")]["v"])]     , cl:[{}]};
  const bnf = {};
  const or  = "|";
  
  // Data Type
  bnf["string"]     = [/^("|')(.*?)\1/,  (a)=>a.substring(1,a.length-1)];
  bnf["boolean"]    = [/^(true|false)/,  (a)=>a=="true"];
  bnf["number"]     = [/^(\d+(\.\d*)?)/, (a)=>Number.parseFloat(a)];
  bnf["datatype"]   = ["string", or, "boolean", or, "number"];
  
  // Immediate
  bnf["paracond"]   = [/^\(/, "logicexp", /^\)/,         (lp,a,rp)=>v(a)];
  bnf["call"]       = ["varname", "paraexplist",
                        (n,l)=>{const fn=v(n); const fp=vs[gs(fn)][fn]; const cvs = vs;
                                //vs=[...fp.cl, {...ns(fp.vl,v(l)), "VAR()":true}];
                                vs=[...fp.cl, ns(fp.vl.concat(vt),v(l).concat(true))];
                                try {const r=v(fp.bl); vs=cvs; return r}
                                catch(e) {vs=cvs; if (e.type==="RETURN") return e.value; throw e;}}];
  bnf["identifier"] = [/^([a-zA-Z]\w*)/, (n)=>vs[gs(n)][n]];
  bnf["immediate"]  = ["datatype", or, "paracond", or, "call", or, "identifier"];
  
  // Monadique operators
  bnf["factor"]     = [/^(\+|\-)/, "immediate",          (op,a)=>op==="+"?v(a):-v(a),      or, "immediate"];
  
  // Diadic operators
  bnf["term"]       = ["factor", /^(\*|\/)/, "term",     (a,op,b)=>op==="*"?v(a)*v(b):v(a)/v(b), or, "factor"];
  bnf["expression"] = ["term", /^(\+|\-)/, "expression", (a,op,b)=>op==="+"?v(a)+v(b):v(a)-v(b), or, "term"];
  bnf["relation"]   = ["expression", /^(<=|>=|<|>)/, "expression",
                       (a,op,b)=>op=="<="?v(a)<=v(b):op==">="?v(a)>=v(b):
                                 op=="<" ?v(a)<v(b) :v(a)>v(b), or, "expression"];
  bnf["equality"]   = ["expression",   /^(==|!=)/, "expression", 
                       (a,op,b)=>op==="=="?v(a)===v(b):v(a)!==v(b), or, "relation"];
  bnf["logicand"]   = ["equality",   /^&&/,    "logicand", (a,op,b)=>v(a)&&v(b), or, "equality"];
  bnf["logicexp"]   = ["logicand", /^\|\|/,    "logicexp", (a,op,b)=>v(a)||v(b), or, "logicand"];
  
  // Var process
  bnf["varname"]    = [/^([a-zA-Z]\w*)/, (n)=>n];
  bnf["assign"]     = ["varname", /^(=)/, "logicexp", (n,op,e) =>vs[gs(v(n))][v(n)] = v(e)];
  bnf["var"]        = [/^(var)/, "varname", /^(=)/, "logicexp", (l,n,op,e)=>vs[gvs()][v(n)] = v(e)];
  bnf["let"]        = [/^(let)/, "varname", /^(=)/, "logicexp", (l,n,op,e)=>vs[gcs()][v(n)] = v(e)];
  bnf["letvarass"]  = ["let", or, "var", or, "assign"];
  
  // Function definitions
  bnf["varlist"]     = ["varname",    /^(\,)/, "varlist", (vn,c,vl)=>[v(vn), ...v(vl)], or, 
                        "varname", (vn)=>[v(vn)]];
  bnf["paravarlist"] = [/^\(/, "varlist", /^\)/,          (lp,a,rp)=>v(a), or, /^\(/, /^\)/, ()=>[]];
  
  bnf["explist"]     = ["logicexp", /^(\,)/, "explist",   (e,c,el)=>[v(e), ...v(el)],   or, "logicexp", (e)=>[v(e)]];
  bnf["paraexplist"] = [/^\(/, "explist", /^\)/, (lp,a,rp)=>v(a), or, /^\(/, /^\)/, ()=>[]];
  
  bnf["function"]    = [/^(function)/, "varname", "paravarlist", "stablock",
                        (f,n,vl,b)=>vs[gcs()][v(n)]={vl:v(vl), bl:b, cl:[...vs]}];
                      // My best way for a return
  bnf["return"]     = [/^(return)/, "logicexp", (r,e)=>{throw {type:"RETURN", value:v(e)}}];
  
  // Language reserved words or instructions
  bnf["for"]        = [/^(for)/, /^\(/, "letvarass", /^(\;)/, "logicexp", /^(\;)/, "assign",  /^\)/, "stablock",
                       (f,lp, cv, pv1, c, pv2, e, rp, b)=>{vs.push({});v(cv);while(v(c)){v(b);v(e)};vs.pop()}];
  bnf["do"]         = [/^(do)/,    "stablock", /^(while)/, "paracond", (d,b,w,c)=>{do {v(b)} while (v(c))}];
  bnf["while"]      = [/^(while)/, "paracond", "stablock",  (w,c,b)=>{while (v(c)) v(b)}];
  bnf["if"]         = [/^(if)/,    "paracond", "stablock",  (i,c,b)=>{if (v(c)) return v(b)}];
  bnf["ifelse"]     = [/^(if)/,    "paracond", "stablock", /^(else)/, "stablock", (i,c,b1,e,b2)=>v(c)?v(b1):v(b2)];
  bnf["block"]      = [/^(\{)/, /^(\})/, ()=>{}, or, 
                       /^(\{)/, "statements",  /^(\})/, (l,s,r)=>{vs.push({});const sr=v(s);vs.pop();return sr}];
  bnf["stablock"]   = ["block", or, "statement"];
  
  // Comment
  bnf["comment"]    = [/^\/\/.*/, or, /^\/\*[\s\S]*?\*\//];
  // Statements
  bnf["statement"]  = ["ifelse",   or, "if",       or, "while",  or, "do",  or, "for", or, "letvarass", or, "block", or,
                       "function", or, "return",   or, "let", or, "var", or,
                       "paracond", or, "logicexp", or, "expression"];
  bnf["statements"] = ["comment",           "statements", (c,s)=>v(s), or,
                       "statement", /^(;)/, "statements", (s1,op,s2)=>{v(s1);return v(s2)}, or,
                       "statement"];
  bnf["start"]      = ["statements"];
  return bnf;
}