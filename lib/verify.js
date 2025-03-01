const {isString, isNil, isArray, isPlainObject} = require('lodash');
const AggregateError = require('aggregate-error');
const getError = require('./get-error.js');
const resolveConfig = require('./resolve-config.js');

const isNonEmptyString = (value) => isString(value) && value.trim();
const isStringOrStringArray = (value) => {
  return isNonEmptyString(value) || (isArray(value) && value.every((element) => isNonEmptyString(element)));
};

const isArrayOf = (validator) => (array) => isArray(array) && array.every((value) => validator(value));
const canBeDisabled = (validator) => (value) => value === false || validator(value);

const VALIDATORS = {
  assets: canBeDisabled(
    isArrayOf((asset) => isStringOrStringArray(asset) || (isPlainObject(asset) && isStringOrStringArray(asset.path)))
  ),
  message: isNonEmptyString,
};

/**
 * Verify the commit `message` format and the `assets` option configuration:
 * - The commit `message`, is defined, must a non empty `String`.
 * - The `assets` configuration must be an `Array` of `String` (file path) or `false` (to disable).
 *
 * @param {Object} pluginConfig The plugin configuration.
 * @param {String|Array<String|Object>} [pluginConfig.assets] Files to include in the release commit. Can be files path or globs.
 * @param {String} [pluginConfig.message] The commit message for the release.
 */
module.exports = (pluginConfig) => {
  const options = resolveConfig(pluginConfig);
  console.log(options);
  const errors = Object.entries(options).reduce(
    (errors, [option, value]) =>
      !isNil(value) && !VALIDATORS[option](value)
        ? [...errors, getError(`EINVALID${option.toUpperCase()}`, {[option]: value})]
        : errors,
    []
  );

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }
};
