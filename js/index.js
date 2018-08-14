// Modified from https://bl.ocks.org/mbostock/6fead6d1378d6df5ae77bb6a719afcb2
var data = [];
var copy; // Written copy from the spreadsheet
var companies;
var sectors;
var years;

document.addEventListener('DOMContentLoaded', function(e) {
  d3.json('https://sheets.googleapis.com/v4/spreadsheets/1FKNZgxGHjQt9tQ-qmrst1TwK67FgAh7blCL1o-te_3Y/values/A:AZ?key=AIzaSyA-F8PTqmCvmlWUPmKo8mVMS2siV7kIpZw', init);
});

function init(error, sourceData) {
  if (error) {
    return alert('Something went wrong, please try again later.');
  }
  cleanAndParseData(sourceData);
  updateCopy();
  createChart(data);
  createFilters(data);
  loadFilters();
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
    footprintChangeCategory: cols.indexOf('CoClear-Change Category'),
    footprintChangeReason: cols.indexOf('Reason for change'),
  }

  copy = {
    title: sourceData[0][cols.indexOf('Title Text')],
    header: sourceData[0][cols.indexOf('Header Text')],
    footer1: sourceData[0][cols.indexOf('Footer Text1')],
    footer2: sourceData[0][cols.indexOf('Footer Text2')],
    footerImg: sourceData[0][cols.indexOf('Footer Img URL')],
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
    footprintLabel: row[colIndexes.footprint],
    upstreamPer: row[colIndexes.upstream],
    manufacturingPer: row[colIndexes.operation],
    downstreamPer: row[colIndexes.downstream],
    carbonInt: parseFloat(row[colIndexes.carbonInt]),
    carbonIntLabel: row[colIndexes.carbonInt],
    weight: row[colIndexes.weight],
    weightSource: row[colIndexes.weightSource],
    dataCorrections: row[colIndexes.dataCorrections],
    protocol: row[colIndexes.protocol],
    footprintChangePer: parseFloat(row[colIndexes.footprintChangePer]),
    footprintChangeCategory: row[colIndexes.footprintChangeCategory],
    footprintChangeReason: row[colIndexes.footprintChangeReason],
  };
  obj['upstream']                 = ((parseFloat(row[colIndexes.upstream]) || 0) / 100) * obj.carbonInt;
  obj['manufacturing']            = ((parseFloat(row[colIndexes.operation]) || 0) / 100) * obj.carbonInt;
  obj['downstream']               = ((parseFloat(row[colIndexes.downstream]) || 0) / 100) * obj.carbonInt;
  obj['stage data not available'] = (obj['upstream'] + obj['manufacturing'] + obj['downstream']) === 0 ?
                                      obj.carbonInt : 0;
  return obj;
}

function updateCopy() {
  document.getElementById('title-text').innerHTML = copy.title;
  document.getElementById('header-text').innerHTML = copy.header;
  document.getElementById('footer-text1').innerHTML = copy.footer1;
  document.getElementById('footer-text2').innerHTML = copy.footer2;
  document.getElementById('footer-img').src = copy.footerImg;
}

function sortCompany(a, b) {
  let aName = a.company.toUpperCase();
  let bName = b.company.toUpperCase();
  return aName < bName ? -1 : aName > bName ? 1 : sortIntensity(a, b);
}

function sortIntensity(a, b) {
  return a.carbonInt > b.carbonInt ? 1 : a.carbonInt < b.carbonInt ? -1 : 0;
}

function sortSector(a, b) {
  return a.sector > b.sector ? 1 : a.sector < b.sector ? -1 : sortIntensity(a, b);
}