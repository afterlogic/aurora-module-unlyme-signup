'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	moment = require('moment-timezone'),
	IMask = require('imask'),
	
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	$html = $('html')
;

/**
 * @constructor
 */
function CSignupView()
{
	CAbstractScreenView.call(this, '%ModuleName%')

	this.mobileApp = ko.observable(false)
	
	this.sCustomLogoUrl = Settings.CustomLogoUrl
	this.sBottomInfoHtmlText = Settings.BottomInfoHtmlText
	
	this.registrationUUID = ko.observable('')
	this.accountType = ko.observable(Enums.UnlymeAccountType.Personal)
	this.username = ko.observable('').extend({ rateLimit: 500, method: "notifyWhenChangesStop" })
	this.password = ko.observable('')
	this.passwordRepeat = ko.observable('')
	this.domain = ko.observable('').extend({ rateLimit: 500, method: "notifyWhenChangesStop" })
	this.code = ko.observable('')
	this.phone = ko.observable('')

	this.emailApproved = ko.observable(false)
	this.businessDomainApproved = ko.observable(false)
	
	this.phoneDom = ko.observable(null)
	
	this.usernameFocus = ko.observable(false)
	this.loginFocus = ko.observable(false)
	this.passwordFocus = ko.observable(false)
	this.passwordRepeatFocus = ko.observable(false)
	this.domainFocus = ko.observable(false)
	this.codeFocus = ko.observable(false)
	this.phoneFocus = ko.observable(false)
	
	this.domainError = ko.observable(false)
	this.domainBadError = ko.observable(false)
	this.passwordError = ko.observable(false)
	this.passwordRepeatError = ko.observable(false)
	this.usernameExistError = ko.observable(false)
	this.usernameBadError = ko.observable(false)
	this.codeError = ko.observable(false)

	this.loading = ko.observable(false)

	this.notloading = ko.computed(function () {
		return !this.loading()
	}, this)

	this.codeAccepted = ko.observable(false)
	this.businessDomainAccepted = ko.observable(false)
	this.businessAccountAccepted = ko.observable(false)
	this.personalAccountAccepted = ko.observable(false)

	this.screenToShow = ko.computed(function () {
		let screenToShow = Enums.SignupScreen.PersonalAccount

		if (this.accountType() == Enums.UnlymeAccountType.Personal) {
			screenToShow = Enums.SignupScreen.PersonalAccount
			
			// if (this.personalAccountAccepted()) {
			// 	screenToShow = Enums.SignupScreen.Confirmation
			// }

			// if (this.codeAccepted()) {
			// 	screenToShow = Enums.SignupScreen.Completed
			// }

			if (this.personalAccountAccepted()) {
				screenToShow = Enums.SignupScreen.Completed
			}
		} else if (this.accountType() == Enums.UnlymeAccountType.Business) {
			screenToShow = Enums.SignupScreen.BusinessDomain

			if (this.businessDomainAccepted()) {
				screenToShow = Enums.SignupScreen.BusinessAccount
			}

			// if (this.businessAccountAccepted()) {
			// 	screenToShow = Enums.SignupScreen.Confirmation
			// }

			// if (this.codeAccepted()) {
			// 	screenToShow = Enums.SignupScreen.Completed
			// }

			if (this.businessAccountAccepted()) {
				screenToShow = Enums.SignupScreen.Completed
			}
		}
		return screenToShow
	}, this);

	this.screenToShow.subscribe(function (v) {
		switch (v) {
			case Enums.SignupScreen.PersonalAccount:
				this.usernameFocus(true)
				break
			case Enums.SignupScreen.BusinessDomain:
				this.domainFocus(true)
				break
			case Enums.SignupScreen.BusinessAccount:
				this.usernameFocus(true)
				break
			case Enums.SignupScreen.Confirmation:
				this.codeFocus(true)
		}
	}, this)

	this.canRegisterAccount = ko.computed(function () {
		return this.notloading() && !this.usernameExistError() && !this.usernameBadError()
	}, this);
	this.registerAccountCommand = Utils.createCommand(this, this.registerAccount, this.canRegisterAccount)

	this.canRegisterDomain = ko.computed(function () {
		return this.notloading() && !this.domainError() && !this.domainBadError()
	}, this);
	this.registerDomainCommand = Utils.createCommand(this, this.registerDomain, this.canRegisterDomain)

	
	this.confirmCommand = Utils.createCommand(this, this.confirmRegistration, this.notloading)
	
	this.timerObject = ko.observable(null)
	this.timerSeconds = ko.observable(0)
	this.timerText = ko.computed(function () {
		const seconds = this.timerSeconds()
		const timer = seconds === 0 ? '' : (' (0:' + (seconds < 10 ? '0' + seconds : seconds) + ')')
		return TextUtils.i18n('%MODULENAME%/BUTTON_RESENT_VERIFICATION_CODE', { TIMER: timer })
	}, this)

	this.bRtl = UserSettings.IsRTL
	this.aLanguages = UserSettings.LanguageList
	this.currentLanguage = ko.observable(UserSettings.Language)
	this.bAllowChangeLanguage = Settings.AllowChangeLanguage && !App.isMobile()

	this.domains = ko.observableArray([])
	this.selectedDomain = ko.observable('')

	// this.phonePrefixes = Settings.PhoneCountryCodes
	// this.selectedPhonePrefix = ko.observable(null)
	this.maskObject = null

	this.init()

	this.beforeButtonsControllers = ko.observableArray([])
	App.broadcastEvent('AnonymousUserForm::PopulateBeforeButtonsControllers', { ModuleName: '%ModuleName%', RegisterBeforeButtonsController: this.registerBeforeButtonsController.bind(this) })

	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this})
}

_.extendOwn(CSignupView.prototype, CAbstractScreenView.prototype)

CSignupView.prototype.ViewTemplate = '%ModuleName%_SignupView'
CSignupView.prototype.ViewConstructorName = 'CSignupView'
CSignupView.prototype.onBind = function ()
{
	$html.addClass('non-adjustable-valign')
}
CSignupView.prototype.init = function ()
{
	// reset fields that are used on both forms
	this.accountType.subscribe(function () {
		this.resetForm()
	}, this)

	// reset errors on change input values
	this.username.subscribe(function () {
		this.usernameBadError(false)
		this.usernameExistError(false)
	}, this)
	this.domain.subscribe(function () {
		this.domainBadError(false)
		this.domainError(false)
	}, this)
	this.password.subscribe(function () {
		this.passwordError(false)
	}, this)
	this.passwordRepeat.subscribe(function () {
		this.passwordRepeatError(false)
	}, this)
	this.code.subscribe(function () {
		this.codeError(false)
	}, this)

	// this.selectedPhonePrefix.subscribe(function (v) {
	// 	const mask = '0'.repeat(4 - v?.code?.length + 1) + '-000-00-00'
	// 	this.maskObject.updateOptions({mask: mask})
	// }, this)

	this.phoneDom.subscribe(function (element) {
		const maskOptions = {
			// mask: '0'.repeat(4 - this.selectedPhonePrefix()?.code?.length + 1) + '-000-00-00',
			mask: '+0000-000-00-00',
			lazy: false,
		}
		this.maskObject = IMask.default(element[0], maskOptions)
	}, this)

	//we can't put Ajax.send directly to ko.computed because it causes infinit loop
	this.email = ko.computed(function () {
		const domain = this.accountType() == Enums.UnlymeAccountType.Personal ? this.selectedDomain() : '@' + this.domain()
		return this.username() + domain
	}, this)

	this.email.subscribe(function (sEmail) {
		if (this.username().length >= 3) {
			this.emailApproved(false)
			Ajax.send('%ModuleName%', 'VerifyEmail', {'Email': sEmail}, function (oResponse, oRequest) {
				this.emailApproved(oResponse?.Result ? true : false)

				if (!oResponse?.Result) {
					this.usernameExistError(true)
				}
			}, this)
		} else {
			this.emailApproved(false)
		}
	}, this)

	this.domain.subscribe(function (v) {
		if (this.validateDomain(true)) {
			this.businessDomainApproved(false)
			Ajax.send('%ModuleName%', 'VerifyDomain', {'Domain': v}, function (oResponse, oRequest) {
				this.businessDomainApproved(oResponse?.Result ? true : false)

				this.domainError(!oResponse?.Result)
			}, this)
		} else {
			this.businessDomainApproved(false)
		}
	}, this)
}

/**
 * Focuses login input after view showing.
 */
CSignupView.prototype.onRoute = function (aParams)
{
	this.mobileApp(aParams && aParams.indexOf('mobile-app') !== -1)
}
CSignupView.prototype.onShow = function ()
{
	_.delay(_.bind(function(){
		if (this.username() === '') {
			this.usernameFocus(true)
		}
	},this), 1)

	if (Settings.PersonalDomains.length > 0) {
		this.domains(Settings.PersonalDomains.map(domain => '@' + domain))
		this.selectedDomain(this.domains()[0])
	}
	// this.selectedPhonePrefix(this.phonePrefixes[0])
}

CSignupView.prototype.resetForm = function ()
{
	this.username('')
	this.password('')
	this.phone('')
	this.passwordRepeat('')
	this.passwordRepeat('')
	this.domain('')
	this.registrationUUID('')
	this.code('')
}
CSignupView.prototype.validatePhone = function ()
{
	let valid = true

	// if (this.phone().length === 0 || !this.selectedPhonePrefix()) {
	if (this.phone().length === 0) {
		this.phoneFocus(true)
		valid = false
	}

	return valid
}

CSignupView.prototype.validateEmail = function ()
{
	let valid = true

	if (this.username().length === 0) {
		this.usernameFocus(true)
		valid = false
	}

	if (this.accountType() == Enums.UnlymeAccountType.Personal) {
		// if (this.getEmail().indexOf('test') >= 0) {
		// 	valid = false
		// 	this.usernameExistError(!valid)
		// }
	}

	if (this.getEmail().indexOf('bad') >= 0) {
		valid = false
		this.usernameBadError(!valid)
	}

	return valid
}
CSignupView.prototype.validatePassword = function ()
{
	let valid = true

	if (this.password().length === 0) {
		this.passwordFocus(true)
		valid = false
	} else {
		// any symbols, but at least 8 characters, one digit, one uppercase and one lowercase letter
		const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
		valid = regex.test(this.password())
		this.passwordError(!valid)
	}

	return valid
}

CSignupView.prototype.validateDomain = function (silentMode = false)
{
	let valid = false

	if (this.domain().length === 0 || this.domain().indexOf('.') <= 0) {
		this.domainFocus(true)
		if (!silentMode) {
			this.domainBadError(true)
		}
	} else {
		const regex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
		valid = regex.test(this.domain())
		
		if (!valid) {
			if (!silentMode) {
				this.domainBadError(true)
			}
			this.domainFocus(true)
		}
	}

	return valid
}

// CSignupView.prototype.setPhonePrefix = function (prefix)
// {
// 	this.selectedPhonePrefix(prefix)
// }

/**
 *  The functon creates countdown timer
 */
CSignupView.prototype.setTimer = function ()
{
	if (!this.timerObject()) {
		const seconds = 60
		let counter = seconds
		this.timerSeconds(counter)
		let timer = setInterval(_.bind(function () {
			if (counter === 0) {
				this.resetTimer()
			} else {
				counter--
			}
			this.timerSeconds(counter)
		}, this), 1000)

		this.timerObject(timer)
	}
}

/**
 *  The functon resets countdown timer
 */

CSignupView.prototype.resetTimer = function ()
{
	if (this.timerObject()) {
		clearInterval(this.timerObject())
		this.timerObject(null)
	}
	this.timerSeconds(0)
}

CSignupView.prototype.resendCode = function ()
{
	if (this.timerSeconds() === 0) {
		const oParameters = {
			'UUID': this.registrationUUID(),
		}
	
		this.loading(true)
	
		Ajax.send('%ModuleName%', 'ResendCode', oParameters, function (oResponse) {
			this.loading(false)
	
			if (oResponse?.Result) {
				this.setTimer()
			} else {
				console.log('ResendCode error', oResponse)
			}
		}, this)
	}
}

CSignupView.prototype.back = function ()
{
	if (this.accountType() == Enums.UnlymeAccountType.Personal && this.personalAccountAccepted()) {
		this.personalAccountAccepted(false)
		this.code('')
		this.resetTimer()
	} else if (this.accountType() == Enums.UnlymeAccountType.Business) {
		this.code('')
		this.resetTimer()
		if (this.businessAccountAccepted()) {
			this.businessAccountAccepted(false)
		} else if (this.businessDomainAccepted()) {
			this.businessDomainAccepted(false)
		}
	}
}

CSignupView.prototype.registerDomain = function ()
{
	if (this.registerDomainTimer) {
		clearTimeout(this.registerDomainTimer)
		this.registerDomainTimer = null
	}

	if (this.domain().length === 0) {
		this.domainFocus(true)
	} else if (this.validateDomain()) {
		const oParameters = {
			'UUID': this.registrationUUID(),
			'AccountType': Types.pInt(this.accountType()),
			'Domain': this.domain(),
			'Language': $.cookie('aurora-selected-lang') || '',
		}
		const oEventParameters = { Module: '%ModuleName%', Parameters: oParameters, Reject: false }

		this.loading(true)

		App.broadcastEvent('AnonymousUserForm::PopulateFormSubmitParameters', oEventParameters)

		// check if reject status was passed by other listeners and restart method in a second
		if (oEventParameters.Reject) {
			this.registerDomainTimer = setTimeout(_.bind(this.registerDomain, this), 1000)
			return
		}

		Ajax.send('%ModuleName%', 'Register', oParameters, function (oResponse) {
			this.loading(false)

			if (oResponse?.Result) {
				this.registrationUUID(oResponse?.Result)

				if (oParameters.AccountType == Enums.UnlymeAccountType.Personal) {
					this.personalAccountAccepted(true)
				} else if (oParameters.AccountType == Enums.UnlymeAccountType.Business) {
					this.businessDomainAccepted(true)
				}
			}
		}, this)
	}
}

CSignupView.prototype.registerAccount = function ()
{
	if (this.registerAccountTimer) {
		clearTimeout(this.registerAccountTimer)
		this.registerAccountTimer = null
	}

	if (this.screenToShow() == Enums.SignupScreen.PersonalAccount || this.screenToShow() == Enums.SignupScreen.BusinessAccount) {
		
		if (!this.validateEmail()) {
			return
		}
		
		// if (!this.validatePhone()) {
		// 	return
		// }

		if (!this.validatePassword()) {
			return
		}

		if (this.passwordRepeat().length === 0) {
			this.passwordRepeatFocus(true)
			return
		}

		if (this.password().trim() !== this.passwordRepeat().trim()) {
			this.passwordRepeatFocus(true)
			this.passwordRepeatError(true)
			return
		}

		const oParameters = {
			'UUID': this.registrationUUID(),
			'AccountType': Types.pInt(this.accountType()),
			'Email': this.getEmail(),
			'Password': this.password().trim(),
			// 'Phone': this.selectedPhonePrefix().code + this.phone(),
			// 'Phone': this.phone(),
			'Language': $.cookie('aurora-selected-lang') || '',
			'Timezone': moment.tz.guess(),
		}
		const oEventParameters = { Module: '%ModuleName%', Parameters: oParameters, Reject: false }
		
		
		this.loading(true)
		
		App.broadcastEvent('AnonymousUserForm::PopulateFormSubmitParameters', oEventParameters)
		
		// check if reject status was passed by other listeners and restart method in a second
		if (oEventParameters.Reject) {
			this.registerAccountTimer = setTimeout(_.bind(this.registerAccount, this), 1000)
			return
		}

		Ajax.send('%ModuleName%', 'Register', oParameters, function (oResponse) {
			this.loading(false)

			if (oResponse?.Result) {
				this.registrationUUID(oResponse?.Result)
				// this.setTimer()

				if (!this.mobileApp()) {
					this.resetForm()
					window.location.reload()
				} else {
					if (oParameters.AccountType == Enums.UnlymeAccountType.Personal) {
						this.personalAccountAccepted(true)
					} else if (oParameters.AccountType == Enums.UnlymeAccountType.Business) {
						this.businessAccountAccepted(true)
					}
				}
			}
		}, this)
	}
}

CSignupView.prototype.confirmRegistration = function ()
{
	if (this.code().length === 0) {
		this.codeFocus(true)
		return
	}

	const oParameters = {
		'UUID': this.registrationUUID(),
		'Code': this.code(),
	}

	this.loading(true)

	Ajax.send('%ModuleName%', 'ConfirmRegistration', oParameters, function (oResponse) {
		this.loading(false)

		if (oResponse?.Result) {
			if (!this.mobileApp()) {
				window.location.href = '#' + Settings.HashSigninForm
			} else {
				this.codeAccepted(true)
			}
		} else {
			this.codeError(true)
		}

	}, this);
}

CSignupView.prototype.getEmail = function ()
{
	let sDomain = ''
	if (this.accountType() == Enums.UnlymeAccountType.Personal) {
		sDomain = this.domains().length > 1 ? this.selectedDomain() : this.domains()[0]
	} else {
		sDomain = '@' + this.domain().trim()
	}

	return this.username().trim() + sDomain
}

/**
 * @param {string} sLanguage
 */
CSignupView.prototype.changeLanguage = function (sLanguage)
{
	if (sLanguage && this.bAllowChangeLanguage)
	{
		$.cookie('aurora-lang-on-login', sLanguage, { expires: 30 });
		$.cookie('aurora-selected-lang', sLanguage, { expires: 30 });
		window.location.reload();
	}
}


/**
 * @param {Object} oComponent
 */
CSignupView.prototype.registerBeforeButtonsController = function (oComponent)
{
	this.beforeButtonsControllers.push(oComponent);
}

module.exports = new CSignupView()
