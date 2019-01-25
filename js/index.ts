// TODO: eliminate globals.
var data = [];
var copy; // Written copy from the spreadsheet
import * as d3 from 'd3';
import { createChart  } from './chart';
import { Filters } from './filters';
import { QueryString } from './QueryString';
import { Select } from './Select';


document.addEventListener('DOMContentLoaded',  async function(e) {
  let queryString = new QueryString();

  let filterDefaults =  {
    sort: queryString.get('sort') || 'sector',
    sector: queryString.get('sector') || 'all',
    company: queryString.get('company') || 'all',
    year: queryString.get('year') || '2017'
  }

  let filters = new Filters(filterDefaults)
  filters.on('change', (filter, value) => {
    // update the query string as the filters change.
    this.queryString.set(filter, value);
  });

  function onFilterSelectChanged(name: string, value: string) {
    filters.set(name, value);
  }

  let sectorSelect = new Select('sector').on('change', onFilterSelectChanged);

  let companySelect = new Select('company').on('change', onFilterSelectChanged);

  let yearSelect = new Select('year').on('change', onFilterSelectChanged);

  let sortSelect = new Select('sort').on('change', onFilterSelectChanged);



  try {

    let content:any = await d3.json('content.json');
    filters.on('change', () => {

    })
    data = content.data;
    copy = content.copy;
    // createFilters(content.data);
    // updateCopy(content.copy);
    // createChart(content.data, filters);
  }
  catch(error) {
      return alert('Something went wrong, please try again later.');
  }

});


function updateCopy(copy: any) {
  document.getElementById('title-text').innerHTML = copy.title;
  document.getElementById('header-text').innerHTML = copy.header;
  document.getElementById('footer-text1').innerHTML = copy.footer1;
  document.getElementById('footer-text2').innerHTML = copy.footer2;
  d3.select('#footer-img').attr('src', copy.footerImg);
}
