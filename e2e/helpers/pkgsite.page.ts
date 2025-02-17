import { Page } from 'puppeteer';

import * as pg from './page';
import * as unit from './unit.page';

/**
 * prepare gets the pkgsite module page ready for snapshot tests by rewriting highly
 * variable page content to constant values.
 * @param page The page to prepare
 */
export async function prepare(page: Page): Promise<void> {
  await unit.prepare(page);
  await Promise.all([
    pg.$eval(
      page,
      pg.select('UnitHeader-version', 'a'),
      el =>
        ((el as HTMLElement).innerHTML =
          '<span class="UnitHeader-detailItemSubtle">Version: </span>v0.0.0')
    ),
    pg.$eval(
      page,
      pg.select('UnitHeader-commitTime'),
      el => ((el as HTMLElement).innerHTML = 'Published: Apr 16, 2021')
    ),
    pg.$$eval(page, pg.select('UnitHeader-imports', 'a'), els =>
      els.map(el => (el.innerHTML = 'Imports: 0'))
    ),
  ]);
}
