<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Capsule\Manager as Capsule;

class CreateRegistrationUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Capsule::schema()->create('registration_users', function (Blueprint $table) {
            $table->increments('Id');
            $table->string('UUID')->default('');
            $table->string('Domain')->default('');
            $table->integer('AccountType')->default(0);
            $table->string('Phone')->default('');
            $table->string('Email')->default('');
            $table->string('Login')->default('');
            $table->string('Password')->default('');
            $table->string('Language')->default('');
            $table->integer('LastSentCodeTime')->default(0);
            $table->timestamp(\Aurora\System\Classes\Model::CREATED_AT)->nullable();
            $table->timestamp(\Aurora\System\Classes\Model::UPDATED_AT)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Capsule::schema()->dropIfExists('registration_users');
    }
}
