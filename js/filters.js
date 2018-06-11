var filters = {
  sort: 'intensity',
  industry: 'all',
  year: 2015,
  company: 'all'
}
function createFilters(data, sortCompany, sortIntensity) {
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
  setSelectDefault('year', Math.max(...getUniqueValues(data, 'year')));
  setSelectDefault('sort', 'intensity')
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
  var options = select.selectAll('option')
                      // Need the custom id mapping so we don't override the defaults
                      .data(data, function(d) { return d; });
  options.enter()
         .append('option')
            .attr('value', (d) => d)
            .text((d) => d + append);

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
  ['industry', 'year', 'company'].forEach(key => {
    if (filters[key] !== 'all') {
      newData = newData.filter(d => d[key] === filters[key]);
    }
  });
  newData.sort(filters.sort === 'company' ? sortCompany : sortIntensity);
  updateChart(newData);
}

function setSelectDefault(key, value) {
  document.getElementById('select-' + key).value = value;
  filters[key] = value;
  updateData();
}

function avoidConflicts(ele, key) {
  // If we set industry then reset company, and visa versa
  if (ele.node().val !== 'all' && (key === 'industry' || key === 'company')) {
    let conflict = key === 'industry' ? 'company' : 'industry';
    filters[conflict] = 'all';
    document.getElementById('select-' + conflict).value = 'all';
  }
}

function filterRemainingOptions (ele, key, val) {
  if (key === 'industry' && val !== 'all') {
    // Only show companies in that industry in the companies select
    populateSelect(d3.select('#select-company'), getUniqueValues(data.filter(d => d.industry === val), 'company'));
  } else if ((key === 'company' || key === 'industry') && val === 'all')  {
    // Add back in all companies when selecting all companies or all industries
    populateSelect(d3.select('#select-company'), getUniqueValues(data, 'company'));
  }
}