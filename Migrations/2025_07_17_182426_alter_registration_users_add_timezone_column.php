<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Capsule\Manager as Capsule;

class AlterRegistrationUsersAddTimezoneColumn extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Capsule::schema()->table('registration_users', function (Blueprint $table) {
            $table->string('Timezone')->default('')->after('Language');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Capsule::schema()->table('registration_users', function (Blueprint $table) {
            $table->dropColumn('Timezone');
        });
    }
}
