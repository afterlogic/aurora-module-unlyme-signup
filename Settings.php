<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\UnlymeSignup;

use Aurora\System\SettingsProperty;

/**
 * @property bool $Disabled
 * @property string $ServerModuleName
 * @property string $HashSigninForm
 * @property string $HashSignupForm
 * @property string $DemoLogin
 * @property string $DemoPassword
 * @property string $InfoText
 * @property string $BottomInfoHtmlText
 * @property int $LoginSignMeType
 * @property bool $AllowChangeLanguage
 * @property int $CodeResendTime
 * @property array $PhoneCountryCodes
 * @property array $Twilio
 * @property int $RegistrationDataLifetimeMinutes
 * @property array $IgnoreHashesListForMobileAppInfo
 * @property string $MailAppIosLink
 * @property string $MailAppAndroidLink
 * @property string $FilesAppIosLink
 * @property string $FilesAppAndroidLink
 * @property string $PostProcessScript
 * @property int $MaxLoginLength
 */

class Settings extends \Aurora\System\Module\Settings
{
    protected function initDefaults()
    {
        $this->aContainer = [
            "Disabled" => new SettingsProperty(
                false,
                "bool",
                null,
                "Setting to true disables the module",
            ),
            "ServerModuleName" => new SettingsProperty(
                "UnlymeSignup",
                "string",
                null,
                "Defines name of the module responsible for login page",
            ),
            "HashSigninForm" => new SettingsProperty(
                "signin",
                "string",
                null,
                "Defines hash of the module responsible for SignIn page",
            ),
            "HashSignupForm" => new SettingsProperty(
                "signup",
                "string",
                null,
                "Defines hash of the module responsible for SignUp page",
            ),
            "DemoLogin" => new SettingsProperty(
                "",
                "string",
                null,
                "If set, denotes email address of predefined demo account",
            ),
            "DemoPassword" => new SettingsProperty(
                "",
                "string",
                null,
                "If set, denotes password of predefined demo account",
            ),
            "InfoText" => new SettingsProperty(
                "",
                "string",
                null,
                "Defines additional text message shown on login page",
            ),
            "BottomInfoHtmlText" => new SettingsProperty(
                "",
                "string",
                null,
                "Defines bottom text message shown on login page",
            ),
            "LoginSignMeType" => new SettingsProperty(
                0,
                "int",
                null,
                "",
            ),
            "AllowChangeLanguage" => new SettingsProperty(
                true,
                "bool",
                null,
                "Enables changing language on login page",
            ),
            "CodeResendTime" => new SettingsProperty(
                60,
                "int",
                null,
                "Code resend time in seconds",
            ),
            "PhoneCountryCodes" => new SettingsProperty(
                [
                    [
                        "name" => "Australia",
                        "code" => "+61",
                        "icon" => "au",
                    ],
                    [
                        "name" => "France",
                        "code" => "+33",
                        "icon" => "fr",
                    ],
                    [
                        "name" => "Germany",
                        "code" => "+49",
                        "icon" => "de",
                    ],
                    [
                        "name" => "Switzerland",
                        "code" => "+41",
                        "icon" => "ch",
                    ],
                    [
                        "name" => "United Kingdom",
                        "code" => "+44",
                        "icon" => "gb",
                    ],
                    [
                        "name" => "United States",
                        "code" => "+1",
                        "icon" => "us",
                    ]
                ],
                "array",
                null,
                "List of codes wiht country codes and names",
            ),
            "Twilio" => new SettingsProperty(
                [
                    "AccountSID" => "",
                    "AuthToken" => "",
                    "ServiceId" => ""
                ],
                "array",
                null,
                "Twilio credentials",
            ),
            "RegistrationDataLifetimeMinutes" => new SettingsProperty(
                10,
                "int",
                null,
                "",
            ),
            "IgnoreHashesListForMobileAppInfo" => new SettingsProperty(
                [
                    'signup',
                    'signup/mobile-app',
                    'signup/mobile-app/completed',
                    'user-deletion-request'
                ],
                "array",
                null,
                "List of hashes to skip when attepmt to display mobile info page",
            ),
            "MailAppIosLink" => new SettingsProperty(
                "",
                "string",
                null,
                "URL of a link to Unlyme Mail for iOS",
            ),
            "MailAppAndroidLink" => new SettingsProperty(
                "",
                "string",
                null,
                "URL of a link to Unlyme Mail for Android",
            ),
            "FilesAppIosLink" => new SettingsProperty(
                "",
                "string",
                null,
                "URL of a link to Unlyme Drive for iOS",
            ),
            "FilesAppAndroidLink" => new SettingsProperty(
                "",
                "string",
                null,
                "URL of a link to Unlyme Drive for Android",
            ),
            "PostProcessScript" => new SettingsProperty(
                "",
                "string",
                null,
                "Path to script that will be executed after account creation",
            ),
            "MaxLoginLength" => new SettingsProperty(
                0,
                "int",
                null,
                "Maximum allowed number of characters in a user login (0 means no limit)",
            ),
        ];
    }
}
