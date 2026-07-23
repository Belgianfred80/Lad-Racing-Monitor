// ============================================================
// CONFIGURATION DES PAGES À SURVEILLER
// C'est le SEUL fichier à modifier pour ajouter/retirer une page.
// ============================================================

module.exports = {
  // Seuil global : au-delà de ce temps (ms), la page est jugée trop lente
  maxLoadTimeMs: 15000,

  // Temps max d'attente du contenu avant de déclarer la page "cassée"
  contentTimeoutMs: 20000,

  // HEURES SILENCIEUSES (heure belge, changement d'heure géré automatiquement)
  // Entre ces deux bornes, le monitoring vérifie seulement que le site répond,
  // sans exiger que les courses soient affichées (elles sont chargées vers 08h00-08h30).
  quietHours: {
    start: "00:00",
    end: "08:30",
  },

  pages: [
    {
      name: "Courses hippiques (PMU)",
      url: "https://www.ladbrokes.be/fr/horseraces/#!/1_pmu-french-horse-racing",
      contentSignals: [
        { type: "regex", value: "\\bR\\d{1,2}\\b", description: "Badge de réunion (R1, R2...)" },
        { type: "regex", value: "\\bC\\d{1,2}\\b", description: "Case de course (C1, C2...)" },
        { type: "regex", value: "\\b\\d{1,3}[.,]\\d{2}\\b", description: "Une cote (ex: 3.60)" },
      ],
      minSignals: 2,
    },
    {
      name: "Courses de lévriers",
      url: "https://www.ladbrokes.be/fr/greyhound/#!/19_greyhound-racing",
      contentSignals: [
        { type: "regex", value: "(\\d{1,2}:\\d{2}[\\s\\S]*?){4}", description: "Au moins 4 horaires de courses affichés" },
      ],
      minSignals: 1,
    },
  ],
};
