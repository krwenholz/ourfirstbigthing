import * as Alexa from "ask-sdk-core";
import CancelAndStopIntentHandler from "./intent_handlers/_cancel_and_stop";
import DecisionGivenChooseStoryDecisionIntentHandler from "./intent_handlers/_decision_given_choose_story_decision";
import ErrorHandler from "./_error_handler";
import GoBackIntentHandler from "./intent_handlers/_go_back";
import HelpIntentHandler from "./intent_handlers/_help";
import LaunchRequestHandler from "./request_handlers/_launch";
import RestartStoryIntentHandler from "./intent_handlers/_restart_story";
import SessionEndedRequestHandler from "./request_handlers/_session_ended";
import StartedInProgressChooseStoryIntentHandler from "./intent_handlers/_started_in_progress_choose_story";
import StoryTitleChoiceGivenChooseStoryIntentHandler from "./intent_handlers/_story_title_choice_given_choose_story";
import {
  SkillRequestSignatureVerifier,
  TimestampVerifier
} from "ask-sdk-express-adapter";
import { logger } from "src/logging";

// TODO(kyle): https://developer.amazon.com/en-US/docs/alexa/account-linking/steps-to-implement-account-linking.html
// https://github.com/jaredhanson/oauth2orize

// BEWARE: Order matters; they're handlers.
const skill = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    StoryTitleChoiceGivenChooseStoryIntentHandler,
    StartedInProgressChooseStoryIntentHandler,
    DecisionGivenChooseStoryDecisionIntentHandler,
    GoBackIntentHandler,
    RestartStoryIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .create();

export const post = (req, res, next) => {
  // TODO(kyle): auth https://github.com/jaredhanson/oauth2orize#implement-api-endpoints
  return new SkillRequestSignatureVerifier()
    .verify(req.rawBody, req.headers)
    .then(() => {
      return new TimestampVerifier().verify(req.rawBody);
    })
    .then(() => skill.invoke(req.body))
    .then(skillResponse => {
      res.send(JSON.stringify(skillResponse));
      res.status(200);
      res.end();
    })
    .catch(err => {
      logger.error(err, "Error processing Alexa request");
      res.status(500);
    });
};
