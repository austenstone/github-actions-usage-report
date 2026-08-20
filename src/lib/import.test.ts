import { describe, expect, it, vi } from 'vitest';
import { importFiles, importRawCSVs } from './import';
import type { ParsedReport } from './types';

const USAGE_CSV = [
  'date,product,sku,quantity,unit_type,price_per_unit,gross_amount,discount_amount,net_amount,organization,repository,cost_center_name',
  '2026-01-05,actions,actions_linux,120,minutes,0.008,0.96,0,0.96,acme,acme/api,',
].join('\n');

const collector = () => {
  const reports: ParsedReport[] = [];
  const addReport = vi.fn((report: ParsedReport) => reports.push(report) - 1);
  return { reports, addReport };
};

const csvFile = (name: string, content: string) =>
  new File([content], name, { type: 'text/csv' });

// zipSync can't build a valid archive under jsdom — fflate's Uint8Array check
// fails across realms and it walks the byte array as a nested directory. The
// read path (unzipSync) is unaffected, so use an archive built ahead of time.
// Contents: good.csv (valid usage report), bad.csv (unparseable), notes.txt.
const ZIP_B64 =
  'UEsDBBQAAAAIAHdKFF3n7nuMjQAAANEAAAAIAAAAZ29vZC5jc3Y9jOEKwjAMhP/7LFG7gUOfpoQu' +
  'jKBNapOC8+ldlfnn7kvuuBmdoFSdW3Kwe4NnQ3H2FZqwR19LjzlRLFRj/8FS1Sxi1iYOM1vqsN9C' +
  'f9S6oPAbnVWgUlFj17pCUvOYSHwbFMx0GMM4HcNwDBfA1Nu2e3ywtBcMY4C8kZNBOIVw3fQ2QfgZ' +
  'pkxfOWNh+ABQSwMEFAAAAAgAd0oUXaIsw5gJAAAABwAAAAcAAABiYWQuY3N2S9RJ4jLUMQIAUEsD' +
  'BBQAAAAIAHdKFF0smQQICQAAAAcAAAAJAAAAbm90ZXMudHh0K87OLFDITQUAUEsBAhQAFAAAAAgA' +
  'd0oUXefue4yNAAAA0QAAAAgAAAAAAAAAAAAAAAAAAAAAAGdvb2QuY3N2UEsBAhQAFAAAAAgAd0oU' +
  'XaIsw5gJAAAABwAAAAcAAAAAAAAAAAAAAAAAswAAAGJhZC5jc3ZQSwECFAAUAAAACAB3ShRdLJkE' +
  'CAkAAAAHAAAACQAAAAAAAAAAAAAAAADhAAAAbm90ZXMudHh0UEsFBgAAAAADAAMAogAAABEBAAAA' +
  'AA==';

const zipFile = (name: string) =>
  new File([Uint8Array.from(atob(ZIP_B64), (c) => c.charCodeAt(0))], name, {
    type: 'application/zip',
  });

describe('importFiles', () => {
  it('parses a CSV file and reports it as succeeded', async () => {
    const { reports, addReport } = collector();

    const result = await importFiles([csvFile('usage.csv', USAGE_CSV)], addReport);

    expect(result).toEqual({ succeeded: 1, failed: [] });
    expect(reports[0].type).toBe('usage_report');
    expect(addReport).toHaveBeenCalledWith(expect.anything(), USAGE_CSV);
  });

  it('skips files that are neither CSV nor ZIP without failing them', async () => {
    const { addReport } = collector();

    const result = await importFiles(
      [new File(['nope'], 'notes.txt', { type: 'text/plain' })],
      addReport,
    );

    expect(result).toEqual({ succeeded: 0, failed: [] });
    expect(addReport).not.toHaveBeenCalled();
  });

  it('records the filename when a CSV cannot be parsed', async () => {
    const { addReport } = collector();

    const result = await importFiles([csvFile('junk.csv', 'a,b,c\n1,2,3')], addReport);

    expect(result).toEqual({ succeeded: 0, failed: ['junk.csv'] });
  });

  it('extracts CSVs from a ZIP and ignores non-CSV entries', async () => {
    const { reports, addReport } = collector();

    const result = await importFiles([zipFile('reports.zip')], addReport);

    expect(result.succeeded).toBe(1);
    expect(reports[0].type).toBe('usage_report');
  });

  it('fails only the bad entries inside a ZIP', async () => {
    const { addReport } = collector();

    const result = await importFiles([zipFile('mixed.zip')], addReport);

    expect(result.failed).toEqual(['bad.csv']);
  });

  it('keeps going after a failed file', async () => {
    const { addReport } = collector();

    const result = await importFiles(
      [csvFile('junk.csv', 'a,b\n1,2'), csvFile('usage.csv', USAGE_CSV)],
      addReport,
    );

    expect(result).toEqual({ succeeded: 1, failed: ['junk.csv'] });
  });
});

describe('importRawCSVs', () => {
  it('imports raw CSV strings', () => {
    const { reports, addReport } = collector();

    const result = importRawCSVs([{ name: 'usage.csv', content: USAGE_CSV }], addReport);

    expect(result).toEqual({ succeeded: 1, failed: [] });
    expect(reports[0].isSample).toBeUndefined();
  });

  it('marks reports as samples when asked', () => {
    const { reports, addReport } = collector();

    importRawCSVs([{ name: 'usage.csv', content: USAGE_CSV }], addReport, { isSample: true });

    expect(reports[0].isSample).toBe(true);
  });

  it('collects unparseable entries without throwing', () => {
    const { addReport } = collector();

    const result = importRawCSVs(
      [
        { name: 'bad.csv', content: 'a,b\n1,2' },
        { name: 'usage.csv', content: USAGE_CSV },
      ],
      addReport,
    );

    expect(result).toEqual({ succeeded: 1, failed: ['bad.csv'] });
  });
});
