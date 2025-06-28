'use strict'

module.exports = function (oAppData) {
	
	require('modules/%ModuleName%/js/enums.js')
	require('%PathToCoreWebclientModule%/js/vendors/jquery.cookie.js')

	const
		App = require('%PathToCoreWebclientModule%/js/App.js'),
		Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
		Settings = require('modules/%ModuleName%/js/Settings.js'),
		bAnonimUser = App.getUserRole() === window.Enums.UserRole.Anonymous
	;
	
	Settings.init(oAppData)

	if (!App.isPublic() && bAnonimUser) {
		if (App.isMobile()) {
			return {				
				getHashModuleName: function () {
					return Settings.HashSigninForm
				},
			}
		} else {
			return {
				start: function (ModulesManager) {
        			const bMobile = !window.matchMedia('all and (min-width: 768px)').matches

					if (bMobile && Routing.currentHash().indexOf('mobile-app') === -1) {
						Routing.replaceHash(Settings.HashMobileInfo)
					}

					Routing.currentHash.subscribe(function (hash) {
						const bMobile = !window.matchMedia('all and (min-width: 768px)').matches
						if (bMobile && hash.indexOf('mobile-app') === -1) {
							Routing.replaceHash(Settings.HashMobileInfo)
						}
					}, this)
      			},
				getScreens: function () {
					const oScreens = {}

					oScreens[Settings.HashSigninForm] = function () {
						return require('modules/%ModuleName%/js/views/SigninView.js')
					}
					oScreens[Settings.HashSignupForm] = function () {
						return require('modules/%ModuleName%/js/views/SignupView.js')
					}
					oScreens[Settings.HashMobileInfo] = function () {
						return require('modules/%ModuleName%/js/views/MobileAppInfoView.js')
					}
					
					return oScreens
				},
			}
		}
	}
	
	return null
}
