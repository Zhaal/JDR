exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return { statusCode: 500, body: 'Missing GITHUB_TOKEN' };
  }

  const data = JSON.parse(event.body || '{}');
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

  const owner = 'Zhaal';
  const repo = 'JDR';
  const filePath = 'data/wiki.json';
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  let sha;
  const getRes = await fetch(apiUrl, {
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': 'netlify-function'
    }
  });
  if (getRes.ok) {
    const info = await getRes.json();
    sha = info.sha;
  }

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'netlify-function'
    },
    body: JSON.stringify({
      message: 'Mise à jour wiki.json',
      content,
      sha
    })
  });

  if (!putRes.ok) {
    const errorBody = await putRes.text();
    return { statusCode: putRes.status, body: errorBody };
  }

  return { statusCode: 200, body: 'Sauvegarde effectuée' };
};
