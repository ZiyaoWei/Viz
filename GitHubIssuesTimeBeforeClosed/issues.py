import requests
import json
import os

user = 'twbs'
repo = 'bootstrap'
url = 'https://api.github.com/repos/{}/{}/issues?state=all&page={}&per_page=100&direction=asc&client_id={}&client_secret={}'

page = 1
all_issues = []
client_id = os.environ['GITHUB_CLIENT_ID']
client_secret = os.environ['GITHUB_CLIENT_SECRET']
while True:
    print(page)
    resp = requests.get(url.format(user, repo, page, client_id, client_secret))
    issues = json.loads(resp.content)
    all_issues += issues
    page += 1
    if issues == []:
        break

all_issues = [(i['created_at'], i['closed_at']) for i in all_issues if 'pull_request' not in i]

with open('{}-{}.json'.format(user, repo), 'w') as f:
    json.dump(all_issues, f)
