var filters = {
  sort: 'intensity',
  sector: 'all',
  year: 2015,
  company: 'all'
}
function createFilters(data) {
  const sortSelect = d3.select('#select-sort');
  const sectorSelect = d3.select('#select-sector');
  const yearSelect = d3.select('#select-year');
  const companySelect = d3.select('#select-company');

  populateSelect(sectorSelect, getUniqueValues(data, 'sector'));
  populateSelect(yearSelect, getUniqueValues(data, 'year'));
  populateSelect(companySelect, getUniqueValues(data, 'company'));
  bindSelect(sortSelect, 'sort');
  bindSelect(sectorSelect, 'sector');
  bindSelect(yearSelect, 'year');
  bindSelect(companySelect, 'company');
  setSelectDefault('year', Math.max(...getUniqueValues(data, 'year')));
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
    filterRemainingOptions(ele, key, val);
    updateData();
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
  updateData();
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
  }
}

function filterRemainingOptions (ele, key, val) {
  if (key === 'sector' && val !== 'all') {
    // Only show companies in that sector in the companies select
    populateSelect(d3.select('#select-company'), getUniqueValues(data.filter(d => d.sector === val), 'company'));
  } else if ((key === 'company' || key === 'sector') && val === 'all')  {
    // Add back in all companies when selecting all companies or all sectors
    populateSelect(d3.select('#select-company'), getUniqueValues(data, 'company'));
  }
}