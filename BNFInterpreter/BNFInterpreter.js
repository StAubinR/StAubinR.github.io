<<<<<<< HEAD
// Module to read input text (source code)
function SRC(text) {
  const getPos = () =>cPos;
  const setPos = (p)=>cPos=p;
  const getSrc = () =>text;
  const showCur   = ()=>text.substring(0,cPos)+"||"+text.substring(cPos);
  let cPos = 0;
  let mPos = 0;
  // match: RegEx match with input text
  function match(regExp) {
    while (cPos<text.length && " \t\n\r".includes(text.charAt(cPos))) cPos++;
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
    if (cPos<text.length || cPos !== mPos) {
      errMsg += text.substring(0,mPos)+
                " [>>>] "+text.substring(mPos)+"<br>";
    }
    return errMsg;
  }
  return {getPos, setPos, getSrc, checkError, showCur, match}
}

// Module to process your language
function BNF(bnf) {
  const isOprNode = (node)=>Array.isArray(node) && typeof node[0] === "function";
  const gBnf = {};
  let maxDepth, totalCall, procTime;
  
  // Compute some statistics for buildTree
  function forStat(depth) {
    if (!depth) {
      if (depth===0) {
        console.log("Total Call", totalCall, "Max Depth", maxDepth,
                   "and", Math.floor(performance.now()-procTime), "ms");
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
  //   Node is: function (a,op,b)=>a+b, a, +, b
  //   a and b can become an other tree
  function buildTree(src, ruleName, depth) {
    var tree = [];
    depth = forStat(depth);
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
              tree.push((subTree.length==1)?subTree[0]:subTree);
            } else { // If not, check the next option
              newOpt = true;
            }
          } else if (kw === or) {     // End of this option
            searching = !tree.length; // If empty tree, continue searching
          } else {
            console.log("No idea what I'm doing here", kw);
          }
        }
        if (newOpt) tree = [];
      }
    } else {
      console.log("Unknow rule name", rulename);
    }
    forStat(depth);
    return tree;
  }
  
  // Rebalance recreate left to right sequence
  // Example 1-1-1 should be ((1-1)-1) not (1-(1-1))
  function reBalance(tree) {
    const pm = "+-"
    const md = "*/";
    if (Array.isArray(tree) && tree.length) {
      if (tree.length === 1) {
        tree = reBalance(tree[0]);
      } else if (typeof tree[0] === "function") {
        for (let iPrm=1; iPrm<tree.length; iPrm++) {
          if (isOprNode(tree[iPrm])) {
            tree[iPrm] = reBalance(tree[iPrm]);
          }
        }
        if (tree.length === 4 && tree[3].length === 4 && 
            ((pm.includes(tree[2]) && pm.includes(tree[3][2])) ||
             (md.includes(tree[2]) && md.includes(tree[3][2])))) {
          const top = tree[3];
          const mBr = top[1];
          top[1]  = tree;
          tree[3] = mBr;
          tree = reBalance(top);
        }
      }
    }
    return tree;
  }
  
  // Execute a tree and return its value
  function evalTree(tree) {
    let rsl = tree;
    if (Array.isArray(tree) && tree.length) {
      if (tree.length ===1) {
        rsl = evalTree(tree[0]);
      } else {
        let nodes = [];
        for (let iNode=1; iNode<tree.length; iNode++) {
          nodes.push(evalTree(tree[iNode]));
        }
        rsl = tree[0](...nodes);
      }
    }
    return rsl;
  }
  
  // Convert the BNF table to gBNF.
  // gBNF is use to generate random equation
  function genBnf() {
    for (const ruleName of Object.keys(bnf)) {
      let opts = [];
      let opt = [];
      const rule = bnf[ruleName];
      for (ir=0; ir<rule.length; ir++) {
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
        } else if (typeof prm === "string") {
          mathStr += prm;
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
  genBnf();
  console.log(gBnf);
  return {buildTree, reBalance, evalTree, genEqua, treeToString, bnfToString}
}
=======
// Module to read input text (source code)
function SRC(text) {
  const getPos = () =>cPos;
  const setPos = (p)=>cPos=p;
  const getSrc = () =>text;
  const showCur   = ()=>text.substring(0,cPos)+"||"+text.substring(cPos);
  let cPos = 0;
  let mPos = 0;
  // match: RegEx match with input text
  function match(regExp) {
    while (cPos<text.length && " \t\n\r".includes(text.charAt(cPos))) cPos++;
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
    if (cPos<text.length || cPos !== mPos) {
      errMsg += text.substring(0,mPos)+
                " [>>>] "+text.substring(mPos)+"<br>";
    }
    return errMsg;
  }
  return {getPos, setPos, getSrc, checkError, showCur, match}
}

// Module to process your language
function BNF(bnf) {
  const isOprNode = (node)=>Array.isArray(node) && typeof node[0] === "function";
  const gBnf = {};
  let maxDepth, totalCall, procTime;
  
  // Compute some statistics for buildTree
  function forStat(depth) {
    if (!depth) {
      if (depth===0) {
        console.log("Total Call", totalCall, "Max Depth", maxDepth,
                   "and", Math.floor(performance.now()-procTime), "ms");
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
  //   Node is: function (a,op,b)=>a+b, a, +, b
  //   a and b can become an other tree
  function buildTree(src, ruleName, depth) {
    var tree = [];
    depth = forStat(depth);
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
              tree.push((subTree.length==1)?subTree[0]:subTree);
            } else { // If not, check the next option
              newOpt = true;
            }
          } else if (kw === or) {     // End of this option
            searching = !tree.length; // If empty tree, continue searching
          } else {
            console.log("No idea what I'm doing here", kw);
          }
        }
        if (newOpt) tree = [];
      }
    } else {
      console.log("Unknow rule name", rulename);
    }
    forStat(depth);
    return tree;
  }
  
  // Rebalance recreate left to right sequence
  // Example 1-1-1 should be ((1-1)-1) not (1-(1-1))
  function reBalance(tree) {
    const pm = "+-"
    const md = "*/";
    if (Array.isArray(tree) && tree.length) {
      if (tree.length === 1) {
        tree = reBalance(tree[0]);
      } else if (typeof tree[0] === "function") {
        for (let iPrm=1; iPrm<tree.length; iPrm++) {
          if (isOprNode(tree[iPrm])) {
            tree[iPrm] = reBalance(tree[iPrm]);
          }
        }
        if (tree.length === 4 && tree[3].length === 4 && 
            ((pm.includes(tree[2]) && pm.includes(tree[3][2])) ||
             (md.includes(tree[2]) && md.includes(tree[3][2])))) {
          const top = tree[3];
          const mBr = top[1];
          top[1]  = tree;
          tree[3] = mBr;
          tree = reBalance(top);
        }
      }
    }
    return tree;
  }
  
  // Execute a tree and return its value
  function evalTree(tree) {
    let rsl = tree;
    if (Array.isArray(tree) && tree.length) {
      if (tree.length ===1) {
        rsl = evalTree(tree[0]);
      } else {
        let nodes = [];
        for (let iNode=1; iNode<tree.length; iNode++) {
          nodes.push(evalTree(tree[iNode]));
        }
        rsl = tree[0](...nodes);
      }
    }
    return rsl;
  }
  
  // Convert the BNF table to gBNF.
  // gBNF is use to generate random equation
  function genBnf() {
    for (const ruleName of Object.keys(bnf)) {
      let opts = [];
      let opt = [];
      const rule = bnf[ruleName];
      for (ir=0; ir<rule.length; ir++) {
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
        } else if (typeof prm === "string") {
          mathStr += prm;
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
  genBnf();
  console.log(gBnf);
  return {buildTree, reBalance, evalTree, genEqua, treeToString, bnfToString}
}
>>>>>>> a8e53075a32eefbcc49853f32f2e9ba272a615af
