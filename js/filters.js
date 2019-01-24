// global filter state.
var filters = { sort: 'all', sector: 'all', year: 'all', company: 'all' }
// handle for selects.
var selects = {};

function createFilters(data) {
  // establish initial filter values
  let year = getQueryVariable('year') || 2013;
  if (year && year != 'all') year = parseInt(year);
  let sector = getQueryVariable('sector') || 'all';
  let company = getQueryVariable('company') || 'all';
  let sort = getQueryVariable('sort') || 'sector';

  Object.assign(filters, {  year, sector, company, sort });

  selects.sort = d3.select('#select-sort')
    .property('value', filters.sort || 'all')
    .on('change', (event) => filterChanged(selects.sort));
  selects.sector = d3.select('#select-sector')
    .property('value', filters.sector || 'all')
    .on('change', (event) => filterChanged(selects.sector));
  selects.year = d3.select('#select-year')
    .property('value', filters.year || 'all')
    .on('change', (event) => filterChanged(selects.year));
  selects.company = d3.select('#select-company')
    .property('value', filters.company || 'all')
    .on('change', (event) => filterChanged(selects.company));
  updateData();
}

function createSelectOptions(select, options, selected) {
  //console.log('createSelectOptions', options, selected)

  // use object itself as key to identify data.
  var optionElements = select.selectAll('option').data(options, function(d) { return d;});
  optionElements.enter().append('option').attr('value', (d) => d).text((d) => d);
  // use object itself as key to identify which entities to remove.
  optionElements.exit().filter(function(d,i) { return d }).remove();
  select.property('value', selected);
}

function filterChanged(element) {
  let name = element.property('name');
  let value = element.property('value');

  // convert years to numeric if they're not all.
  if (name == 'year' && value != 'all') value = parseInt(value);

  // short circuit if no change, so we don't create infinite looping when
  // modifying select options.
  if (filters[name] == value) return;

  //console.log('filterChanged', name, value);
  filters[name] = value;
  updateData();
}

// limit year options to all available year after applying all other filters.
function yearOptionsFilter(data) {
  return ( filters.company  === 'all' || data.company === filters.company) &&
         ( filters.sector === 'all' || data.sector === filters.sector);
}

function companyOptionsFilter(data) {
  return ( filters.year === 'all' || data.year === filters.year) &&
         ( filters.sector === 'all' || data.sector === filters.sector)
}

function sectorOptionsFilter(data) {
  return ( filters.year === 'all' || data.year === filters.year) &&
         ( filters.company  === 'all' || data.company === filters.company)
}

function distinctFilter(value, index, self) {
  return self.indexOf(value) === index;
}


function updateSelects() {
  const yearOptions = data.filter(yearOptionsFilter).map(function(d) { return d.year; }).filter(distinctFilter);
  createSelectOptions(selects.year, yearOptions, filters.year);

  const companyOptions = data.filter(companyOptionsFilter).map(function(d) { return d.company }).filter(distinctFilter);
   createSelectOptions(selects.company, companyOptions, filters.company);


  const sectorOptions = data.filter(sectorOptionsFilter).map(function(d) { return d.sector }).filter(distinctFilter);
  createSelectOptions(selects.sector, sectorOptions, filters.sector);
}

// to change viewed data, update the global filters object, then call updateData();
function updateData() {
  updateLocation();
  updateSelects();
  updateChart();
}

let queryParams;
function getQueryVariable(variable) {
  if (!queryParams) {
    queryParams = {};
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        queryParams[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1])
    }
  }
  return queryParams[variable];
}

// Adds or modifies query string params
function updateLocation() {
  var queryString = '?sector='+encodeURIComponent(filters.sector)
                    +'&company='+encodeURI(filters.company)
                    +'&year='+encodeURI(filters.year)
                    +'&sort='+encodeURI(filters.sort);
  history.pushState(null, null, location.href.split('?')[0] + '?' + queryString);
}
