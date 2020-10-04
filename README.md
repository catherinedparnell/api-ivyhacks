# ivyhacks-api

## How we built it
We built our api using two main endpoints, text-recommendations and slide-recommendations. These two endpoints return recommendations for which candidate most aligns with a user's needs and values based on a user's text input or self assessment. This is done using IBM's personality insights API. We hope to further implement this idea with the scraping of social media presences (ie. Twitter, Facebook) with the use of the Twitter and Facebook APIs (we were unable to recieve permission in time for the hackathon).

## Challenges we ran into
Our main challenge was the handling of the multiple asynchronous API calls, and making sure that we got the right timing. For a while, the calculations were correct but wouldn't update our return object correctly due to mismatches in timing. With some work on promises and awaits, and the help of ivyhacks mentor, we managed to tackle it.

Our other significant challenge was the inability to obtain a developer account/permission to work with Twitter and Facebook APIs. We hope to continue work on this product in the future which wouls allow us to use candidates' and users' real social media presences. In the meantime we are using 'dummy data' to simulate what the content might look like.

## Accomplishments that we're proud of
We are proud of our use of different APIs to accomplish this pretty neat goal. The IBM personality API in particular was really interesting and seamless to work with. The algorithm itself for calculating similarity, when planning it out, seemed pretty complicated, so we were proud that we were able to implement our idea. This is our first time hackathon and we are very proud of our output.

## What we learned
Technically speaking, we learned about the intricacies of promises and asynchronous functions, and learned how to use IBM's watson API interface. More broadly, however, we learned that we had the ability to fully form a complex idea in such a short amount of time. 
