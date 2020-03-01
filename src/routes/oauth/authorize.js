import config from "config";
import oauth2orize from "oauth2orize";
import passportHttpBearer from "passport-http-bearer";
import securePassword from "secure-password";
import uuidv4 from "uuid/v4";
import { passport } from "src/authentication";
import { findUser, findUserSafeDetails } from "src/lib/server/users";
import { logger } from "src/logging";
import { pool } from "src/lib/server/database.js";
import { join, times } from "lodash";

const findAccessTokenByUserIdAndClientId = async (userId, clientId, done) => {
  try {
    const results = await pool.query(
      `
    SELECT
        client_id AS clientId,
        user_id AS userId
    FROM
        oauth_access_tokens
    WHERE
        user_id = $1
        AND client_id = $2
    `,
      [userId, clientId]
    );

    return done(null, results.rows[0]);
  } catch (err) {
    logger.error(err);
    return done(err);
  }
};

export const get = (req, res, next) => {
  return server.authorization(
    (clientId, redirectUri, done) => {
      // WARNING: For security purposes, it is highly advisable to check that
      //          redirectUri provided by the client matches one registered with
      //          the server. For simplicity, this example does not. You have
      //          been warned.
      // TODO(kyle): verify the client is who they say with some lookup and auth?
      return done(null, { clientId, isTrusted: true }, redirectUri);
    },
    (client, user, done) => {
      // Check if grant request qualifies for immediate approval

      // Auto-approve
      if (client.isTrusted) return done(null, true);

      findAccessTokenByUserIdAndClientId(
        user.id,
        client.clientId,
        (error, token) => {
          // Auto-approve
          if (token) return done(null, true);

          // Otherwise ask user
          return done(null, false);
        }
      );
    }
  )(req, res, (req, res) => {
    return response.render("dialog", {
      transactionId: request.oauth2.transactionID,
      user: request.user,
      client: request.oauth2.client
    });
  });
};