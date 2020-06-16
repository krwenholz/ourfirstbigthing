import AWS from "aws-sdk";
import config from "config";
import securePassword from "secure-password";
import { logger } from "src/logging";
import { pool } from "src/db/database";

const passwordHasher = securePassword();

const users = [];

export const findUser = async identifier => {
  try {
    const results = await pool.query(
      `
    SELECT
        users.email,
        users.id as id,
        users.first_name as "firstName",
        users.last_name as "lastName",
        users.type as "type",
        users.free_story_used as "freeStoryUsed",
        users.password_hash as "passwordHash",
        subscriptions.stripe_customer_id as "stripeCustomerId",
        subscriptions.subscription_id as "subscriptionId",
        subscriptions.subscription_period_end as "subscriptionPeriodEnd"
    FROM
        users
        LEFT JOIN subscriptions ON users.id = subscriptions.user_id
    WHERE
        users.email = $1
    OR
        users.id::text = $1;
    `,
      [identifier]
    );

    return results.rows[0];
  } catch (err) {
    logger.error(err);
    return Promise.reject(err);
  }
};

export const findUserSafeDetails = async identifier => {
  try {
    const results = await pool.query(
      `
    SELECT
        users.email,
        users.id as id,
        users.first_name as "firstName",
        users.type as "type",
        users.free_story_used as "freeStoryUsed",
        users.created as "created",
        subscriptions.stripe_customer_id as "stripeCustomerId",
        subscriptions.subscription_id as "subscriptionId",
        subscriptions.subscription_period_end as "subscriptionPeriodEnd"
    FROM
        users
        LEFT JOIN subscriptions ON users.id = subscriptions.user_id
    WHERE
        users.email = $1
    OR
        users.id::text = $1
    OR
        subscriptions.stripe_customer_id = $1;
    `,
      [identifier]
    );

    return results.rows[0];
  } catch (err) {
    logger.error(err);
    return Promise.reject(err);
  }
};

export const addUser = async ({
  firstName,
  lastName,
  email,
  password,
  freeStoryUsed
}) => {
  try {
    const hash = await passwordHasher.hash(Buffer.from(password));

    await pool.query(
      `
      INSERT INTO
        users (id, email, first_name, last_name, password_hash, type, free_story_used, created, modified)
      VALUES (DEFAULT, $1, $2, $3, $4, DEFAULT, $5, NOW(), NOW())
    `,
      [email, firstName, lastName, hash, freeStoryUsed]
    );

    logger.info({ email, freeStoryUsed }, "User added");
    return findUserSafeDetails(email);
  } catch (err) {
    logger.error(err);
    return Promise.reject(err);
  }
};

export const removeUser = async identifier => {
  try {
    await pool.query(
      `
    DELETE FROM
        users
    WHERE
        email = $1
    OR
        id::text = $1;
  `,
      [identifier]
    );

    logger.info({ identifier }, "User removed");
    return Promise.resolve({});
  } catch (err) {
    logger.error(err);
    return promise.reject(err);
  }
};

export const updateUserPassword = async (identifier, { password }) => {
  const hash = await passwordHasher.hash(Buffer.from(password));

  try {
    await pool.query(
      `
      UPDATE
        users
      SET
        password_hash = $2
      WHERE
        email = $1
      OR
        id::text = $1;
    `,
      [identifier, hash.toString("utf-8").replace(/\0/g, "")]
    );

    return Promise.resolve({});
  } catch (err) {
    logger.error(err);
    return Promise.reject(err);
  }
};

export const updateUserFreeStoryUsed = async (identifier, storyId) => {
  try {
    await pool.query(
      `
      UPDATE
        users
      SET
        free_story_used = $2
      WHERE
        email = $1
      OR
        id::text = $1;
    `,
      [identifier, storyId]
    );

    return Promise.resolve({});
  } catch (err) {
    logger.error(err);
    return Promise.reject(err);
  }
};

export const setSubscriptionDetails = async (
  identifier,
  stripeCustomerId,
  subscriptionId,
  subscriptionPeriodEnd,
  errors = null
) => {
  try {
    await pool.query(
      `
      INSERT INTO subscriptions (user_id, stripe_customer_id, subscription_id, subscription_period_end, errors)
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5
      )
      ON CONFLICT(user_id)
      DO UPDATE
        SET
          stripe_customer_id = $2,
          subscription_id = $3,
          subscription_period_end = $4;
    `,
      [
        identifier,
        stripeCustomerId,
        subscriptionId,
        subscriptionPeriodEnd,
        errors
      ]
    );
    return {
      identifier,
      stripeCustomerId,
      subscriptionId,
      subscriptionPeriodEnd
    };
  } catch (err) {
    logger.error(err);
    return Promise.reject(err);
  }
};
