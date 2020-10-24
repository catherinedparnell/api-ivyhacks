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
        per += Math.min(user[i].raw_score, candidate[i].raw_score)/Math.max(user[i].raw_score, candidate[i].raw_score);
    }
    return (per / num)
}


app.put('/api/text-recommendations/', async (req, res) => {
        // get user profile from ibm
        const userProfileParams = {
            // req.body.userText
            content: req.body.userText,
            contentType: 'text/plain;charset=utf-8',
            consumptionPreferences: true,
            rawScores: true,
        };
        let user_profile = await personalityInsights.profile(userProfileParams);
    
        // for each election in elections
        // console.log(req.body.elections);
        const elections = req.body.elections;
        for (election of elections) {
            // eslint-disable-next-line consistent-return
                try {
                    let candidate_profiles = [];
                    // try and get candidates' profiles from election
                            for (candidate of election.candidates) {
                                let candidate_content = "Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, and his entire family have been blessed to live the American Dream — the idea that anyone, through hard work and determination, can achieve anything. And he is committed to ensuring every family has that same opportunity."
                                const candidateProfileParams = {
                                    content: candidate_content,
                                    contentType: 'text/plain;charset=utf-8',
                                    consumptionPreferences: true,
                                    rawScores: true,
                                };

                                profile = await personalityInsights.profile(candidateProfileParams);
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
                            }
                        } catch (error) {
                            console.log(error);
                            return res.status(500).send(error);
                        } 
            }
            // return elections
            return res.status(200).send({elections});
        });

        app.put('/api/slide-recommendations/', async (req, res) => {
            const user_profile = req.body.user;
            const elections = req.body.elections;

            for (election of elections) {
                // eslint-disable-next-line consistent-return                 
                        let candidate_profiles =[];
                        // if candidates' profiles from election not stored in firebase
                            try {
                                for (candidate of election.candidates) {
                                    let candidate_content = "Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, and his entire family have been blessed to live the American Dream — the idea that anyone, through hard work and determination, can achieve anything. And he is committed to ensuring every family has that same opportunity."
                                    const candidateProfileParams = {
                                        content: candidate_content,
                                        contentType: 'text/plain;charset=utf-8',
                                        consumptionPreferences: true,
                                        rawScores: true,
                                    };
    
                                    profile = await personalityInsights.profile(candidateProfileParams);
                                    // add profile to candidate json
                                    candidate["profile"] = profile;
                                    // add profile to candidate profiles for store in firebase
                                    candidate_profiles.push(profile);
                                    // calculate needs_score and values_score with user_profile
                                    const needs_score = calculate_similarity(user_profile.needs, candidate.profile.result.needs, 12);
                                    const values_score = calculate_similarity(user_profile.values, candidate.profile.result.values, 5);
                                    candidate.profile["needs_score"] = needs_score;
                                    candidate.profile["values_score"] = values_score;
                                    // take average and add to candidate.profile under "average_score"
                                    candidate.profile["average_score"] = (needs_score + values_score) / 2;
                                }
                            } catch (error) {
                                console.log(error);
                                console.log('election error: ', election);
                                return res.status(500).send(error);
                            } 
                }
                // return elections
                return res.status(200).send({elections});
            });


// START THE SERVER
// =============================================================================
const port = process.env.PORT || 8081;
app.listen(port);

console.log(`listening on: ${port}`);