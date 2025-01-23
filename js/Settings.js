'use strict'

const
	_ = require('underscore'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	ServerModuleName: '%ModuleName%',
	HashSigninForm: '%ModuleName%-signin',
	HashSignupForm: '%ModuleName%-signup',
	
	AllowChangeLanguage: false,
	CustomLogoUrl: '',
	DemoLogin: '',
	DemoPassword: '',
	InfoText: '',
	BottomInfoHtmlText: '',
	LoginSignMeType: Enums.LoginSignMeType.DefaultOff, // 0 - off, 1 - on, 2 - don't use

	PhonePrefixes: [
		{
			name: 'Australia',
			code: '+61',
			icon: 'au',
		},
		{
			name: 'France',
			code: '+33',
			icon: 'fr',
		},
		{
			name: 'Germany',
			code: '+49',
			icon: 'de',
		},
		// {
		// 	name: 'Switzerland',
		// 	code: '+41',
		// 	icon: 'ch',
		// },
		{
			name: 'United Kingdom',
			code: '+44',
			icon: 'gb',
		},
		{
			name: 'United States',
			code: '+1',
			icon: 'us',
		},
	],
	
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
		}
		
		if (!_.isEmpty(oAppDataBrandingWebclientSection))
		{
			this.CustomLogoUrl = Types.pString(oAppDataBrandingWebclientSection.LoginLogo, this.CustomLogoUrl)
		}
	}
}
