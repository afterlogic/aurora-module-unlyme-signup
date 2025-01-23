'use strict'

module.exports = function (oAppData) {
	require('modules/%ModuleName%/js/enums.js')
	require('%PathToCoreWebclientModule%/js/vendors/jquery.cookie.js')

	const
		App = require('%PathToCoreWebclientModule%/js/App.js'),
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
				getScreens: function () {
					const oScreens = {}

					oScreens[Settings.HashSigninForm] = function () {
						return require('modules/%ModuleName%/js/views/SigninView.js')
					}
					oScreens[Settings.HashSignupForm] = function () {
						return require('modules/%ModuleName%/js/views/SignupView.js')
					}
					
					return oScreens
				},
			}
		}
	}
	
	return null
}
