import type { Page } from '@playwright/test';

export async function stubAuthUser(page: Page, user?: { id: string; email?: string }) {
  const body = JSON.stringify({ id: user?.id ?? 'test-user', email: user?.email ?? 'user@example.com' });
  await page.route('**/auth/v1/user**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body });
  });
}

export async function stubReports(page: Page, reports: ReadonlyArray<{ id: string; title: string }>) {
  await page.route('**/rest/v1/reports**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(reports) });
  });
}

export async function stubReportsFail(page: Page, status = 500) {
  await page.route('**/rest/v1/reports**', async (route) => {
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error: 'fail' }) });
  });
}

export async function stubConsentList(
  page: Page,
  records: ReadonlyArray<Record<string, unknown>>
) {
  await page.route('**/rest/v1/sms_consent**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(records) });
      return;
    }
    await route.continue();
  });
}

export async function stubConsentPatchSuccess(
  page: Page,
  updated: ReadonlyArray<Record<string, unknown>>
) {
  await page.route('**/rest/v1/sms_consent**', async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updated) });
      return;
    }
    await route.continue();
  });
}

export async function stubConsentPatchFail(page: Page, status = 500) {
  await page.route('**/rest/v1/sms_consent**', async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error: 'fail' }) });
      return;
    }
    await route.continue();
  });
}

export async function stubExportCsv(page: Page, csv: string) {
  await page.route('**/functions/v1/export-consent-data', async (route) => {
    await route.fulfill({ status: 200, headers: { 'content-type': 'text/csv' }, body: csv });
  });
}

export async function stubExportFail(page: Page, status = 500) {
  await page.route('**/functions/v1/export-consent-data', async (route) => {
    await route.fulfill({ status, headers: { 'content-type': 'text/plain' }, body: 'error' });
  });
}

export async function stubCreatePaymentSessionSuccess(page: Page, url: string) {
  await page.route('**/functions/v1/create-payment-session', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url }) });
  });
}

export async function stubCreatePaymentSessionFail(page: Page, status = 500) {
  await page.route('**/functions/v1/create-payment-session', async (route) => {
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error: 'fail' }) });
  });
}

export async function setLocalStorage(page: Page, key: string, value: string) {
  await page.addInitScript(([k, v]) => {
    localStorage.setItem(k, v);
  }, [key, value] as const);
}

export type DownloadInfo = { csv?: string; downloadName?: string };
export async function addDownloadCapture(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __downloadInfo: DownloadInfo };
    w.__downloadInfo = {};
    const origCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = (blob: Blob) => {
      void blob.text().then((t) => {
        (window as unknown as { __downloadInfo: DownloadInfo }).__downloadInfo.csv = t;
      });
      return origCreateObjectURL(blob);
    };
    const origCreateElement = document.createElement.bind(document);
    document.createElement = ((tagName: string) => {
      const el = origCreateElement(tagName) as HTMLElement;
      if (tagName.toLowerCase() === 'a') {
        const a = el as HTMLAnchorElement;
        const origClick = a.click.bind(a);
        a.click = () => {
          (window as unknown as { __downloadInfo: DownloadInfo }).__downloadInfo.downloadName = a.download;
          return origClick();
        };
      }
      return el;
    }) as typeof document.createElement;
  });
}

export async function waitForDownloadInfo(page: Page): Promise<DownloadInfo> {
  await page.waitForFunction(() => {
    const w = window as unknown as { __downloadInfo?: DownloadInfo };
    return !!w.__downloadInfo?.csv;
  });
  return page.evaluate<DownloadInfo>(() => {
    return (window as unknown as { __downloadInfo: DownloadInfo }).__downloadInfo;
  });
}

