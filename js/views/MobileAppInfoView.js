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
function CMobileAppInfoView()
{
	CAbstractScreenView.call(this, '%ModuleName%')
	
	this.sCustomLogoUrl = Settings.CustomLogoUrl
	this.sBottomInfoHtmlText = Settings.BottomInfoHtmlText
	
	this.bRtl = UserSettings.IsRTL
	this.aLanguages = UserSettings.LanguageList
	this.sMailAppIosLink = Settings.MailAppIosLink
	this.sMailAppAndroidLink = Settings.MailAppAndroidLink
	this.sFilesAppIosLink = Settings.FilesAppIosLink
	this.sFilesAppAndroidLink = Settings.FilesAppAndroidLink

	this.currentLanguage = ko.observable(UserSettings.Language)
	this.bAllowChangeLanguage = Settings.AllowChangeLanguage && !App.isMobile()

	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this})
}

_.extendOwn(CMobileAppInfoView.prototype, CAbstractScreenView.prototype)

CMobileAppInfoView.prototype.ViewTemplate = '%ModuleName%_MobileAppInfoView'
CMobileAppInfoView.prototype.ViewConstructorName = 'CMobileAppInfoView'

CMobileAppInfoView.prototype.onBind = function ()
{
	$html.addClass('non-adjustable-valign')
}

/**
 * Focuses login input after view showing.
 */
CMobileAppInfoView.prototype.onShow = function ()
{
}

/**
 * @param {string} sLanguage
 */
CMobileAppInfoView.prototype.changeLanguage = function (sLanguage)
{
	if (sLanguage && this.bAllowChangeLanguage)
	{
		$.cookie('aurora-lang-on-login', sLanguage, { expires: 30 })
		$.cookie('aurora-selected-lang', sLanguage, { expires: 30 })
		window.location.reload()
	}
}

module.exports = new CMobileAppInfoView()
