dbQuery.use('student-depression');

addMdToPage(`
## Sömn och depression

Denna sida visar hur andelen depression skiljer sig mellan olika sömnkategorier.
Diagrammet visar procent för att jämförelsen ska bli tydlig och rättvis.
`);

let data = await dbQuery(`
  SELECT 
    Sleep_Duration AS sömn,
    COUNT(*) AS totalt,
    SUM(Depression) AS antal_deprimerade,
    ROUND(AVG(Depression) * 100, 1) AS procent_deprimerade
  FROM student_depression
  GROUP BY Sleep_Duration
`);

let cleanData = data.map(row => ({
  sömn: String(row.sömn).replaceAll("'", "").trim(),
  totalt: Number(row.totalt),
  antal_deprimerade: Number(row.antal_deprimerade),
  procent_deprimerade: Number(row.procent_deprimerade)
}));

cleanData.sort((a, b) => {
  const order = {
    'Less than 5 hours': 1,
    '5-6 hours': 2,
    '7-8 hours': 3,
    'More than 8 hours': 4,
    'Others': 5
  };
  return order[a.sömn] - order[b.sömn];
});

let chartData = [
  ['Sömnkategori', 'Depression (%)']
];

for (let row of cleanData) {
  chartData.push([row.sömn, row.procent_deprimerade]);
}

drawGoogleChart({
  type: 'ColumnChart',
  data: chartData,
  options: {
    title: 'Andel med depression per sömnkategori (%)',
    height: 500,
    legend: { position: 'none' },
    vAxis: {
      title: 'Procent',
      viewWindow: { min: 0, max: 100 }
    },
    hAxis: {
      title: 'Sömnkategori'
    }
  }
});

tableFromData({
  data: cleanData,
  columnNames: [
    'Sömnkategori',
    'Totalt antal',
    'Antal deprimerade',
    'Depression (%)'
  ]
});

addMdToPage(`
## Analys

Resultaten visar tydliga skillnader mellan olika sömnkategorier.

Gruppen som sover mindre än 5 timmar har den högsta andelen depression, medan gruppen som sover mer än 8 timmar har en lägre andel depression än flera andra grupper.

Detta indikerar ett möjligt samband där mindre sömn är kopplat till högre nivåer av depression. Skillnaderna är dock inte extrema, vilket tyder på att fler faktorer påverkar.

Det är därför rimligt att anta att sömn är en av flera faktorer som påverkar psykisk hälsa, men inte den enda.
`);

try {
  let rawData = await dbQuery(`
    SELECT 
      Sleep_Duration AS sömn,
      Depression AS depression
    FROM student_depression
  `);

  let mapped = rawData.map(row => {
    let text = String(row.sömn).replaceAll("'", "").trim();
    let timmar = null;

    if (text === '5-6 hours') timmar = 5.5;
    if (text === '7-8 hours') timmar = 7.5;
    if (text === 'Less than 5 hours') timmar = 4;
    if (text === 'More than 8 hours') timmar = 9;

    return {
      sömn: timmar,
      depression: Number(row.depression)
    };
  }).filter(x => x.sömn !== null && !isNaN(x.depression));

  let sleep = mapped.map(x => x.sömn);
  let depression = mapped.map(x => x.depression);

  if (sleep.length < 2) {
    throw new Error('För få datapunkter för statistisk analys');
  }

  let correlation = s.sampleCorrelation(sleep, depression);

  addMdToPage(`
## Statistisk analys

**Korrelation mellan sömntimmar och depression: ${correlation.toFixed(3)}**

### Nollhypotes

Nollhypotesen är att det **inte finns något samband** mellan sömn och depression.

### Resultat

Den beräknade korrelationen är **${correlation.toFixed(3)}**, vilket är mycket nära 0.

### Tolkning

Eftersom värdet är nära 0 tyder det på att sambandet är mycket svagt.

Vi kan därför **inte förkasta nollhypotesen**, vilket innebär att vi inte har tillräckligt starka bevis för att säga att sömn påverkar depression tydligt i denna data.
`);

  let mean = s.mean(sleep);
  let median = s.median(sleep);
  let std = s.standardDeviation(sleep);

  addMdToPage(`
## Fördelningsanalys (normalfördelning)

- Medelvärde: **${mean.toFixed(2)}**
- Median: **${median.toFixed(2)}**
- Standardavvikelse: **${std.toFixed(2)}**

När medelvärde och median ligger relativt nära varandra tyder det på att datan inte är kraftigt snedfördelad.

I detta fall är skillnaden relativt liten, vilket tyder på att sömndatan inte är extremt snedfördelad. En mer exakt bedömning av normalfördelning skulle dock kräva fler statistiska tester.
`);

  addMdToPage(`
## Slutsats

Sammanfattningsvis visar analysen att sömn verkar ha ett visst samband med depression på gruppnivå. Personer med mycket lite sömn har högre andel depression, men den statistiska analysen visar samtidigt att sambandet är svagt.

Det tyder på att sömn sannolikt är en av flera faktorer som påverkar psykisk hälsa.
`);

} catch (e) {
  addMdToPage(`
## Fel i statistisk analys

${e.message}
`);
}