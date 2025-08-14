'use strict';

const
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

Ajax.registerAbortRequestHandler(Settings.ServerModuleName, function (oRequest, oOpenedRequest) {
	switch (oRequest.Method)
	{
		case 'VerifyEmail':
			return oOpenedRequest.Method === 'VerifyEmail';
		case 'VerifyDomain':
			return oOpenedRequest.Method === 'VerifyDomain';
	}
	
	return false;
});

module.exports = {
	send: function (sMethod, oParameters, fResponseHandler, oContext, oMainParams) {
		Ajax.send(Settings.ServerModuleName, sMethod, oParameters, fResponseHandler, oContext, oMainParams);
	}
}; 