<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\UnlymeSignup\Enums;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 *
 * @package Api
 * @subpackage Enum
 */
class AccountType extends \Aurora\System\Enums\AbstractEnumeration
{
    public const Personal = 0;
    public const Business = 1;

    /**
     * @var array
     */
    protected $aConsts = array(
        'Personal' => self::Personal,
        'Business' => self::Business,
    );
}
