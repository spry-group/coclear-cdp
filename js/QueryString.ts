

export class QueryString {
    private params: any = {};

    constructor()  {
      window.location.search.substring(1).split('&')
          .map((param) => {
            let key: string, value: string;
            [ key, value ] = param.split('=');
            return { key: decodeURIComponent(key), value: decodeURIComponent(value)}
          })
          .reduce((acc: any, current: { key: string, value:string}) => { acc[current.key] = current.value; return acc;}, this.params)
    }

    get(param: string): string {
      return this.params[param];
    }

    set(param: string, value: string): void {
      this.params[param] = encodeURIComponent(value);

      // update querystring in browser.
      let parts = Object.keys(this.params).map((key) => `${key}=${this.params[key]}`);
      let queryString = '?' + parts.join('&');
      history.pushState(null, null, location.href.split('?')[0] + queryString);
    }
  }