export const TRAIT_LOADINGS = Object.freeze({
  /* ---------- Tier-1 ---------- */
  101:{ axisWeight:{ Z:0   } },
  103:{ axisWeight:{ Z:0   } },
  104:{ axisWeight:{ Z:0.5 } },
  105:{ axisWeight:{ Z:0   } },
  106:{ axisWeight:{ Z:0   } },
  107:{ axisWeight:{ Z:0.5 } },

  /* Per-answer override showcase */
  108:{
    axisWeight:{ Z:1.5 },
    overrides:{
      Typical   :{ Z:-3 },
      Revelatory:{ X:-1, Y:0, Z:+2 },
      Wrong     :{ X:-2, Y:+1, Z:+1 }
    }
  },

  109:{ axisWeight:{ Z:1.5 } },

  /* ---------- Tier-2 ---------- */
  201:{ axisWeight:{ Z:0   } },
  202:{ axisWeight:{ Z:1.5 } },
  203:{ axisWeight:{ Z:0   } },
  204:{ axisWeight:{ Z:0   } },

  205:{
    axisWeight:{ X:0.5, Y:0.7, Z:1.2 },
    overrides:{
      Typical   :{ X:+1, Y:-2, Z:-2 },
      Revelatory:{ X:-2, Y:+4, Z:+2 },
      Wrong     :{ X:-2, Y:+1, Z:-3 }
    }
  },

  206:{ axisWeight:{ Z:1   } },
  207:{ axisWeight:{ Z:1.5 } },
  208:{ /* TBD */ },
  209:{ axisWeight:{ Z:0   } }
});
