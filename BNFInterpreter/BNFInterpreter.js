// Module to read the input text
//
function SRC(text) {
  const getPos = () =>cPos;
  const setPos = (p)=>cPos=p;
  const getSrc = () =>text;
  const getMaxPos = ()=>mPos;
  const showCur   = ()=>text.substring(0,cPos)+"||"+text.substring(cPos);
  let cPos = 0;
  let mPos = 0;
  function match(regExp) {
    let ma = text.substring(cPos).match(regExp);
    if (ma) {
      ma = ma[0];
      cPos += ma.length;
      mPos = Math.max(mPos,cPos);
    }
    return ma;
  }
  function checkError() {
    let error = false;
    if (cPos < text.length) {
      console.log("Partial ", text.substring(0,cPos),
                  "left",     text.substring(cPos));
      error = true;
    } 
    if (cPos !== mPos) {
      console.log("Backtracking", text.substring(0,cPos),
                  "to",           text.substring(cPos, mPos),
                  "left",         text.substring(mPos));
      error = true;
    }
    return error;
  }
  return {getPos, setPos, getMaxPos, getSrc, checkError, showCur, match}
}
// Module to process your language
function BNF(bnf) {
  const isOprNode = (node)=>Array.isArray(node) && typeof node[0] === "function";
  const gBnf = {};
  function buildTree(src, ruleName) {
    var tree = [];
    const rule = bnf[ruleName];
    if (rule) {
      let newOpt    = false;
      let searching = true;
      let sPos      = src.getPos();
      for (let iKW=0; iKW<rule.length && searching; iKW++) {
        const kw = rule[iKW];
        if (newOpt) {
          if (kw === or) {
            newOpt = false;
            tree   = [];
            src.setPos(sPos);
          }
        } else {
          if (kw instanceof RegExp) {
            const found = src.match(kw);
            if (found) {
              tree.push(found);
            } else {
              newOpt = true;
              tree   = [];
            }
          } else if (typeof kw === "function") {
            tree.unshift(kw);
            searching = false;
          } else if (bnf[kw]) {
            const subTree = buildTree(src, kw);
            if (subTree.length) {
              tree.push((subTree.length==1)?subTree[0]:subTree);
            } else {
              newOpt = true;
              //tree   = [];
            }
          } else if (kw === or) {
            searching = false;
          } else {
            console.log("No idea what I'm doing here");
          }
        }
      }
    }
    return tree;
  }
  function reBalance(tree) {
    if (Array.isArray(tree) && tree.length) {
      if (tree.length === 1) {
        tree = reBalance(tree[0]);
      } else if (typeof tree[0] === "function") {
        for (let iPrm=1; iPrm<tree.length; iPrm++) {
          if (isOprNode(tree[iPrm])) {
            tree[iPrm] = reBalance(tree[iPrm]);
          }
        }
        if (tree.length === 4 && 
            (((tree[2] === "-" || tree[2] === "+") && (tree[3][2] === "-" || tree[3][2]==="+")) ||
             ((tree[2] === "/" || tree[2] === "*") && (tree[3][2] === "/" || tree[3][2]==="*")))) {
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
          const strReg = prm.toString();
          opt.push(strReg.substring(3,strReg.length-1).replace(/[\[\]]/g, ""));
        } else if (typeof prm !== "function") {
          opt.push(prm);
        }
      }
      opts.push(opt);
      gBnf[ruleName] = opts;
    }
    console.log(gBnf);
  }
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
        strEq += prm.charAt(random(prm.length));
      }
    }
    return strEq.replace("++", "+").replace("--", "-");  // Javascript do not like it
  }
  genBnf();
  return {buildTree, reBalance, evalTree, genEqua}
}
