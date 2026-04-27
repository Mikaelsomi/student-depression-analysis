dbQuery.use('student-depression');

addMdToPage(`
## Könsfördelning i datasetet

Detta diagram och tabellen visar hur många män respektive kvinnor som finns i datamängden.
`);

let data = await dbQuery(`
  SELECT 
    CASE 
      WHEN Gender = 'Male' THEN 'Män'
      WHEN Gender = 'Female' THEN 'Kvinnor'
      ELSE Gender
    END AS kön,
    COUNT(*) AS antal
  FROM student_depression
  GROUP BY kön
`);

let chartData = [
  ['Kön', 'Antal']
];

for (let row of data) {
  chartData.push([row.kön, Number(row.antal)]);
}

drawGoogleChart({
  type: 'ColumnChart',
  data: chartData,
  options: {
    title: 'Könsfördelning i datasetet',
    height: 500,
    legend: { position: 'none' },
    vAxis: { title: 'Antal personer' },
    hAxis: { title: 'Kön' }
  }
});

tableFromData({
  data: data,
  columnNames: ['Kön', 'Antal']
});

addMdToPage(`
## Analys

Diagrammet visar att det finns fler män än kvinnor i datasetet.

Detta är viktigt att ta hänsyn till i den fortsatta analysen, eftersom en ojämn fördelning mellan grupper kan påverka hur resultaten tolkas.
`);