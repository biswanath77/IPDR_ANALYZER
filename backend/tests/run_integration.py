import urllib.request, urllib.parse, json, sys, os, tempfile, time

BASE = os.environ.get('BASE_URL', 'http://127.0.0.1:8000')

csv_text = "ip,timestamp,msisdn,data_volume\n192.0.2.1,2025-11-16T12:00:00Z,+1000000000,1234\n"

# write temp file
fd, path = tempfile.mkstemp(suffix='.csv')
with os.fdopen(fd, 'w', encoding='utf-8') as f:
    f.write(csv_text)

print('Created temp CSV:', path)

# upload using curl if available, otherwise use urllib
use_curl = False
curl_path = None
try:
    import shutil
    curl_path = shutil.which('curl')
    if curl_path:
        use_curl = True
except Exception:
    pass

if use_curl:
    print('Using curl to upload')
    cmd = f'"{curl_path}" -s -F "file=@{path}" {BASE}/predict-file'
    res = os.popen(cmd).read()
else:
    print('Using urllib to upload')
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    data = []
    data.append(f'--{boundary}')
    data.append('Content-Disposition: form-data; name="file"; filename="test.csv"')
    data.append('Content-Type: text/csv')
    data.append('')
    data.append(open(path, 'rb').read().decode('utf-8'))
    data.append(f'--{boundary}--')
    body = '\r\n'.join(data).encode('utf-8')
    req = urllib.request.Request(BASE + '/predict-file', data=body)
    req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            res = r.read().decode('utf-8')
    except Exception as e:
        print('Upload failed:', e)
        sys.exit(2)

print('Upload response:', res)
try:
    j = json.loads(res)
except Exception as e:
    print('Failed to parse JSON:', e)
    sys.exit(2)

if 'file' not in j:
    print('No file in response, failing')
    sys.exit(2)

uploaded = j['file']
print('Uploaded file name:', uploaded)

# wait briefly for backend to save
time.sleep(1)

# query /ml/results
q = urllib.parse.quote(uploaded)
try:
    with urllib.request.urlopen(f'{BASE}/ml/results?file={q}', timeout=10) as r:
        out = r.read().decode('utf-8')
        print('/ml/results ->', out)
        oj = json.loads(out)
        if 'detailed' in oj and len(oj['detailed']) > 0:
            print('Integration test succeeded: detailed predictions present')
            sys.exit(0)
        else:
            print('Integration failure: no detailed predictions')
            sys.exit(2)
except Exception as e:
    print('Error fetching /ml/results:', e)
    sys.exit(2)
