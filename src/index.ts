import { run } from '@cycle/core';
import { makeDOMDriver, h } from '@cycle/dom';
import { makeJSONPDriver } from '@cycle/jsonp';

const MAIN_URL = 'https://en.wikipedia.org';
const WIKI_URL = MAIN_URL + '/wiki/';
const API_URL = MAIN_URL + '/w/api.php?' +
  'action=query&list=search&format=json&srsearch=';

const searchRequest = ({ DOM }) => {
  return DOM
    .select('.search-field')
    .events('input')
    .debounce(300)
    .map((e: any) => e.target.value)
    .filter((value: string): boolean => value.length > 2)
    .map((search: string) => API_URL + search);
};

const vtreeElements = (results: { title: string }[]): any => {
  return h('div', [
    h('h1', 'Wikipedia Search '),
    h('input', {
      className: 'search-field',
      attributes: { type: 'text' }
    }),
    h('hr'),
    h('div',
      results.map(({ title }) => {
        return h('div', [
          h('a', { href: WIKI_URL + title }, title)
        ]);
      })
    )
  ]);
};

export default function m() {
  const main = ({ DOM, JSONP }: { DOM: any, JSONP: any }): any => {
    const vtree$ = JSONP
      .filter((res$: any) => res$.request.indexOf(API_URL) === 0)
      .mergeAll()
      .map((i: any) => i.query.search)
      .startWith([])
      .map(vtreeElements);
    return {
      DOM: vtree$,
      JSONP: searchRequest({ DOM })
    };
  };
  const drivers = {
    DOM: makeDOMDriver('#container'),
    JSONP: makeJSONPDriver()
  };
  run(main, drivers);
}
