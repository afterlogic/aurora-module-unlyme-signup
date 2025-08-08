<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\UnlymeSignup;

use Aurora\Modules\UnlymeSignup\Models\RegistrationUser;

if (PHP_SAPI !== 'cli') {
    exit("Use the console for running this script");
}

require_once \dirname(__file__) . "/../../../system/autoload.php";
\Aurora\System\Api::Init(true);

$periodInMinutes = Module::getInstance()->getConfig('RegistrationDataLifetimeMinutes', 10);
$time = (new \DateTime())->sub(new \DateInterval('PT' . $periodInMinutes . 'M'));
RegistrationUser::where('UpdatedAt', '<', $time)->delete();
