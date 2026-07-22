// ============================================================
// CONFIGURATION DES PAGES À SURVEILLER
// C'est le SEUL fichier à modifier pour ajouter/retirer une page.
// ============================================================

module.exports = {
  // Seuil global : au-delà de ce temps (ms), la page est jugée trop lente
  maxLoadTimeMs: 15000,

  // Temps max d'attente du contenu avant de déclarer la page "cassée"
  contentTimeoutMs: 20000,

  pages: [
    {
      name: "Courses hippiques (PMU)",
      url: "https://www.ladbrokes.be/fr/horseraces/#!/1_pmu-french-horse-racing",
      // La page est "saine" si AU MOINS UNE de ces preuves de contenu est trouvée.
      // Ce sont des motifs de TEXTE visibles, indépendants des noms de classes CSS,
      // donc robustes même si Ladbrokes retouche son style.
      contentSignals: [
        { type: "regex", value: "\\bR\\d{1,2}\\b", description: "Badge de réunion (R1, R2...)" },
        { type: "regex", value: "\\bC\\d{1,2}\\b", description: "Case de course (C1, C2...)" },
        { type: "regex", value: "\\b\\d{1,3}[.,]\\d{2}\\b", description: "Une cote (ex: 3.60)" },
      ],
      // Combien de signaux différents doivent être présents (2 sur 3 = solide)
      minSignals: 2,
    },
    {
      name: "Courses de lévriers",
      url: "https://www.ladbrokes.be/fr/greyhound/#!/19_greyhound-racing",
      contentSignals: [
        { type: "regex", value: "\\bC\\d{1,2}\\b", description: "Case de course (C1, C2...)" },
        { type: "regex", value: "\\b\\d{1,3}[.,]\\d{2}\\b", description: "Une cote (ex: 3.60)" },
        { type: "regex", value: "\\b\\d{1,2}:\\d{2}\\b", description: "Un horaire de course (ex: 13:50)" },
      ],
      minSignals: 2,
    },
  ],
};
