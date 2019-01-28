import './scss/style.scss';
import * as contentUrl from './content.json';

import { json } from 'd3-fetch';
import { combineLatest } from 'rxjs'

import { CDPChart2019 } from './js/CDPChart2019'
import { ObservableSelect } from './js/ObservableSelect';
import { QueryString } from './js/QueryString';

console.log('(c) 2019 CoClear, Inc.');
console.log('The visualization was designed by Erika Whilas of Coclear.');
console.log('The Spry Group work with CoClear to refine and implementment the visualization.')
console.log();
console.log('If you want to join or hire a team of developers that are passionate about sustainability, ');
console.log('Send an email to opportunities@spry-group.com and introduce yourself.')

function yearOptions(data: any, sector: string, company: string): Array<string> {
  const options: Array<string> = data.filter((d:any) => {
    return  (sector === 'all' || d.sector === sector) && (company === 'all' || d.company === company)
  })
  .map((d: any) => d.year)
  .filter(distinct);
  return options;
}

function sectorOptions(data: any, company: string, year: string): Array<string> {
  let yearInt = parseInt(year);
  const options: Array<string> = data.filter((d:any) => {
    return  (company === 'all' || d.company === company) && (year === 'all' || d.year === yearInt)
  })
  .map((d: any) => d.sector)
  .filter(distinct);
  return options;
}

function companyOptions(data: any, sector: string, year: string): Array<string> {
  let yearInt = parseInt(year);
  const options: Array<string> = data.filter((d:any) => {
    return  (sector === 'all' || d.sector === sector) && (year === 'all' || d.year === yearInt)
  })
  .map((d: any) => d.company)
  .filter(distinct);
  return options;
}

document.addEventListener('DOMContentLoaded', async function(e) {
  try {
    const content: any = await json((<any>contentUrl));
    updateCopy(content.copy);

    const queryString = new QueryString();
    const defaultSector = queryString.get('sector') || 'all';
    const defaultCompany = queryString.get('company') || 'all';
    const defaultYear = queryString.get('year') || '2017';
    const defaultSort =  queryString.get('sort') || 'sector';

    const defaultSectorOptions = sectorOptions(content.data, defaultCompany, defaultYear);
    const defaultCompanyOptions = companyOptions(content.data, defaultSector, defaultYear);
    const defaultYearOptions = yearOptions(content.data, defaultSector, defaultCompany);

    const sectorSelect$ = new ObservableSelect('sector', defaultSector, defaultSectorOptions );
    const companySelect$ = new ObservableSelect('company', defaultCompany, defaultCompanyOptions);
    const yearSelect$ = new ObservableSelect('year', defaultYear, defaultYearOptions);
    yearSelect$.subscribe((v) => console.log('yearSelect.next', v));
    const sortSelect$ = new ObservableSelect('sort', defaultSort, []);
    const chart = new CDPChart2019('#chart', '#tooltip');

    combineLatest(sectorSelect$, companySelect$).subscribe(([sector, company]:Array<string>) => {
      //console.log('update year options, when sector or company changes.', sector, company);
      const options = yearOptions(content.data, sector, company);
      yearSelect$.options(options);
    });

    combineLatest(sectorSelect$.asObservable(), yearSelect$).subscribe(([sector, year]:Array<string>) => {
      // console.log('update company options, when sector or year changes.', sector, year)
      const options = companyOptions(content.data, sector, year);
      companySelect$.options(options);
    });

    combineLatest(companySelect$, yearSelect$).subscribe(([company, year]:Array<string>) => {
      // console.log('update sector options, when company or year changes.', company, year)
      const options = sectorOptions(content.data, company, year);
      sectorSelect$.options(options);
    });

    // update chart & query string when any control changes.
    combineLatest(sectorSelect$, companySelect$, yearSelect$, sortSelect$).subscribe((controls: Array<string>) => {
      let [ sector, company, year, sort ] = controls;
      let yearInt = parseInt(year);
      const data = content.data.filter((d: any) => {
        return (sector === 'all' || d.sector === sector)
               && (company === 'all' || d.company === company)
               && (year === 'all' || d.year === yearInt)
      })
      .sort( sort === 'company' ?  sortCompany : sort === 'intensity' ? sortIntensity : sortSector  );
      chart.update(data);
      console.log('chart/qs update', { sector, company, year, sort })
      queryString.setAll({ sector, company, year, sort });
    });

  }
  catch(error) {
    return alert(`Something went wrong, please try again later. ERR: ${error}`);
  }

});

function updateCopy(copy: any) {
  document.getElementById('title-text').innerHTML = copy.title;
  document.getElementById('header-text').innerHTML = copy.header;
  document.getElementById('footer-text1').innerHTML = copy.footer1;
  document.getElementById('footer-text2').innerHTML = copy.footer2;
  document.getElementById('footer-img').setAttribute('src', copy.footerImg)
}

function distinct(value: any, index: any, self: any) {
    return self.indexOf(value) === index;
}

function sortCompany(a: any, b: any) {
  let aName = a.company.toUpperCase();
  let bName = b.company.toUpperCase();
  return aName < bName ? -1 : aName > bName ? 1 : sortIntensity(a, b);
}

function sortIntensity(a: any, b: any) {
  return a.carbonInt > b.carbonInt ? 1 : a.carbonInt < b.carbonInt ? -1 : 0;
}

function sortSector(a: any, b: any) {
  return a.sector > b.sector ? 1 : a.sector < b.sector ? -1 : sortIntensity(a, b);
}
