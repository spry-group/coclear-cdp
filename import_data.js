'use strict';

const request = require("request-promise-native");
const fs = require("fs");

import_data();

async function import_data() {
  try {
    /* backup of document created at 1y-bcX_Jk8OPGXW9M8IizkuhNQ0b-M2068d1iWJdSp6I in darrel's spry-group account in case upstream ever disappears */
    const dataUrl = 'https://sheets.googleapis.com/v4/spreadsheets/1FKNZgxGHjQt9tQ-qmrst1TwK67FgAh7blCL1o-te_3Y/values/A:AZ?key=AIzaSyA-F8PTqmCvmlWUPmKo8mVMS2siV7kIpZw';
    const rawdata = await fetchRawData(dataUrl)
    const column_headers = rawdata.shift();
    const field_index = buildFieldIndex(column_headers);
    // TODO: normalize companies, sectors, and years to reduce data size and speed processing. (integer comparison vs string)
    const data = parseData(rawdata, field_index);
    const copy = parseCopy(rawdata, column_headers);
    writeJson(data, copy);
    return {data, copy};
  }
  catch (error) {
    console.error(error);
  }
}

async function fetchRawData(url) {
  try {
    // fetch data and strip leading line()
    const response = await request({ url, json: true});
    // remove duplicate header row.
    response.values.shift();
    return response.values;
  }
  catch (error) {
    throw new Error(`GET Data Failed: ${error}`);
  }
}

function buildFieldIndex(column_headers) {
  try {
    // find the fields we care about in the data
    return {
      company: column_headers.indexOf('Organisation'),
      country: column_headers.indexOf('Country'),
      name: column_headers.indexOf('Product name'),
      id: column_headers.indexOf('CoClear-Product ID'),
      desc: column_headers.indexOf('Product detail'),
      footprint: column_headers.indexOf('Product CO2e footprint (kg CO2e)'),
      upstream: column_headers.indexOf('CoClear-Footprint %Upstream'),
      operation: column_headers.indexOf('CoClear-Footprint %Operation'),
      downstream: column_headers.indexOf('CoClear-Footprint %Downstream'),
      transportation: column_headers.indexOf('CoClear-Footprint %Transportion'),
      endOfLife: column_headers.indexOf('CoClear-Footprint %EndOfLife'),
      sector: column_headers.indexOf('CoClear-Sector Mapping'),
      year: column_headers.indexOf('Year of reporting'),
      carbonInt: column_headers.indexOf('CoClear-Product Carbon Intensity'),
      weight: column_headers.indexOf('Product FU Weight (kg)'),
      weightSource: column_headers.indexOf('CoClear Product Weight Source'),
      dataCorrections: column_headers.indexOf('CoClear DataCorrections Comment'),
      protocol: column_headers.indexOf('CoClear Protocol Mapping'),
      footprintChangePer: column_headers.indexOf('Footprint %Change'),
      footprintChangeCategory: column_headers.indexOf('CoClear-Change Category'),
      footprintChangeReason: column_headers.indexOf('Reason for change'),
    }
  }
  catch (error) {
    throw new Error(`Error building field_index: ${error}`)
  }
}

function parseData(rawdata, field_index) {
  try {

    function row2field(row, index) {
      let obj = {
        company: row[index.company],
        country: row[index.country],
        name: row[index.name],
        coclearId: row[index.id],
        id: row[index.id] + row[index.year],
        desc: row[index.desc],
        sector: row[index.sector],
        year: parseInt(row[index.year]),
        footprint: parseFloat(row[index.footprint]),
        footprintLabel: row[index.footprint],
        upstreamPer: row[index.upstream],
        manufacturingPer: row[index.operation],
        downstreamPer: row[index.downstream],
        carbonInt: parseFloat(row[index.carbonInt]),
        carbonIntLabel: row[index.carbonInt],
        weight: row[index.weight],
        weightSource: row[index.weightSource],
        dataCorrections: row[index.dataCorrections],
        protocol: row[index.protocol],
        footprintChangePer: parseFloat(row[index.footprintChangePer]),
        footprintChangePerLabel: row[index.footprintChangePer].replace('-', ''),
        footprintChangeCategory: row[index.footprintChangeCategory],
        footprintChangeReason: row[index.footprintChangeReason],
      };
      obj['upstream']                 = ((parseFloat(row[index.upstream]) || 0) / 100) * obj.carbonInt;
      obj['manufacturing']            = ((parseFloat(row[index.operation]) || 0) / 100) * obj.carbonInt;
      obj['downstream']               = ((parseFloat(row[index.downstream]) || 0) / 100) * obj.carbonInt;
      obj['stageTotal']               = obj['upstream'] + obj['manufacturing'] + obj['downstream'];
      obj['stage data not available'] = (obj['stageTotal']) === 0 ? obj.carbonInt : 0;
      return obj;
    }

    function sortCompany(a, b) {
      let aName = a.company.toUpperCase();
      let bName = b.company.toUpperCase();
      return aName < bName ? -1 : aName > bName ? 1 : sortIntensity(a, b);
    }

    function sortIntensity(a, b) {
      return a.carbonInt > b.carbonInt ? 1 : a.carbonInt < b.carbonInt ? -1 : 0;
    }
    return rawdata.map((row) => row2field(row, field_index)).sort(sortCompany);
  }
  catch (error) {
    throw new Error(`Error parsing data: ${error}`);
  }
}


function parseCopy(rawdata, column_headers) {
  try {
    // content copy is stored in the first row. It would be preferable to move to a different sheet or hardcode.
    return {
      title: rawdata[0][column_headers.indexOf('Title Text')],
      header: rawdata[0][column_headers.indexOf('Header Text')],
      footer1: rawdata[0][column_headers.indexOf('Footer Text1')],
      footer2: rawdata[0][column_headers.indexOf('Footer Text2')],
      footerImg: rawdata[0][column_headers.indexOf('Footer Img URL')],
    }
  }
  catch (error) {
    throw new Error(`Error parsing copy: ${error}`);
  }
}

function writeJson(data, copy) {
  try {
    fs.writeFileSync('./src/201901-CDP/content.json', JSON.stringify({data, copy}));
  }
  catch(error) {
    throw new Error(`Error parsing copy': ${error}`);
  }
}



