import { run } from '@cycle/core';
import { makeDOMDriver, h } from '@cycle/dom';
import { makeJSONPDriver } from '@cycle/jsonp';

type Source = { DOM: any, JSONP: any };
type Sink = { DOM: any, JSONP: any };
type Actions = { result$: any, search$: any };
type State = { state$: any, search$: any };

const MAIN_URL = 'https://en.wikipedia.org';
const WIKI_URL = MAIN_URL + '/wiki/';
const API_URL = MAIN_URL + '/w/api.php?' +
  'action=query&list=search&format=json&srsearch=';

const intent = (source: Source): any => {
  return {
    search$: request(source),
    result$: response(source)
  };
};

const request = ({ DOM }: Source): any =>
  DOM
    .select('.search-field')
    .events('input')
    .debounce(300)
    .map((e: any) => e.target.value)
    .filter((value: string): boolean => value.length > 2)
    .map((search: string) => API_URL + search);

const response = ({ JSONP }: Source): any =>
  JSONP
    .filter((res$: any) => res$.request.indexOf(API_URL) === 0)
    .mergeAll()
    .map((i: any) => i.query.search);

const model = ({ result$, search$ }: Actions): State => {
  return {
    search$,
    state$: result$.startWith([])
  };
};

const vtreeElements = (state$: any): any => {
  return state$.map((results: { title: string }[]) => {
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
  });
};

const view = ({ state$, search$ }: State): Sink => {
  return {
    DOM: vtreeElements(state$),
    JSONP: search$
  };
};

export default function m() {
  const main = (source: Source): Sink =>
    view(model(intent(source)));
  const drivers = {
    DOM: makeDOMDriver('#container'),
    JSONP: makeJSONPDriver()
  };
  run(main, drivers);
}
