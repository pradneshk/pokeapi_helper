const express = require('express');
const https = require('https');

const app = express();

function callApi(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        const parsedData = JSON.parse(data);
        resolve(parsedData);
      });

    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function getPokemonDetails(url) {
  const data = await callApi(url);
  return {
    name: data.name,
    types: data.types.map((type) => type.type.name),
    abilities: data.abilities.map((ability) => ability.ability.name),
    artwork: data.sprites.other['official-artwork']
  };
}

async function getAllPokemon(limit, offset) {
  const data = await callApi(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
  const results = await Promise.all(data.results.map(async (result) => {
    const details = await getPokemonDetails(result.url);
    return {
      name: result.name,
      ...details,
    };
  }));
  return results;
}

app.get('/pokemon', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const data = await getAllPokemon(limit, offset);
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});