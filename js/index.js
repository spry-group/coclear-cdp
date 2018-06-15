// Modified from https://bl.ocks.org/mbostock/6fead6d1378d6df5ae77bb6a719afcb2
var data = [];
var companies;
var sectors;
var years;

document.addEventListener('DOMContentLoaded', function(e) {
  d3.json('https://sheets.googleapis.com/v4/spreadsheets/1FKNZgxGHjQt9tQ-qmrst1TwK67FgAh7blCL1o-te_3Y/values/A:Z?key=AIzaSyA-F8PTqmCvmlWUPmKo8mVMS2siV7kIpZw', init);
});

function init(error, sourceData) {
  if (error) {
    return alert('Something went wrong, please try again later.');
  }
  cleanAndParseData(sourceData);
  updateHeader();
  createChart(data);
  createFilters(data, sortCompany, sortIntensity);
}

function cleanAndParseData(sourceData) {
  sourceData = sourceData.values;
  sourceData.shift(); // Discard copyright notice
  let cols = sourceData.shift();
  let colIndexes = {
    company: cols.indexOf('Organisation'),
    name: cols.indexOf('Product name'),
    id: cols.indexOf('CoClear-Product ID'),
    desc: cols.indexOf('Product detail'),
    footprint: cols.indexOf('Product CO2e footprint (kg CO2e)'),
    upstream: cols.indexOf('CoClear-Footprint %Upstream'),
    operation: cols.indexOf('CoClear-Footprint %Operation'),
    downstream: cols.indexOf('CoClear-Footprint %Downstream'),
    transportation: cols.indexOf('CoClear-Footprint %Transportion'),
    endOfLife: cols.indexOf('CoClear-Footprint %EndOfLife'),
    sector: cols.indexOf('CoClear-Sector Mapping'),
    year: cols.indexOf('Year of reporting'),
    carbonInt: cols.indexOf('CoClear-Product Carbon Intensity'),
    weight: cols.indexOf('Product FU Weight (kg)'),
    weightSource: cols.indexOf('CoClear Product Weight Source'),
    dataCorrections: cols.indexOf('CoClear DataCorrections Comment'),
    protocol: cols.indexOf('CoClear Protocol Mapping'),
    footprintChangePer: cols.indexOf('Footprint %Change'),
    footprintChangeReason: cols.indexOf('Reason for change'),
  }

  data.push(...sourceData.map((row) => mapRow(colIndexes, row)));
  data.sort(sortCompany);
}

function mapRow(colIndexes, row) {
  let obj = {
    company: row[colIndexes.company],
    name: row[colIndexes.name],
    coclearId: row[colIndexes.id],
    id: row[colIndexes.id] + row[colIndexes.year],
    desc: row[colIndexes.desc],
    sector: row[colIndexes.sector],
    year: parseInt(row[colIndexes.year]),
    footprint: parseFloat(row[colIndexes.footprint]),
    upstreamPer: row[colIndexes.upstream],
    manufacturingPer: row[colIndexes.operation],
    downstreamPer: row[colIndexes.downstream],
    carbonInt: parseFloat(row[colIndexes.carbonInt]),
    weight: row[colIndexes.weight],
    weightSource: row[colIndexes.weightSource],
    dataCorrections: row[colIndexes.dataCorrections],
    protocol: row[colIndexes.protocol],
    footprintChangePer: parseFloat(row[colIndexes.footprintChangePer]),
    footprintChangeReason: row[colIndexes.footprintChangeReason],
  };
  obj['upstream']                 = ((parseFloat(row[colIndexes.upstream]) || 0) / 100) * obj.carbonInt;
  obj['manufacturing']            = ((parseFloat(row[colIndexes.operation]) || 0) / 100) * obj.carbonInt;
  obj['downstream']               = ((parseFloat(row[colIndexes.downstream]) || 0) / 100) * obj.carbonInt;
  obj['stage data not available'] = (obj['upstream'] + obj['manufacturing'] + obj['downstream']) === 0 ?
                                      obj.carbonInt : 0;
  return obj;
}

function updateHeader() {
  document.getElementById('productCount').innerHTML = data.length;
  let yearRange = d3.extent(data, (d) => d.year);
      yearRange = JSON.stringify(yearRange[0]) + '-' + JSON.stringify(yearRange[1]).substring(2);
  document.querySelector('#header .yearRange').innerHTML = yearRange;
  document.querySelector('#footer .yearRange').innerHTML = yearRange;
}

function sortCompany(a, b) {
  let aName = a.company.toUpperCase();
  let bName = b.company.toUpperCase();
  return aName < bName ? -1 : aName > bName ? 1 : sortIntensity(a, b);
}

function sortIntensity(a, b) {
  return a.carbonInt > b.carbonInt ? 1 : a.carbonInt < b.carbonInt ? -1 : 0;
}