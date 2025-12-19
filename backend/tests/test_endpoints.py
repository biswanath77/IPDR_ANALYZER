import urllib.request, urllib.parse, json, sys, os

BASE = os.environ.get('BASE_URL', 'http://127.0.0.1:8000')
ENDPOINTS = [
    '/reports/summary',
    '/data/list',
    '/system/status',
    '/auth/users',
]


def get_json(path):
    url = BASE + path
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            body = r.read().decode('utf-8')
            return r.getcode(), json.loads(body)
    except Exception as e:
        return None, str(e)


def run():
    ok = True
    for p in ENDPOINTS:
        code, data = get_json(p)
        print(f'GET {p} ->', code)
        print(data if isinstance(data, (dict, list)) else str(data)[:400])
        print('---')
        if code is None:
            ok = False

    # If there are uploads, try ml/results for latest file
    code, files = get_json('/data/list')
    if code and isinstance(files, list) and len(files) > 0:
        latest = files[-1]
        print('Found uploads, querying /ml/results for', latest)
        code, res = get_json('/ml/results?file=' + urllib.parse.quote(latest))
        print('GET /ml/results ->', code)
        print(res if isinstance(res, (dict, list)) else str(res)[:400])
    else:
        print('No uploads found; skip /ml/results')

    if not ok:
        sys.exit(2)


if __name__ == '__main__':
    run()
