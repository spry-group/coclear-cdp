var filters = {
  sort: 'sector',
  sector: 'all',
  year: 2013,
  company: 'all'
}
var selects = {};

function createFilters(data) {
  selects.sort = d3.select('#select-sort');
  selects.sector = d3.select('#select-sector');
  selects.year = d3.select('#select-year');
  selects.company = d3.select('#select-company');
  const firstYear = data.reduce((result, item) => Math.min(result, item.year), Infinity);

  bindSelect(selects.sort, 'sort');
  bindSelect(selects.sector, 'sector');
  bindSelect(selects.year, 'year');
  bindSelect(selects.company, 'company');
  updateData();
  setSelectDefault('year', firstYear);
  setSelectDefault('sort', 'sector');
}


function populateSelect(select, data) {
  var options = select.selectAll('option')
                      // Need the custom id mapping so we don't override the defaults
                      .data(data, function(d) { return d; });
  options.enter()
         .append('option')
            .attr('value', (d) => d)
            .text((d) => d);

  options.exit()
         .filter(function(d, i) { return d; }) // Filter by key instead of index
         .remove();
}

function bindSelect(ele, key) {
  ele.on('change', function() {
    console.log('change')
    let val = ele.node().value;
    filters[key] = key !== 'year' || val === 'all' ? val : parseInt(val);
    updateData();
  });
}

function updateData() {
  let newData = [...data];

  let filteredData = newData.filter((data) =>
    (filters.year === 'all' || data.year === filters.year) &&
    (filters.company === 'all' || data.company === filters.company) &&
    (filters.sector === 'all' || data.sector === filters.sector)
  );
  const yearOptions = new Set(filteredData.map((d) => d.year));
  const companyOptions = new Set(filteredData.map((d) => d.company));
  const sectorOptions = new Set(filteredData.map((d) => d.sector));
  populateSelect(selects.year, Array.from(yearOptions));
  populateSelect(selects.company, Array.from(companyOptions));
  populateSelect(selects.sector, Array.from(sectorOptions));

  console.log('wat', newData);
  filteredData.sort(filters.sort === 'company' ?
    sortCompany :
    filters.sort === 'intensity' ?
      sortIntensity :
      sortSector
  );
  updateChart(filteredData);
}

function setSelectDefault(key, value) {
  document.getElementById('select-' + key).value = value;
  filters[key] = value;
  console.log('yes', value)
}

function loadFilters() {
  let queryDict = mapQueryParamsToDict();
  Object.keys(queryDict).forEach(queryKey => {
    if (queryKey in filters) {
      let val = decodeURIComponent(queryDict[queryKey]);
      if (queryKey === 'year' && val !== 'all') {
        val = parseFloat(val);
      }
      setSelectDefault(queryKey, val);
      filters[queryKey] = val;
    }
  });
  updateData();
}

// Adds or modifies query string params
function updateQueryParam(key, val) {
  let queryDict = mapQueryParamsToDict();
  queryDict[key] = encodeURIComponent(val);
  let queryString = Object.keys(queryDict).map(queryKey => queryKey + '=' + queryDict[queryKey]).join('&');
  history.pushState(null, '', location.href.split('?')[0] + '?' + queryString);
}

// Take all query params in the url and return them as a dictionary
function mapQueryParamsToDict() {
  let queryDict = {};
  let matches = location.search.match(/(\w+)=([\w,%]+)/g);
  if (matches) {
    matches.forEach(match => queryDict[match.split('=')[0]] = match.split('=')[1]);
  }

  return queryDict;
}