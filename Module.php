<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\UnlymeSignup;

use Aurora\System\Api;
use Aurora\System\Enums\UserRole;
use Aurora\Modules\MailDomains\Module as MailDomains;
use Aurora\Modules\Core\Module as Core;
use Aurora\Modules\Mail\Module as Mail;

/**
 * Displays standard login form with ability to pass login and password.
 *
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2025, Afterlogic Corp.
 *
 * @property Settings $oModuleSettings
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractWebclientModule
{
    protected $twilioClient;
    protected $domainId;

    /***** public functions might be called with web API *****/
    /**
     * @return Module
     */
    public static function getInstance()
    {
        return parent::getInstance();
    }

    /**
     * @return Module
     */
    public static function Decorator()
    {
        return parent::Decorator();
    }

    /**
     * @return Settings
     */
    public function getModuleSettings()
    {
        return $this->oModuleSettings;
    }

    public function init()
    {
        $this->subscribeEvent('Core::CreateUser::before', array($this, 'onBeforeCreateUser'));
    }

    /**
     * Obtains list of module settings for authenticated user.
     *
     * @return array
     */
    public function GetSettings()
    {
        Api::checkUserRoleIsAtLeast(UserRole::Anonymous);

        return array(
            'ServerModuleName' => $this->oModuleSettings->ServerModuleName,
            'HashSigninForm' => $this->oModuleSettings->HashSigninForm,
            'HashSignupForm' => $this->oModuleSettings->HashSignupForm,
            'DemoLogin' => $this->oModuleSettings->DemoLogin,
            'DemoPassword' => $this->oModuleSettings->DemoPassword,
            'InfoText' => $this->oModuleSettings->InfoText,
            'BottomInfoHtmlText' => $this->oModuleSettings->BottomInfoHtmlText,
            'LoginSignMeType' => $this->oModuleSettings->LoginSignMeType,
            'AllowChangeLanguage' => $this->oModuleSettings->AllowChangeLanguage,
            'PersonalDomains' => self::Decorator()->GetPersonalDomains(),
            'PhoneCountryCodes' => $this->oModuleSettings->PhoneCountryCodes,
        );
    }

    /**
     * Obtains list of mail domains of Default tenant.
     *
     * @return array
     */
    public function GetPersonalDomains()
    {
        $domains = [];

        $tenant = \Aurora\Modules\Core\Models\Tenant::whereNull('Properties->BillingUnlyme::IsBusiness')->first();
        if ($tenant) {
            $domains = MailDomains::getInstance()->getDomainsManager()->getDomainsByTenantId($tenant->Id)->toArray();
        }

        // pick domain names only
        $domains = array_map(function ($domain) {
            return $domain['Name'];
        }, $domains);

        return $domains;
    }

    /**
     * @param mixed $Login
     * @param mixed $Password
     * @param mixed $Language
     * @param mixed $SignMe
     * @return array
     */
    public function Login($Login, $Password, $Language = '', $SignMe = false)
    {
        $mResult = Core::Decorator()->Login($Login, $Password, $Language, $SignMe);

        return $mResult;
    }

    /**
     * Summary of Register
     * @param mixed $Domain
     * @param mixed $AccountType
     * @param mixed $Phone
     * @param mixed $Email
     * @param mixed $Login
     * @param mixed $Password
     * @param mixed $Language
     * @return bool
     */
    public function Register($Domain = '', $AccountType = Enums\AccountType::Personal, $Phone = '', $Email = '', $Login = '', $Password = '', $Language = '', $UUID = '')
    {
        $mResult = false;
        $regUser = null;
        $sendCode = false;

        if($AccountType === Enums\AccountType::Business) {
            $regUser = $UUID ? Models\RegistrationUser::where('UUID', $UUID)->first() : new Models\RegistrationUser();

            if ($regUser) {
                if ($Domain && self::Decorator()->VerifyDomain($Domain)) {
                    $regUser->Domain = $Domain;
                    $regUser->AccountType = $AccountType;

                    $sendCode = $regUser->save();
                } else if ($Email && self::Decorator()->VerifyEmail($Email)) {
                    $regUser->Email = $Email;
                    $regUser->AccountType = $AccountType;
                    $regUser->Phone = $Phone;
                    $regUser->Login = $Login;
                    $regUser->Password = $Password;
                    $regUser->Language = $Language;

                    $sendCode = $regUser->save();
                }
            }
        } elseif ($AccountType === Enums\AccountType::Personal) {
            $regUser = $UUID ? Models\RegistrationUser::where('UUID', $UUID)->first() : new Models\RegistrationUser();

            if ($regUser && self::Decorator()->VerifyEmail($Email)) {
                $regUser->AccountType = $AccountType;
                $regUser->Phone = $Phone;
                $regUser->Email = $Email;
                $regUser->Password = $Password;
                $regUser->Language = $Language;

                $sendCode = $regUser->save();
            }
        }

        if ($regUser && empty($regUser->UUID)) {
            $regUser->UUID = $regUser->generateUUID();
            $regUser->save();
            $mResult = $regUser->UUID;
        }

        if ($sendCode) {
            $this->sendCode($regUser);
            $mResult = $regUser->UUID;
        }

        return $mResult;
    }

    /**
     * Summary of VerifyDomain
     * 
     * @param mixed $Domain
     * 
     * @return bool
     */
    public function VerifyDomain($Domain)
    {
        $mResult = false;

        if (!!filter_var($Domain, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) && strpos($Domain, '.') !== false) {
            $domain = MailDomains::Decorator()->getDomainsManager()->getDomainByName($Domain, 0);
            $registrationDomain = Models\RegistrationUser::where('Domain', $Domain)->first();
            $tenant = Core::getInstance()->getTenantsManager()->getTenantByName($Domain);
            if (!$domain && !$registrationDomain && !$tenant) {
                $mResult = true;
            }
        }

        return $mResult;
    }

    /**
     * Summary of VerifyEmail
     * @param string $Email
     * @return bool
     */
    public function VerifyEmail($Email)
    {
        $mResult = false;

        if (!empty($Email)) {
            $account = Mail::Decorator()->getAccountsManager()->getAccountUsedToAuthorize($Email);
            $registrationEmail = Models\RegistrationUser::where('Email', $Email)->first();
            if (!$account && !$registrationEmail) {
                $mResult = true;
            }
        }

        return $mResult;
    }

    /**
     * Summary of ConfirmRegistration
     * @param mixed $UUID
     * @param mixed $Code
     * @return bool
     */
    public function ConfirmRegistration($UUID, $Code)
    {
        $mResult = false;

        $regUser = Models\RegistrationUser::where('UUID', $UUID)->first();
        $tenantId = 0;
        $domainId = 0;
        if ($regUser && $this->validateCode($regUser, $Code)) { //TODO: Validate code from sms
            $prevState = Api::skipCheckUserRole(true);
            $oServer = \Aurora\Modules\Mail\Models\Server::where([['OwnerType', '=', \Aurora\Modules\Mail\Enums\ServerOwnerType::SuperAdmin]])->first();
            $serverId = $oServer ? $oServer->Id : 0;
            if ($regUser->AccountType === Enums\AccountType::Business) {
                $tenantId = Core::Decorator()->CreateTenant(0, $regUser->Domain);
                if ($tenantId) {
                    $domainId = MailDomains::Decorator()->CreateDomain($tenantId, $serverId, $regUser->Domain);
                    if (!$domainId) {
                        //TODO: Can`t create Domain
                        if ($tenantId > 0) {
                            Core::Decorator()->DeleteTenant($tenantId);
                        }
                        return false;
                    }
                } else {
                    //TODO: Cant`t Create Tenant
                    return false;
                }
            } elseif ($regUser->AccountType === Enums\AccountType::Personal) {
                $tenant = \Aurora\Modules\Core\Models\Tenant::whereNull('Properties->BillingUnlyme::IsBusiness')->first();
                if ($tenant) {
                    $tenantId = $tenant->Id;
                    
                    $domainName = explode('@', $regUser->Email)[1];
                    $domain = MailDomains::getInstance()->getDomainsManager()->getDomainByName($domainName, $tenant->Id);
                    if ($domain) {
                        $domainId = $domain->Id;
                    }
                }
            }
            $this->domainId = $domainId;
            $userId = Core::Decorator()->CreateUser($tenantId, $regUser->Email);
            if ($userId) {
                $oUser = Core::Decorator()->GetUser($userId);
                if ($oUser) {
                    $oUser->Language = $regUser->Language;
                    if ($regUser->AccountType === Enums\AccountType::Business) {
                        $oUser->Role = UserRole::TenantAdmin;
                    }
                    $oUser->save();
                }
                $account = Mail::Decorator()->CreateAccount(
                    $userId, 
                    '', 
                    $regUser->Email, 
                    !empty($regUser->Login) ? $regUser->Login : $regUser->Email, 
                    $regUser->Password
                );
                if ($account) {
                    $mResult = true;
                    $regUser->delete();
                } else {
                    Core::Decorator()->DeleteUser($userId);
                    if ($regUser->AccountType === Enums\AccountType::Business ) {
                        if ($domainId > 0) {
                            MailDomains::Decorator()->DeleteDomains($tenantId, [$domainId]);
                        }
                        if ($tenantId > 0) {
                            Core::Decorator()->DeleteTenant($tenantId);
                        }
                    }
                    $regUser->delete();
                    //TODO: Can`t create account
                }
            } else {
                if ($regUser->AccountType === Enums\AccountType::Business ) {
                    if ($domainId > 0) {
                        MailDomains::Decorator()->DeleteDomains($tenantId, [$domainId]);
                    }
                    if ($tenantId > 0) {
                        Core::Decorator()->DeleteTenant($tenantId);
                    }
                }
                //TODO: Can`t create user
            }
            \Aurora\Api::skipCheckUserRole($prevState);
        }
        return $mResult;
    }

    /**
     * Summary of ResendCode
     * @param mixed $UUID
     * @param mixed $Code
     * @return int
     */
    public function ResendCode($UUID)
    {
        $mResult = 0;
        $regUser = Models\RegistrationUser::where('UUID', $UUID)->first();
        if ($regUser) {
            if (time() - $regUser->LastSentCodeTime < $this->getConfig('CodeResendTime', 60)) {
                return false;
            }
            $mResult = $this->sendCode($regUser);
        }
        return $mResult;
    }
    /***** public functions might be called with web API *****/

    protected function sendCode($RegUser) 
    {
        if (!empty($RegUser->Phone)) {
            $twilio = $this->getTwilioClient();
            if ($twilio) {
                $twilioConfig = $this->getConfig('Twilio');
                $verification = $twilio->verify->v2
                    ->services($twilioConfig['ServiceId'])
                    ->verifications->create(
                        $RegUser->Phone, // To
                        "sms" // Channel
                    );

                if ($verification && $verification->sid) {
                    $RegUser->LastSentCodeTime = time();
                    $RegUser->save();
                }
            }
        }

        return true;
    }

    protected function validateCode($RegUser, $Code) 
    {
        $mResult = false;

        $twilio = $this->getTwilioClient();
        if ($twilio) {
            $twilioConfig = $this->getConfig('Twilio');
            $verification_check = $twilio->verify->v2
                ->services($twilioConfig['ServiceId'])
                ->verificationChecks->create([
                    "to" => $RegUser->Phone,
                    "code" => $Code,
                ]);
    
            $mResult = $verification_check && $verification_check->status === 'approved';
        } else if ($Code === '123456') {
            $mResult = true;
        }

        return $mResult;
    }

    protected function getTwilioClient()
    {
        $twilioConfig = $this->getConfig('Twilio');

        if (!$this->twilioClient && !empty($twilioConfig)) {
            if (is_array($twilioConfig) && !empty($twilioConfig['AccountSID']) && !empty($twilioConfig['AuthToken'] && !empty($twilioConfig['ServiceId'])))
            $this->twilioClient = new \Twilio\Rest\Client($twilioConfig['AccountSID'], $twilioConfig['AuthToken']);
        }

        return $this->twilioClient;
    }

    /**
     * This subscruption adds Domain parameter to the CreateUser request.
     * This way it emmulates the adding the parameter by MtaConnector module.
     */
    public function onBeforeCreateUser($aArgs, &$mResult)
    {
        if ($this->domainId) {
            $aArgs['Domain'] = $this->domainId;
            // $aArgs['QuotaBytes'] = $this->domainId; // Most lilely it should be added by other module
        }
    }
}
