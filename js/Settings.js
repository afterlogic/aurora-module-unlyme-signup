'use strict'

const
	_ = require('underscore'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	ServerModuleName: '%ModuleName%',
	HashSigninForm: '%ModuleName%-signin',
	HashSignupForm: '%ModuleName%-signup',
	HashSignupFormCompleted: 'completed',
	HashMobileInfo: 'mobile-app-info',
	IgnoreHashesListForMobileAppInfo: [],
	
	AllowChangeLanguage: false,
	CustomLogoUrl: '',
	DemoLogin: '',
	DemoPassword: '',
	InfoText: '',
	BottomInfoHtmlText: '',
	LoginSignMeType: Enums.LoginSignMeType.DefaultOff, // 0 - off, 1 - on, 2 - don't use

	PersonalDomains: [],
	PhoneCountryCodes: [],
	
	MailAppIosLink: '',
	MailAppAndroidLink: '',
	FilesAppIosLink: '',
	FilesAppAndroidLink: '',
	
	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		const 
			oAppDataSection = oAppData['%ModuleName%'],
			oAppDataBrandingWebclientSection = oAppData['BrandingWebclient']
		;
		
		if (!_.isEmpty(oAppDataSection))
		{
			this.ServerModuleName = Types.pString(oAppDataSection.ServerModuleName, this.ServerModuleName)
			this.HashSigninForm = Types.pString(oAppDataSection.HashSigninForm, this.HashSigninForm)
			this.HashSignupForm = Types.pString(oAppDataSection.HashSignupForm, this.HashSignupForm)
		
			this.AllowChangeLanguage = Types.pBool(oAppDataSection.AllowChangeLanguage, this.AllowChangeLanguage)
			this.DemoLogin = Types.pString(oAppDataSection.DemoLogin, this.DemoLogin)
			this.DemoPassword = Types.pString(oAppDataSection.DemoPassword, this.DemoPassword)
			this.InfoText = Types.pString(oAppDataSection.InfoText, this.InfoText)
			this.BottomInfoHtmlText = Types.pString(oAppDataSection.BottomInfoHtmlText, this.BottomInfoHtmlText)
			this.LoginSignMeType = Types.pEnum(oAppDataSection.LoginSignMeType, Enums.LoginSignMeType, this.LoginSignMeType)
			this.PersonalDomains = Types.pArray(oAppDataSection.PersonalDomains, this.PersonalDomains)
			this.PhoneCountryCodes = Types.pArray(oAppDataSection.PhoneCountryCodes, this.PhoneCountryCodes)

			this.IgnoreHashesListForMobileAppInfo = Types.pArray(oAppDataSection.IgnoreHashesListForMobileAppInfo, this.IgnoreHashesListForMobileAppInfo)
			this.MailAppIosLink = Types.pString(oAppDataSection.MailAppIosLink, this.MailAppIosLink)
			this.MailAppAndroidLink = Types.pString(oAppDataSection.MailAppAndroidLink, this.MailAppAndroidLink)
			this.FilesAppIosLink = Types.pString(oAppDataSection.FilesAppIosLink, this.FilesAppIosLink)
			this.FilesAppAndroidLink = Types.pString(oAppDataSection.FilesAppAndroidLink, this.FilesAppAndroidLink)
		}
		
		if (!_.isEmpty(oAppDataBrandingWebclientSection))
		{
			this.CustomLogoUrl = Types.pString(oAppDataBrandingWebclientSection.LoginLogo, this.CustomLogoUrl)
		}
	}
}
