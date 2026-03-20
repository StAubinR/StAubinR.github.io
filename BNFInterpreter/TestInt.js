// Basic test for JSLikeBNF
// Need more
"use strict";
export default function TestInt() {
  const options = [
    ["Select a test script", ""],
    ["While",`
      // Basic While loop
      var a=1;
      while(a<10) a=a+1;
      a
    `],
    ["For loop",`
    // Test a 1,000,000 for loop
    // JS is 100 time faster
    let s = 0;
    for(let i=0; i<1000000; i=i+1){
      s=s+i
    };
    s
    `],
    ["Let and Var", `
    // The scope of let c= ... is its block
    var c=10;
    {
      let c=0
    };
    c
    `],
    ["Closure", `
    // Test of closure
    function createur(x){
      function add(y){
        return x + y 
      };
      return add
    };
    let add5  = createur(5);
    let add10 = createur(10);
    add5(2)+add10(2)
    `],
    ["Recursivity",`
    // Recursivity test
    function fact(n) {
      if (n <= 1) return 1;
      return n * fact(n - 1)
    };
    fact(5)
    `],
    ["Definition scope",`
    // JS is not execution scope 
    // but definition scope
    // It is where the function is defined
    // that defined the scope
    let x=10;
    function f(){
      return x
    };
    function g(){
      let x = 20;
      return f()
    };
    g()
    `],
    ["Function as object",`
    function cc(){
      let c=0;
      function count(){
        c=c+1;
        return c
      };
      return count
    };
    let c1 = cc();
    c1();
    c1()
    `],
    ["Function system",`
    setIDHtml('msgID','Something');
    addIDHtml('msgID',' And more');
    consoleLog("Check js console")
    `]
  ];
  return options;
}