/*
 *   Test utils.betterErrors. utils.betterErrors should provide sensible error messages even when the error does not
 *   contain expected, actual or operator.
 */
import should from "should";
import util from 'util';
import * as assert from "../lib/assert.js";
import * as types from "../lib/types.js";
import * as utils from "../lib/utils.js";

function betterErrorStringFromError(error) {
		let assertion = types.assertion({error: error});
		let better = utils.betterErrors(assertion);
		return better.error.stack.toString();
}

function performBasicChecks(betterErrorString) {
		betterErrorString.should.containEql("AssertionError");
		betterErrorString.should.containEql("test-bettererrors");
		//betterErrorString.should.not.include("undefined");
}

/**
 * Control test. Provide an AssertionError that contains actual, expected operator values.
 * @param test the test object from nodeunit
 */
export const testEqual = function (test) {
		try {
				assert.equal(true, false);
		} catch (error) {
				let betterErrorString = betterErrorStringFromError(error);
				performBasicChecks(betterErrorString);

				betterErrorString.should.containEql("true");
				betterErrorString.should.containEql("false");
				betterErrorString.should.containEql("==");

				test.done();
		}
};

/**
 * Test an AssertionError that does not contain actual, expected or operator values.
 * @param test the test object from nodeunit
 */
export const testAssertThrows = function (test) {
		try {
				assert.throws(function () {
				});
		} catch (error) {
				let betterErrorString = betterErrorStringFromError(error);
				performBasicChecks(betterErrorString);
				test.done();
		}
};

/**
 * Test with an error that is not an AssertionError.
 *
 * This function name MUST NOT include "AssertionError" because one of the
 * tests it performs asserts that the returned error string does not contain
 * the "AssertionError" term. If this function name does include that term, it
 * will show up in the stack trace and the test will fail!
 * @param test the test object from nodeunit
 */
export const testErrorIsNotAssertion = function (test) {
		try {
				throw new Error("test error");
		} catch (error) {
				let betterErrorString = betterErrorStringFromError(error);
				betterErrorString.should.not.containEql("AssertionError");
				betterErrorString.should.containEql("Error");
				betterErrorString.should.containEql("test error");
				betterErrorString.should.containEql("test-bettererrors");
				betterErrorString.should.not.containEql("undefined");
				test.done();
		}
};
