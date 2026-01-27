import { matchPath, useLocation } from 'react-router-dom';

export const useLaxInstanceId = () => {
  const instanceOwnerPartyId = useNavigationParam('instanceOwnerPartyId');

  console.log(`instanceOwnerPartyId ${instanceOwnerPartyId}`);

  const instanceGuid = useNavigationParam('instanceGuid');

  console.log(`instanceGuid ${instanceGuid}`);

  return instanceOwnerPartyId && instanceGuid
    ? `${instanceOwnerPartyId}/${instanceGuid}`
    : undefined;
};

//preview/localgiteaadmin/test-app-filippa?layout=pdfLayout
//localgiteaadmin/test-app-filippa/ui-editor/layoutSet/form
const matchers: string[] = [
  '/instance/:instanceOwnerPartyId/:instanceGuid',
  '/instance/:instanceOwnerPartyId/:instanceGuid/:taskId',
  '/instance/:instanceOwnerPartyId/:instanceGuid/:taskId/:pageKey',
  '/:instanceOwnerPartyId/:instanceGuid/*',
  '/:pageKey', // Stateless

  // Subform
  '/instance/:instanceOwnerPartyId/:instanceGuid/:taskId/:mainPageKey/:componentId',
  '/instance/:instanceOwnerPartyId/:instanceGuid/:taskId/:mainPageKey/:componentId/:dataElementId',
  '/instance/:instanceOwnerPartyId/:instanceGuid/:taskId/:mainPageKey/:componentId/:dataElementId/:pageKey',
];

type Matches = ReturnType<typeof matchPath>[];

export const useNavigationParam = <T extends keyof PathParams>(key: T) => {
  const location = useLocation();

  console.log(`location.pathname ${location.pathname}`);
  const matches = matchers.map((matcher) => matchPath(matcher, location.pathname));

  console.log(`matches ${JSON.stringify(matches)}`);

  return paramFrom(matches, key) as PathParams[T];
};

function paramFrom(matches: Matches, key: keyof PathParams): string | undefined {
  const param = matches.reduce((acc, match) => acc ?? match?.params[key], undefined) as string;
  const decode = requiresDecoding.has(key);
  return decode && param ? decodeURIComponent(param) : param;
}

const requiresDecoding: Set<keyof PathParams> = new Set(['pageKey', 'mainPageKey']);

interface PathParams {
  instanceOwnerPartyId?: string;
  instanceGuid?: string;
  taskId?: string;
  pageKey?: string;
  componentId?: string;
  dataElementId?: string;
  mainPageKey?: string;
}

export type PathParam<Path extends string> = Path extends '*' | '/*'
  ? '*'
  : Path extends `${infer Rest}/*`
    ? '*' | _PathParam<Rest>
    : _PathParam<Path>;
export type ParamParseKey<Segment extends string> = [PathParam<Segment>] extends [never]
  ? string
  : PathParam<Segment>;
type _PathParam<Path extends string> = Path extends `${infer L}/${infer R}`
  ? _PathParam<L> | _PathParam<R>
  : Path extends `:${infer Param}`
    ? Param extends `${infer Optional}?`
      ? Optional
      : Param
    : never;

export interface PathPattern<Path extends string = string> {
  /**
   * A string to match against a URL pathname. May contain `:id`-style segments
   * to indicate placeholders for dynamic parameters. May also end with `/*` to
   * indicate matching the rest of the URL pathname.
   */
  path: Path;
  /**
   * Should be `true` if the static portions of the `path` should be matched in
   * the same case.
   */
  caseSensitive?: boolean;
  /**
   * Should be `true` if this pattern should match the entire URL pathname.
   */
  end?: boolean;
}

export interface PathMatch<ParamKey extends string = string> {
  /**
   * The names and values of dynamic parameters in the URL.
   */
  params: Params<ParamKey>;
  /**
   * The portion of the URL pathname that was matched.
   */
  pathname: string;
  /**
   * The portion of the URL pathname that was matched before child routes.
   */
  pathnameBase: string;
  /**
   * The pattern that was used to match.
   */
  pattern: PathPattern;
}

export type Params<Key extends string = string> = {
  readonly [key in Key]: string | undefined;
};
