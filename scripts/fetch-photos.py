#!/usr/bin/env python3
"""Fetch candidate landmark photos and their licence details from Wikimedia Commons.

For each entry in scripts/photos.json this takes the Wikipedia article's lead image
(Wikipedia only reports freely licensed lead images) plus a few matches from
Commons "Quality images", and saves 960px-wide copies with a meta.json listing
each file's author, licence and source page. Only CC0, public-domain, CC BY and
CC BY-SA files are kept.

Wikimedia rate-limits busy shared cloud addresses, so this normally runs in the
"Fetch landmark photos" GitHub workflow, which uploads the result as an artifact.
The chosen photos are then resized into photos/ and credited in js/data/photos.js.

    python3 scripts/fetch-photos.py OUT_DIR
"""
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

UA = 'DressUpWorldTour/1.0 (https://github.com/rbragadesh/Barbie-Dressup; personal educational game)'
WIDTH = 960
ALTERNATIVES = 3
FREE = re.compile(r'^(cc0|cc[ -]by(-sa)?[ -]?\d|public domain|pd\b|pd-)', re.I)


def get(url, binary=False):
    wait = 5
    for _ in range(8):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            body = urllib.request.urlopen(req, timeout=60).read()
            return body if binary else json.loads(body)
        except urllib.error.HTTPError as e:
            if e.code not in (429, 500, 502, 503, 504):
                raise
            wait = max(wait, int(e.headers.get('Retry-After') or 0))
            print(f'  HTTP {e.code}, retrying in {wait}s', flush=True)
        except (urllib.error.URLError, TimeoutError) as e:
            print(f'  {e}, retrying in {wait}s', flush=True)
        time.sleep(wait)
        wait = min(wait * 2, 300)
    raise SystemExit(f'Gave up on {url}')


def api(host, **params):
    time.sleep(1)
    return get(f'https://{host}/w/api.php?' + urllib.parse.urlencode({**params, 'format': 'json', 'formatversion': 2}))


def text(value):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', value or ''))).strip()


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else 'photos-raw'
    os.makedirs(out, exist_ok=True)
    wanted = json.load(open(os.path.join(os.path.dirname(__file__), 'photos.json')))

    # 1. Lead images of the Wikipedia articles.
    pages = api('en.wikipedia.org', action='query', prop='pageimages', piprop='name', redirects=1,
                titles='|'.join(w['article'] for w in wanted.values()))['query']
    alias = {n['from']: n['to'] for n in pages.get('normalized', []) + pages.get('redirects', [])}
    lead = {p['title']: p.get('pageimage') for p in pages['pages']}
    files = {}
    for key, w in wanted.items():
        title = w['article']
        while title in alias:
            title = alias[title]
        files[key] = [('lead', lead[title])] if lead.get(title) else []

    # 2. A few well-reviewed alternatives from Commons.
    for key, w in wanted.items():
        found = api('commons.wikimedia.org', action='query', list='search', srnamespace=6, srlimit=ALTERNATIVES,
                    srsearch=f'{w["search"]} incategory:Quality_images filetype:bitmap')['query']['search']
        have = {f for _, f in files[key]}
        files[key] += [('quality', r['title'].removeprefix('File:')) for r in found if r['title'].removeprefix('File:') not in have]
        print(key, [f for _, f in files[key]], flush=True)

    # 3. Licence details and thumbnail addresses.
    names = sorted({f.replace('_', ' ') for fs in files.values() for _, f in fs})
    info = {}
    for i in range(0, len(names), 40):
        q = api('commons.wikimedia.org', action='query', prop='imageinfo', iiprop='url|extmetadata|size|mime',
                iiurlwidth=WIDTH, titles='|'.join('File:' + n for n in names[i:i + 40]))['query']
        for p in q['pages']:
            if p.get('imageinfo'):
                info[p['title'].removeprefix('File:')] = p['imageinfo'][0]

    # 4. Download the freely licensed ones.
    meta = {}
    for key, fs in files.items():
        meta[key] = []
        for kind, f in fs:
            ii = info.get(f.replace('_', ' '))
            if not ii:
                continue
            em = {k: v.get('value', '') for k, v in ii.get('extmetadata', {}).items()}
            licence = text(em.get('LicenseShortName'))
            if not FREE.match(licence) or ii.get('mime') not in ('image/jpeg', 'image/png'):
                print(f'  skip {f}: {licence or "no licence"} {ii.get("mime")}', flush=True)
                continue
            n = len(meta[key]) + 1
            name = f'{key}-{n}.jpg' if ii['mime'] == 'image/jpeg' else f'{key}-{n}.png'
            time.sleep(1)
            with open(os.path.join(out, name), 'wb') as fh:
                fh.write(get(ii.get('thumburl') or ii['url'], binary=True))
            meta[key].append({
                'name': name, 'kind': kind, 'file': f.replace('_', ' '), 'page': ii.get('descriptionurl'),
                'licence': licence, 'licenceUrl': em.get('LicenseUrl', ''), 'author': text(em.get('Artist')),
                'credit': text(em.get('Credit')), 'attribution': text(em.get('Attribution')),
                'title': text(em.get('ObjectName')), 'width': ii.get('thumbwidth') or ii.get('width'),
                'height': ii.get('thumbheight') or ii.get('height'),
            })
            print(f'  saved {name}: {licence}, {meta[key][-1]["author"][:60]}', flush=True)
    with open(os.path.join(out, 'meta.json'), 'w') as fh:
        json.dump(meta, fh, indent=1, ensure_ascii=False)
    print('Done:', sum(len(v) for v in meta.values()), 'photos')


if __name__ == '__main__':
    main()
