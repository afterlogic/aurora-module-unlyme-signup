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
        );
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
            if (empty($UUID)) {
                if (self::Decorator()->VerifyDomain($Domain)) {
                    $regUser = Models\RegistrationUser::create([
                        'Domain' => $Domain,
                        'AccountType' => $AccountType,
                    ]);
                }
            } elseif (self::Decorator()->VerifyEmail($Email)) {
                $regUser = Models\RegistrationUser::where('UUID', $UUID)->first();
                if ($regUser) {
                    $regUser->Phone = $Phone;
                    $regUser->Email = $Email;
                    $regUser->Login = $Login;
                    $regUser->Password = $Password;
                    $regUser->Language = $Language;

                    $sendCode = $regUser->save();
                }

            }
        } elseif ($AccountType === Enums\AccountType::Personal) {
            if (self::Decorator()->VerifyEmail($Email)) {
                $regUser = new Models\RegistrationUser();
                $regUser->AccountType = $AccountType;
                $regUser->Phone = $Phone;
                $regUser->Email = $Email;
                $regUser->Login = $Login;
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
     * @param mixed $Domain
     * @return bool
     */
    public function VerifyDomain($Domain)
    {
        $mResult = false;

        if (!empty($Domain)) {
            $domain = MailDomains::Decorator()->getDomainsManager()->getDomainByName($Domain, 0);
            $registrationDomain = Models\RegistrationUser::where('Domain', $Domain)->first();
            $tenant = Core::getInstance()->getTenantsManager()->getTenantByName($Domain);
            if ($domain || $registrationDomain || $tenant) {
                throw new \Aurora\System\Exceptions\ApiException(\Aurora\Modules\MailDomains\Enums\ErrorCodes::DomainExists);
            } else {
                $mResult = true;
            }
        }

        return $mResult;
    }

    /**
     * Summary of VerifyEmail
     * @param mixed $Email
     * @return bool
     */
    public function VerifyEmail($Email)
    {
        $mResult = true;

        if (!empty($Email)) {
            $account = Mail::Decorator()->getAccountsManager()->getAccountUsedToAuthorize($Email);
            $registrationEmail = Models\RegistrationUser::where('Email', $Email)->first();
            if ($account || $registrationEmail) {
                throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccountExists);
            } else {
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
                    }
                } else {
                    //TODO: Cant`t Create Tenant
                }
            } elseif ($regUser->AccountType === Enums\AccountType::Personal) {
                $tenant = \Aurora\Modules\Core\Models\Tenant::whereNull('Properties->BillingUnlyme::IsBusiness')->first();
                if ($tenant) {
                    $tenantId = $tenant->Id;
                }
            }
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
                    $regUser->Login, 
                    $regUser->Password
                );
                if ($account) {
                    $mResult = true;
                    $regUser->delete();
                } else {
                    //TODO: Can`t create account
                }
            } else {
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
            $lastSent = $regUser->LastSentCodeTime;
            $currentTime = time();
            if ($currentTime - $lastSent < 60) {
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
        }

        return $mResult;
    }

    protected function getTwilioClient()
    {
        if (!$this->twilioClient) {
            $twilioConfig = $this->getConfig('Twilio');
            if (is_array($twilioConfig) && !empty($twilioConfig['AccountSID']) && !empty($twilioConfig['AuthToken'] && !empty($twilioConfig['ServiceId'])))
            $this->twilioClient = new \Twilio\Rest\Client($twilioConfig['AccountSID'], $twilioConfig['AuthToken']);
        }

        return $this->twilioClient;
    }
}
