// Modified from https://bl.ocks.org/mbostock/6fead6d1378d6df5ae77bb6a719afcb2
var data = [];
var companies;
var industries;
var years;

document.addEventListener("DOMContentLoaded", function(e) {
  d3.json('https://sheets.googleapis.com/v4/spreadsheets/1FKNZgxGHjQt9tQ-qmrst1TwK67FgAh7blCL1o-te_3Y/values/A:Z?key=AIzaSyA-F8PTqmCvmlWUPmKo8mVMS2siV7kIpZw', init);
});

function init(error, sourceData) {
  if (error) {
    return alert('Something went wrong, please try again later.');
  }
  cleanAndParseData(sourceData);
  createChart(data);
  createFilters(data, sortCompany, sortFootprint);
}

function cleanAndParseData(sourceData) {
  sourceData = sourceData.values;
  sourceData.shift(); // Discard copyright notice
  let cols = sourceData.shift();
  let colIndexes = {
    company: cols.indexOf("Organisation"),
    name: cols.indexOf("Product name"),
    desc: cols.indexOf("Product detail"),
    footprint: cols.indexOf("Product CO2e footprint (kg CO2e)"),
    upstream: cols.indexOf("CoClear-Footprint %Upstream"),
    operation: cols.indexOf("CoClear-Footprint %Operation"),
    downstream: cols.indexOf("CoClear-Footprint %Downstream"),
    transportation: cols.indexOf("CoClear-Footprint %Transportion"),
    endOfLife: cols.indexOf("CoClear-Footprint %EndOfLife"),
    industry: cols.indexOf("CoClear-Sector Mapping"),
    year: cols.indexOf("Year of reporting"),
    carbonInt: cols.indexOf("CoClear-Product Carbon Intensity"),
    weight: cols.indexOf("Product FU Weight (kg)"),
    weightSource: cols.indexOf("CoClear Product Weight Source"),
    protocol: cols.indexOf("CoClear Protocol Mapping"),
    footprintChangePer: cols.indexOf("Footprint %Change"),
    footprintChangeReason: cols.indexOf("Reason for change"),
  }

  data.push(...sourceData.map((row) => mapRow(colIndexes, row)));
  data.sort(sortCompany);
}

function mapRow(colIndexes, row) {
  let obj = {
    company: row[colIndexes.company],
    name: row[colIndexes.name],
    desc: row[colIndexes.desc],
    industry: row[colIndexes.industry],
    year: parseInt(row[colIndexes.year]),
    footprint: parseFloat(row[colIndexes.footprint]),
    upstreamPer: row[colIndexes.upstream],
    manufacturingPer: row[colIndexes.operation],
    downstreamPer: row[colIndexes.downstream],
    carbonInt: row[colIndexes.carbonInt],
    weight: row[colIndexes.weight],
    weightSource: row[colIndexes.weightSource],
    protocol: row[colIndexes.protocol],
    footprintChangePer: row[colIndexes.footprintChangePer],
    footprintChangeReason: row[colIndexes.footprintChangeReason],
  };
  obj["upstream"]                 = ((parseFloat(row[colIndexes.upstream]) || 0) / 100) * obj.footprint;
  obj["manufacturing"]            = ((parseFloat(row[colIndexes.operation]) || 0) / 100) * obj.footprint;
  obj["downstream"]               = ((parseFloat(row[colIndexes.downstream]) || 0) / 100) * obj.footprint;
  obj["stage data not available"] = (obj["upstream"] + obj["manufacturing"] + obj["downstream"]) === 0 ? obj.footprint : 0;
  return obj;
}

function sortCompany(a, b) {
  a = a.company.toUpperCase();
  b = b.company.toUpperCase();
  return a < b ? -1 : a > b ? 1 : 0;
}

function sortFootprint(a, b) {
  return a.footprint < b.footprint ? 1 : a.footprint > b.footprint ? -1 : 0;
}