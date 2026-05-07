function simulateRTP() {
  const WEIGHTS = [35, 25, 20, 15, 10, 6, 3, 1.3, 3.0]; // total
  const W_TOTAL = WEIGHTS.reduce((a, b) => a + b, 0);
  const p = WEIGHTS.map((w) => w / W_TOTAL);

  const mults = [
    [0.2, 1.0, 3], // grape 
    [0.4, 1.5, 4], // banana 
    [0.5, 2.0, 6], // carrot 
    [0.8, 3.0, 10], // airplane 
    [1.5, 5.0, 20], // scale 
    [3.0, 10.0, 40], // castle 
    [5.0, 20.0, 100], // trident 
    [10.0, 40.0, 250], // wild
  ];
  const p_wild = p[7];

  let lineRTP = 0;
  for (let i = 0; i < 7; i++) {
    const P_match = p[i] + p_wild;
    const P3 = Math.pow(P_match, 3) * (1 - P_match);
    const P4 = Math.pow(P_match, 4) * (1 - P_match);
    const P5 = Math.pow(P_match, 5);
    let E =
      (P3 - Math.pow(p_wild, 3) * (1 - p_wild)) * mults[i][0] +
      (P4 - Math.pow(p_wild, 4) * (1 - p_wild)) * mults[i][1] +
      (P5 - Math.pow(p_wild, 5)) * mults[i][2];
    lineRTP += E;
  }

  let E_wild =
    Math.pow(p_wild, 3) * (1 - p_wild) * mults[7][0] +
    Math.pow(p_wild, 4) * (1 - p_wild) * mults[7][1] +
    Math.pow(p_wild, 5) * mults[7][2];
  lineRTP += E_wild;

  const baseLineRTP = lineRTP * 20;

  const pS = p[8];
  let p_fs = 0;
  let expected_fs_spins = 0;
  function comb(n, k) {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    let r = 1;
    for (let i = 1; i <= k; i++) {
      r = (r * (n - i + 1)) / i;
    }
    return r;
  }
  let scatterTriggerPayout = 0;
  for (let k = 3; k <= 20; k++) {
    const prob = comb(20, k) * Math.pow(pS, k) * Math.pow(1 - pS, 20 - k);
    p_fs += prob;
    let spins = k === 3 ? 10 : k === 4 ? 15 : 20;
    expected_fs_spins += prob * spins;
    scatterTriggerPayout += prob * (k * 2); 
  }

  const V = (baseLineRTP + scatterTriggerPayout) / (1 - expected_fs_spins);

  console.log("Line RTP:", baseLineRTP.toFixed(4));
  console.log("Scatter RTP:", scatterTriggerPayout.toFixed(4));
  console.log("Expected FS per spin:", expected_fs_spins.toFixed(4));
  console.log("Total Game RTP:", V.toFixed(4));
}
simulateRTP();
