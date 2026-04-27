dbQuery.use('student-depression');

addMdToPage(`
## Depression uppdelat på kön

Detta diagram visar hur många män respektive kvinnor som rapporterar depression och hur många som inte gör det.
`);

let rawData = await dbQuery(`
  SELECT 
    CASE 
      WHEN Gender = 'Male' THEN 'Män'
      WHEN Gender = 'Female' THEN 'Kvinnor'
      ELSE Gender
    END AS kön,
    CASE
      WHEN Depression = 1 THEN 'Deprimerad'
      WHEN Depression = 0 THEN 'Inte deprimerad'
      ELSE 'Okänd'
    END AS status,
    COUNT(*) AS antal
  FROM student_depression
  GROUP BY kön, status
`);

let grupper = {
  'Kvinnor': { deprimerad: 0, inteDeprimerad: 0 },
  'Män': { deprimerad: 0, inteDeprimerad: 0 }
};

for (let row of rawData) {
  if (!grupper[row.kön]) continue;

  if (row.status === 'Deprimerad') {
    grupper[row.kön].deprimerad = Number(row.antal);
  }

  if (row.status === 'Inte deprimerad') {
    grupper[row.kön].inteDeprimerad = Number(row.antal);
  }
}

let chartData = [
  ['Kön', 'Deprimerad', 'Inte deprimerad'],
  ['Kvinnor', grupper['Kvinnor'].deprimerad, grupper['Kvinnor'].inteDeprimerad],
  ['Män', grupper['Män'].deprimerad, grupper['Män'].inteDeprimerad]
];

drawGoogleChart({
  type: 'ColumnChart',
  data: chartData,
  options: {
    title: 'Depression per kön',
    height: 500,
    isStacked: false,
    colors: ['#e74c3c', '#2ecc71'],
    vAxis: { title: 'Antal personer' },
    hAxis: { title: 'Kön' }
  }
});

tableFromData({
  data: rawData,
  columnNames: ['Kön', 'Depression', 'Antal']
});

addMdToPage(`
## Analys

Diagrammet visar att både män och kvinnor har många fall av depression i datasetet.

Antalet deprimerade män är högre i absoluta tal, men eftersom män också är fler i datamängden betyder det inte automatiskt att kön ensam förklarar depression.

Resultatet visar att kön är en relevant variabel att undersöka vidare.
`);