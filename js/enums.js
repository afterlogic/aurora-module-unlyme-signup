'use strict'

var
	_ = require('underscore'),
	Enums = {}
;

/**
 * @enum {number}
 */
Enums.LoginSignMeType = {
	'DefaultOff': 0,
	'DefaultOn': 1,
	'Unuse': 2
}

Enums.UnlymeAccountType = {
	'Personal': 0,
	'Business': 1,
}

Enums.SignupScreen = {
	'PersonalAccount': 0,
	'BusinessDomain': 1,
	'BusinessAccount': 2,
	'Confirmation': 3,
	'Completed': 4,
}

Enums.ErrorCodes = {
	'LoginTooLong': 1001,
	'InvalidDomain': 1002,
	'ForbiddenEmail': 1003,
}

if (typeof window.Enums === 'undefined')
{
	window.Enums = {}
}

_.extendOwn(window.Enums, Enums)
