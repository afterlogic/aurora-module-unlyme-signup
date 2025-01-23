<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\UnlymeSignup;

use Aurora\System\Enums\UserRole;

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
        \Aurora\System\Api::checkUserRoleIsAtLeast(UserRole::Anonymous);

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

    public function Login($Login, $Password, $Language = '', $SignMe = false)
    {
        $mResult = \Aurora\Modules\Core\Module::Decorator()->Login($Login, $Password, $Language, $SignMe);

        return $mResult;
    }
    /***** public functions might be called with web API *****/
}
