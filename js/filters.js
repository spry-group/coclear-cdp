var filters = {
  sort: 'company',
  sector: 'all',
  year: 2013,
  company: 'all'
}
function createFilters(data) {
  const sortSelect = d3.select('#select-sort');
  const sectorSelect = d3.select('#select-sector');
  const yearSelect = d3.select('#select-year');
  const companySelect = d3.select('#select-company');
  let firstYear = Math.min(...getUniqueValues(data, 'year'));

  populateSelect(sectorSelect, getUniqueValues(data, 'sector'));
  populateSelect(yearSelect, getUniqueValues(data, 'year'));
  populateSelect(companySelect, getUniqueCompaniesByYear(firstYear));
  bindSelect(sortSelect, 'sort');
  bindSelect(sectorSelect, 'sector');
  bindSelect(yearSelect, 'year');
  bindSelect(companySelect, 'company');
  setSelectDefault('year', firstYear);
  setSelectDefault('sort', 'company');
  updateData();
}

// Takes an array of objects and a key to map to.
// Returns an array of unique values
function getUniqueValues(data, key) {
 return data.map(d => d[key]).filter((ele, pos, arr) => {
   return arr.indexOf(ele) === pos;
 }).sort();
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
    let val = ele.node().value;
    filters[key] = key !== 'year' || val === 'all' ? val : parseInt(val);
    avoidConflicts(ele, key);
    filterRemainingOptions(key, val);
    updateData();
    // updateQueryParam(key, val);
  });
}

function updateData() {
  let newData = [...data];
  ['sector', 'year', 'company'].forEach(key => {
    if (filters[key] !== 'all') {
      newData = newData.filter(d => d[key] === filters[key]);
    }
  });
  newData.sort(filters.sort === 'company' ? sortCompany : filters.sort === 'intensity' ? sortIntensity : sortSector);
  updateChart(newData);
}

function setSelectDefault(key, value) {
  document.getElementById('select-' + key).value = value;
  filters[key] = value;
}

function avoidConflicts(ele, key) {
  // // Ignore if we're choosing a single company after filtering down to a sector
  if (key === 'company' && filters.sector !== 'all' && ele.node().value !== 'all') {
    return;
  }

  // If we set sector then reset company, and visa versa
  if (key === 'sector' || key === 'company') {
    let conflict = key === 'sector' ? 'company' : 'sector';
    filters[conflict] = 'all';
    document.getElementById('select-' + conflict).value = 'all';
    // updateQueryParam(conflict, 'all');
  }

  // Restrict company list to companies with data for that year
  if (key === 'year') {
    populateCompaniesByYear(ele, key);
  }
}

function getUniqueCompaniesByYear(year) {
  return getUniqueValues(
    data.filter(d => d.year === year),
    'company'
  )
}

function populateCompaniesByYear(ele, key) {
  let selectedVal = ele.node().value;
  const companySelect = d3.select('#select-company');

  if (selectedVal === 'all') {
    return populateSelect(companySelect, getUniqueValues(data, 'company'));
  }

  // Show only companies who we have data for that year.
  selectedVal = parseInt(selectedVal);
  let companiesInYear = getUniqueCompaniesByYear(selectedVal);
  populateSelect(companySelect, companiesInYear);

  // If the selected company doesn't have data for this year then reset the company selector
  if (companiesInYear.indexOf(filters.company) === -1) {
    setSelectDefault('company', 'all');
  }

}

function filterRemainingOptions(key, val) {
  if (key === 'sector' && val !== 'all') {
    // Only show companies in that sector in the companies select
    populateSelect(d3.select('#select-company'), getUniqueValues(data.filter(d => d.sector === val), 'company'));
  } else if ((key === 'company' || key === 'sector') && val === 'all')  {
    // Add back in all companies when selecting all companies or all sectors
    populateSelect(d3.select('#select-company'), getUniqueValues(data, 'company'));
  }
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