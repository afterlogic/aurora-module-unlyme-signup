'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	IMask = require('imask'),
	
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
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
	
	this.sCustomLogoUrl = Settings.CustomLogoUrl
	this.sBottomInfoHtmlText = Settings.BottomInfoHtmlText
	
	this.registrationUUID = ko.observable('')
	this.accountType = ko.observable(Enums.UnlymeAccountType.Personal)
	this.username = ko.observable('')
	this.login = ko.observable('')
	this.password = ko.observable('')
	this.passwordRepeat = ko.observable('')
	this.domain = ko.observable('')
	this.code = ko.observable('')
	this.phone = ko.observable('')
	
	this.phoneDom = ko.observable(null)
	
	this.usernameFocus = ko.observable(false)
	this.loginFocus = ko.observable(false)
	this.passwordFocus = ko.observable(false)
	this.passwordRepeatFocus = ko.observable(false)
	this.domainFocus = ko.observable(false)
	this.codeFocus = ko.observable(false)
	this.phoneFocus = ko.observable(false)
	
	this.domainError = ko.observable(false)
	this.passwordError = ko.observable(false)
	this.passwordRepeatError = ko.observable(false)
	this.usernameExistError = ko.observable(false)
	this.usernameBadError = ko.observable(false)

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
			
			if (this.personalAccountAccepted()) {
				screenToShow = Enums.SignupScreen.Confirmation
			}

			if (this.codeAccepted()) {
				screenToShow = Enums.SignupScreen.Confirmation
			}
		} else if (this.accountType() == Enums.UnlymeAccountType.Business) {
			screenToShow = Enums.SignupScreen.BusinessDomain

			if (this.businessDomainAccepted()) {
				screenToShow = Enums.SignupScreen.BusinessAccount
			}

			if (this.businessAccountAccepted()) {
				screenToShow = Enums.SignupScreen.Confirmation
			}

			if (this.codeAccepted()) {
				screenToShow = Enums.SignupScreen.Confirmation
			}
		}
		return screenToShow
	}, this);

	this.registerAccountCommand = Utils.createCommand(this, this.registerAccount, this.notloading)
	this.confirmCommand = Utils.createCommand(this, this.signUp, this.notloading)
	this.registerDomainCommand = Utils.createCommand(this, this.registerDomain, this.notloading)
	
	this.bRtl = UserSettings.IsRTL
	this.aLanguages = UserSettings.LanguageList
	this.currentLanguage = ko.observable(UserSettings.Language)
	this.bAllowChangeLanguage = Settings.AllowChangeLanguage && !App.isMobile()

	this.domains = ko.observableArray([])
	this.selectedDomain = ko.observable('')

	this.phonePrefixes = Settings.PhonePrefixes
	this.selectedPhonePrefix = ko.observable('')

	this.accountType.subscribe(function () {
		this.username('');
		this.password('');
		this.passwordRepeat('');
	}, this)

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
	// reset errors on change input values
	this.username.subscribe(function () {
		this.usernameBadError(false)
		this.usernameExistError(false)
	}, this)
	this.domain.subscribe(function () {
		this.domainError(false)
	}, this)
	this.password.subscribe(function () {
		this.passwordError(false)
	}, this)
	this.passwordRepeat.subscribe(function () {
		this.passwordRepeatError(false)
	}, this)

	this.phoneDom.subscribe(function (element) {
		const maskOptions = {
			mask: '000-000-00-00',
			lazy: false,
		}
		IMask.default(element[0], maskOptions)
	}, this)
}

/**
 * Focuses login input after view showing.
 */
CSignupView.prototype.onShow = function ()
{
	_.delay(_.bind(function(){
		if (this.username() === '') {
			this.usernameFocus(true)
		}
	},this), 1)

	this.domains(['@unlymemail.com', '@unlymemail.ch', '@unly.me']);

	this.selectedPhonePrefix(this.phonePrefixes[0])
	this.selectedDomain(this.domains()[0])
	
	// Ajax.send('%ModuleName%', 'GetMailDomains', {}, function (oResponse, oRequest) {
	// 	if (_.isArray(oResponse.Result))
	// 	{
	// 		this.domains(oResponse.Result);
	// 	}
	// }, this);
}

CSignupView.prototype.validateEmail = function ()
{
	let valid = true

	if (this.username().length === 0) {
		this.usernameFocus(true)
		valid = false
	}

	if (this.accountType() == Enums.UnlymeAccountType.Personal) {
		if (this.getEmail().indexOf('test') >= 0) {
			valid = false
			this.usernameExistError(!valid)
		}
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
		const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/
		valid = regex.test(this.password())
		this.passwordError(!valid)
	}

	return valid
}
CSignupView.prototype.validateDomain = function ()
{
	const valid = this.domain().indexOf('.') >= 0
	this.domainError(!valid)

	return valid
}

CSignupView.prototype.setPhonePrefix = function (prefix)
{
	this.selectedPhonePrefix(prefix)
}

CSignupView.prototype.registerDomain = function ()
{
	if (this.domain().length === 0) {
		this.domainFocus(true)
	} else if (this.validateDomain()) {
		this.businessDomainAccepted(true)
	}
}


CSignupView.prototype.back = function ()
{
	if (this.accountType() == Enums.UnlymeAccountType.Personal && this.personalAccountAccepted()) {
		this.personalAccountAccepted(false)
	} else if (this.accountType() == Enums.UnlymeAccountType.Business) {
		if (this.businessAccountAccepted()) {
			this.businessAccountAccepted(false)
		} else if (this.businessDomainAccepted()) {
			this.businessDomainAccepted(false)
		}
	}
}

CSignupView.prototype.registerAccount = function ()
{
	if (this.screenToShow() == Enums.SignupScreen.PersonalAccount || this.screenToShow() == Enums.SignupScreen.BusinessAccount) {
		
		if (!this.validateEmail()) {
			return
		}

		if (this.phone().length === 0) {
			this.phoneFocus(true)
			return
		}

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
			'Id': this.registrationUUID(),
			'AccountType': this.accountType(),
			'Email': this.getEmail(),
			'Password': this.password().trim(),
			'Phone': this.phone(),
			'Language': $.cookie('aurora-selected-lang') || '',
		}

		// App.broadcastEvent('AnonymousUserForm::PopulateFormSubmitParameters', { Module: '%ModuleName%', Parameters: oParameters });

		this.loading(true)

		// Ajax.send('%ModuleName%', 'Register', oParameters, function () {
			this.loading(false)

			if (this.accountType() == Enums.UnlymeAccountType.Personal) {
				this.personalAccountAccepted(true)
			} else if (this.accountType() == Enums.UnlymeAccountType.Business) {
				this.businessAccountAccepted(true)
			}
		// }, this);
	}
}

CSignupView.prototype.getEmail = function ()
{
	let sDomain = ''
	if (this.accountType() === Enums.UnlymeAccountType.Personal) {
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
