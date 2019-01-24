// TODO: eliminate globals.
var data = [];
var copy; // Written copy from the spreadsheet
var companies;
var sectors;
var years;

document.addEventListener('DOMContentLoaded', function(e) {
  d3.json('content.json', init);
});

function init(error, content) {
  if (error) {
    return alert('Something went wrong, please try again later.');
  }
  data = content.data;
  copy = content.copy;
  updateCopy(content.copy);
  createChart(content.data);
  createFilters(content.data);
  loadFilters();
}


function updateCopy(copy) {
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