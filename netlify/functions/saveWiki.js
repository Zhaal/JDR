exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('Missing GITHUB_TOKEN');
    return { statusCode: 500, body: 'Missing GITHUB_TOKEN' };
  }

  const owner = 'Zhaal';
  const repo = 'JDR';
  const filePath = 'data/wiki.json';
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  try {
    const data = JSON.parse(event.body || '{}');
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

    let sha;
    try {
      const getRes = await fetch(apiUrl, {
        headers: {
          Authorization: `token ${token}`,
          'User-Agent': 'netlify-function-fetch'
        }
      });

      if (getRes.ok) {
        const info = await getRes.json();
        sha = info.sha;
      } else if (getRes.status !== 404) {
        // If the file doesn't exist, we'll get a 404, which is fine.
        // For other errors, we should throw an error.
        const errorBody = await getRes.text();
        throw new Error(`Failed to get file SHA: ${getRes.status} ${errorBody}`);
      }
    } catch (error) {
      console.error('Error getting file SHA:', error);
      throw error; // rethrow to be caught by outer catch
    }


    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'netlify-function-fetch'
      },
      body: JSON.stringify({
        message: 'Mise à jour wiki.json via Netlify',
        content,
        sha
      })
    });

    if (!putRes.ok) {
      const errorBody = await putRes.text();
      throw new Error(`Failed to save file: ${putRes.status} ${errorBody}`);
    }

    return { statusCode: 200, body: 'Sauvegarde effectuée' };

  } catch (error) {
    console.error('Error in saveWiki function:', error);
    return {
      statusCode: 500,
      body: `An error occurred: ${error.message}`,
    };
  }
};
