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

const Apify = require('apify');

Apify.client.setOptions({ token: 'HPHxehsbm8m2t4iEvWpu8sFeJ' });

const axios = require('axios');

let data = '';

const config = {
  method: 'get',
  url: 'https://api.apify.com/v2/acts/pocesar~facebook-pages-scraper/runs/last/dataset/items?token=HPHxehsbm8m2t4iEvWpu8sFeJ\n',
  headers: {
    Cookie: 'AWSALB=CJFq9Ff621KPwyrNjrbVdikBoCaXzEvywP4PU+TEED2YEJEufiqiHIJAhSUBW2ms67c1AebTxKBUC07L49dZ7HKeF4wersmImyHNVpMN6MrtIYQc5iEteMxFCd1r; AWSALBCORS=CJFq9Ff621KPwyrNjrbVdikBoCaXzEvywP4PU+TEED2YEJEufiqiHIJAhSUBW2ms67c1AebTxKBUC07L49dZ7HKeF4wersmImyHNVpMN6MrtIYQc5iEteMxFCd1r',
  },
  data,
};

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
                    // string parse input for election_id
                    const election_id = election.candidates[0].name + election.district.name;
    
                    // try and get candidates' profiles from election
                    const document = db.collection('elections').doc(election_id);
                    let item = await document.get();
                    let candidate_profiles =[];
                    // if candidates' profiles from election not stored in firebase
                    if (!item.exists){
                        try {
                            for (candidate of election.candidates) {
                                // if has a facebook url (typically stored at index 0)
                                // if (candidate.channels[0].type == "Facebook") {
                                //     const fburl = candidate.channels[0].id;
                                //         console.log('hello currently scraping');
                                //         const run = await Apify.call('pocesar/facebook-pages-scraper', {
                                //           startUrls: [
                                //             {
                                //               url: fburl,
                                //             },
                                //           ],
                                //           language: 'en-US',
                                //           maxPosts: 10,
                                //           maxPostDate: '2019-01-01',
                                //           maxPostComments: 0,
                                //           maxCommentDate: '2020-01-01',
                                //           maxReviews: 0,
                                //           maxReviewDate: '2020-01-01',
                                //           proxyConfiguration: {
                                //             useApifyProxy: true,
                                //           },
                                //         });
                                //         console.log('scraping finished, here is the output:');
                                //         console.dir(run);
                                // }
                                // let candidate_content = "";
                                // axios(config)
                                //     .then((response) => {
                                //         data = JSON.stringify(response.data);
                                //         const obj = JSON.parse(data)[0].posts;
                                //         // console.log(obj);
                                //         for (const each in obj) {
                                //             if (each) {
                                //                 candidate_content += obj[each].postText;
                                //             }
                                //         }
                                //         console.log(candidate_content)
                                //     })
                                //     .catch((error) => {
                                //         console.log(error);
                                //     });
    
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
                            // create elections entry in firebase
                            console.log("candidate_profiles", candidate_profiles);
                            await db.collection('elections').doc('/' + election_id + '/')
                                .create({election: candidate_profiles});
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
            return res.status(200).send({elections});
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
                        let candidate_profiles =[];
                        console.log(item);
                        // if candidates' profiles from election not stored in firebase
                        if (!item.exists){
                            try {
                                for (candidate of election.candidates) {
                                    // if has a facebook url (typically stored at index 0)
                                    // if (candidate.channels[0].type == "Facebook") {
                                    //     const fburl = candidate.channels[0].id;
                                    //         console.log('hello currently scraping');
                                    //         const run = await Apify.call('pocesar/facebook-pages-scraper', {
                                    //           startUrls: [
                                    //             {
                                    //               url: fburl,
                                    //             },
                                    //           ],
                                    //           language: 'en-US',
                                    //           maxPosts: 10,
                                    //           maxPostDate: '2019-01-01',
                                    //           maxPostComments: 0,
                                    //           maxCommentDate: '2020-01-01',
                                    //           maxReviews: 0,
                                    //           maxReviewDate: '2020-01-01',
                                    //           proxyConfiguration: {
                                    //             useApifyProxy: true,
                                    //           },
                                    //         });
                                    //         console.log('scraping finished, here is the output:');
                                    //         console.dir(run);
                                    // }
                                    // let candidate_content = "";
                                    // axios(config)
                                    //     .then((response) => {
                                    //         data = JSON.stringify(response.data);
                                    //         const obj = JSON.parse(data)[0].posts;
                                    //         // console.log(obj);
                                    //         for (const each in obj) {
                                    //             if (each) {
                                    //                 candidate_content += obj[each].postText;
                                    //             }
                                    //         }
                                    //         console.log(candidate_content)
                                    //     })
                                    //     .catch((error) => {
                                    //         console.log(error);
                                    //     });
        
                                    let candidate_content = "Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, Ted, his wife Heidi, their two daughters Caroline and Catherine, and his entire family have been blessed to live the American Dream — the idea that anyone, through hard work and determination, can achieve anything. And he is committed to ensuring every family has that same opportunity."
                                    const candidateProfileParams = {
                                        content: candidate_content,
                                        contentType: 'text/plain;charset=utf-8',
                                        consumptionPreferences: true,
                                        rawScores: true,
                                    };

                                    console.log('still going');
    
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
                                // create elections entry in firebase
                                console.log("candidate_profiles", candidate_profiles);
                                await db.collection('elections').doc('/' + election_id + '/')
                                    .create({election: candidate_profiles});
                            } catch (error) {
                                console.log(error);
                                return res.status(500).send(error);
                            } 
                        // if candidates' profiles already stored in firebase
                        } else {
                            // response = {election: candidate_profiles}
                            let response = item.data();
                            let candidate_profiles = response.election;
                            let user_profile = req.body.user;
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

                        setTimeout(2000);
                    } catch (error) {
                        console.log(error);
                        return res.status(500).send(error);
                        console.log(election);
                    };
                }
                // return elections
                return res.status(200).send({elections});
            });


// START THE SERVER
// =============================================================================
const port = process.env.PORT || 8081;
app.listen(port);

console.log(`listening on: ${port}`);