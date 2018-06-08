var filters = {
  sort: 'company',
  industry: 'all',
  year: 2015,
  company: 'all'
}
function createFilters(data, sortCompany, sortFootprint) {
  const sortSelect = d3.select('#select-sort');
  const industrySelect = d3.select('#select-industry');
  const yearSelect = d3.select('#select-year');
  const companySelect = d3.select('#select-company');

  populateSelect(industrySelect, getUniqueValues(data, 'industry'), ' Industry');
  populateSelect(yearSelect, getUniqueValues(data, 'year'));
  populateSelect(companySelect, getUniqueValues(data, 'company'));
  bindSelect(sortSelect, 'sort');
  bindSelect(industrySelect, 'industry');
  bindSelect(yearSelect, 'year');
  bindSelect(companySelect, 'company');
  setYear(yearSelect, getUniqueValues(data, 'year'));
}

// Takes an array of objects and a key to map to.
// Returns an array of unique values
function getUniqueValues(data, key) {
 return data.map(d => d[key]).filter((ele, pos, arr) => {
   return arr.indexOf(ele) === pos;
 }).sort();
}

function populateSelect(select, data, append) {
  append = append || '';
  select.selectAll('option')
        .data(data, function(d) { return d; }) // Need the custom id mapping so we don't override the defaults
        .enter()
        .append('option')
          .attr('value', (d) => d)
          .text((d) => d + append);
}

function bindSelect(ele, key) {
  ele.on('change', function() {
    let val = ele.node().value;
    filters[key] = key !== 'year' || val === 'all' ? val : parseInt(val);
    updateData();
  });
}

function updateData() {
  let newData = [...data];
  ['industry', 'year', 'company'].forEach(key => {
    if (filters[key] !== 'all') {
      newData = newData.filter(d => d[key] === filters[key]);
    }
  });
  newData.sort(filters.sort === 'company' ? sortCompany : sortFootprint);
  updateChart(newData);
}

function setYear(yearSelect, years) {
  let currentYear = Math.max(...years);
  document.getElementById('select-year').value = currentYear;
  filters.year = currentYear;
  updateData();
}