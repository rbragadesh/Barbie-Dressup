#!/usr/bin/env python3
"""Fetch landmark photos and their licence details from Wikimedia Commons.

Each entry in scripts/photos.json can name exact Commons "files", a Wikipedia
"article" whose lead image to take, and a Commons "search" (used as written, with
up to "limit" results). The photos in the game are the pinned "files"; the other
two are for finding candidates. Only CC0, public-domain, CC BY and CC BY-SA files
are saved, as WIDTH-pixel copies (default 1920) with a meta.json listing each
file's author, licence and source page.

Wikimedia rate-limits busy shared cloud addresses, so this normally runs in the
"Fetch landmark photos" GitHub workflow, which uploads the result as an artifact.
The chosen photos are then resized into photos/ and credited in js/data/photos.js.

    python3 scripts/fetch-photos.py OUT_DIR [WIDTH]
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
    width = int(sys.argv[2]) if len(sys.argv) > 2 else 1920
    os.makedirs(out, exist_ok=True)
    wanted = json.load(open(os.path.join(os.path.dirname(__file__), 'photos.json')))
    files = {key: [('chosen', f) for f in w.get('files', [])] for key, w in wanted.items()}

    # 1. Lead images of Wikipedia articles.
    articles = {key: w['article'] for key, w in wanted.items() if w.get('article')}
    if articles:
        pages = api('en.wikipedia.org', action='query', prop='pageimages', piprop='name', redirects=1,
                    titles='|'.join(articles.values()))['query']
        alias = {n['from']: n['to'] for n in pages.get('normalized', []) + pages.get('redirects', [])}
        lead = {p['title']: p.get('pageimage') for p in pages['pages']}
        for key, title in articles.items():
            while title in alias:
                title = alias[title]
            if lead.get(title):
                files[key].append(('lead', lead[title]))

    # 2. Commons searches for more candidates.
    for key, w in wanted.items():
        if w.get('search'):
            found = api('commons.wikimedia.org', action='query', list='search', srnamespace=6,
                        srlimit=w.get('limit', 3), srsearch=w['search'])['query']['search']
            files[key] += [('search', r['title'].removeprefix('File:')) for r in found]
        seen = set()
        files[key] = [(k, f) for k, f in files[key] if not (f.replace('_', ' ') in seen or seen.add(f.replace('_', ' ')))]
        print(key, [f for _, f in files[key]], flush=True)

    # 3. Licence details and thumbnail addresses.
    names = sorted({f.replace('_', ' ') for fs in files.values() for _, f in fs})
    info = {}
    for i in range(0, len(names), 40):
        q = api('commons.wikimedia.org', action='query', prop='imageinfo', iiprop='url|extmetadata|size|mime',
                iiurlwidth=width, titles='|'.join('File:' + n for n in names[i:i + 40]))['query']
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
