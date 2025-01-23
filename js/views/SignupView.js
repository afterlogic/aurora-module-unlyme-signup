'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	UrlUtils = require('%PathToCoreWebclientModule%/js/utils/Url.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Browser = require('%PathToCoreWebclientModule%/js/Browser.js'),
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
	this.sInfoText = Settings.InfoText
	this.sBottomInfoHtmlText = Settings.BottomInfoHtmlText
	
	this.registrationId = ko.observable('')
	this.accountType = ko.observable(Enums.UnlymeAccountType.Personal)
	this.username = ko.observable('')
	this.login = ko.observable('')
	this.password = ko.observable('')
	this.passwordRepeat = ko.observable('')
	this.domain = ko.observable('')
	this.code = ko.observable('')
	this.phone = ko.observable('')
	
	this.usernameFocus = ko.observable(false)
	this.loginFocus = ko.observable(false)
	this.passwordFocus = ko.observable(false)
	this.passwordRepeatFocus = ko.observable(false)
	this.domainFocus = ko.observable(false)
	this.codeFocus = ko.observable(false)
	this.phoneFocus = ko.observable(false)
	
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


	// this.primaryButtonText = ko.computed(function () {
	// 	return this.loading() ? TextUtils.i18n('COREWEBCLIENT/ACTION_SIGN_IN_IN_PROGRESS') : TextUtils.i18n('COREWEBCLIENT/ACTION_SIGN_IN');
	// }, this);

	this.registerAccountCommand = Utils.createCommand(this, this.registerAccount, this.notloading)
	this.confirmCommand = Utils.createCommand(this, this.signUp, this.notloading)
	this.registerDomainCommand = Utils.createCommand(this, this.registerDomain, this.notloading)
	
	this.shake = ko.observable(false).extend({'autoResetToFalse': 800})
	
	this.bRtl = UserSettings.IsRTL
	this.aLanguages = UserSettings.LanguageList
	this.currentLanguage = ko.observable(UserSettings.Language)
	this.bAllowChangeLanguage = Settings.AllowChangeLanguage && !App.isMobile()
	this.bUseDropdownLanguagesView = Settings.UseDropdownLanguagesView

	this.domains = ko.observableArray([])
	this.selectedDomain = ko.observable('')
	this.firstDomain = ko.computed(function () {
		return this.domains().length > 0 ? this.domains()[0] : ''
	}, this)

	this.accountType.subscribe(function (value) {
		this.username('');
		this.password('');
		this.passwordRepeat('');
	}, this)

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

	// Ajax.send('%ModuleName%', 'GetMailDomains', {}, function (oResponse, oRequest) {
	// 	if (_.isArray(oResponse.Result))
	// 	{
	// 		this.domains(oResponse.Result);
	// 	}
	// }, this);

	this.domains(['@unlymemail.com', '@unlymemail.ch', '@unly.me']);
};

CSignupView.prototype.registerDomain = function ()
{
	if (this.domain().length === 0) {
		this.domainFocus(true)
	} else {
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
		if (this.username().length === 0) {
			this.usernameFocus(true)
			return
		}

		if (this.phone().length === 0) {
			this.phoneFocus(true)
			return
		}

		if (this.password().length === 0) {
			this.passwordFocus(true)
			return
		}

		if (this.passwordRepeat().length === 0) {
			this.passwordRepeatFocus(true)
			return
		}

		if (this.password().trim() !== this.passwordRepeat().trim()) {
			this.passwordRepeatFocus(true)
			return
		}

		let sDomain = ''
		let sPassword = this.password().trim()
		if (this.accountType() === Enums.UnlymeAccountType.Personal) {
			sDomain = this.domains().length > 1 ? this.selectedDomain() : this.domains()[0]
		} else {
			sDomain = '@' + this.domain().trim()
		}

		const oParameters = {
			'Id': this.registrationId(),
			'AccountType': this.accountType(),
			'Email': this.username().trim() + sDomain,
			'Password': sPassword,
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

/**
 * Checks login input value and sends sign-in request to server.
 */
CSignupView.prototype.signIn = function ()
{
	// sometimes nockoutjs conflicts with saved passwords in FF
	// this.login($(this.loginDom()).val());
	// this.username($(this.usernameDom()).val());
	// this.password($(this.passwordDom()).val());

	let sLogin = this.login().trim();
	let sPassword = this.password().trim();
	let sDomain = '';
	let koForFocus = null;

	if (!this.loading()) {
		if (this.accountType() === Enums.UnlymeAccountType.Personal) {
			sDomain = this.domains().length > 1 ? this.selectedDomain() : this.domains()[0];
			const sUsername = this.username().trim();
			if (sUsername.length === 0) {
				koForFocus = this.usernameFocus;
			}
			sLogin =  sUsername + sDomain;
		} else {
			sLogin = this.login().trim();

			if (sLogin.length === 0) {
				koForFocus = this.loginFocus;
			}
		}

		if (sPassword.length === 0) {
			koForFocus = this.passwordFocus;
		}

		if (koForFocus) {
			koForFocus(true);
		}

		if (sLogin.length > 0 && sPassword.length > 0)
		{
			var oParameters = {
				'Login': sLogin,
				'Password': sPassword,
				'Language': $.cookie('aurora-selected-lang') || '',
				'SignMe': this.signMe()
			};

			App.broadcastEvent('AnonymousUserForm::PopulateFormSubmitParameters', { Module: '%ModuleName%', Parameters: oParameters });

			this.loading(true);
	
			Ajax.send('%ModuleName%', 'Login', oParameters, this.onSystemLoginResponse, this);
		} else {
			this.shake(true);
		}
	}
}

/**
 * Receives data from the server. Shows error and shakes form if server has returned false-result.
 * Otherwise clears search-string if it don't contain "reset-pass", "invite-auth" and "oauth" parameters and reloads page.
 * 
 * @param {Object} oResponse Data obtained from the server.
 * @param {Object} oRequest Data has been transferred to the server.
 */
CSignupView.prototype.onSystemLoginResponseBase = function (oResponse, oRequest)
{
	if (false === oResponse.Result)
	{
		this.loading(false);
		this.shake(true);
		
		Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_PASS_INCORRECT'));
	}
	else
	{
		$.removeCookie('aurora-selected-lang');

		if (window.location.search !== '' &&
			UrlUtils.getRequestParam('reset-pass') === null &&
			UrlUtils.getRequestParam('invite-auth') === null &&
			UrlUtils.getRequestParam('oauth') === null)
		{
			UrlUtils.clearAndReloadLocation(Browser.ie8AndBelow, true);
		}
		else
		{
			UrlUtils.clearAndReloadLocation(Browser.ie8AndBelow, false);
		}
	}
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
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CSignupView.prototype.onSystemLoginResponse = function (oResponse, oRequest)
{
	this.onSystemLoginResponseBase(oResponse, oRequest);
}

/**
 * @param {Object} oComponent
 */
CSignupView.prototype.registerBeforeButtonsController = function (oComponent)
{
	this.beforeButtonsControllers.push(oComponent);
}

module.exports = new CSignupView()
