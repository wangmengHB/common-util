


export class URI {
  static isUri(thing: any): thing is URI {
		if (thing instanceof URI) {
			return true;
		}
		if (!thing) {
			return false;
		}
		return typeof (<URI>thing).authority === 'string'
			&& typeof (<URI>thing).fragment === 'string'
			&& typeof (<URI>thing).path === 'string'
			&& typeof (<URI>thing).query === 'string'
			&& typeof (<URI>thing).scheme === 'string'
			&& typeof (<URI>thing).fsPath === 'function'
			&& typeof (<URI>thing).with === 'function'
			&& typeof (<URI>thing).toString === 'function';
	}

	/**
	 * scheme is the 'http' part of 'http://www.msft.com/some/path?query#fragment'.
	 * The part before the first colon.
	 */
	readonly scheme: string;

	/**
	 * authority is the 'www.msft.com' part of 'http://www.msft.com/some/path?query#fragment'.
	 * The part between the first double slashes and the next slash.
	 */
	readonly authority: string;

	/**
	 * path is the '/some/path' part of 'http://www.msft.com/some/path?query#fragment'.
	 */
	readonly path: string;

	/**
	 * query is the 'query' part of 'http://www.msft.com/some/path?query#fragment'.
	 */
	readonly query: string;

	/**
	 * fragment is the 'fragment' part of 'http://www.msft.com/some/path?query#fragment'.
	 */
	readonly fragment: string;


  // todo: 
  get fsPath(): string {
    return '';
  }

  // todo
  with() {
    
  }

}