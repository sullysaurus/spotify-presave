require('dotenv').config();
const express = require('express');
const request = require('request');
const querystring = require('querystring');
const app = express();

app.use(express.static('public')); // Serve static files

const redirect_uri = 'http://localhost:8888/callback'; // Your redirect URI

app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>The Daydream District - Puppet Shadows</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                img { width: 100%; max-width: 300px; height: auto; margin-top: 20px; }
                a { display: inline-block; margin: 20px; padding: 10px 20px; background-color: #1db954; color: white; text-decoration: none; border-radius: 20px; }
                @media (max-width: 600px) {
                    body { padding: 10px; }
                    h1 { font-size: 24px; }
                    h3 { font-size: 18px; }
                }
            </style>
        </head>
        <body>
            <h1>The Daydream District</h1>
            <h3>Puppet Shadows</h3>
            <img src="/puppet-shadows.jpg" alt="Puppet Shadows Cover Art"><br>
            <a href="/login">Add to Your Library</a>
        </body>
        </html>
    `);
});

app.get('/login', (req, res) => {
    const queryParams = querystring.stringify({
        client_id: process.env.SPOTIFY_CLIENT_ID,
        response_type: 'code',
        redirect_uri,
        scope: 'user-library-modify',
        show_dialog: true
    });
    res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

app.get('/callback', (req, res) => {
    const code = req.query.code || null;
    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code'
        },
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
        },
        json: true
    };

    request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            const accessToken = body.access_token;
            const uri = 'spotify:track:7uBMFgWIw01HDDd4xbVVXh'; // Provided song URI
            const options = {
                url: `https://api.spotify.com/v1/me/tracks?ids=${uri.split(':')[2]}`,
                headers: { 'Authorization': 'Bearer ' + accessToken },
                json: true
            };

            request.put(options, function(error, response, body) {
                if (!error && response.statusCode === 200) {
                    res.send('<p>Song saved to your library!</p>');
                } else {
                    res.send('<p>Failed to save song.</p>');
                }
            });
        } else {
            res.send('<p>Failed to get access token.</p>');
        }
    });
});

app.listen(8888, () => console.log('Listening on 8888'));
