<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\UnlymeSignup\Models;

use Aurora\System\Classes\Model;

/**
 * The Core User class.
 *
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2023, Afterlogic Corp.
 * @property int    $Id             Object primary key
 * @property string $UUID           Unique identifier of the object
 * @property string $Domain         Domain name
 * @property int    $AccountType    Personal or Business
 * @property string $Phone          Phone
 * @property string $Email          Email
 * @property string $Login          Login
 * @property string $Password       Password
 * @property int $LastSentCodeTime  Last send code time
 */
class RegistrationUser extends Model
{
    protected $table = 'registration_users';

    protected $moduleName = 'UnlymeSignup';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'Id',
        'UUID',
        'Domain',
        'AccountType',
        'Phone',
        'Email',
        'Login',
        'Password',
        'LastSentCodeTime'
    ];

    protected $casts = [
        'Password' => \Aurora\System\Casts\Encrypt::class,
    ];
}
