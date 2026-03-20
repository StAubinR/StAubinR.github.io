 // Module to read input text (source code)
"use strict";
export function SRC(text) {
  const getPos  = () =>cPos;
  const setPos  = (p)=>cPos=p;
  const getSrc  = () =>text;
  const showCur = ()=>text.substring(0,cPos)+"||"+text.substring(cPos);
  const toEnd   = ()=>text.substring(cPos);
  const atEnd   = ()=>cPos===text.length-1;
  let cPos = 0;
  let mPos = 0;
  // Skip unused char
  function skipBl() {
    while (cPos<text.length && " \t\n\r".includes(text.charAt(cPos))) cPos++;
    mPos = Math.max(mPos,cPos);
  }
  // match: RegEx match with input text
  function match(regExp) {
    skipBl();
    let ma = text.substring(cPos).match(regExp);
    if (ma) {
      ma = ma[0];
      cPos += ma.length;
      mPos = Math.max(mPos,cPos);
    }
    return ma;
  }
  // Check if parsing is completed
  function checkError() {
    let errMsg = "";
    skipBl();
    if (cPos<text.length || cPos !== mPos) {
      errMsg += [cPos,mPos,text.length].join(",")+": "+text.substring(0,cPos)+
                " [>>>] "+text.substring(cPos,mPos)+
                " [>>>] "+text.substring(mPos)+"<br>";
    }
    return errMsg;
  }
  return {getPos, setPos, getSrc, checkError, showCur, match, toEnd, atEnd}
}

// Module to process your language
export function NANOINT() {
  let   bnf;
  const or   = "|";
  const gBnf = {};  // BNF to generate random equations
  const isOprNode = (node)=>Array.isArray(node) && node.length && typeof node[0] === "function";
  const setBNF    = (pBnf)=>{bnf=pBnf; genBnf();}
  let maxDepth, totalCall, procTime, depth;
  let buildSta = "";
  const getSta = ()=>buildSta;
  
  // Compute some statistics for buildTree
  function buildRpt(depth) {
    if (!depth) {
      if (depth===0) {
        buildSta = "Total Call "+totalCall+" Max Depth "+maxDepth+
                   " and "+Math.floor(performance.now()-procTime)+"ms";
      } else {
        procTime = performance.now();
        maxDepth  = 0;
        totalCall = 0;
        depth     = 0;
      }
    }
    totalCall++;
    maxDepth = Math.max(maxDepth, depth);   
    return depth;
  }
  // Main function.  Build a tree using BNF
  // Node is generated depending on the BNF
  // Example for diadic opr like a+b:
  //   Node will be: function (a,op,b)=>a+b, a, "+", b
  //   a and b can become an other tree
  function buildTree(src, ruleName, depth) {
    var tree = [];
    depth = buildRpt(depth);
    const rule = bnf[ruleName];
    if (rule) {
      const sPos    = src.getPos();  // for backtracking
      let newOpt    = false;  // if true, try next option after OR
      let searching = true;   // Stop when you found something valid
      for (let iKW=0; iKW<rule.length && searching; iKW++) {
        const kw = rule[iKW];
        if (newOpt) {  // if we need to find next option
          if (kw === or) {  // found it
            newOpt = false; 
            src.setPos(sPos);  // Back to the beginning of the statement
          }
        } else {
          if (kw instanceof RegExp) {  // Is it a regular expression
            const found = src.match(kw);
            if (found) {
              tree.push(found);
            } else {   // If fail, go to the next OR
              newOpt = true;
            }
          } else if (typeof kw === "function") {
            tree.unshift(kw);      // Place function at the beginning of a node
            searching = false;     // We found a good statement, stop searching
          } else if (bnf[kw]) {    // A ruleName?
            const subTree = buildTree(src, kw, depth+1); // Check with recursivity
            if (subTree.length) {  // Found something?
              //tree.push((subTree.length==1)?subTree[0]:subTree);
              tree.push(subTree);
            } else { // If not, check the next option
              newOpt = true;
            }
          } else if (kw === or) {     // End of this option
            searching = !tree.length; // If empty tree, continue searching
          } else {
            console.log("Unknow rulename: ", kw);
          }
        }
        if (newOpt) tree = [];  // Empty a wrong partial tree
      }
    } else {
      console.log("Unknow rule name", rulename);
    }
    buildRpt(depth);
    return (tree.length==1)?tree[0]:tree;
  }
  
  // Rebalance recreate left to right sequence
  // Example 1-1-1 should be ((1-1)-1) not (1-(1-1))
  // TO DO: Works only for balChar of 2
  function reBalance(tree, balChar) {
    if (isOprNode(tree)) {
      for (let iPrm=1; iPrm<tree.length; iPrm++) {
        if (isOprNode(tree[iPrm])) {
          tree[iPrm] = reBalance(tree[iPrm], balChar);
        }
      }
      if (tree.length === 4 && tree[3].length === 4 && 
          balChar.some((cs)=>cs.includes(tree[2]) && cs.includes(tree[3][2]))) {
        const top = tree[3];
        const mBr = top[1];
        top[1]  = tree;
        tree[3] = mBr;
        tree = reBalance(top, balChar);
      }
    }
    return tree;
  }
  // Try to optimise a tree with strategie:
  // - Compute fix value once
  // - Compute from fix value is a constant (TO DO)
  function optTree(tree, optNames) {
    // function object are use to find BNF rule name
    const bnfFn = optNames.map((n)=>bnf[n][bnf[n].length-1]);
    const fixVal = (a)=>a;
    function optimise(tree) {
      if (isOprNode(tree)) {
        for (let iPrm=1; iPrm<tree.length; iPrm++) {
          if (Array.isArray(tree[iPrm])) {
            tree[iPrm] = optimise(tree[iPrm]);
          }
        }
        if (bnfFn.includes(tree[0])) {
          //tree = [fixVal, evalTree(tree)];
          tree = evalTree(tree);
        }
      }
      return tree;
    }
    return optimise(tree);
  }
  // Build a statiscical report avout evalTree
  function evalRpt(mode, prm) {
    if (prm===0) {
      if (mode=="Start") {
        procTime = performance.now();
        maxDepth  = 1;
        totalCall = 0;
        depth     = 1;
      } else {
        buildSta = "Total Call "+totalCall+" Max Depth "+maxDepth+
                   " and "+Math.floor(performance.now()-procTime)+"ms";
      }
    } else {
      if (mode=="Start") {
        totalCall++;
        depth++;
        maxDepth = Math.max(maxDepth, depth);   
      } else {
        depth--
      }
    }
  }
  // Execute a tree and return its value
  function evalTree(tree, depth) {
    evalRpt("Start",depth);
    let rsl = tree;
    if (Array.isArray(tree) && tree.length) {
      if (typeof tree[0] !=="function") console.log("Not a function", tree);
      rsl = tree[0](...tree.slice(1));
    //} else {
    //  console.log("Not array", tree);
    }
    evalRpt("End",depth);
    return rsl;
  }
  
  // Convert the BNF table to gBNF.
  // gBNF is use to generate random equation
  function genBnf() {
    for (const ruleName of Object.keys(bnf)) {
      let opts = [];
      let opt = [];
      const rule = bnf[ruleName];
      for (let ir=0; ir<rule.length; ir++) {
        const prm = rule[ir];
        if (prm == or) {
          opts.push(opt);
          opt = [];
        } else if (prm  instanceof RegExp) {
          let strReg = prm.toString();
          strReg = strReg.substring(2,strReg.length-1).replace(/\\/g, "");
          strReg = (strReg.length>2)?strReg.replace(/[\(\)]/g, "").split("|"):[strReg];
          opt.push(strReg);
        } else if (typeof prm !== "function") {
          opt.push(prm);
        }
      }
      opts.push(opt);
      gBnf[ruleName] = opts;
    }
  }
  
  // Generate a random equation using gBNF
  function genEqua(dif, ruleName) {
    const random = (n)=>Math.floor(Math.random() * (n));
    let strEq = "";
    const rule = gBnf[ruleName];
    const opt = (dif>0)?rule[random(rule.length)]:rule[rule.length-1];
    for (const prm of opt) {
      if (prm==="number") {
        strEq += (1+random(10)).toString();
      } else if (gBnf[prm]) {
        strEq += genEqua(dif-1, prm);
      } else {
        strEq += prm[random(prm.length)];
      }
    }
    return strEq.replace("++", "+").replace("--", "-");  // Javascript do not like it
  }
  
  // Add [] to show priority order of execution
  function treeToString(tree) {
    let mathStr = "";
    if (isOprNode(tree)) {
      for (let iPrm=1; iPrm<tree.length; iPrm++) {
        let prm = tree[iPrm];
        if (isOprNode(prm)) {
          let str = treeToString(prm);
          if (prm.length>2 && prm[1]!=="(" && tree[1]!="(") {
            str = "["+str+"]"
          }
          mathStr += str;
        } else if (typeof prm === "string" || typeof prm === "number") {
          mathStr += " "+prm;
        } else {
          console.log("No idea why I'm here");
        }
      }
    }
    return mathStr;
  }
  function bnfToString() {
    const rslStr = [];
    const ruleNames = Object.keys(bnf);
    const maxLen   = Math.max(...ruleNames.map(str=>str.length));
    for (const ruleName of ruleNames) {
      const prm  = bnf[ruleName];
      const aStr = [ruleName.padEnd(maxLen+1)+" ::= "];
      const aErr = [];
      for (let ip=0; ip<prm.length; ip++) {
        const onePrm = prm[ip];
        if (typeof onePrm === "string") {
          if (onePrm==="|") {
            aStr.push("OR");
          } else {
            aStr.push(onePrm);
            if (!bnf[onePrm]) aErr.push("Unknow ruleName: "+onePrm);
          }
        } else if (typeof onePrm === "function" || onePrm instanceof RegExp) {
          aStr.push(onePrm.toString());
        }
      }
      rslStr.push(aStr.join(" "));
      if (aErr.length) rslStr.push(aErr.join(" "));
    }
    return rslStr.join("\n");
  }
  return {buildTree, reBalance, evalTree, optTree, genEqua, treeToString, bnfToString, setBNF, getSta}
}
