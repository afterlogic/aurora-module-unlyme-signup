'use strict'

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
function CSigninView()
{
	CAbstractScreenView.call(this, '%ModuleName%')
	
	this.sCustomLogoUrl = Settings.CustomLogoUrl
	this.sBottomInfoHtmlText = Settings.BottomInfoHtmlText
	

	this.accountType = ko.observable(Enums.UnlymeAccountType.Personal)
	this.username = ko.observable('')
	this.login = ko.observable('')
	this.password = ko.observable('')
	
	this.usernameDom = ko.observable(null)
	this.loginDom = ko.observable(null)
	this.passwordDom = ko.observable(null)
	
	this.usernameFocus = ko.observable(false)
	this.loginFocus = ko.observable(false)
	this.passwordFocus = ko.observable(false)

	this.loading = ko.observable(false)

	this.bUseSignMe = (Settings.LoginSignMeType === Enums.LoginSignMeType.Unuse)
	this.signMe = ko.observable(Enums.LoginSignMeType.DefaultOn === Settings.LoginSignMeType)
	this.signMeFocused = ko.observable(false)

	this.canBeLogin = ko.computed(function () {
		return !this.loading();
	}, this)

	this.signInButtonText = ko.computed(function () {
		return this.loading() ? TextUtils.i18n('COREWEBCLIENT/ACTION_SIGN_IN_IN_PROGRESS') : TextUtils.i18n('COREWEBCLIENT/ACTION_SIGN_IN')
	}, this);

	this.loginCommand = Utils.createCommand(this, this.signIn, this.canBeLogin);

	this.login(Settings.DemoLogin || '')
	this.password(Settings.DemoPassword || '')

	this.bRtl = UserSettings.IsRTL
	this.aLanguages = UserSettings.LanguageList
	this.currentLanguage = ko.observable(UserSettings.Language)
	this.bAllowChangeLanguage = Settings.AllowChangeLanguage && !App.isMobile()

	this.domains = ko.observableArray([])
	this.selectedDomain = ko.observable('')

	this.beforeButtonsControllers = ko.observableArray([]);
	App.broadcastEvent('AnonymousUserForm::PopulateBeforeButtonsControllers', { ModuleName: '%ModuleName%', RegisterBeforeButtonsController: this.registerBeforeButtonsController.bind(this) })

	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this})
}

_.extendOwn(CSigninView.prototype, CAbstractScreenView.prototype)

CSigninView.prototype.ViewTemplate = '%ModuleName%_SigninView'
CSigninView.prototype.ViewConstructorName = 'CSigninView'

CSigninView.prototype.onBind = function ()
{
	$html.addClass('non-adjustable-valign')
}

/**
 * Focuses login input after view showing.
 */
CSigninView.prototype.onShow = function ()
{
	_.delay(_.bind(function(){
		if (this.login() === '') {
			this.loginFocus(true)
		}
	},this), 1)

	this.domains(['@unlymemail.com', '@unlymemail.ch', '@unly.me'])

	this.selectedDomain(this.domains()[0])

	// Ajax.send('%ModuleName%', 'GetMailDomains', {}, function (oResponse, oRequest) {
	// 	if (_.isArray(oResponse.Result))
	// 	{
	// 		this.domains(oResponse.Result);
	// 	}
	// }, this);

}

/**
 * Checks login input value and sends sign-in request to server.
 */
CSigninView.prototype.signIn = function ()
{
	// sometimes nockoutjs conflicts with saved passwords in FF
	this.login($(this.loginDom()).val())
	this.username($(this.usernameDom()).val())
	this.password($(this.passwordDom()).val())

	let sLogin = this.login().trim()
	let sPassword = this.password().trim()
	let sDomain = ''
	let koForFocus = null

	if (!this.loading()) {
		if (this.accountType() == Enums.UnlymeAccountType.Personal) {
			sDomain = this.domains().length > 1 ? this.selectedDomain() : this.domains()[0]
			const sUsername = this.username().trim()
			if (sUsername.length === 0) {
				koForFocus = this.usernameFocus
			}
			sLogin =  sUsername + sDomain
		} else {
			sLogin = this.login().trim()

			if (sLogin.length === 0) {
				koForFocus = this.loginFocus
			}
		}

		if (sPassword.length === 0) {
			koForFocus = this.passwordFocus
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
			}

			App.broadcastEvent('AnonymousUserForm::PopulateFormSubmitParameters', { Module: '%ModuleName%', Parameters: oParameters })

			this.loading(true)
	
			Ajax.send('%ModuleName%', 'Login', oParameters, this.onSystemLoginResponse, this)
		} else {
			console.log('Error')
		}
	}
}

/**
 * Receives data from the server. Shows error if server has returned false-result.
 * Otherwise clears search-string if it don't contain "reset-pass", "invite-auth" and "oauth" parameters and reloads page.
 * 
 * @param {Object} oResponse Data obtained from the server.
 * @param {Object} oRequest Data has been transferred to the server.
 */
CSigninView.prototype.onSystemLoginResponseBase = function (oResponse, oRequest)
{
	if (false === oResponse.Result) {
		this.loading(false)
		
		Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_PASS_INCORRECT'))
	} else {
		$.removeCookie('aurora-selected-lang')

		if (window.location.search !== '' &&
			UrlUtils.getRequestParam('reset-pass') === null &&
			UrlUtils.getRequestParam('invite-auth') === null &&
			UrlUtils.getRequestParam('oauth') === null)
		{
			UrlUtils.clearAndReloadLocation(Browser.ie8AndBelow, true)
		} else {
			UrlUtils.clearAndReloadLocation(Browser.ie8AndBelow, false)
		}
	}
}

/**
 * @param {string} sLanguage
 */
CSigninView.prototype.changeLanguage = function (sLanguage)
{
	if (sLanguage && this.bAllowChangeLanguage)
	{
		$.cookie('aurora-lang-on-login', sLanguage, { expires: 30 })
		$.cookie('aurora-selected-lang', sLanguage, { expires: 30 })
		window.location.reload()
	}
}

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CSigninView.prototype.onSystemLoginResponse = function (oResponse, oRequest)
{
	this.onSystemLoginResponseBase(oResponse, oRequest)
}

/**
 * @param {Object} oComponent
 */
CSigninView.prototype.registerBeforeButtonsController = function (oComponent)
{
	this.beforeButtonsControllers.push(oComponent)
}

module.exports = new CSigninView()
