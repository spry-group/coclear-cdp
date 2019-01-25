import { EventEmitter } from "events";

export class Filters extends EventEmitter {
    protected filters: any  = { sort: 'sector', sector: 'all', company: 'all', year: 'all' };

    constructor(defaults: any )   {
      super();
      this.filters = { ...this.filters, defaults };
    }

    set(name:string, value: any) {
      this.filters[name] = value;
      this.emit('change', name, value);
    }

    get(name:string) {
      return this.filters[name];
    }
}




// function filterChanged(element) {
//   let name = element.property('name');
//   let value = element.property('value');

//   // convert years to numeric if they're not all.
//   if (name == 'year' && value != 'all') value = parseInt(value);

//   // short circuit if no change, so we don't create infinite looping when
//   // modifying select options.
//   if (filters[name] == value) return;

//   //console.log('filterChanged', name, value);
//   filters[name] = value;
//   updateData();
// }

// function createSelectOptions(select, options, selected) {
//   //console.log('createSelectOptions', options, selected)


// }



// // limit year options to all available year after applying all other filters.
// function yearOptionsFilter(data) {
//   return ( filters.company  === 'all' || data.company === filters.company) &&
//          ( filters.sector === 'all' || data.sector === filters.sector);
// }

// function companyOptionsFilter(data) {
//   return ( filters.year === 'all' || data.year === filters.year) &&
//          ( filters.sector === 'all' || data.sector === filters.sector)
// }

// function sectorOptionsFilter(data) {
//   return ( filters.year === 'all' || data.year === filters.year) &&
//          ( filters.company  === 'all' || data.company === filters.company)
// }

// function distinctFilter(value, index, self) {
//   return self.indexOf(value) === index;
// }


// function updateSelects() {
//   const yearOptions = data.filter(yearOptionsFilter).map(function(d) { return d.year; }).filter(distinctFilter);
//   createSelectOptions(selects.year, yearOptions, filters.year);

//   const companyOptions = data.filter(companyOptionsFilter).map(function(d) { return d.company }).filter(distinctFilter);
//    createSelectOptions(selects.company, companyOptions, filters.company);


//   const sectorOptions = data.filter(sectorOptionsFilter).map(function(d) { return d.sector }).filter(distinctFilter);
//   createSelectOptions(selects.sector, sectorOptions, filters.sector);
// }

// // to change viewed data, update the global filters object, then call updateData();
// function updateData() {
//   updateLocation();
//   updateSelects();
//   updateChart();
// }


