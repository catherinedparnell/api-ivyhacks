
// import apiRouter from './router';
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const bodyParser = require('body-parser');

const dotenv = require('dotenv');
dotenv.config({ silent: true });

// initialize
const app = express();

const admin = require('firebase-admin');

const serviceAccount = require('../permissions.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// enable/disable cross origin resource sharing if necessary
app.use(cors());

// enable/disable http request logging
app.use(morgan('dev'));

// enable only if you want templating
app.set('view engine', 'ejs');

// enable only if you want static assets from folder static
app.use(express.static('static'));

// this just allows us to render ejs from the ../app/views directory
app.set('views', path.join(__dirname, '../src/views'));

// enable json message body for posting data to API
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// additional init stuff should go before hitting the routing

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
// this should go AFTER body parser
// app.use('/api', apiRouter);

app.get('/api/hello-world', async (req, res) => {
    const docRef = db.collection('tests').doc('alovelace');

    await docRef.set({
        first: 'Ada',
        last: 'Lovelace',
        born: 1815
    });
    return res.status(200).send('Hello World!');
});

const PersonalityInsightsV3 = require('ibm-watson/personality-insights/v3');
const { IamAuthenticator } = require('ibm-watson/auth');

const personalityInsights = new PersonalityInsightsV3({
    version: '2017-10-13',
    authenticator: new IamAuthenticator({
        apikey: process.env.IBMKEY,
    }),
    serviceUrl: 'https://api.us-east.personality-insights.watson.cloud.ibm.com/instances/e243b357-33f5-45ec-a2e3-a4fdabccd55c',
});


function calculate_similarity(user, candidate, num) {
    let per = 0;
    for (i = 0; i < num; i++) {
        per += Math.min(user[i].raw_score, candidate[i].raw_score) / Math.max(user[i].raw_score, candidate[i].raw_score);
    }
    return (per / num)
}

// returns election profiles if election exists, else makes and returns profiles
// put call because need to add req.body and return
// req.body = {elections: [candidates: [{url, name, channels=[{type(Facebook), id(url)}]}]], userText: "user_input"}
// returns {candidates = [{profile={avg score, value score, needs score, other info from ibm}, ^^above}]
app.put('/api/text-recommendations/', async (req, res) => {

    // get user profile from ibm
    const userProfileParams = {
        // req.body.userText
        content: "returns election profiles if election exists, else makes and returns profiles returns election profiles if election exists, else makes and returns profiles Hi y'all! I'm Catherine and I'm from the great state of Texas. When I'm not in class you'll find me carefully curating Spotify playlists, exploring the Upper Valley with friends, or finding ways to enjoy the great outdoors through different sub-clubs with the DOC. I am the Treasurer of the club lacrosse team, a tutor for the Institute for Writing and Rhetoric, and am involved with research in machine learning and computational humanities through Sophomore and Neukom scholars!",
        contentType: 'text/plain;charset=utf-8',
        consumptionPreferences: true,
        rawScores: true,
    };
    let user_profile = {};
    // get candidate profile from ibm
    personalityInsights.profile(userProfileParams)
        .then(profile => {
            // save user profile
            user_profile = profile;
        })
        .catch(err => {
            console.log('error:', err);
        });

    // for each election in elections
    // console.log(req.body.elections);
    const elections = req.body.elections;
    for (election of elections) {
        // eslint-disable-next-line consistent-return
        try {
            // string parse input for election_id
            const election_id = election.candidates[0].name + election.district.name;

            // try and get candidates' profiles from election
            const document = db.collection('elections').doc(election_id);
            let item = await document.get();
            let candidate_profiles = [];

            // if candidates' profiles from election not stored in firebase
            if (!item.exists) {
                try {
                    for (candidate of election.candidates) {
                        // if has a url
                        // if (candidate.candidateUrl.exists) {
                        let candidate_content = "Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, and his entire family have been blessed to live the American Dream — the idea that anyone, through hard work and determination, can achieve anything. And he is committed to ensuring every family has that same opportunity."
                        const candidateProfileParams = {
                            content: candidate_content,
                            contentType: 'text/plain;charset=utf-8',
                            consumptionPreferences: true,
                            rawScores: true,
                        };
                        // get candidate profile from ibm
                        personalityInsights.profile(candidateProfileParams)
                            .then(profile => {
                                // add profile to candidate json
                                candidate["profile"] = profile;
                                // add profile to candidate profiles for store in firebase
                                candidate_profiles.push(profile);
                                // calculate needs_score and values_score with user_profile
                                const needs_score = calculate_similarity(user_profile.result.needs, candidate.profile.result.needs, 12);
                                const values_score = calculate_similarity(user_profile.result.values, candidate.profile.result.values, 5);
                                candidate.profile["needs_score"] = needs_score;
                                candidate.profile["values_score"] = values_score;
                                // take average and add to candidate.profile under "average_score"
                                candidate.profile["average_score"] = (needs_score + values_score) / 2;
                            })
                            .catch(err => {
                                console.log('error:', err);
                            });
                        // }
                        // // if candidate does not have a url
                        // else {
                        //     const profile = {
                        //         needs_score: 0,
                        //         values_score: 0,
                        //         average_score: 0,
                        //     };
                        //     candidate["profile"] = profile;
                        // }
                    }
                    // create elections entry in firebase
                    console.log("candidate_profiles", candidate_profiles);
                    await db.collection('elections').doc('/' + election_id + '/')
                        .create({ election: candidate_profiles });
                } catch (error) {
                    console.log(error);
                    return res.status(500).send(error);
                }
                // if candidates' profiles already stored in firebase
            } else {
                // response = {election: candidate_profiles}
                let response = item.data();
                let candidate_profiles = response.election;
                for (candidate_profile of candidate_profiles) {
                    // calculate needs_score and values_score with user_profile
                    const needs_score = calculate_similarity(user_profile.result.needs, candidate.profile.result.needs, 12);
                    const values_score = calculate_similarity(user_profile.result.values, candidate.profile.result.values, 5);
                    candidate_profile["needs_score"] = needs_score;
                    candidate_profile["values_score"] = values_score;
                    // take average and add to candidate.profile under "average_score"
                    candidate_profile["average_score"] = (needs_score + values_score) / 2;
                    // add profile to candidate json
                    candidate["profile"] = candidate_profile;
                }
            }
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        };
    }
    // return elections
    console.log(elections);
    return res.status(200).send({ elections });
});

app.put('/api/slide-recommendations/', async (req, res) => {

    // for each election in elections
    // console.log(req.body.elections);
    const elections = req.body.elections;
    for (election of elections) {
        // eslint-disable-next-line consistent-return
        try {
            // string parse input for election_id
            const election_id = election.candidates[0].name + election.district.name;

            // try and get candidates' profiles from election
            const document = db.collection('elections').doc(election_id);
            let item = await document.get();
            let candidate_profiles = [];

            // if candidates' profiles from election not stored in firebase
            if (!item.exists) {
                try {
                    for (candidate of election.candidates) {
                        // if has a url
                        // if (candidate.candidateUrl.exists) {
                        let candidate_content = "Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, and his entire family have been blessed to live the American Dream — the idea that anyone, through hard work and determination, can achieve anything. And he is committed to ensuring every family has that same opportunity."
                        const candidateProfileParams = {
                            content: candidate_content,
                            contentType: 'text/plain;charset=utf-8',
                            consumptionPreferences: true,
                            rawScores: true,
                        };
                        // get candidate profile from ibm
                        personalityInsights.profile(candidateProfileParams)
                            .then(profile => {
                                console.log(profile);
                                // add profile to candidate json
                                candidate["profile"] = profile;
                                // add profile to candidate profiles for store in firebase
                                candidate_profiles.push(profile);
                                const user_profile = req.body.user;
                                // calculate needs_score and values_score with user_profile
                                const needs_score = calculate_similarity(user_profile.needs, candidate.profile.result.needs, 12);
                                const values_score = calculate_similarity(user_profile.values, candidate.profile.result.values, 5);
                                candidate.profile["needs_score"] = needs_score;
                                candidate.profile["values_score"] = values_score;
                                // take average and add to candidate.profile under "average_score"
                                candidate.profile["average_score"] = (needs_score + values_score) / 2;
                            })
                            .catch(err => {
                                console.log('error:', err);
                            });
                        // }
                        // // if candidate does not have a url
                        // else {
                        //     const profile = {
                        //         needs_score: 0,
                        //         values_score: 0,
                        //         average_score: 0,
                        //     };
                        //     candidate["profile"] = profile;
                        // }
                    }
                    // create elections entry in firebase
                    console.log("candidate_profiles", candidate_profiles);
                    await db.collection('elections').doc('/' + election_id + '/')
                        .create({ election: candidate_profiles });
                } catch (error) {
                    console.log(error);
                    return res.status(500).send(error);
                }
                // if candidates' profiles already stored in firebase
            } else {
                // response = {election: candidate_profiles}
                let response = item.data();
                let candidate_profiles = response.election;
                for (candidate_profile of candidate_profiles) {
                    // calculate needs_score and values_score with user_profile
                    const needs_score = calculate_similarity(user_profile.needs, candidate.profile.result.needs, 12);
                    const values_score = calculate_similarity(user_profile.values, candidate.profile.result.values, 5);
                    candidate_profile["needs_score"] = needs_score;
                    candidate_profile["values_score"] = values_score;
                    // take average and add to candidate.profile under "average_score"
                    candidate_profile["average_score"] = (needs_score + values_score) / 2;
                    // add profile to candidate json
                    candidate["profile"] = candidate_profile;
                }
            }
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        };
    }
    // return elections
    console.log(elections);
    return res.status(200).send({ elections });
});


// START THE SERVER
// =============================================================================
const port = process.env.PORT || 8081;
app.listen(port);

console.log(`listening on: ${port}`);
